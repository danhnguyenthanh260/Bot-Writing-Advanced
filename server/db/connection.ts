import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

/**
 * Normalize DATABASE_URL to ensure password is properly URL encoded
 */
function normalizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    
    // If password exists, ensure it's properly encoded
    if (parsed.password) {
      // Check if password needs encoding (contains special characters)
      const specialChars = /[@:?#[\]%]/;
      const needsEncoding = specialChars.test(parsed.password) && 
                            parsed.password === decodeURIComponent(parsed.password);
      
      if (needsEncoding) {
        // Password has special chars but not encoded, encode it
        const encodedPassword = encodeURIComponent(parsed.password);
        
        // Rebuild URL with properly encoded password
        return `${parsed.protocol}//${parsed.username}:${encodedPassword}@${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      // Password is already properly encoded or has no special chars, use as-is
    }
    
    return url;
  } catch (error) {
    // If parsing fails, return original URL
    return url;
  }
}

// Parse DATABASE_URL or use individual connection parameters
function getPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    const connectionString = String(databaseUrl).trim();
    
    if (!connectionString) {
      throw new Error('DATABASE_URL is empty or invalid');
    }
    
    // Validate it's a postgresql URL
    if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
    }
    
    try {
      // Parse URL to extract components explicitly
      // This ensures password is always a string, not undefined
      const url = new URL(connectionString);
      
      // Extract password - URL automatically decodes it
      // CRITICAL: Ensure password is always a string primitive, never undefined, null, or String object
      let password: string = '';
      if (url.password !== null && url.password !== undefined) {
        // Convert to string primitive (not String object)
        password = String(url.password).valueOf();
      }
      
      // Ensure it's a string primitive
      if (typeof password !== 'string') {
        password = String(password || '');
      }
      
      // Debug logging (only in development)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEBUG connection.ts] Password type:', typeof password, 'Length:', password.length);
        console.log('[DEBUG connection.ts] Password is string primitive?', typeof password === 'string' && password.constructor === String.prototype.constructor);
      }
      
      // Build config object with explicit password as string
      // IMPORTANT: Do NOT include connectionString when using individual fields
      // pg library will prioritize connectionString over individual fields if both are present
      const config: PoolConfig = {
        host: url.hostname,
        port: parseInt(url.port || '5432', 10),
        database: url.pathname.slice(1) || 'bot_writing_advanced', // Remove leading '/'
        user: url.username || 'postgres',
        password: password, // Explicitly set as string primitive
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
      
      // Final validation: ensure password is string primitive
      if (typeof config.password !== 'string') {
        throw new Error(`Password must be a string primitive, got ${typeof config.password} (${config.password?.constructor?.name || 'unknown'})`);
      }
      
      // Additional check: ensure it's not a String object
      if (config.password instanceof String) {
        config.password = String(config.password);
      }
      
      // Debug: verify config password
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DEBUG connection.ts] Final config password type:', typeof config.password);
        console.log('[DEBUG connection.ts] Final config password is string primitive?', typeof config.password === 'string');
      }
      
      return config;
    } catch (parseError: any) {
      // If URL parsing fails, try connectionString as fallback
      console.warn('Failed to parse DATABASE_URL, using connectionString directly:', parseError.message);
      return {
        connectionString: connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };
    }
  }
  
  // Fallback to individual environment variables
  const password = process.env.DB_PASSWORD;
  const user = process.env.DB_USER || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.DB_NAME || 'bot_writing_advanced';
  
  // Ensure password is always a string (even if empty)
  const passwordString = password !== undefined ? String(password) : '';
  
  return {
    host: host,
    port: port,
    database: database,
    user: user,
    password: passwordString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(getPoolConfig());

// Test connection
pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export const db = {
  query: async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Query error', { text: text.substring(0, 100), error });
      throw error;
    }
  },
  
  // Transaction helper
  transaction: async (callback: (client: any) => Promise<void>) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await callback(client);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

export default pool;





