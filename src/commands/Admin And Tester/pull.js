import { 
  SlashCommandBuilder, 
  ChannelType, 
  PermissionFlagsBits, 
  MessageFlags,
  EmbedBuilder
} from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';

// Central Role Config untuk Tester
const TESTER_ROLE_IDS = [
  '1502537249131335710',
  '1500479159485595722', // Verified Tester
];

export default {
  data: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pull the top player from the waitlist and create a testing ticket')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Specific gamemode queue to pull from (optional)')
        .setRequired(false)
        .addChoices(
          { name: 'Crystal', value: 'crystal' },
          { name: 'Sword', value: 'sword' },
          { name: 'Mace', value: 'mace' },
          { name: 'Axe', value: 'axe' },
          { name: 'UHC', value: 'uhc' },
          { name: 'Pot', value: 'pot' },
          { name: 'Nethop', value: 'nethop' },
          { name: 'SMP', value: 'smp' },
          { name: 'Cart', value: 'cart' },
          { name: 'DiaSMP', value: 'diasmp' },
          { name: 'SpearMace', value: 'spearmace' }
        )
    ),

  async execute(interaction, guildConfig, client, supabase) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 1. Role Permission Check
    const member = interaction.member;
    const hasTesterRole = TESTER_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    if (!hasTesterRole && !isAdmin) {
      return interaction.editReply({
        content: '❌ **Access Denied!** Only **Tester** and **Verified Tester** roles can use this command.'
      });
    }

    // 2. Determine Mode Option (if specified)
    const targetMode = interaction.options.getString('mode');

    // 3. Pull Player via waitlistService
    let result = null;
    if (targetMode) {
      if (typeof waitlistService.pullPlayerFromMode === 'function') {
        result = waitlistService.pullPlayerFromMode(targetMode);
      } else if (typeof waitlistService.pullNextPlayer === 'function') {
        result = waitlistService.pullNextPlayer(targetMode);
      }
    } else {
      if (typeof waitlistService.pullNextPlayer === 'function') {
        result = waitlistService.pullNextPlayer();
      }
    }

    if (!result || !result.player) {
      const modeText = targetMode ? `for **${targetMode.toUpperCase()}**` : '';
      return interaction.editReply({
        content: `❌ The waitlist ${modeText} is empty or no active queues are open.`
      });
    }

    const { player, modeName } = result;
    const guild = interaction.guild;
    const categoryId = process.env.TICKET_CATEGORY_ID;

    try {
      // 4. Create Ticket Channel
      const ticketChannel = await guild.channels.create({
        name: `ticket-${player.username || player.id}`,
        type: ChannelType.GuildText,
        parent: categoryId || null,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: player.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          }
        ]
      });

      // 5. Register Ticket into waitlistService memory
      if (typeof waitlistService.registerTicket === 'function') {
        waitlistService.registerTicket(ticketChannel.id, player, interaction.user.id, modeName);
      }

      // 6. Automatically Remove Waitlist Role from the pulled player (if mapped)
      const targetWaitlistRoleId = waitlistService.getWaitlistRole ? waitlistService.getWaitlistRole(modeName) : null;
      if (targetWaitlistRoleId) {
        const targetMember = await guild.members.fetch(player.id).catch(() => null);
        if (targetMember && targetMember.roles.cache.has(targetWaitlistRoleId)) {
          await targetMember.roles.remove(targetWaitlistRoleId).catch(() => {});
        }
      }

      // 7. Send Ticket Welcome Message
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle(`⚔️ Testing Ticket - ${modeName?.toUpperCase() || 'GENERAL'}`)
        .setDescription(
          `Welcome <@${player.id}>!\n\n` +
          `Your testing session for **${modeName?.toUpperCase() || 'Waitlist'}** has been initiated by Tester <@${interaction.user.id}>.\n\n` +
          `Please coordinate with your tester here. Once finished, the tester can run \`/close\` to close this ticket.`
        )
        .setTimestamp();

      await ticketChannel.send({
        content: `<@${player.id}> | <@${interaction.user.id}>`,
        embeds: [welcomeEmbed]
      });

      return interaction.editReply({
        content: `✅ Successfully pulled <@${player.id}> (${modeName?.toUpperCase() || 'Waitlist'}). Ticket channel created: ${ticketChannel}`
      });

    } catch (error) {
      console.error('Failed to create ticket channel:', error);
      return interaction.editReply({
        content: `❌ An error occurred while creating the ticket channel: \`${error.message}\``
      });
    }
  }
};
