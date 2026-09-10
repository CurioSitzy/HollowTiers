import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';
import { WaitlistUpdater } from '../../services/waitlistupdater.js';

// ID Role
const ALLOWED_ROLE_IDS = [
    '1546366823732351016', // ID Role Admin
    '1500479159485595724'  // ID Role Verified Admin
]; // 👈 PERBAIKAN 1: Menambahkan ']' dan ';' yang kurang

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
        .setDescription('Select the tester role allowed to open/close this queue')
        .setRequired(true)
    ),

  category: 'Queue',

  async execute(interaction, guildConfig, client) {
    // 👈 PERBAIKAN 2: Pengecekan permission dilakukan di awal
    const hasPermission = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ You do not have permission to use this command!',
        flags: 64 // Ephemeral (hanya terlihat oleh user yang menjalankan command)
      });
    }

    await interaction.deferReply({ flags: 64 }); // Menggunakan 'flags: 64' pengganti ephemeral: true (versi discord.js v14 terbaru)

    try {
      const modeKey = interaction.options.getString('gamemode');
      const testerRole = interaction.options.getRole('tester_role');

      // 1. Simpan ID role tester ke service
      waitlistService.setTesterRole(modeKey, testerRole.id);

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
        content: `✅ Queue panel for **${modeKey.toUpperCase()}** created!\nRole tester: <@&${testerRole.id}>` 
      });
    } catch (error) {
      console.error('Error executing /setup-queue:', error);
      await interaction.editReply({ content: '❌ Failed to create queue panel.' });
    }
  }
};
