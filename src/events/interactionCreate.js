import { 
  Events, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import { logger } from '../utils/logger.js';
import { getGuildConfig } from '../services/config/guildConfig.js';
import {
  getBotMessage,
  isBotOwner,
  isCommandCategoryEnabled,
  isMaintenanceMode,
} from '../config/bot.js';
import botConfig from '../config/bot.js';
import { handleApplicationModal } from '../commands/Community/apply.js';
import { handleInteractionError, createError, ErrorTypes, ErrorCodes } from '../utils/errorHandler.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import { createInteractionTraceContext, runWithTraceContext } from '../utils/logger.js';
import { validateChatInputPayloadOrThrow } from '../utils/commandInputValidation.js';
import { enforceAbuseProtection, formatCooldownDuration } from '../utils/abuseProtection.js';
import { isCommandEnabled } from '../services/commandAccessService.js';
import { resolveSlashAccessKey } from '../utils/messageAdapter.js';
import { isCollectorManagedComponent } from '../utils/collectorComponents.js';
import { ResponseCoordinator } from '../utils/responseCoordinator.js';
import { enforceDefaultCommandPermissions } from '../utils/permissionGuard.js';

import { waitlistService } from '../services/waitlistservice.js';
import { WaitlistUpdater } from '../services/waitlistupdater.js';

const COMMAND_ERROR_SUBTYPES = {
  warn: 'warn_failed',
  kick: 'kick_failed',
  ban: 'ban_failed',
  unban: 'unban_failed',
  timeout: 'timeout_failed',
  untimeout: 'untimeout_failed',
  warnings: 'warnings_view_failed',
  ticket: 'ticket_failed',
  serverstats: 'serverstats_failed',
  gcreate: 'giveaway_failed',
  gend: 'giveaway_failed',
  gdelete: 'giveaway_failed',
  greroll: 'giveaway_failed',
};

function withTraceContext(context = {}, traceContext = {}) {
  return {
    traceId: traceContext.traceId,
    guildId: context.guildId || traceContext.guildId,
    userId: context.userId || traceContext.userId,
    command: context.commandName || traceContext.command,
    ...context
  };
}

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    const interactionTraceContext = createInteractionTraceContext(interaction);
    interaction.traceContext = interactionTraceContext;
    interaction.traceId = interactionTraceContext.traceId;

    return runWithTraceContext(interactionTraceContext, async () => {
      try {
        InteractionHelper.patchInteractionResponses(interaction);
        ResponseCoordinator.attach(interaction);

        // --- HANDLER SLASH COMMANDS ---
        if (interaction.isChatInputCommand()) {
          try {
            logger.info(`Command executed: /${interaction.commandName} by ${interaction.user.tag}`, {
              event: 'interaction.command.received',
              traceId: interactionTraceContext.traceId,
              guildId: interaction.guildId,
              userId: interaction.user?.id,
              command: interaction.commandName
            });

            validateChatInputPayloadOrThrow(interaction, withTraceContext({
              type: 'command_input_validation',
              commandName: interaction.commandName
            }, interactionTraceContext));

            const command = client.commands.get(interaction.commandName);

            if (!command) {
              throw createError(
                `No command matching ${interaction.commandName} was found.`,
                ErrorTypes.CONFIGURATION,
                'Sorry, that command does not exist.',
                withTraceContext({ commandName: interaction.commandName }, interactionTraceContext)
              );
            }

            if (isMaintenanceMode() && !isBotOwner(interaction.user.id)) {
              throw createError(
                'Bot is in maintenance mode',
                ErrorTypes.CONFIGURATION,
                getBotMessage('maintenanceMode'),
                withTraceContext({ commandName: interaction.commandName }, interactionTraceContext)
              );
            }

            if (!isCommandCategoryEnabled(command.category)) {
              throw createError(
                `Feature disabled for category ${command.category}`,
                ErrorTypes.CONFIGURATION,
                getBotMessage('commandDisabled'),
                withTraceContext({ commandName: interaction.commandName, category: command.category }, interactionTraceContext)
              );
            }

            const defaultCooldownSec = Number(botConfig.commands?.defaultCooldown) || 0;
            if (defaultCooldownSec > 0 && !isBotOwner(interaction.user.id)) {
              const cooldownKey = `${interaction.user.id}:${interaction.commandName}`;
              const expiresAt = client.cooldowns.get(cooldownKey);

              if (expiresAt && Date.now() < expiresAt) {
                const remainingSec = Math.ceil((expiresAt - Date.now()) / 1000);
                throw createError(
                  `Default command cooldown active for ${interaction.commandName}`,
                  ErrorTypes.RATE_LIMIT,
                  getBotMessage('cooldownActive', { time: `${remainingSec}s` }),
                  withTraceContext({ commandName: interaction.commandName, remainingSec }, interactionTraceContext)
                );
              }

              client.cooldowns.set(cooldownKey, Date.now() + defaultCooldownSec * 1000);
            }

            const abuseProtection = await enforceAbuseProtection(interaction, command, interaction.commandName);
            if (!abuseProtection.allowed) {
              const formattedCooldown = formatCooldownDuration(abuseProtection.remainingMs);
              throw createError(
                `Risky command cooldown active for ${interaction.commandName}`,
                ErrorTypes.RATE_LIMIT,
                `This command is on cooldown. Please wait ${formattedCooldown} before trying again.`,
                withTraceContext({
                  commandName: interaction.commandName,
                  subtype: 'command_cooldown',
                  expected: true,
                  cooldownMs: abuseProtection.remainingMs,
                  cooldownWindowMs: abuseProtection.policy?.windowMs,
                  cooldownMaxAttempts: abuseProtection.policy?.maxAttempts
                }, interactionTraceContext)
              );
            }

            let guildConfig = null;
            if (interaction.guild) {
              guildConfig = await getGuildConfig(client, interaction.guild.id, interactionTraceContext);
              const accessKey = resolveSlashAccessKey(interaction);
              if (!(await isCommandEnabled(client, interaction.guild.id, accessKey, command.category))) {
                throw createError(
                  `Command ${accessKey} is disabled in this guild`,
                  ErrorTypes.CONFIGURATION,
                  'This command has been disabled for this server.',
                  withTraceContext({ commandName: accessKey, guildId: interaction.guild.id }, interactionTraceContext)
                );
              }
            }

            const permissionAllowed = await enforceDefaultCommandPermissions(interaction, command, {
              source: 'interactionCreate',
              guildConfig,
            });
            if (!permissionAllowed) {
              return;
            }

            await command.execute(interaction, guildConfig, client);
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({
              type: 'command',
              commandName: interaction.commandName,
              subtype: COMMAND_ERROR_SUBTYPES[interaction.commandName] || error?.context?.subtype,
            }, interactionTraceContext));
          }

        // --- HANDLER AUTOCOMPLETE ---
        } else if (interaction.isAutocomplete()) {
          const autocompleteCommand = client.commands.get(interaction.commandName);
          if (autocompleteCommand?.autocomplete) {
            try {
              await autocompleteCommand.autocomplete(interaction, client);
            } catch (error) {
              logger.error('Error handling command autocomplete:', {
                error: error.message,
                guildId: interaction.guildId,
                commandName: interaction.commandName,
              });
              await interaction.respond([]).catch(() => {});
            }
            return;
          }

        // --- HANDLER BUTTON ---
        } else if (interaction.isButton()) {
          const customId = interaction.customId;

          // 1. TOMBOL VERIFY (waitlist_verify)
          if (customId === 'waitlist_verify') {
            const modal = new ModalBuilder()
              .setCustomId('modal_verify_form:global')
              .setTitle('Player Verification');

            const ignInput = new TextInputBuilder()
              .setCustomId('verify_ign')
              .setLabel('In-Game Name (Minecraft Username)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g. Player123')
              .setRequired(true);

            const regionInput = new TextInputBuilder()
              .setCustomId('verify_region')
              .setLabel('Region (NA / EU / AS / AU)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g. AS')
              .setRequired(true);

            const typeInput = new TextInputBuilder()
              .setCustomId('verify_type')
              .setLabel('Account Type (Cracked / Premium)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('e.g. Premium')
              .setRequired(true);

            modal.addComponents(
              new ActionRowBuilder().addComponents(ignInput),
              new ActionRowBuilder().addComponents(regionInput),
              new ActionRowBuilder().addComponents(typeInput)
            );

            return await interaction.showModal(modal);
          }

          // 2. TOMBOL GAMEMODE (gm_crystal, gm_sword, gm_mace, dll)
          if (customId.startsWith('gm_')) {
            const modeKey = customId.split('_')[1];

            const mode = waitlistService.getMode(modeKey);
            if (!mode) {
              return await interaction.reply({ content: '❌ Invalid Game Mode selected!', ephemeral: true });
            }

            // Cek apakah embed antrean gamemode ini sudah aktif
            if (mode.messageId) {
              return await interaction.reply({ 
                content: `✅ The **${mode.name}** waitlist queue is already active in this channel!`, 
                ephemeral: true 
              });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
              const message = await WaitlistUpdater.createMessage(interaction.channel, modeKey, waitlistService);
              waitlistService.setMessageId(modeKey, message.id);

              return await interaction.editReply({ 
                content: `✅ Spawned the **${mode.name}** waitlist panel below!` 
              });
            } catch (err) {
              logger.error(`Failed to spawn queue panel for ${modeKey}:`, err);
              return await interaction.editReply({ content: '❌ Failed to spawn waitlist queue panel.' });
            }
          }

          // 3. TOMBOL DI DALAM EMBED ANTREAN GAMEMODE (waitlist_join, waitlist_leave, waitlist_toggle)
          const [action, queueModeKey] = customId.split(':');

          // TOGGLE STATUS QUEUE (OPEN / CLOSE)
          if (action === 'waitlist_toggle') {
            const isTester = waitlistService.isTester(interaction.member, queueModeKey);
            const isAdmin = interaction.member?.permissions.has(PermissionFlagsBits.Administrator);

            if (!isTester && !isAdmin) {
              return await interaction.reply({
                content: `❌ You do not have the required tester role for **${queueModeKey?.toUpperCase() || 'this mode'}** to toggle this queue!`,
                ephemeral: true
              });
            }

            await interaction.deferUpdate().catch(() => {});
            waitlistService.toggleOpen(queueModeKey, interaction.user.id);

            try {
              await WaitlistUpdater.updateMessage(interaction.channel, interaction.message.id, queueModeKey, waitlistService);
            } catch (err) {
              logger.error(`Failed updating waitlist on toggle for ${queueModeKey}:`, err);
            }
            return;
          }

          // JOIN QUEUE
          if (action === 'waitlist_join') {
            // Verifikasi: Harus sudah isi modal verify dulu
            const stats = waitlistService.getPlayerStats(interaction.user.id);
            if (!stats) {
              return await interaction.reply({ 
                content: '❌ You must click the **Verify / Change** button on the setup panel first to register your IGN & Region!', 
                ephemeral: true 
              });
            }

            const result = waitlistService.addPlayer(queueModeKey, interaction.user);
            if (!result.success) {
              return await interaction.reply({ content: `❌ ${result.reason}`, ephemeral: true });
            }

            // Auto assign waitlist role
            const waitlistRoleId = waitlistService.getWaitlistRole(queueModeKey);
            if (waitlistRoleId && interaction.member) {
              await interaction.member.roles.add(waitlistRoleId).catch((err) => 
                logger.error(`Failed to assign waitlist role: ${err.message}`)
              );
            }

            await interaction.deferUpdate().catch(() => {});
            try {
              await WaitlistUpdater.updateMessage(interaction.channel, interaction.message.id, queueModeKey, waitlistService);
            } catch (err) {
              logger.error(`Failed updating waitlist on join for ${queueModeKey}:`, err);
            }
            return;
          }

          // LEAVE QUEUE
          if (action === 'waitlist_leave') {
            const result = waitlistService.removePlayer(queueModeKey, interaction.user.id);
            if (!result.success) {
              return await interaction.reply({ content: `❌ ${result.reason}`, ephemeral: true });
            }

            // Auto remove waitlist role
            const waitlistRoleId = waitlistService.getWaitlistRole(queueModeKey);
            if (waitlistRoleId && interaction.member) {
              await interaction.member.roles.remove(waitlistRoleId).catch((err) => 
                logger.error(`Failed to remove waitlist role: ${err.message}`)
              );
            }

            await interaction.deferUpdate().catch(() => {});
            try {
              await WaitlistUpdater.updateMessage(interaction.channel, interaction.message.id, queueModeKey, waitlistService);
            } catch (err) {
              logger.error(`Failed updating waitlist on leave for ${queueModeKey}:`, err);
            }
            return;
          }

          // Fallback ke handler button umum jika ada
          const button = client.buttons?.get(action);
          if (button) {
            try {
              await button.execute(interaction, client, [queueModeKey]);
            } catch (error) {
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'button',
                customId: interaction.customId
              }, interactionTraceContext));
            }
          }

        // --- HANDLER MODAL SUBMIT ---
        } else if (interaction.isModalSubmit()) {
          const [modalAction, modeKey] = interaction.customId.split(':');

          if (modalAction === 'modal_verify_form') {
            const ign = interaction.fields.getTextInputValue('verify_ign');
            const region = interaction.fields.getTextInputValue('verify_region');
            const type = interaction.fields.getTextInputValue('verify_type');

            // 1. Ubah Nickname Discord Player
            try {
              await interaction.member.setNickname(`${ign} [${region.toUpperCase()}]`);
            } catch (err) {
              logger.warn(`Could not change nickname for ${interaction.user.tag}: ${err.message}`);
            }

            // 2. Simpan Data Player ke Cache Service
            waitlistService.setPlayerStats(interaction.user.id, { 
              ign, 
              region: region.toUpperCase(), 
              type 
            });

            const successEmbed = new EmbedBuilder()
              .setColor(0x57F287)
              .setTitle('✅ Verification Saved!')
              .setDescription(
                `**IGN:** \`${ign}\`\n` +
                `**Region:** \`${region.toUpperCase()}\`\n` +
                `**Type:** \`${type}\`\n\n` +
                `You can now select a Gamemode from the panel and click **Join Queue**!`
              );

            return await interaction.reply({
              embeds: [successEmbed],
              ephemeral: true
            });
          }
        }
      } catch (error) {
        logger.error('Unhandled error in interactionCreate:', {
          event: 'interaction.unhandled_error',
          errorCode: ErrorCodes.INTERACTION_UNHANDLED,
          error,
          traceId: interactionTraceContext.traceId
        });
      }
    });
  }
};
