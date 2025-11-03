import type { WorkspaceSnapshot } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : window.location.origin);

/**
 * Save workspace snapshot to server
 */
export async function saveWorkspace(
  sessionToken: string,
  snapshot: WorkspaceSnapshot
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/workspace/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify(snapshot),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Không thể lưu workspace');
    }
  } catch (error) {
    // Silent fail - workspace is already saved in localStorage
    console.warn('Failed to save workspace to server', error);
    throw error;
  }
}


