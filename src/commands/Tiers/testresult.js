import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

// ID Channel
const COMMAND_CHANNEL_ID = '1509184085015269516'; // ID Channel #result-commands
const OUTPUT_CHANNEL_ID = '1500797205382959164';  // ID Channel #🏆・results

// Daftar pilihan Rank dari LT5 sampai HT1
const RANK_CHOICES = [
    { name: 'LT5', value: 'LT5' },
    { name: 'HT5', value: 'HT5' },
    { name: 'LT4', value: 'LT4' },
    { name: 'HT4', value: 'HT4' },
    { name: 'LT3', value: 'LT3' },
    { name: 'HT3', value: 'HT3' },
    { name: 'LT2', value: 'LT2' },
    { name: 'HT2', value: 'HT2' },
    { name: 'LT1', value: 'LT1' },
    { name: 'HT1', value: 'HT1' },
];

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
                .setRequired(true)
                .addChoices(...RANK_CHOICES))
        .addStringOption(option => 
            option.setName('rank_earned')
                .setDescription('Rank earned')
                .setRequired(true)
                .addChoices(...RANK_CHOICES)),

    async execute(interaction) {
        // Cek apakah command dijalankan di channel #result-commands
        if (interaction.channelId !== COMMAND_CHANNEL_ID) {
            return await interaction.reply({
                content: `❌ This command can only be used in <#${COMMAND_CHANNEL_ID}>!`,
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

        // Ambil channel tempat output hasil embed
        const targetChannel = await interaction.client.channels.fetch(OUTPUT_CHANNEL_ID).catch(() => null);

        if (!targetChannel) {
            return await interaction.reply({
                content: `❌ Could not find output channel! Please check output channel ID.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setAuthor({ 
                name: `${username}'s Test Results 🏆`, 
                iconURL: player.displayAvatarURL() 
            })
            .addFields(
                { name: 'Tester', value: `<@${tester.id}>`, inline: true },
                { name: 'Region', value: region, inline: true },
                { name: 'Gamemode', value: gamemode, inline: true },
                { name: 'Username', value: username, inline: true },
                { name: 'Previous Rank', value: previousRank, inline: true },
                { name: 'Rank Earned', value: rankEarned, inline: true }
            )
            .setImage(`https://visage.surgeplay.com/full/512/${username}`);

        // Kirim embed + tag player ke channel #results
        await targetChannel.send({ content: `<@${player.id}>`, embeds: [embed] });

        // Konfirmasi sukses ke pengirim command di #result-commands
        await interaction.reply({
            content: `✅ Test result for **${username}** has been sent to <#${OUTPUT_CHANNEL_ID}>!`,
            ephemeral: true
        });
    },
};
