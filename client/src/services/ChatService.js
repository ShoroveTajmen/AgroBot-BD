import axios from 'axios';

export class ChatService {
  constructor() {
    this.sessionId = null;
    this.apiBase = '/api';
  }

  async sendMessage(message) {
    try {
      const response = await axios.post(`${this.apiBase}/chat`, {
        sessionId: this.sessionId,
        message: message
      });
      
      return response.data;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  async getSessions() {
    try {
      const response = await axios.get(`${this.apiBase}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  }

  async createSession() {
    try {
      const response = await axios.post(`${this.apiBase}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }
}
