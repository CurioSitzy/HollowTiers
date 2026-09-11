import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'playerData.json');

export class WaitlistService {
  constructor() {
    this.playerData = new Map();
    this.activeTickets = new Map();
    this.loadPlayerData();

    // Tambahkan properti channelId di tiap mode
    this.modes = new Map([
      ['mace', { name: 'Mace', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['sword', { name: 'Sword', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['crystal', { name: 'Crystal', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['axe', { name: 'Axe', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['pot', { name: 'Pot', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['diapot', { name: 'Dia Pot', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['uhc', { name: 'UHC', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['smp', { name: 'SMP', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['diasmp', { name: 'Dia SMP', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['spearmace', { name: 'Spearmace', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['cart', { name: 'Cart', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }],
      ['nethop', { name: 'NetHop', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null, channelId: null }]
    ]);
  }

  loadPlayerData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(rawData);
        this.playerData = new Map(Object.entries(parsed));
      }
    } catch (err) {
      console.error('Failed to load playerData.json:', err);
      this.playerData = new Map();
    }
  }

  savePlayerData() {
    try {
      const obj = Object.fromEntries(this.playerData);
      fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save playerData.json:', err);
    }
  }

  setPlayerStats(userId, data) {
    this.playerData.set(userId, data);
    this.savePlayerData();
  }

  getPlayerStats(userId) {
    return this.playerData.get(userId) || null;
  }

  getMode(modeKey) {
    return this.modes.get(modeKey?.toLowerCase());
  }

  setTesterRole(modeKey, roleId) {
    const mode = this.getMode(modeKey);
    if (mode) mode.testerRoleId = roleId;
  }

  setMessageId(modeKey, messageId) {
    const mode = this.getMode(modeKey);
    if (mode) mode.messageId = messageId;
  }

  // Method baru untuk menyimpan Channel ID
  setChannelId(modeKey, channelId) {
    const mode = this.getMode(modeKey);
    if (mode) mode.channelId = channelId;
  }

  isTester(member, modeKey) {
    if (!member || !modeKey) return false;
    const mode = this.getMode(modeKey);
    if (!mode || !mode.testerRoleId) return false;
    return member.roles.cache.has(mode.testerRoleId);
  }

  toggleOpen(modeKey, userId) {
    const mode = this.getMode(modeKey);
    if (!mode) return false;

    mode.isOpen = !mode.isOpen;

    if (mode.isOpen) {
      const now = new Date();
      mode.lastSession = now.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      mode.openedBy = userId;
    } else {
      mode.openedBy = null;
    }

    return mode.isOpen;
  }

  addPlayer(modeKey, user) {
    const mode = this.getMode(modeKey);
    if (!mode) return { success: false, reason: 'Invalid game mode.' };
    if (!mode.isOpen) return { success: false, reason: 'This queue is currently closed.' };

    const exists = mode.queue.some(p => p.id === user.id);
    if (exists) return { success: false, reason: 'You are already in this queue!' };

    mode.queue.push({ id: user.id, username: user.username, joinedAt: Date.now() });
    return { success: true };
  }

  removePlayer(modeKey, userId) {
    const mode = this.getMode(modeKey);
    if (!mode) return { success: false, reason: 'Invalid game mode.' };

    const index = mode.queue.findIndex(p => p.id === userId);
    if (index === -1) return { success: false, reason: 'You are not in this queue.' };

    mode.queue.splice(index, 1);
    return { success: true };
  }

  // ==========================================
  // HELPER UNTUK REFRESH/UPDATE EMBED DISCORD
  // ==========================================
  async updateQueueEmbed(modeKey, client) {
    const mode = this.getMode(modeKey);
    if (!mode || !mode.messageId || !mode.channelId || !client) return;

    try {
      const channel = await client.channels.fetch(mode.channelId).catch(() => null);
      if (!channel) return;

      const message = await channel.messages.fetch(mode.messageId).catch(() => null);
      if (!message) return;

      // Ambil embed asli
      const existingEmbed = message.embeds[0];
      if (!existingEmbed) return;

      // Buat daftar antrean terbaru
      const queueList = mode.queue.length > 0
        ? mode.queue.map((p, i) => `${i + 1}. <@${p.id}>`).join('\n')
        : 'No players in queue';

      // Rebuild embed dengan antrean baru
      const newEmbed = { ...existingEmbed.data };
      
      // Update field Waiting Queue
      const queueFieldIndex = newEmbed.fields?.findIndex(f => f.name.includes('Waiting Queue'));
      if (queueFieldIndex !== undefined && queueFieldIndex !== -1) {
        newEmbed.fields[queueFieldIndex].name = `Waiting Queue (${mode.queue.length})`;
        newEmbed.fields[queueFieldIndex].value = queueList;
      }

      await message.edit({ embeds: [newEmbed] });
    } catch (err) {
      console.error(`Failed to update embed for mode ${modeKey}:`, err);
    }
  }

  // ==========================================
  // FITUR PULL & TICKET SYSTEM
  // ==========================================

  pullNextPlayer(modeKey = null, client = null) {
    let pulledResult = null;

    if (modeKey) {
      const mode = this.getMode(modeKey);
      if (mode && mode.queue.length > 0) {
        pulledResult = { 
          player: mode.queue.shift(), 
          modeName: mode.name, 
          modeKey: modeKey.toLowerCase() 
        };
      }
    } else {
      for (const [key, mode] of this.modes.entries()) {
        if (mode.isOpen && mode.queue.length > 0) {
          pulledResult = { 
            player: mode.queue.shift(), 
            modeName: mode.name, 
            modeKey: key 
          };
          break;
        }
      }
    }

    // Jika berhasil pull player, otomatis refresh embed pesan Discord
    if (pulledResult && client) {
      this.updateQueueEmbed(pulledResult.modeKey, client);
    }

    return pulledResult;
  }

  registerTicket(channelId, player, testerId) {
    this.activeTickets.set(channelId, { player, testerId, createdAt: Date.now() });
  }

  getTicket(channelId) {
    return this.activeTickets.get(channelId) || null;
  }

  removeTicket(channelId) {
    return this.activeTickets.delete(channelId);
  }
}

export const waitlistService = new WaitlistService();
