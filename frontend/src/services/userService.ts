import { API_BASE_URL } from '../config';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UserCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: 'Active' | 'Inactive';
}

const userService = {
  getUsers: async (token: string): Promise<User[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getUserById: async (token: string, userId: number): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  createUser: async (token: string, userData: UserCreateRequest): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (token: string, userId: number, userData: UserUpdateRequest): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  deleteUser: async (token: string, userId: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  // Mock data for development
  getMockUsers: (): User[] => {
    return [
      {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        status: 'Active',
        isVerified: true,
        createdAt: '2025-08-01T10:00:00Z',
        lastLogin: '2025-09-23T15:30:00Z'
      },
      {
        id: 2,
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'technical_expert',
        status: 'Active',
        isVerified: true,
        createdAt: '2025-08-05T14:30:00Z',
        lastLogin: '2025-09-22T09:15:00Z'
      },
      {
        id: 3,
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'technical_junior',
        status: 'Active',
        isVerified: true,
        createdAt: '2025-08-10T11:20:00Z',
        lastLogin: '2025-09-20T16:45:00Z'
      },
      {
        id: 4,
        email: 'bob.johnson@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'non_technical',
        status: 'Inactive',
        isVerified: false,
        createdAt: '2025-08-15T09:10:00Z',
      },
      {
        id: 5,
        email: 'alice.wang@example.com',
        firstName: 'Alice',
        lastName: 'Wang',
        role: 'technical_expert',
        status: 'Active',
        isVerified: true,
        createdAt: '2025-08-20T13:40:00Z',
        lastLogin: '2025-09-21T11:30:00Z'
      }
    ];
  }
};

export default userService;
