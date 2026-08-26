/**
 * EventBus.js - Lightweight Publish-Subscribe Event Bus
 * Facilitates decoupled communication between controllers and UI components.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event topic.
   * @param {string} event - Event name
   * @param {Function} callback - Event listener callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event topic once.
   * @param {string} event - Event name
   * @param {Function} callback - Event listener callback
   */
  once(event, callback) {
    const unsub = this.on(event, (data) => {
      unsub();
      callback(data);
    });
    return unsub;
  }

  /**
   * Unsubscribe a callback from an event topic.
   * @param {string} event - Event name
   * @param {Function} callback - Event listener callback
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event topic with optional payload data.
   * @param {string} event - Event name
   * @param {any} data - Event payload
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error handling event "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all registered event listeners.
   */
  clear() {
    this.listeners.clear();
  }
}

export const globalEventBus = new EventBus();
