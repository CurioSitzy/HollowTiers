const waitlistService = require('./waitlistservice');

class WaitlistUpdater {
  // Update message with current queue state in Discord channel
  async updateEmbed(interaction, channelId) {
    try {
      const embed = waitlistService.buildWaitlistEmbed(interaction.guild, channelId);

      if (interaction.message) {
        await interaction.message.edit({ embeds: [embed] });
      }
    } catch (error) {
      console.error('❌ Error updating waitlist embed display:', error);
    }
  }

  // Sync state with Supabase database if configured
  async syncToDatabase(supabase, guildId, channelId) {
    if (!supabase) return;

    try {
      const queue = waitlistService.getWaitlist(channelId);
      const { error } = await supabase
        .from('waitlists')
        .upsert({
          guild_id: guildId,
          channel_id: channelId,
          queue_data: queue,
          updated_at: new Date()
        }, { onConflict: 'guild_id,channel_id' });

      if (error) throw error;
      console.log(`✅ Waitlist synced to database for channel ${channelId}`);
    } catch (err) {
      console.error('❌ Failed to sync waitlist to database:', err.message);
    }
  }
}

module.exports = new WaitlistUpdater();
