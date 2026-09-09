import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';
import { WaitlistUpdater } from '../../services/waitlistupdater.js';

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
          { name: 'Spear Mace Tier', value: 'spearmace' }
        )
    )
    .addRoleOption(option =>
      option.setName('tester_role')
        .setDescription('Select the tester role allowed to open/close this queue')
        .setRequired(true)
    ),

  category: 'Queue',

  async execute(interaction, guildConfig, client) {
    await interaction.deferReply({ ephemeral: true });

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
