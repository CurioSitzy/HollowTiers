export class WaitlistService {
  constructor() {
    // Definisi mode queue bawaan (termasuk spearmace & cart)
    this.modes = new Map([
      ['mace', { name: 'Mace', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['sword', { name: 'Sword', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['crystal', { name: 'Crystal', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['axe', { name: 'Axe', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['pot', { name: 'Pot', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['uhc', { name: 'UHC', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['smp', { name: 'SMP', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['spearmace', { name: 'Spearmace', isOpen: false, queue: [], openedBy: null, lastSession: null }],
      ['cart', { name: 'Cart', isOpen: false, queue: [], openedBy: null, lastSession: null }]
    ]);

    // Role Tester yang diizinkan untuk setiap mode (Ganti ID Role sesuai server kamu)
    this.testerRoles = {
      mace: ['1546163052909428796'],
      sword: ['1546352203739045888'],
      crystal: ['1546352188757119107'],
      axe: ['1546352170721607710'],
      pot: ['1546349242245971998'],
      uhc: ['1546349340778438687'],
      smp: ['1546352269333635152'],
      spearmace: ['1546349379709833296'],
      cart: ['1546349356020666439']
    };
  }

  getMode(modeKey) {
    return this.modes.get(modeKey?.toLowerCase());
  }

  isTester(member, modeKey) {
    if (!member || !modeKey) return false;
    const allowedRoles = this.testerRoles[modeKey.toLowerCase()] || [];
    return member.roles.cache.some(role => allowedRoles.includes(role.id));
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
      // Menyimpan ID tester yang menekan tombol
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
}

export const waitlistService = new WaitlistService();
