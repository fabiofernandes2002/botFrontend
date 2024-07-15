import { defineStore } from 'pinia';

export const useStore = defineStore('main', {
  state: () => ({
    conversationHistory: JSON.parse(localStorage.getItem('conversationHistory')) || []
  }),
  actions: {
    addConversation(conversation) {
      this.conversationHistory.push(conversation);
      localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
    },
    clearConversations() {
      this.conversationHistory = [];
      localStorage.removeItem('conversationHistory');
    }
  },
  getters: {
    getConversationHistory: (state) => state.conversationHistory
  }
});
