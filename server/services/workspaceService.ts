import { db } from '../db/connection';

export interface Workspace {
  workspace_id: string;
  user_id: string;
  name?: string;
  selected_book_id?: string;
  selected_chapter_id?: string;
  settings?: any;
  latest_chat_message_id?: string;
  active_canvas_pages?: string[];
  created_at: Date;
  updated_at: Date;
  last_accessed_at: Date;
}

export interface CreateWorkspaceInput {
  user_id: string;
  name?: string;
  selected_book_id?: string;
  selected_chapter_id?: string;
  settings?: any;
}

export interface UpdateWorkspaceInput {
  name?: string;
  selected_book_id?: string;
  selected_chapter_id?: string;
  settings?: any;
  latest_chat_message_id?: string;
  active_canvas_pages?: string[];
}

/**
 * Create a new workspace
 */
export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  const result = await db.query(
    `INSERT INTO workspaces (user_id, name, selected_book_id, selected_chapter_id, settings)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.user_id,
      input.name || null,
      input.selected_book_id || null,
      input.selected_chapter_id || null,
      input.settings ? JSON.stringify(input.settings) : null,
    ]
  );
  
  return {
    ...result.rows[0],
    settings: result.rows[0].settings ? JSON.parse(result.rows[0].settings) : null,
    active_canvas_pages: result.rows[0].active_canvas_pages || [],
  };
}

/**
 * Get workspace by ID
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const result = await db.query(
    'SELECT * FROM workspaces WHERE workspace_id = $1',
    [workspaceId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    settings: result.rows[0].settings ? JSON.parse(result.rows[0].settings) : null,
    active_canvas_pages: result.rows[0].active_canvas_pages || [],
  };
}

/**
 * Get user's default or most recent workspace
 */
export async function getUserWorkspace(userId: string): Promise<Workspace | null> {
  const result = await db.query(
    `SELECT * FROM workspaces 
     WHERE user_id = $1 
     ORDER BY last_accessed_at DESC 
     LIMIT 1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    settings: result.rows[0].settings ? JSON.parse(result.rows[0].settings) : null,
    active_canvas_pages: result.rows[0].active_canvas_pages || [],
  };
}

/**
 * List workspaces for a user
 */
export async function listWorkspaces(userId: string, limit: number = 50): Promise<Workspace[]> {
  const result = await db.query(
    `SELECT * FROM workspaces 
     WHERE user_id = $1 
     ORDER BY last_accessed_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  
  return result.rows.map(row => ({
    ...row,
    settings: row.settings ? JSON.parse(row.settings) : null,
    active_canvas_pages: row.active_canvas_pages || [],
  }));
}

/**
 * Update workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput
): Promise<Workspace | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.selected_book_id !== undefined) {
    updates.push(`selected_book_id = $${paramIndex++}`);
    values.push(input.selected_book_id);
  }
  if (input.selected_chapter_id !== undefined) {
    updates.push(`selected_chapter_id = $${paramIndex++}`);
    values.push(input.selected_chapter_id);
  }
  if (input.settings !== undefined) {
    updates.push(`settings = $${paramIndex++}`);
    values.push(JSON.stringify(input.settings));
  }
  if (input.latest_chat_message_id !== undefined) {
    updates.push(`latest_chat_message_id = $${paramIndex++}`);
    values.push(input.latest_chat_message_id);
  }
  if (input.active_canvas_pages !== undefined) {
    updates.push(`active_canvas_pages = $${paramIndex++}`);
    values.push(input.active_canvas_pages);
  }
  
  // Always update last_accessed_at
  updates.push(`last_accessed_at = CURRENT_TIMESTAMP`);
  
  if (updates.length === 0) {
    return getWorkspaceById(workspaceId);
  }
  
  values.push(workspaceId);
  const result = await db.query(
    `UPDATE workspaces SET ${updates.join(', ')} WHERE workspace_id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    settings: result.rows[0].settings ? JSON.parse(result.rows[0].settings) : null,
    active_canvas_pages: result.rows[0].active_canvas_pages || [],
  };
}

/**
 * Delete workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM workspaces WHERE workspace_id = $1 RETURNING workspace_id',
    [workspaceId]
  );
  
  return result.rowCount > 0;
}

/**
 * Save workspace chat message
 */
export async function saveChatMessage(
  workspaceId: string,
  message: any
): Promise<string> {
  const result = await db.query(
    `INSERT INTO workspace_chat_messages (workspace_id, message)
     VALUES ($1, $2)
     RETURNING message_id`,
    [workspaceId, JSON.stringify(message)]
  );
  
  return result.rows[0].message_id;
}

/**
 * Get workspace chat messages
 */
export async function getChatMessages(
  workspaceId: string,
  limit: number = 100
): Promise<any[]> {
  const result = await db.query(
    `SELECT message_id, message, created_at
     FROM workspace_chat_messages
     WHERE workspace_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [workspaceId, limit]
  );
  
  return result.rows.map(row => ({
    message_id: row.message_id,
    message: JSON.parse(row.message),
    created_at: row.created_at,
  }));
}

/**
 * Save workspace canvas page
 */
export async function saveCanvasPage(
  workspaceId: string,
  pageData: any
): Promise<string> {
  const result = await db.query(
    `INSERT INTO workspace_canvas_pages (workspace_id, page_data)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING page_id`,
    [workspaceId, JSON.stringify(pageData)]
  );
  
  if (result.rows.length === 0) {
    // Update existing page
    const updateResult = await db.query(
      `UPDATE workspace_canvas_pages 
       SET page_data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE workspace_id = $2
       RETURNING page_id`,
      [JSON.stringify(pageData), workspaceId]
    );
    return updateResult.rows[0]?.page_id || '';
  }
  
  return result.rows[0].page_id;
}

/**
 * Get workspace canvas pages
 */
export async function getCanvasPages(workspaceId: string): Promise<any[]> {
  const result = await db.query(
    `SELECT page_id, page_data, updated_at
     FROM workspace_canvas_pages
     WHERE workspace_id = $1
     ORDER BY updated_at DESC`,
    [workspaceId]
  );
  
  return result.rows.map(row => ({
    page_id: row.page_id,
    page_data: JSON.parse(row.page_data),
    updated_at: row.updated_at,
  }));
}











