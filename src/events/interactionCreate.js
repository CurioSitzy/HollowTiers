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
import { handleInteractionError, createError, ErrorTypes, ErrorCodes } from '../utils/errorHandler.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import { createInteractionTraceContext, runWithTraceContext } from '../utils/logger.js';
import { validateChatInputPayloadOrThrow } from '../utils/commandInputValidation.js';
import { enforceAbuseProtection, formatCooldownDuration } from '../utils/abuseProtection.js';
import { isCommandEnabled } from '../services/commandAccessService.js';
import { resolveSlashAccessKey } from '../utils/messageAdapter.js';
import { ResponseCoordinator } from '../utils/responseCoordinator.js';
import { enforceDefaultCommandPermissions } from '../utils/permissionGuard.js';

import { waitlistService } from '../services/waitlistservice.js';
import { WaitlistUpdater } from '../services/waitlistupdater.js';

// ==========================================
// CONFIGURATION ROLE ID
// ==========================================
const REGION_ROLES = {
  AS: '1500479159456235533',
  EU: '1500479159456235535',
  NA: '1500479159456235534',
  AU: '1500479159456235532',
  SA: '1547158919649165413',
};

const TYPE_ROLES = {
  PREMIUM: '1546348570293051444',
  CRACKED: '1546348575406166106',
};

// Waitlist Role IDs per Gamemode
const WAITLIST_ROLES = {
  crystal: '1546415409618485328',
  sword: '1546413861387898903',
  mace: '1546412993758236832',
  axe: '1546413949552164884',
  uhc: '1546413321228656720',
  pot: '1546414095819997215',
  nethop: '1546413523716931694',
  smp: '1546413431089791027',
  cart: '1546413989196472373',
  diasmp: '1546413278195093545',
  spearmace: '1546413406918152223',
};

// ==========================================
// TESTER ROLE IDs PER GAMEMODE (TAMBAHAN KHUSUS TESTER)
// ISI DENGAN ID ROLE TESTER MASING-MASING GAMEMODE
// ==========================================
const TESTER_ROLES = {
  crystal: '1546352188757119107',
  sword: '1546352203739045888',
  mace: '1546163052909428796', // <-- Masukkan ID Role Tester Mace di sini
  axe: '1546352170721607710',
  uhc: '1546349340778438687',
  pot: '1546349242245971998',
  nethop: '1546349287720488970',
  smp: '1546352269333635152',
  cart: '1546349356020666439',
  diasmp: '1546352284135334019',
  spearmace: '1546349379709833296', // <-- Masukkan ID Role Tester Spearmace di sini
};

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
  async execute(interaction, client, supabase) {
    const interactionTraceContext = createInteractionTraceContext(interaction);
    interaction.traceContext = interactionTraceContext;
    interaction.traceId = interactionTraceContext.traceId;

    return runWithTraceContext(interactionTraceContext, async () => {
      try {
        InteractionHelper.patchInteractionResponses(interaction);
        ResponseCoordinator.attach(interaction);

        // ==========================================
        // 1. HANDLER SLASH COMMANDS
        // ==========================================
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

            // Eksekusi command
            await command.execute(interaction, guildConfig, client, supabase);
          } catch (error) {
            await handleInteractionError(interaction, error, withTraceContext({
              type: 'command',
              commandName: interaction.commandName,
              subtype: COMMAND_ERROR_SUBTYPES[interaction.commandName] || error?.context?.subtype,
            }, interactionTraceContext));
          }
          return;
        }

        // ==========================================
        // 2. HANDLER AUTOCOMPLETE
        // ==========================================
        if (interaction.isAutocomplete()) {
          const autocompleteCommand = client.commands.get(interaction.commandName);
          if (autocompleteCommand?.autocomplete) {
            try {
              await autocompleteCommand.autocomplete(interaction, client, supabase);
            } catch (error) {
              logger.error('Error handling command autocomplete:', {
                error: error.message,
                guildId: interaction.guildId,
                commandName: interaction.commandName,
              });
              await interaction.respond([]).catch(() => {});
            }
          }
          return;
        }

        // ==========================================
        // 3. HANDLER BUTTON INTERACTION
        // ==========================================
        if (interaction.isButton()) {
          const customId = interaction.customId;

          // A. TOMBOL VERIFY (waitlist_verify)
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
              .setLabel('Region (AS / EU / NA / AU / SA)')
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

          // B. TOMBOL GAMEMODE (gm_crystal, gm_sword, dll)
          if (customId.startsWith('gm_')) {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});

            try {
              const modeKey = customId.split('_')[1];

              let stats = null;
              if (waitlistService) {
                if (typeof waitlistService.getPlayerStats === 'function') {
                  stats = waitlistService.getPlayerStats(interaction.user.id);
                } else if (typeof waitlistService.getStats === 'function') {
                  stats = waitlistService.getStats(interaction.user.id);
                }
              }

              if (!stats) {
                return await interaction.editReply({ 
                  content: '❌ You must click the **Verify / Change** button first to register your IGN & Region!'
                });
              }

              const targetWaitlistRole = WAITLIST_ROLES[modeKey];
              if (!targetWaitlistRole || !/^\d+$/.test(targetWaitlistRole)) {
                return await interaction.editReply({
                  content: `❌ The Role ID for **${modeKey.toUpperCase()}** is missing or invalid in \`WAITLIST_ROLES\`!`
                });
              }

              const member = interaction.member;
              if (!member) {
                return await interaction.editReply({ content: '❌ Could not find member data in server.' });
              }

              const hasRole = member.roles.cache.has(targetWaitlistRole);

              if (hasRole) {
                await member.roles.remove(targetWaitlistRole);
                if (waitlistService && typeof waitlistService.removePlayer === 'function') {
                  try { waitlistService.removePlayer(modeKey, interaction.user.id); } catch (e) { logger.error(e); }
                }
                return await interaction.editReply({
                  content: `➖ Removed **${modeKey.toUpperCase()}** waitlist role from your profile.`
                });
              } else {
                await member.roles.add(targetWaitlistRole);
                if (waitlistService && typeof waitlistService.addPlayer === 'function') {
                  try { waitlistService.addPlayer(modeKey, interaction.user); } catch (e) { logger.error(e); }
                }
                return await interaction.editReply({
                  content: `✅ Successfully joined the **${modeKey.toUpperCase()}** waitlist! The role has been assigned.`
                });
              }
            } catch (err) {
              logger.error(`Error in gamemode button handler: ${err.stack || err.message}`);
              return await interaction.editReply({
                content: `⚠️ An error occurred while updating your role: \`${err.message}\`. Make sure the bot's highest role is HIGHER than the waitlist roles in Server Settings!`
              });
            }
          }

          // C. TOMBOL ANTREAN GAMEMODE (waitlist_join, waitlist_leave, waitlist_toggle)
          const [action, queueModeKey] = customId.split(':');

          // TOGGLE STATUS QUEUE
          if (action === 'waitlist_toggle') {
            try {
              const member = interaction.member;

              if (!member || !member.roles) {
                return await interaction.reply({
                  content: '❌ Member data could not be retrieved.',
                  ephemeral: true
                });
              }

              // 1. Ambil Role Tester khusus dari object TESTER_ROLES di atas
              const specificTesterRoleId = TESTER_ROLES[queueModeKey];
              const hasSpecificTesterRole = specificTesterRoleId ? member.roles.cache.has(specificTesterRoleId) : false;

              // 2. Ambil Role Tester dari waitlistService jika ada
              const serviceTesterRoleId = waitlistService && typeof waitlistService.getTesterRole === 'function' 
                ? waitlistService.getTesterRole(queueModeKey) 
                : null;
              const hasServiceTesterRole = serviceTesterRoleId ? member.roles.cache.has(serviceTesterRoleId) : false;

              // 3. Cek fungsi isTester di waitlistService
              const isServiceTester = waitlistService && typeof waitlistService.isTester === 'function' 
                ? waitlistService.isTester(member, queueModeKey) 
                : false;

              // 4. Cek Administrator
              const isAdmin = member.permissions?.has(PermissionFlagsBits.Administrator);

              // Jika salah satu dari izin di atas terpenuhi, beri akses
              const isAllowed = hasSpecificTesterRole || hasServiceTesterRole || isServiceTester || isAdmin;

              if (!isAllowed) {
                return await interaction.reply({
                  content: `❌ You do not have the required tester role for **${queueModeKey?.toUpperCase() || 'this mode'}** to toggle this queue!`,
                  ephemeral: true
                });
              }

              await interaction.deferUpdate().catch(() => {});

              if (waitlistService && typeof waitlistService.toggleOpen === 'function') {
                waitlistService.toggleOpen(queueModeKey, interaction.user.id);
              }

              await WaitlistUpdater.updateMessage(interaction.channel, interaction.message.id, queueModeKey, waitlistService);
            } catch (err) {
              logger.error(`Error in waitlist_toggle for ${queueModeKey}:`, err);
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred while toggling the queue.', ephemeral: true }).catch(() => {});
              }
            }
            return;
          }

          // JOIN QUEUE
          if (action === 'waitlist_join') {
            let stats = null;
            if (waitlistService && typeof waitlistService.getPlayerStats === 'function') {
              stats = waitlistService.getPlayerStats(interaction.user.id);
            }

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

            const targetWaitlistRole = WAITLIST_ROLES[queueModeKey] || waitlistService.getWaitlistRole(queueModeKey);
            if (targetWaitlistRole && /^\d+$/.test(targetWaitlistRole) && interaction.member) {
              try {
                await interaction.member.roles.add(targetWaitlistRole);
              } catch (err) {
                logger.error(`Failed to assign waitlist role for ${queueModeKey}: ${err.message}`);
              }
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

            const targetWaitlistRole = WAITLIST_ROLES[queueModeKey] || waitlistService.getWaitlistRole(queueModeKey);
            if (targetWaitlistRole && /^\d+$/.test(targetWaitlistRole) && interaction.member) {
              try {
                await interaction.member.roles.remove(targetWaitlistRole);
              } catch (err) {
                logger.error(`Failed to remove waitlist role for ${queueModeKey}: ${err.message}`);
              }
            }

            await interaction.deferUpdate().catch(() => {});
            try {
              await WaitlistUpdater.updateMessage(interaction.channel, interaction.message.id, queueModeKey, waitlistService);
            } catch (err) {
              logger.error(`Failed updating waitlist on leave for ${queueModeKey}:`, err);
            }
            return;
          }

          // Fallback ke handler button dinamis/umum jika ada
          const button = client.buttons?.get(action);
          if (button) {
            try {
              await button.execute(interaction, client, [queueModeKey], supabase);
            } catch (error) {
              await handleInteractionError(interaction, error, withTraceContext({
                type: 'button',
                customId: interaction.customId
              }, interactionTraceContext));
            }
          }
          return;
        }

        // ==========================================
        // 4. HANDLER MODAL SUBMIT
        // ==========================================
        if (interaction.isModalSubmit()) {
          const customId = interaction.customId;

          if (customId.startsWith('modal_verify_form')) {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});

            try {
              const ign = interaction.fields.getTextInputValue('verify_ign').trim();
              const region = interaction.fields.getTextInputValue('verify_region').trim().toUpperCase();
              const type = interaction.fields.getTextInputValue('verify_type').trim().toUpperCase();

              let nicknameUpdated = true;

              try {
                if (interaction.guild && interaction.member) {
                  await interaction.member.setNickname(`${ign} [${region}]`);
                }
              } catch (err) {
                nicknameUpdated = false;
                logger.warn(`Could not change nickname for ${interaction.user.tag}: ${err.message}`);
              }

              if (interaction.guild && interaction.member) {
                const allRegionRoleIds = Object.values(REGION_ROLES);
                const allTypeRoleIds = Object.values(TYPE_ROLES);

                const oldRolesToRemove = interaction.member.roles.cache
                  .filter(role => allRegionRoleIds.includes(role.id) || allTypeRoleIds.includes(role.id))
                  .map(role => role.id);

                if (oldRolesToRemove.length > 0) {
                  await interaction.member.roles.remove(oldRolesToRemove).catch(err => {
                    logger.warn(`Could not remove old roles for ${interaction.user.tag}: ${err.message}`);
                  });
                }

                const rolesToAdd = [];

                const regionRoleId = REGION_ROLES[region];
                if (regionRoleId) {
                  rolesToAdd.push(regionRoleId);
                }

                const typeRoleId = TYPE_ROLES[type];
                if (typeRoleId) {
                  rolesToAdd.push(typeRoleId);
                }

                if (rolesToAdd.length > 0) {
                  try {
                    await interaction.member.roles.add(rolesToAdd);
                  } catch (err) {
                    logger.error(`Failed to add verification roles for ${interaction.user.tag}: ${err.message}`);
                  }
                }
              }

              if (waitlistService && typeof waitlistService.setPlayerStats === 'function') {
                waitlistService.setPlayerStats(interaction.user.id, { 
                  ign, 
                  region, 
                  type 
                });
              }

              const successEmbed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('✅ Verification Saved!')
                .setDescription(
                  `**IGN:** \`${ign}\`\n` +
                  `**Region:** \`${region}\`\n` +
                  `**Type:** \`${type}\`\n\n` +
                  (nicknameUpdated ? '' : `⚠️ *Note: Could not update nickname due to Discord role hierarchy.* \n\n`) +
                  `You can now select any gamemode button above to toggle your waitlist role!`
                );

              return await interaction.editReply({
                embeds: [successEmbed]
              });
            } catch (submitErr) {
              logger.error('Error executing modal verification submit:', submitErr);
              return await interaction.editReply({
                content: '❌ An error occurred while processing your verification. Please try again.'
              });
            }
          }
          return;
        }

      } catch (error) {
        logger.error('Unhandled error in interactionCreate:', {
          event: 'interaction.unhandled_error',
          errorCode: ErrorCodes.INTERACTION_UNHANDLED,
          error: error.message || error,
          traceId: interactionTraceContext.traceId
        });
      }
    });
  }
};
