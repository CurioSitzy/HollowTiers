import { 
  SlashCommandBuilder, 
  PermissionFlagsBits 
} from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';
import { WaitlistUpdater } from '../../services/waitlistupdater.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-queue')
    .setDescription('Setup the waitlist queue panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'Queue',

  async execute(interaction, guildConfig, client) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. Buat pesan dengan format lama yang diinginkan
      const { embed, components } = WaitlistUpdater.buildMessage(waitlistService);

      // 2. Kirim ke channel
      const queueMessage = await interaction.channel.send({
        embeds: [embed],
        components: components
      });

      // 3. Simpan message ID ke service
      if (typeof waitlistService.setMessageId === 'function') {
        waitlistService.setMessageId(queueMessage.id);
      }

      await interaction.editReply({ content: '✅ Queue panel created successfully!' });
    } catch (error) {
      console.error('Error executing /setup-queue:', error);
      await interaction.editReply({ content: '❌ Failed to create queue panel.' });
    }
  }
};
