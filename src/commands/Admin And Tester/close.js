const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const waitlistService = require('../../services/waitlistservice');
const waitlistUpdater = require('../../services/waitlistupdater');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close and clear the current waitlist testing session')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction, { supabase }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channelId = interaction.channelId;
    
    // Clear waitlist memory queue
    waitlistService.clearWaitlist(channelId);

    // Sync updated state to Discord embed and database
    await waitlistUpdater.updateEmbed(interaction, channelId);
    if (supabase) {
      await waitlistUpdater.syncToDatabase(supabase, interaction.guildId, channelId);
    }

    await interaction.channel.send({
      content: '🔒 **Testing Session Closed.** The waitlist queue has been cleared.',
    });

    await interaction.editReply({
      content: '✅ The testing session has been successfully closed.',
    });
  },
};
