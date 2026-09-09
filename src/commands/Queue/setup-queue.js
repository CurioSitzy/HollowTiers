import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-queue')
    .setDescription('Setup the waitlist queue panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  category: 'Queue', // Pastikan kategorinya aktif di bot.js

  async execute(interaction, guildConfig, client) {
    // Kodingan untuk ngirim tombol / panel waitlist
  }
};
