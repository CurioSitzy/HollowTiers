export class WaitlistService {
  constructor() {
    this.isOpen = false;
    this.queue = [];
    this.requiredRoleId = null;
  }

  // --- GETTER & SETTER STATUS QUEUE ---
  setOpen(status) {
    this.isOpen = Boolean(status);
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    return this.isOpen;
  }

  // --- GETTER & SETTER REQUIRED ROLE ---
  setRequiredRoleId(roleId) {
    this.requiredRoleId = roleId;
  }

  getRequiredRoleId() {
    return this.requiredRoleId;
  }

  // --- MANAJEMEN PLAYER ---
  getQueue() {
    return this.queue;
  }

  addPlayer(user) {
    if (!this.isOpen) {
      return { success: false, reason: 'The queue is currently closed.' };
    }

    const exists = this.queue.some(player => player.id === user.id);
    if (exists) {
      return { success: false, reason: 'You are already in the queue.' };
    }

    const playerData = {
      id: user.id,
      username: user.username,
      tag: user.tag || user.username,
      joinedAt: new Date()
    };

    this.queue.push(playerData);
    return { success: true, player: playerData };
  }

  removePlayer(userId) {
    const index = this.queue.findIndex(player => player.id === userId);
    if (index === -1) {
      return { success: false, reason: 'You are not in the queue.' };
    }

    const removed = this.queue.splice(index, 1)[0];
    return { success: true, player: removed };
  }

  clearQueue() {
    this.queue = [];
  }
}

export const waitlistService = new WaitlistService();
