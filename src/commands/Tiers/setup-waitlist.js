import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-waitlist')
        .setDescription('Send the Evaluation Testing Waitlist panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ 
                name: 'Evaluation Testing Waitlist', 
                iconURL: interaction.guild.iconURL() 
            })
            .setDescription(
                `🩸 **Requirements:**\n` +
                `• **Region:** NA, EU, AS, AU\n` +
                `• **Username:** In-Game Name\n` +
                `• **Server:** Minecraft Server\n` +
                `• **Type:** Cracked Or Premium\n\n` +
                `--------------------------------------------------\n\n` +
                `**Step 1: Click VERIFY Button Below**\n` +
                `Then Select Your Gamemode To Get The Waitlist Role.\n\n` +
                `--------------------------------------------------\n\n` +
                `🩸 Failure To Provide Authentic Information Will Result In A Denied Test.`
            );

        // Baris 1: Tombol VERIFY
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('waitlist_verify')
                .setLabel('VERIFY')
                .setEmoji('❤️')
                .setStyle(ButtonStyle.Secondary)
        );

        // Baris 2: Gamemode (Crystal, Sword, Axe, UHC, SMP)
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('gm_crystal').setLabel('Crystal').setEmoji('🔮').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_sword').setLabel('Sword').setEmoji('⚔️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_axe').setLabel('Axe').setEmoji('🪓').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_uhc').setLabel('UHC').setEmoji('🍏').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_smp').setLabel('SMP').setEmoji('🌐').setStyle(ButtonStyle.Secondary)
        );

        // Baris 3: Gamemode (DiaPot, NethPot, DiaSmp, Mace)
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('gm_diapot').setLabel('DiaPot').setEmoji('🧪').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_nethpot').setLabel('NethPot').setEmoji('🖤').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_diasmp').setLabel('DiaSmp').setEmoji('🍇').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_mace').setLabel('Mace').setEmoji('🔨').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ 
            embeds: [embed], 
            components: [row1, row2, row3] 
        });

        await interaction.reply({ 
            content: '✅ Waitlist panel successfully deployed!', 
            ephemeral: true 
        });
    }
};
