import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class WaitlistUpdater {
  static buildMessage(modeKey, service) {
    const mode = service.getMode(modeKey);
    if (!mode) return { embed: null, components: [] };

    const queueList = mode.queue.length > 0 
      ? mode.queue.map((p, i) => `${i + 1}. <@${p.id}>`).join('\n')
      : '*Queue is currently empty*';

    const testerText = mode.isOpen && mode.openedBy 
      ? `\n**Tester:** <@${mode.openedBy}>` 
      : '';

    const embed = new EmbedBuilder()
      .setColor(mode.isOpen ? 0x57F287 : 0xED4245)
      .addFields(
        {
          name: mode.isOpen ? `${mode.name} Testers Online` : 'No Testers Online',
          value: mode.isOpen 
            ? `Testers for **${mode.name}** are online!${testerText}\nClick **Join Queue** to apply for testing.`
            : 'No testers for your region are available at this time.\nYou will be pinged when a tester is available. Check back later!'
        },
        {
          name: `Waiting Queue (${mode.queue.length})`,
          value: queueList
        },
        {
          name: 'Last Testing Session',
          value: mode.lastSession || '-'
        }
      );

    const joinBtn = new ButtonBuilder()
      .setCustomId(`waitlist_join:${modeKey}`)
      .setLabel('Join Queue')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!mode.isOpen);

    const leaveBtn = new ButtonBuilder()
      .setCustomId(`waitlist_leave:${modeKey}`)
      .setLabel('Leave Queue')
      .setStyle(ButtonStyle.Danger);

    const toggleBtn = new ButtonBuilder()
      .setCustomId(`waitlist_toggle:${modeKey}`)
      .setLabel('Open / Close Queue')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(joinBtn, leaveBtn, toggleBtn);

    return { embed, components: [row] };
  }

  static async updateMessage(channel, messageId, modeKey, service) {
    try {
      if (!channel || !messageId) return;
      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) return;

      const { embed, components } = this.buildMessage(modeKey, service);
      await message.edit({ embeds: [embed], components });
    } catch (error) {
      console.error('Error updating waitlist message:', error);
    }
  }
}
