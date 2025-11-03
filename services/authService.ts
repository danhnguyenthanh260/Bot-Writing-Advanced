import type { User, WorkspaceSnapshot } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : window.location.origin);

export interface LoginResponse {
  user: User;
  sessionToken: string;
  workspace?: WorkspaceSnapshot;
}

/**
 * Login with Google credential (JWT token from Google Sign-In)
 */
export async function loginWithGoogle(credential: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Đăng nhập thất bại' }));
      throw new Error(error.error || 'Đăng nhập thất bại');
    }

    const data = await response.json();
    return {
      user: data.user,
      sessionToken: data.sessionToken,
      workspace: data.workspace,
    };
  } catch (error) {
    // Fallback: Create a mock user if API fails (for development)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('API not available, using mock authentication');
      // Try to decode JWT credential to get user info
      try {
        const payload = JSON.parse(atob(credential.split('.')[1]));
        return {
          user: {
            name: payload.name || payload.email?.split('@')[0] || 'User',
            avatarUrl: payload.picture || '',
            email: payload.email,
          } as User & { email?: string },
          sessionToken: `mock-token-${Date.now()}`,
        };
      } catch {
        return {
          user: {
            name: 'User',
            avatarUrl: '',
          },
          sessionToken: `mock-token-${Date.now()}`,
        };
      }
    }
    throw error;
  }
}

/**
 * Fetch session data from server
 */
export async function fetchSession(sessionToken: string): Promise<{ user: User; workspace?: WorkspaceSnapshot }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Session không hợp lệ');
    }

    const data = await response.json();
    return {
      user: data.user,
      workspace: data.workspace,
    };
  } catch (error) {
    // Fallback: Return null user if API fails
    throw new Error('Không thể khôi phục phiên đăng nhập');
  }
}

/**
 * Logout from server
 */
export async function logout(sessionToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
      credentials: 'include',
    });
  } catch (error) {
    // Silent fail - cleanup will happen client-side anyway
    console.warn('Logout API call failed', error);
  }
}


