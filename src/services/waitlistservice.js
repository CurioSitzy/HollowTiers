export class WaitlistService {
  constructor() {
    this.isOpen = false;
    this.queue = [];
    this.lastSessionDate = '08 Sept 2026';
    this.requiredRoleId = null;
    this.messageId = null;
  }

  setMessageId(id) {
    this.messageId = id;
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      const now = new Date();
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      this.lastSessionDate = now.toLocaleDateString('en-GB', options);
    }
    return this.isOpen;
  }

  setOpen(status) {
    this.isOpen = Boolean(status);
  }

  getQueue() {
    return this.queue;
  }

  addPlayer(user) {
    if (!this.isOpen) {
      return { success: false, reason: 'The queue is currently closed.' };
    }

    if (this.queue.some(p => p.id === user.id)) {
      return { success: false, reason: 'You are already in the queue.' };
    }

    this.queue.push({ id: user.id, username: user.username, joinedAt: new Date() });
    return { success: true };
  }

  removePlayer(userId) {
    const index = this.queue.findIndex(p => p.id === userId);
    if (index === -1) {
      return { success: false, reason: 'You are not in the queue.' };
    }

    this.queue.splice(index, 1);
    return { success: true };
  }

  getRequiredRoleId() {
    return this.requiredRoleId;
  }

  setRequiredRoleId(roleId) {
    this.requiredRoleId = roleId;
  }
}

export const waitlistService = new WaitlistService();
