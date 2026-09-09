export class WaitlistService {
    constructor() {
        this.queue = [];
        this.activeTickets = new Map(); // Stores active ticket channel data
    }

    addPlayer(user) {
        if (this.queue.some(p => p.id === user.id)) {
            return { success: false, reason: 'You are already in the waitlist.' };
        }

        this.queue.push({
            id: user.id,
            username: user.username,
            joinedAt: new Date()
        });

        return { success: true, position: this.queue.length };
    }

    pullNextPlayer() {
        if (this.queue.length === 0) return null;
        return this.queue.shift();
    }

    registerTicket(channelId, playerData, testerId) {
        this.activeTickets.set(channelId, {
            player: playerData,
            testerId: testerId,
            createdAt: new Date()
        });
    }

    getTicket(channelId) {
        return this.activeTickets.get(channelId);
    }

    removeTicket(channelId) {
        return this.activeTickets.delete(channelId);
    }

    getQueue() {
        return this.queue;
    }
}

export const waitlistService = new WaitlistService();
