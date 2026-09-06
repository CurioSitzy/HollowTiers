import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('testresult')
        .setDescription('Kirim hasil tier test player')
        .addUserOption(option => 
            option.setName('player')
                .setDescription('Player yang dites')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('tester')
                .setDescription('Tester yang nge-test')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('region')
                .setDescription('Region (misal: AS, EU, NA)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Username Minecraft player')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('previous_rank')
                .setDescription('Rank sebelumnya')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('rank_earned')
                .setDescription('Rank yang didapat')
                .setRequired(true)),

    async execute(interaction) {
        const player = interaction.options.getUser('player');
        const tester = interaction.options.getUser('tester');
        const region = interaction.options.getString('region');
        const username = interaction.options.getString('username');
        const previousRank = interaction.options.getString('previous_rank');
        const rankEarned = interaction.options.getString('rank_earned');

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setAuthor({ 
                name: `${username}'s Test Results 🏆`, 
                iconURL: player.displayAvatarURL() 
            })
            .addFields(
                { name: 'Tester:', value: `<@${tester.id}>` },
                { name: 'Region:', value: region },
                { name: 'Username:', value: username },
                { name: 'Previous Rank:', value: previousRank },
                { name: 'Rank Earned:', value: rankEarned }
            )
            .setThumbnail(`https://mc-heads.net/body/${username}`);

        await interaction.reply({ content: `<@${player.id}>`, embeds: [embed] });
    },
};
