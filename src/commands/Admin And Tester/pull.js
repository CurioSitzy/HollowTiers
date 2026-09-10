import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { waitlistService } from '../../services/waitlistservice.js';

const TESTER_ROLE_IDS = [
  '1502537249131335710',
  '1500479159485595722',
];

export default {
  data: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pull the top player from the waitlist and create a testing ticket'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // 1. Pengecekan Role Tester
    const member = interaction.member;
    const hasTesterRole = TESTER_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));

    if (!hasTesterRole && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({
        content: '❌ **Akses Ditolak!** Hanya **Tester** dan **Verified Tester** yang dapat menggunakan command ini.'
      });
    }

    // 2. Ambil Player dari Service
    const player = waitlistService.pullNextPlayer();

    if (!player) {
      return interaction.editReply({
        content: '❌ Antrean waitlist kosong. Tidak ada player untuk ditarik.'
      });
    }

    const guild = interaction.guild;
    const categoryId = process.env.TICKET_CATEGORY_ID;

    try {
      // 3. Buat Room Ticket
      const ticketChannel = await guild.channels.create({
        name: `ticket-${player.username || player.id}`,
        type: ChannelType.GuildText,
        parent: categoryId || null,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: player.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          }
        ]
      });

      // 4. Register Ticket ke Waitlist Service
      if (typeof waitlistService.registerTicket === 'function') {
        waitlistService.registerTicket(ticketChannel.id, player, interaction.user.id);
      }

      await ticketChannel.send({
        content: `Halo <@${player.id}>! Room ticket tes kamu telah dibuat oleh Tester <@${interaction.user.id}>.\nGunakan \`/close\` jika sesi tes sudah selesai.`
      });

      return interaction.editReply({
        content: `✅ Berhasil menarik <@${player.id}>. Room ticket: ${ticketChannel}`
      });

    } catch (error) {
      console.error('Gagal membuat channel ticket:', error);
      return interaction.editReply({
        content: `❌ Terjadi kesalahan saat membuat channel ticket: \`${error.message}\``
      });
    }
  }
};
