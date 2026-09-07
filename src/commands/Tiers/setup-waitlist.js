import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} from 'discord.js';

// Daftar Emoji Custom & Fallback Unicode (Pencegah Error API)
const BUTTON_CONFIG = {
    VERIFY: { id: '1546313419068674189', fallback: '✅', label: 'Arrow', customId: 'waitlist_verify' },
    CRYSTAL: { id: '1546313326676414554', fallback: '🔮', label: 'Crystal', customId: 'gm_crystal' },
    SWORD: { id: '1546313218450788432', fallback: '⚔️', label: 'Sword', customId: 'gm_sword' },
    AXE: { id: '1546313229402243185', fallback: '🪓', label: 'Axe', customId: 'gm_axe' },
    UHC: { id: '1546313237258043453', fallback: '❤️', label: 'UHC', customId: 'gm_uhc' },
    SMP: { id: '1546313380170702878', fallback: '🌐', label: 'SMP', customId: 'gm_smp' },
    POT: { id: '1546313256849772654', fallback: '🧪', label: 'Pot', customId: 'gm_pot' },
    NETHOP: { id: '1546313270510751764', fallback: '🔥', label: 'NethOP', customId: 'gm_nethop' },
    DIAMONDSMP: { id: '1546313297547231252', fallback: '💎', label: 'DiamondSMP', customId: 'gm_diamondsmp' },
    MACE: { id: '1546313193989734510', fallback: '🔨', label: 'Mace', customId: 'gm_mace' }
};

/**
 * Validasi Emoji agar Discord API tidak menolak payload
 */
function buildButton(client, config, style = ButtonStyle.Secondary) {
    const button = new ButtonBuilder()
        .setCustomId(config.customId)
        .setLabel(config.label)
        .setStyle(style);

    // Cek apakah bot mengenali ID custom emoji tersebut
    const customEmoji = client.emojis.cache.get(config.id);

    if (customEmoji) {
        button.setEmoji({ id: config.id });
    } else {
        // Jika tidak ditemukan di server/cache, gunakan emoji bawaan agar TIDAK ERROR
        button.setEmoji(config.fallback);
    }

    return button;
}

export default {
    category: 'Waitlist',
    data: new SlashCommandBuilder()
        .setName('setup-waitlist')
        .setDescription('Send the Evaluation Testing Waitlist panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.reply({ 
            content: '⏳ Deploying waitlist panel...', 
            flags: 64 
        });

        const guildIcon = interaction.guild.iconURL();
        const client = interaction.client;

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ 
                name: 'Evaluation Testing Waitlist', 
                ...(guildIcon && { iconURL: guildIcon })
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

        // Baris 1
        const row1 = new ActionRowBuilder().addComponents(
            buildButton(client, BUTTON_CONFIG.VERIFY)
        );

        // Baris 2
        const row2 = new ActionRowBuilder().addComponents(
            buildButton(client, BUTTON_CONFIG.CRYSTAL),
            buildButton(client, BUTTON_CONFIG.SWORD),
            buildButton(client, BUTTON_CONFIG.AXE),
            buildButton(client, BUTTON_CONFIG.UHC),
            buildButton(client, BUTTON_CONFIG.SMP)
        );

        // Baris 3
        const row3 = new ActionRowBuilder().addComponents(
            buildButton(client, BUTTON_CONFIG.POT),
            buildButton(client, BUTTON_CONFIG.NETHOP),
            buildButton(client, BUTTON_CONFIG.DIAMONDSMP),
            buildButton(client, BUTTON_CONFIG.MACE)
        );

        await interaction.channel.send({ 
            embeds: [embed], 
            components: [row1, row2, row3] 
        });

        await interaction.editReply({ 
            content: '✅ Waitlist panel successfully deployed!' 
        });
    }
};
