export class WaitlistService {
  constructor() {
    // Penyimpanan data verifikasi pemain (IGN, Region, Type)
    this.playerData = new Map();

    // Inisialisasi daftar gamemode beserta propertinya
    this.modes = new Map([
      ['mace', { name: 'Mace', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['sword', { name: 'Sword', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['crystal', { name: 'Crystal', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['axe', { name: 'Axe', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['pot', { name: 'Pot', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['diapot', { name: 'Dia Pot', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['uhc', { name: 'UHC', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['smp', { name: 'SMP', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['diasmp', { name: 'Dia SMP', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['spearmace', { name: 'Spearmace', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }],
      ['cart', { name: 'Cart', isOpen: false, queue: [], openedBy: null, lastSession: null, testerRoleId: null, messageId: null }]
    ]);
  }

  // Simpan data verifikasi pemain
  setPlayerStats(userId, data) {
    this.playerData.set(userId, data);
  }

  // Ambil data verifikasi pemain
  getPlayerStats(userId) {
    return this.playerData.get(userId) || null;
  }

  // Mengambil data mode berdasarkan kunci (misal: 'mace', 'spearmace')
  getMode(modeKey) {
    return this.modes.get(modeKey?.toLowerCase());
  }

  // Menyimpan ID Role tester dari komando /setup-queue
  setTesterRole(modeKey, roleId) {
    const mode = this.getMode(modeKey);
    if (mode) {
      mode.testerRoleId = roleId;
    }
  }

  // Menyimpan ID Message panel untuk di-edit otomatis
  setMessageId(modeKey, messageId) {
    const mode = this.getMode(modeKey);
    if (mode) {
      mode.messageId = messageId;
    }
  }

  // Memeriksa apakah user memiliki role tester sesuai mode
  isTester(member, modeKey) {
    if (!member || !modeKey) return false;
    const mode = this.getMode(modeKey);
    if (!mode || !mode.testerRoleId) return false;
    return member.roles.cache.has(mode.testerRoleId);
  }

  // Buka/Tutup antrean serta simpan ID Tester yang menekan tombol
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

  // Menambahkan pemain ke antrean
  addPlayer(modeKey, user) {
    const mode = this.getMode(modeKey);
    if (!mode) return { success: false, reason: 'Invalid game mode.' };
    if (!mode.isOpen) return { success: false, reason: 'This queue is currently closed.' };

    const exists = mode.queue.some(p => p.id === user.id);
    if (exists) return { success: false, reason: 'You are already in this queue!' };

    mode.queue.push({ id: user.id, username: user.username, joinedAt: Date.now() });
    return { success: true };
  }

  // Menghapus pemain dari antrean
  removePlayer(modeKey, userId) {
    const mode = this.getMode(modeKey);
    if (!mode) return { success: false, reason: 'Invalid game mode.' };

    const index = mode.queue.findIndex(p => p.id === userId);
    if (index === -1) return { success: false, reason: 'You are not in this queue.' };

    mode.queue.splice(index, 1);
    return { success: true };
  }
}

export const waitlistService = new WaitlistService();
