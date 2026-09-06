import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} from 'discord.js';

// Custom Emoji ID khusus aset MCTiers
const EMOJIS = {
    VERIFY: '1215283940123021312',   // Heart/Verify
    CRYSTAL: '1215283938210410496',  // Crystal Icon
    SWORD: '1215283925237514240',    // Sword Icon
    AXE: '1215283923412979722',      // Axe Icon
    UHC: '1215283921831723018',      // UHC / Golden Apple Icon
    SMP: '1215283920191885372',      // SMP / Ender Pearl Icon
    DIAPOT: '1215283918505775104',   // Pot / Potion Icon
    NETHPOT: '1215283916895158282',  // NethOP / Helmet Icon
    DIASMP: '1215283915150331904',   // DiaSMP / Chorus Icon
    MACE: '1215283913455702026'      // Mace Icon
};

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
                .setEmoji(EMOJIS.VERIFY)
                .setStyle(ButtonStyle.Secondary)
        );

        // Baris 2: Gamemode (Crystal, Sword, Axe, UHC, SMP)
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('gm_crystal').setLabel('Crystal').setEmoji(EMOJIS.CRYSTAL).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_sword').setLabel('Sword').setEmoji(EMOJIS.SWORD).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_axe').setLabel('Axe').setEmoji(EMOJIS.AXE).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_uhc').setLabel('UHC').setEmoji(EMOJIS.UHC).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_smp').setLabel('SMP').setEmoji(EMOJIS.SMP).setStyle(ButtonStyle.Secondary)
        );

        // Baris 3: Gamemode (DiaPot, NethPot, DiaSmp, Mace)
        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('gm_diapot').setLabel('DiaPot').setEmoji(EMOJIS.DIAPOT).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_nethpot').setLabel('NethPot').setEmoji(EMOJIS.NETHPOT).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_diasmp').setLabel('DiaSmp').setEmoji(EMOJIS.DIASMP).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('gm_mace').setLabel('Mace').setEmoji(EMOJIS.MACE).setStyle(ButtonStyle.Secondary)
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
