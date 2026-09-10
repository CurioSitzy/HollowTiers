import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';

const TESTER_ROLE_IDS = [
  '1502537249131335710',
  '1500479159485595722',
];

export default {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close and delete this testing ticket channel'),

  async execute(interaction) {
    const member = interaction.member;
    const channel = interaction.channel;

    // 1. Role Permission Check
    const hasTesterRole = TESTER_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
    if (!hasTesterRole && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ **Access Denied!** Only **Tester** and **Verified Tester** roles can close this ticket.',
        flags: MessageFlags.Ephemeral
      });
    }

    // 2. Validate Ticket Channel via waitlistService
    const ticketData = waitlistService.getTicket(channel.id);
    const isChannelByPrefix = channel.name.startsWith('ticket-');

    if (!ticketData && !isChannelByPrefix) {
      return interaction.reply({
        content: '❌ This command can only be used inside an active testing ticket channel.',
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.reply({
      content: '🔒 Ticket is closing and this channel will be deleted in 5 seconds...'
    });

    // 3. Clean Memory
    waitlistService.removeTicket(channel.id);

    // 4. Delete Channel
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Failed to delete ticket channel:', error);
      }
    }, 5000);
  }
};
