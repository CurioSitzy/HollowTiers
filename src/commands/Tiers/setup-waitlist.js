import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} from 'discord.js';

// Daftar Emoji Custom (Nama & ID disesuaikan dengan server)
const EMOJIS = {
    VERIFY: { name: 'Arrow', id: '1546313419068674189' },   
    CRYSTAL: { name: 'Vanilla', id: '1546313326676414554' },  
    SWORD: { name: 'Sword', id: '1546313218450788432' },    
    AXE: { name: 'Axe', id: '1546313229402243185' },      
    UHC: { name: 'Uhc', id: '1546313237258043453' },      
    SMP: { name: 'Smp', id: '1546313380170702878' },      
    POT: { name: 'Pot', id: '1546313256849772654' },   
    NETHOP: { name: 'Nethop', id: '1546313270510751764' },  
    DIAMONDSMP: { name: 'DiamondSMP', id: '1546313297547231252' },   
    MACE: { name: 'Mace', id: '1546313193989734510' }      
};

/**
 * Helper untuk membuat tombol secara aman agar tidak crash jika ID emoji mismatch
 */
function createSafeButton(client, { customId, label, emoji, style = ButtonStyle.Secondary }) {
    const button = new ButtonBuilder()
        .setCustomId(customId)
        .setLabel(label)
        .setStyle(style);

    if (emoji && emoji.id) {
        // Cek apakah emoji ada di cache bot
        const emojiExists = client.emojis.cache.has(emoji.id);
        if (emojiExists) {
            button.setEmoji({ id: emoji.id, name: emoji.name });
        } else {
            // Fallback kirim objek emoji langsung jika bot tetap bisa mengaksesnya
            button.setEmoji({ id: emoji.id });
        }
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
        // 1. Reply Ephemeral Awal (mencegah timeout & warning deprecation)
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

        // ActionRow 1: VERIFY Button
        const row1 = new ActionRowBuilder().addComponents(
            createSafeButton(client, {
                customId: 'waitlist_verify',
                label: 'VERIFY',
                emoji: EMOJIS.VERIFY,
                style: ButtonStyle.Secondary
            })
        );

        // ActionRow 2: Gamemodes (Max 5 items)
        const row2 = new ActionRowBuilder().addComponents(
            createSafeButton(client, { customId: 'gm_crystal', label: 'Crystal', emoji: EMOJIS.CRYSTAL }),
            createSafeButton(client, { customId: 'gm_sword', label: 'Sword', emoji: EMOJIS.SWORD }),
            createSafeButton(client, { customId: 'gm_axe', label: 'Axe', emoji: EMOJIS.AXE }),
            createSafeButton(client, { customId: 'gm_uhc', label: 'UHC', emoji: EMOJIS.UHC }),
            createSafeButton(client, { customId: 'gm_smp', label: 'SMP', emoji: EMOJIS.SMP })
        );

        // ActionRow 3: Extra Gamemodes
        const row3 = new ActionRowBuilder().addComponents(
            createSafeButton(client, { customId: 'gm_pot', label: 'Pot', emoji: EMOJIS.POT }),
            createSafeButton(client, { customId: 'gm_nethop', label: 'NethOP', emoji: EMOJIS.NETHOP }),
            createSafeButton(client, { customId: 'gm_diamondsmp', label: 'DiamondSMP', emoji: EMOJIS.DIAMONDSMP }),
            createSafeButton(client, { customId: 'gm_mace', label: 'Mace', emoji: EMOJIS.MACE })
        );

        // 2. Send Panel ke Channel
        await interaction.channel.send({ 
            embeds: [embed], 
            components: [row1, row2, row3] 
        });

        // 3. Update Ephemeral Reply
        await interaction.editReply({ 
            content: '✅ Waitlist panel successfully deployed!' 
        });
    }
};
