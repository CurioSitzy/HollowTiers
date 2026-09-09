import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { waitlistService } from '../services/WaitlistService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('Pull players from the waitlist')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const nextPlayer = waitlistService.pullPlayer();

        if (!nextPlayer) {
            return interaction.reply({
                content: '❌ Waitlist saat ini kosong, tidak ada player untuk ditarik.',
                ephemeral: true
            });
        }

        return interaction.reply({
            content: `✅ <@${nextPlayer.id}> (${nextPlayer.username}) has been pulled from the waitlist!`,
            ephemeral: false
        });
    }
};
