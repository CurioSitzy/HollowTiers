import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';
import { WaitlistUpdater } from '../../services/waitlistupdater.js';

// ID Role Admin
const ALLOWED_ROLE_IDS = [
    '1546366823732351016', // ID Role Admin
    '1500479159485595724'  // ID Role Verified Admin
];

// ==========================================
// TESTER ROLE IDs PER GAMEMODE (AUTOMATIC FALLBACK)
// ISI DENGAN ID ROLE TESTER MASING-MASING GAMEMODE
// ==========================================
const TESTER_ROLES = {
  crystal: '1546352188757119107',
  sword: '1546352203739045888',
  mace: '1546163052909428796',
  axe: '1546352170721607710',
  uhc: '1546349340778438687',
  pot: '1546349242245971998',
  nethop: '1546349287720488970',
  smp: '1546352269333635152',
  cart: '1546349356020666439',
  diasmp: '1546352284135334019',
  spearmace: '1546349379709833296',
};

export default {
  data: new SlashCommandBuilder()
    .setName('setup-queue')
    .setDescription('Setup waitlist panel for a specific gamemode')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('gamemode')
        .setDescription('Select Gamemode')
        .setRequired(true)
        .addChoices(
          { name: 'Mace Tier', value: 'mace' },
          { name: 'Sword Tier', value: 'sword' },
          { name: 'Axe Tier', value: 'axe' },
          { name: 'Crystal Tier', value: 'crystal' },
          { name: 'Dia Pot Tier', value: 'diapot' },
          { name: 'UHC Tier', value: 'uhc' },
          { name: 'SMP Tier', value: 'smp' },
          { name: 'Dia SMP Tier', value: 'diasmp' },
          { name: 'Cart Tier', value: 'cart' },
          { name: 'Spear Mace Tier', value: 'spearmace' },
          { name: 'NethOp Tier', value: 'nethop' }
        )
    )
    .addRoleOption(option =>
      option.setName('tester_role')
        .setDescription('Select the tester role allowed to open/close this queue (Optional if pre-configured)')
        .setRequired(false) // Boleh dikosongkan karena sudah ada sistem TESTER_ROLES otomatis
    ),

  category: 'Queue',

  async execute(interaction, guildConfig, client) {
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ You do not have permission to use this command!',
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const modeKey = interaction.options.getString('gamemode');
      const selectedRole = interaction.options.getRole('tester_role');

      // Tentukan ID Role Tester: Pakai role yang dipilih manual di command, 
      // kalau tidak diisi/dipilih, otomatis ambil dari mapping TESTER_ROLES di atas.
      const finalTesterRoleId = selectedRole?.id || TESTER_ROLES[modeKey];

      // 1. Simpan ID role tester ke service
      if (finalTesterRoleId) {
        waitlistService.setTesterRole(modeKey, finalTesterRoleId);
      }

      // 2. Buat embed & tombol
      const { embed, components } = WaitlistUpdater.buildMessage(modeKey, waitlistService);

      if (!embed) {
        return await interaction.editReply({ content: '❌ Invalid gamemode selection.' });
      }

      // 3. Kirim panel ke channel
      const queueMessage = await interaction.channel.send({
        embeds: [embed],
        components: components
      });

      // 4. Simpan ID pesan
      waitlistService.setMessageId(modeKey, queueMessage.id);

      await interaction.editReply({ 
        content: `✅ Queue panel for **${modeKey.toUpperCase()}** created!\nRole tester: ${finalTesterRoleId ? `<@&${finalTesterRoleId}>` : '*None/Not Configured*'}` 
      });
    } catch (error) {
      console.error('Error executing /setup-queue:', error);
      await interaction.editReply({ content: '❌ Failed to create queue panel.' });
    }
  }
};
