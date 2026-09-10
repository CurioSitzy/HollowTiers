import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';

const TESTER_ROLE_IDS = [
  '1502537249131335710',
  '1500479159485595722',
];

export default {
  data: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pull the top player from the waitlist and create a testing ticket'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 1. Role Permission Check
    const member = interaction.member;
    const hasTesterRole = TESTER_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));

    if (!hasTesterRole && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({
        content: '❌ **Access Denied!** Only **Tester** and **Verified Tester** roles can use this command.'
      });
    }

    // 2. Pull Next Player from Waitlist Service
    const player = waitlistService.pullNextPlayer();

    if (!player) {
      return interaction.editReply({
        content: '❌ The waitlist is empty. No players to pull.'
      });
    }

    const guild = interaction.guild;
    const categoryId = process.env.TICKET_CATEGORY_ID;

    try {
      // 3. Create Ticket Channel
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

      // 4. Register Ticket in Waitlist Service
      if (typeof waitlistService.registerTicket === 'function') {
        waitlistService.registerTicket(ticketChannel.id, player, interaction.user.id);
      }

      await ticketChannel.send({
        content: `Hello <@${player.id}>! Your testing ticket channel has been created by Tester <@${interaction.user.id}>.\nUse \`/close\` once the testing session is finished.`
      });

      return interaction.editReply({
        content: `✅ Successfully pulled <@${player.id}>. Ticket channel created: ${ticketChannel}`
      });

    } catch (error) {
      console.error('Failed to create ticket channel:', error);
      return interaction.editReply({
        content: `❌ An error occurred while creating the ticket channel: \`${error.message}\``
      });
    }
  }
};
