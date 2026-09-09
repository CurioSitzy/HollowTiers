import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import waitlistService from '../../services/waitlistservice.js';
import waitlistUpdater from '../../services/waitlistupdater.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pull the next player from the waitlist queue')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option
        .setName('player')
        .setDescription('Optionally select a specific player to pull')
        .setRequired(false)
    ),

  async execute(interaction, { supabase }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targetedPlayer = interaction.options.getUser('player');
    const channelId = interaction.channelId;

    let pulledUserId = null;

    if (targetedPlayer) {
      const removed = waitlistService.removeUser(channelId, targetedPlayer.id);
      if (removed) {
        pulledUserId = targetedPlayer.id;
      } else {
        return interaction.editReply({
          content: `❌ Player <@${targetedPlayer.id}> is not currently in the waitlist queue.`,
        });
      }
    } else {
      pulledUserId = waitlistService.pullNext(channelId);
    }

    if (!pulledUserId) {
      return interaction.editReply({
        content: '⚠️ The waitlist queue is currently empty.',
      });
    }

    // Sync waitlist embed and database state
    await waitlistUpdater.updateEmbed(interaction, channelId);
    if (supabase) {
      await waitlistUpdater.syncToDatabase(supabase, interaction.guildId, channelId);
    }

    await interaction.channel.send({
      content: `🔔 <@${pulledUserId}>, you have been pulled for testing by <@${interaction.user.id}>!`,
    });

    await interaction.editReply({
      content: `✅ Successfully pulled <@${pulledUserId}> from the queue.`,
    });
  },
};
