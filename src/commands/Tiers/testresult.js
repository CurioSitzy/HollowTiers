import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

// Ganti angkanya dengan ID channel `#🏆・results` milikmu
const ALLOWED_CHANNEL_ID = 'GANTI_DENGAN_ID_CHANNEL_KAMU'; 

export default {
    data: new SlashCommandBuilder()
        .setName('testresult')
        .setDescription('Send a player tier test result')
        .addUserOption(option => 
            option.setName('player')
                .setDescription('The player who was tested')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('tester')
                .setDescription('The tester who conducted the test')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('region')
                .setDescription('Region (e.g. NA, EU, AS, AU)')
                .setRequired(true)
                .addChoices(
                    { name: 'NA', value: 'NA' },
                    { name: 'EU', value: 'EU' },
                    { name: 'AS', value: 'AS' },
                    { name: 'AU', value: 'AU' },
                    { name: 'SA', value: 'SA' }
                ))
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Minecraft IGN / Username')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('gamemode')
                .setDescription('Gamemode / Tier Test')
                .setRequired(true)
                .addChoices(
                    { name: 'Sword', value: 'Sword' },
                    { name: 'Axe', value: 'Axe' },
                    { name: 'Crystal', value: 'Crystal' },
                    { name: 'Vanilla', value: 'Vanilla' },
                    { name: 'SMP', value: 'SMP' },
                    { name: 'Pot', value: 'Pot' },
                    { name: 'UHC', value: 'UHC' },
                    { name: 'Netherite OP', value: 'Netherite OP' }
                ))
        .addStringOption(option => 
            option.setName('previous_rank')
                .setDescription('Previous rank')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('rank_earned')
                .setDescription('Rank earned')
                .setRequired(true)),

    async execute(interaction) {
        // Pengecekan ID Channel
        if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
            return await interaction.reply({
                content: `❌ This command can only be used in <#${ALLOWED_CHANNEL_ID}>!`,
                ephemeral: true
            });
        }

        const player = interaction.options.getUser('player');
        const tester = interaction.options.getUser('tester');
        const region = interaction.options.getString('region');
        const username = interaction.options.getString('username');
        const gamemode = interaction.options.getString('gamemode');
        const previousRank = interaction.options.getString('previous_rank');
        const rankEarned = interaction.options.getString('rank_earned');

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setAuthor({ 
                name: `${username}'s Test Results 🏆`, 
                iconURL: player.displayAvatarURL() 
            })
            .addFields(
                { name: 'Tester:', value: `<@${tester.id}>`, inline: true },
                { name: 'Region:', value: region, inline: true },
                { name: 'Gamemode:', value: gamemode, inline: true },
                { name: 'Username:', value: username, inline: true },
                { name: 'Previous Rank:', value: previousRank, inline: true },
                { name: 'Rank Earned:', value: rankEarned, inline: true }
            )
            .setThumbnail(`https://mc-heads.net/player/${username}/right`);

        await interaction.reply({ content: `<@${player.id}>`, embeds: [embed] });
    },
};
