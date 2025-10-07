import { ApiResponse } from '../types/api';

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'document' | 'audio';
  direction: 'inbound' | 'outbound';
  isSupport: boolean;
  siteId?: number;
  ticketId?: string;
  resolved: boolean;
  category?: string;
}

export interface WhatsAppAnalytics {
  totalMessages: number;
  activeChats: number;
  issuesReported: number;
  avgResponseTime: number;
  topIssues: Array<{
    issue: string;
    count: number;
    avgResolutionTime: number;
  }>;
  messagesByDay: Array<{
    date: string;
    count: number;
  }>;
  responseTimeMetrics: {
    under1Hour: number;
    under4Hours: number;
    under24Hours: number;
    over24Hours: number;
  };
  supportTicketsGenerated: number;
  customerSatisfaction: number;
}

export interface WhatsAppChat {
  id: string;
  phoneNumber: string;
  customerName?: string;
  lastMessage: string;
  lastMessageTime: string;
  status: 'active' | 'waiting' | 'resolved';
  assignedAgent?: string;
  siteId?: number;
  ticketId?: string;
  messageCount: number;
}

class WhatsAppAnalyticsService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Get WhatsApp analytics overview
   */
  async getAnalytics(token: string, dateRange?: { from: string; to: string }): Promise<ApiResponse<WhatsAppAnalytics>> {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('from', dateRange.from);
        params.append('to', dateRange.to);
      }
      
      const response = await fetch(`${this.baseUrl}/api/whatsapp/analytics?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch WhatsApp analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'WhatsApp analytics retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: undefined,
        message: error.message || 'Failed to fetch WhatsApp analytics'
      };
    }
  }

  /**
   * Get active WhatsApp chats
   */
  async getActiveChats(token: string): Promise<ApiResponse<WhatsAppChat[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/whatsapp/chats/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active chats: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Active chats retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch active chats'
      };
    }
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(token: string, chatId: string): Promise<ApiResponse<WhatsAppMessage[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/whatsapp/chats/${chatId}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat messages: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Chat messages retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch chat messages'
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(token: string, to: string, message: string, siteId?: number): Promise<ApiResponse<WhatsAppMessage>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/whatsapp/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          message,
          siteId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Message sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: undefined,
        message: error.message || 'Failed to send message'
      };
    }
  }

  /**
   * Create maintenance ticket from WhatsApp conversation
   */
  async createTicketFromChat(token: string, chatId: string, ticketData: {
    siteId: number;
    issue: string;
    priority: 'Low' | 'Medium' | 'High';
    description?: string;
  }): Promise<ApiResponse<{ ticketId: string; chatId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/whatsapp/chats/${chatId}/create-ticket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ticket from chat: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Ticket created from WhatsApp chat successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: undefined,
        message: error.message || 'Failed to create ticket from chat'
      };
    }
  }

  /**
   * Get WhatsApp analytics for specific site
   */
  async getSiteAnalytics(token: string, siteId: number): Promise<ApiResponse<WhatsAppAnalytics>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/whatsapp/analytics/site/${siteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch site WhatsApp analytics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data,
        message: 'Site WhatsApp analytics retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: undefined,
        message: error.message || 'Failed to fetch site WhatsApp analytics'
      };
    }
  }

  /**
   * Get fallback/mock data when API is unavailable
   */
  getMockAnalytics(): WhatsAppAnalytics {
    return {
      totalMessages: 1247,
      activeChats: 23,
      issuesReported: 18,
      avgResponseTime: 2.3,
      topIssues: [
        { issue: 'Battery not charging', count: 12, avgResolutionTime: 4.5 },
        { issue: 'Low power output', count: 8, avgResolutionTime: 3.2 },
        { issue: 'System offline', count: 6, avgResolutionTime: 1.8 },
        { issue: 'Inverter error', count: 4, avgResolutionTime: 6.1 },
        { issue: 'Panel cleaning needed', count: 3, avgResolutionTime: 2.0 }
      ],
      messagesByDay: [
        { date: '2024-01-15', count: 45 },
        { date: '2024-01-16', count: 52 },
        { date: '2024-01-17', count: 38 },
        { date: '2024-01-18', count: 61 },
        { date: '2024-01-19', count: 47 },
        { date: '2024-01-20', count: 55 },
        { date: '2024-01-21', count: 43 }
      ],
      responseTimeMetrics: {
        under1Hour: 65,
        under4Hours: 25,
        under24Hours: 8,
        over24Hours: 2
      },
      supportTicketsGenerated: 18,
      customerSatisfaction: 4.2
    };
  }
}

export default new WhatsAppAnalyticsService();
