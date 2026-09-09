import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class WaitlistUpdater {
  static buildMessage(service) {
    const queue = service.getQueue ? service.getQueue() : [];
    
    // Format list pemain di dalam antrean
    const queueList = queue.length > 0 
      ? queue.map((p, i) => `${i + 1}. <@${p.id}>`).join('\n')
      : '*Queue is currently empty*';

    const lastSession = service.lastSessionDate || '08 Sept 2026';

    const embed = new EmbedBuilder()
      .setColor(service.isOpen ? 0x57F287 : 0xED4245)
      .addFields(
        {
          name: service.isOpen ? '🟢 Testers Online' : 'No Testers Online',
          value: service.isOpen 
            ? 'Testers are currently online for your region!\nClick **Join Queue** to apply for testing.'
            : 'No testers for your region are available at this time.\nYou will be pinged when a tester is available. Check back later!'
        },
        {
          name: `Waiting Queue (${queue.length})`,
          value: queueList
        },
        {
          name: 'Last Testing Session',
          value: lastSession
        }
      );

    const joinBtn = new ButtonBuilder()
      .setCustomId('waitlist_join')
      .setLabel('Join Queue')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!service.isOpen);

    const leaveBtn = new ButtonBuilder()
      .setCustomId('waitlist_leave')
      .setLabel('Leave Queue')
      .setStyle(ButtonStyle.Danger);

    const toggleBtn = new ButtonBuilder()
      .setCustomId('waitlist_toggle')
      .setLabel('Open / Close Queue')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, toggleBtn);

    return { embed, components: [row] };
  }

  static async updateMessage(channel, messageId, service) {
    try {
      if (!channel || !messageId) return;
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) return;

      const { embed, components } = this.buildMessage(service);
      await message.edit({ embeds: [embed], components });
    } catch (error) {
      console.error('Error updating waitlist message:', error);
    }
  }
}
