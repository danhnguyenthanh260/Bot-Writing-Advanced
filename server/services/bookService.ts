import { db } from '../db/connection';

export interface Book {
  book_id: string;
  google_doc_id: string;
  title: string;
  author?: string;
  total_word_count: number;
  total_chapters: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBookInput {
  google_doc_id: string;
  title: string;
  author?: string;
  total_word_count?: number;
  total_chapters?: number;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  total_word_count?: number;
  total_chapters?: number;
}

/**
 * Create a new book
 */
export async function createBook(input: CreateBookInput): Promise<Book> {
  const result = await db.query(
    `INSERT INTO books (google_doc_id, title, author, total_word_count, total_chapters)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.google_doc_id,
      input.title,
      input.author || null,
      input.total_word_count || 0,
      input.total_chapters || 0,
    ]
  );
  
  return result.rows[0];
}

/**
 * Get book by ID
 */
export async function getBookById(bookId: string): Promise<Book | null> {
  const result = await db.query(
    'SELECT * FROM books WHERE book_id = $1',
    [bookId]
  );
  
  return result.rows[0] || null;
}

/**
 * Get book by Google Doc ID
 */
export async function getBookByGoogleDocId(googleDocId: string): Promise<Book | null> {
  const result = await db.query(
    'SELECT * FROM books WHERE google_doc_id = $1',
    [googleDocId]
  );
  
  return result.rows[0] || null;
}

/**
 * Update book
 */
export async function updateBook(bookId: string, input: UpdateBookInput): Promise<Book | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (input.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(input.title);
  }
  if (input.author !== undefined) {
    updates.push(`author = $${paramIndex++}`);
    values.push(input.author);
  }
  if (input.total_word_count !== undefined) {
    updates.push(`total_word_count = $${paramIndex++}`);
    values.push(input.total_word_count);
  }
  if (input.total_chapters !== undefined) {
    updates.push(`total_chapters = $${paramIndex++}`);
    values.push(input.total_chapters);
  }
  
  if (updates.length === 0) {
    return getBookById(bookId);
  }
  
  values.push(bookId);
  const result = await db.query(
    `UPDATE books SET ${updates.join(', ')} WHERE book_id = $${paramIndex} RETURNING *`,
    values
  );
  
  return result.rows[0] || null;
}

/**
 * Delete book
 */
export async function deleteBook(bookId: string): Promise<boolean> {
  const result = await db.query(
    'DELETE FROM books WHERE book_id = $1 RETURNING book_id',
    [bookId]
  );
  
  return result.rowCount > 0;
}

/**
 * List books with pagination
 */
export async function listBooks(limit: number = 50, offset: number = 0): Promise<Book[]> {
  const result = await db.query(
    'SELECT * FROM books ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  
  return result.rows;
}

/**
 * Get books by user (through workspaces)
 */
export async function getBooksByUserId(userId: string): Promise<Book[]> {
  const result = await db.query(
    `SELECT DISTINCT b.* 
     FROM books b
     INNER JOIN workspaces w ON w.selected_book_id = b.book_id
     WHERE w.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  
  return result.rows;
}


