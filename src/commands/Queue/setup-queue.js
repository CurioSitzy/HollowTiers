import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';
import { WaitlistUpdater } from '../../services/waitlistupdater.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-queue')
    .setDescription('Setup and send the waitlist queue panel to this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(option =>
      option
        .setName('required_role')
        .setDescription('Role required to join this waitlist (optional)')
        .setRequired(false)
    ),

  category: 'Queue',

  async execute(interaction, guildConfig, client) {
    // 1. Langsung deferReply agar Discord tidak timeout ("Application did not respond")
    await interaction.deferReply({ ephemeral: true });

    try {
      // 2. Simpan role ID jika ditentukan oleh admin
      const requiredRole = interaction.options.getRole('required_role');
      if (requiredRole && typeof waitlistService.setRequiredRoleId === 'function') {
        waitlistService.setRequiredRoleId(requiredRole.id);
      }

      // 3. Buat Embed Panel Queue
      const roleMention = requiredRole ? `<@&${requiredRole.id}>` : 'Everyone';
      
      const embed = new EmbedBuilder()
        .setTitle('🎮 Player Waitlist Queue')
        .setDescription(
          `Welcome! Click the buttons below to manage your waitlist status.\n\n` +
          `🔒 **Required Role:** ${roleMention}\n` +
          `📌 **Status:** ${waitlistService.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}`
        )
        .setColor(0x5865F2)
        .setTimestamp();

      // 4. Buat Tombol Interaksi (Verify, Join, Leave, Toggle)
      const verifyBtn = new ButtonBuilder()
        .setCustomId('waitlist_verify')
        .setLabel('Verify & Join')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📝');

      const leaveBtn = new ButtonBuilder()
        .setCustomId('waitlist_leave')
        .setLabel('Leave Queue')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚪');

      const toggleBtn = new ButtonBuilder()
        .setCustomId('waitlist_toggle')
        .setLabel('Toggle Queue Status')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⚙️');

      const row = new ActionRowBuilder().addComponents(verifyBtn, leaveBtn, toggleBtn);

      // 5. Kirim pesan panel utama ke channel
      const queueMessage = await interaction.channel.send({
        embeds: [embed],
        components: [row]
      });

      // 6. Update tampilan awal queue di dalam pesan tersebut
      if (WaitlistUpdater?.updateMessage) {
        await WaitlistUpdater.updateMessage(interaction.channel, queueMessage.id, waitlistService);
      }

      // 7. Berikan respon sukses ke pemanggil command
      await interaction.editReply({ 
        content: '✅ Waitlist queue panel successfully created and configured!' 
      });

    } catch (error) {
      console.error('Error executing /setup-queue:', error);
      
      // Tangani balasan error dengan aman
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ 
          content: '❌ Failed to setup queue panel. Please check bot permissions and logs.' 
        });
      } else {
        await interaction.reply({ 
          content: '❌ Failed to setup queue panel. Please check bot permissions and logs.', 
          ephemeral: true 
        });
      }
    }
  }
};
