import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    MessageFlags
} from 'discord.js';

// Daftar Emoji Custom & Fallback Unicode (Pencegah Error API)
const BUTTON_CONFIG = {
    VERIFY: { id: '1546342563487944734', fallback: '▶', label: 'Verify / Change', customId: 'waitlist_verify', style: ButtonStyle.Success },
    CRYSTAL: { id: '1546304880476561408', fallback: '🔮', label: 'Crystal', customId: 'gm_crystal' },
    SWORD: { id: '1546304895395569675', fallback: '⚔️', label: 'Sword', customId: 'gm_sword' },
    AXE: { id: '1546304739036373023', fallback: '🪓', label: 'Axe', customId: 'gm_axe' },
    UHC: { id: '1546304876340977715', fallback: '❤️', label: 'UHC', customId: 'gm_uhc' },
    SMP: { id: '1546304892048646154', fallback: '🌐', label: 'SMP', customId: 'gm_smp' },
    POT: { id: '1546304887451689020', fallback: '🧪', label: 'Pot', customId: 'gm_pot' },
    NETHOP: { id: '1546304884230586408', fallback: '🔥', label: 'NethOP', customId: 'gm_nethop' },
    DIAMONDSMP: { id: '1546307214967570582', fallback: '💎', label: 'DiamondSMP', customId: 'gm_diasmp' },
    MACE: { id: '1546304790072393809', fallback: '🔨', label: 'Mace', customId: 'gm_mace' },
    CART: { id: '1546344405647233034', fallback: '🛒', label: 'Cart', customId: 'gm_cart' },
    SPEARMACE: { id: '1546346223009669192', fallback: '🗡️', label: 'Spear Mace', customId: 'gm_spearmace' }
};

/**
 * Validasi Emoji agar Discord API tidak menolak payload
 */
function buildButton(client, config) {
    const buttonStyle = config.style || ButtonStyle.Secondary;
    const button = new ButtonBuilder()
        .setCustomId(config.customId)
        .setLabel(config.label)
        .setStyle(buttonStyle);

    // Cek apakah bot mengenali ID custom emoji tersebut
    const customEmoji = client.emojis.cache.get(config.id);

    if (customEmoji) {
        button.setEmoji({ id: config.id });
    } else {
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
        // Menggunakan MessageFlags.Ephemeral agar tidak kena warning deprecated
        await interaction.reply({ 
            content: '⏳ Deploying waitlist panel...', 
            flags: MessageFlags.Ephemeral 
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
                `• **Type:** Premium Or Cracked\n\n` +
                `--------------------------------------------------\n\n` +
                `**Step 1: Click VERIFY / CHANGE Button Below**\n` +
                `Click the button to complete verification or update your IGN/Region.\n\n` +
                `**Step 2: Select Your Gamemode**\n` +
                `Pick your gamemodes below to get the corresponding waitlist roles.\n\n` +
                `--------------------------------------------------\n\n` +
                `🩸 Failure To Provide Authentic Information Will Result In A Denied Test.`
            );

        // Baris 1: Verify Button
        const row1 = new ActionRowBuilder().addComponents(
            buildButton(client, BUTTON_CONFIG.VERIFY)
        );

        // Baris 2: Crystal, Sword, Axe, UHC, SMP
        const row2 = new ActionRowBuilder().addComponents(
            buildButton(client, BUTTON_CONFIG.CRYSTAL),
            buildButton(client, BUTTON_CONFIG.SWORD),
            buildButton(client, BUTTON_CONFIG.AXE),
            buildButton(client, BUTTON_CONFIG.UHC),
            buildButton(client, BUTTON_CONFIG.SMP)
        );

        // Baris 3: Pot, NethOP, DiamondSMP, Mace, Cart
        const row3 = new ActionRowBuilder().addComponents(
            buildButton(client, BUTTON_CONFIG.POT),
            buildButton(client, BUTTON_CONFIG.NETHOP),
            buildButton(client, BUTTON_CONFIG.DIAMONDSMP),
            buildButton(client, BUTTON_CONFIG.MACE),
            buildButton(client, BUTTON_CONFIG.CART)
        );

        // Baris 4: Spear Mace
        const row4 = new ActionRowBuilder().addComponents(
            buildButton(client, BUTTON_CONFIG.SPEARMACE)
        );

        await interaction.channel.send({ 
            embeds: [embed], 
            components: [row1, row2, row3, row4] 
        });

        await interaction.editReply({ 
            content: '✅ Waitlist panel successfully deployed!' 
        });
    }
};
