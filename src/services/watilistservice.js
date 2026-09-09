const { EmbedBuilder } = require('discord.js');

class WaitlistService {
  constructor() {
    this.waitlists = new Map();
  }

  // Get or initialize waitlist for a specific channel
  getWaitlist(channelId) {
    if (!this.waitlists.has(channelId)) {
      this.waitlists.set(channelId, []);
    }
    return this.waitlists.get(channelId);
  }

  // Add user to the waitlist queue
  addUser(channelId, userId) {
    const queue = this.getWaitlist(channelId);
    if (!queue.includes(userId)) {
      queue.push(userId);
      return { success: true, position: queue.length };
    }
    return { success: false, message: 'User is already in the waitlist queue.' };
  }

  // Remove user from the waitlist queue
  removeUser(channelId, userId) {
    const queue = this.getWaitlist(channelId);
    const index = queue.indexOf(userId);
    if (index !== -1) {
      queue.splice(index, 1);
      return true;
    }
    return false;
  }

  // Pull the next user in line
  pullNext(channelId) {
    const queue = this.getWaitlist(channelId);
    if (queue.length === 0) return null;
    return queue.shift();
  }

  // Clear all users from the waitlist
  clearWaitlist(channelId) {
    this.waitlists.set(channelId, []);
  }

  // Generate embed layout for the waitlist display
  buildWaitlistEmbed(guild, channelId, title = 'Evaluation Testing Waitlist') {
    const queue = this.getWaitlist(channelId);
    
    const embed = new EmbedBuilder()
      .setTitle(`📋 ${title}`)
      .setColor('#2F3136')
      .setTimestamp();

    if (queue.length === 0) {
      embed.setDescription('The queue is currently empty. Click the button below to join!');
    } else {
      const queueList = queue.map((id, index) => `${index + 1}. <@${id}>`).join('\n');
      embed.setDescription(`**Queue List (${queue.length}):**\n\n${queueList}`);
    }

    return embed;
  }
}

module.exports = new WaitlistService();
