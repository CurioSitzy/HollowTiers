export class WaitlistService {
  constructor() {
    this.gamemodes = {
      mace: { name: 'Mace', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      sword: { name: 'Sword', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      axe: { name: 'Axe', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      crystal: { name: 'Crystal', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      diapot: { name: 'Dia Pot', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      uhc: { name: 'UHC', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      smp: { name: 'SMP', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      diasmp: { name: 'Dia SMP', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      cart: { name: 'Cart', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null },
      spearmace: { name: 'Spear Mace', testerRoleId: null, isOpen: false, queue: [], lastSession: '-', openedBy: null, messageId: null }
    };
  }

  getMode(modeKey) {
    if (!modeKey) return null;
    return this.gamemodes[modeKey.toLowerCase()] || null;
  }

  setTesterRole(modeKey, roleId) {
    const mode = this.getMode(modeKey);
    if (mode) mode.testerRoleId = roleId;
  }

  setMessageId(modeKey, messageId) {
    const mode = this.getMode(modeKey);
    if (mode) mode.messageId = messageId;
  }

  isTester(member, modeKey) {
    const mode = this.getMode(modeKey);
    if (!mode || !mode.testerRoleId) return false;
    return member.roles.cache.has(mode.testerRoleId);
  }

  toggleOpen(modeKey, user) {
    const mode = this.getMode(modeKey);
    if (!mode) return false;

    mode.isOpen = !mode.isOpen;
    if (mode.isOpen) {
      // Otomatis mengambil tanggal, bulan, dan tahun saat queue dibuka
      const now = new Date();
      mode.lastSession = now.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }); // Contoh hasil: "09 Sept 2026"
      mode.openedBy = user ? user.id : null;
    } else {
      mode.openedBy = null;
    }
    return mode.isOpen;
  }

  addPlayer(modeKey, user) {
    const mode = this.getMode(modeKey);
    if (!mode) return { success: false, reason: 'Invalid gamemode.' };
    if (!mode.isOpen) return { success: false, reason: `Queue for ${mode.name} is currently closed.` };

    if (mode.queue.some(p => p.id === user.id)) {
      return { success: false, reason: `You are already in the ${mode.name} queue.` };
    }

    mode.queue.push({ id: user.id, username: user.username, joinedAt: new Date() });
    return { success: true };
  }

  removePlayer(modeKey, userId) {
    const mode = this.getMode(modeKey);
    if (!mode) return { success: false, reason: 'Invalid gamemode.' };

    const index = mode.queue.findIndex(p => p.id === userId);
    if (index === -1) {
      return { success: false, reason: `You are not in the ${mode.name} queue.` };
    }

    mode.queue.splice(index, 1);
    return { success: true };
  }
}

export const waitlistService = new WaitlistService();
