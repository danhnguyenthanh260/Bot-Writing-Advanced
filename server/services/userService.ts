import { db } from '../db/connection';

export interface User {
  user_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatar_url?: string;
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const result = await db.query(
    `INSERT INTO users (email, name, avatar_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) 
     DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [input.email, input.name || null, input.avatar_url || null]
  );
  
  return result.rows[0];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await db.query(
    'SELECT * FROM users WHERE user_id = $1',
    [userId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows[0] || null;
}

/**
 * Update user
 */
export async function updateUser(userId: string, input: UpdateUserInput): Promise<User | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(input.avatar_url);
  }
  
  if (updates.length === 0) {
    return getUserById(userId);
  }
  
  values.push(userId);
  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0] || null;
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
    [userId]
  );
  
  return result.rowCount > 0;
}











