import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { waitlistService } from '../services/WaitlistService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close and delete this testing ticket channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const channel = interaction.channel;
        const ticketData = waitlistService.getTicket(channel.id);

        if (!ticketData) {
            return interaction.reply({
                content: '❌ This command can only be used inside an active testing ticket channel.',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: '🔒 Ticket is closing and this channel will be deleted in 5 seconds...'
        });

        waitlistService.removeTicket(channel.id);

        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (error) {
                console.error('Failed to delete ticket channel:', error);
            }
        }, 5000);
    }
};
