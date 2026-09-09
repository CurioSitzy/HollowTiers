import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { waitlistService } from '../services/WaitlistService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pull')
        .setDescription('Pull the top player from the waitlist and create a testing ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const player = waitlistService.pullNextPlayer();

        if (!player) {
            return interaction.editReply({
                content: '❌ The waitlist is empty. No players to pull.'
            });
        }

        const guild = interaction.guild;
        const categoryId = process.env.TICKET_CATEGORY_ID; // Set your ticket category ID in .env if available

        try {
            // Create a private ticket channel for the Player & Tester
            const ticketChannel = await guild.channels.create({
                name: `ticket-${player.username}`,
                type: ChannelType.GuildText,
                parent: categoryId || null,
                permissionOverwrites: [
                    {
                        id: guild.id, // Hide from everyone (@everyone)
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: player.id, // Permissions for Player
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: interaction.user.id, // Permissions for Tester
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            // Save ticket data
            waitlistService.registerTicket(ticketChannel.id, player, interaction.user.id);

            // Send welcome message in ticket channel
            await ticketChannel.send({
                content: `Hello <@${player.id}>! Your testing ticket has been created by Tester <@${interaction.user.id}>.\nUse \`/close\` once the testing session is finished.`
            });

            return interaction.editReply({
                content: `✅ Successfully pulled <@${player.id}>. Ticket channel created: ${ticketChannel}`
            });

        } catch (error) {
            console.error('Failed to create ticket channel:', error);
            return interaction.editReply({
                content: '❌ An error occurred while creating the ticket channel.'
            });
        }
    }
};
