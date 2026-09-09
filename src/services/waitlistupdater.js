import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class WaitlistUpdater {
    static createEmbed(waitlistService, region = 'Global', hasTestersOnline = false, lastSession = '08 Sept 2026') {
        const queue = waitlistService.getQueue();

        const queueDescription = queue.length > 0
            ? queue.map((player, index) => `${index + 1}. <@${player.id}>`).join('\n')
            : '*Queue is currently empty*';

        const statusTitle = hasTestersOnline ? 'Testers Online' : 'No Testers Online';
        const statusDescription = hasTestersOnline
            ? 'Testers are currently available for testing sessions!'
            : 'No testers for your region are available at this time.\nYou will be pinged when a tester is available. Check back later!';

        const embed = new EmbedBuilder()
            .setColor(hasTestersOnline ? 0x57F287 : 0xED4245)
            .addFields(
                { name: statusTitle, value: statusDescription },
                { name: `Waiting Queue (${queue.length})`, value: queueDescription },
                { name: 'Last Testing Session', value: lastSession }
            );

        return embed;
    }

    static createComponents() {
        const joinButton = new ButtonBuilder()
            .setCustomId('waitlist_join')
            .setLabel('Join Queue')
            .setStyle(ButtonStyle.Success);

        const leaveButton = new ButtonBuilder()
            .setCustomId('waitlist_leave')
            .setLabel('Leave Queue')
            .setStyle(ButtonStyle.Danger);

        const toggleButton = new ButtonBuilder()
            .setCustomId('waitlist_toggle')
            .setLabel('Open / Close Queue')
            .setStyle(ButtonStyle.Secondary);

        return new ActionRowBuilder().addComponents(joinButton, leaveButton, toggleButton);
    }

    static async updateMessage(channel, messageId, waitlistService, options = {}) {
        try {
            const message = await channel.messages.fetch(messageId);
            const embed = this.createEmbed(
                waitlistService,
                options.region,
                options.hasTestersOnline,
                options.lastSession
            );
            const components = this.createComponents();

            await message.edit({ embeds: [embed], components: [components] });
        } catch (error) {
            console.error('Failed to update waitlist display message:', error);
        }
    }
}
