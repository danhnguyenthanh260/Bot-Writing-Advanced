import type { PoolConfig } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// 2) Then import and create pool
import { Pool } from 'pg';
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
  console.log("DEBUG RAW DATABASE_URL:", JSON.stringify(process.env.DATABASE_URL));

  
  if (databaseUrl) {
    // Ensure it's a string primitive, not String object
    let connectionString: string;
    if (typeof databaseUrl === 'string') {
      connectionString = databaseUrl.trim();
    } else {
      // Force to string primitive
      connectionString = String(databaseUrl).valueOf().trim();
    }
    
    if (!connectionString) {
      throw new Error('DATABASE_URL is empty or invalid');
    }
    
    // Validate it's a postgresql URL
    if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
    }
    
    // Normalize URL to ensure password is properly encoded
    try {
      const url = new URL(connectionString);
      
      // If password exists and contains special characters, ensure it's encoded
      if (url.password) {
        const decodedPassword = decodeURIComponent(url.password);
        // If password has special chars that need encoding, re-encode it
        if (decodedPassword !== url.password || /[@:?#[\]%]/.test(decodedPassword)) {
          const encodedPassword = encodeURIComponent(decodedPassword);
          // Rebuild URL with properly encoded password
          connectionString = `${url.protocol}//${url.username}:${encodedPassword}@${url.host}${url.pathname}${url.search}${url.hash}`;
        }
      }
    } catch (urlError) {
      // If URL parsing fails, use original connectionString
      console.warn('[DEBUG connection.ts] Failed to parse URL for normalization:', urlError);
    }
    
    // Final check: ensure it's a string primitive
    if (typeof connectionString !== 'string') {
      connectionString = String(connectionString).valueOf();
    }
    
    
    // Parse URL to extract components explicitly
    // This ensures password is always a string primitive, not undefined
    try {
      const url = new URL(connectionString);
      
      // Extract password - URL automatically decodes it
      // CRITICAL: Ensure password is always a string primitive, never undefined, null, or String object
      let password: string = '';
      if (url.password !== null && url.password !== undefined) {
        // Force to string primitive - URL.password is already decoded
        password = String(url.password);
        // Ensure it's truly a primitive, not a String object
        if (password instanceof String) {
          password = password.valueOf();
        }
      }
      
      // Final safety check - ensure password is always a string primitive
      if (typeof password !== 'string') {
        password = String(password || '');
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
        throw new Error(`Password must be a string primitive, got ${typeof config.password}`);
      }
      
      // Additional check: ensure it's not a String object
      if (config.password instanceof String) {
        config.password = String(config.password).valueOf();
      }
      
      // Debug: Log password type and length (not value for security)
      console.log('[DEBUG connection.ts] Password type:', typeof config.password);
      console.log('[DEBUG connection.ts] Password is string primitive?', typeof config.password === 'string' && !(config.password instanceof String));
      console.log('[DEBUG connection.ts] Password length:', config.password.length);
      
      return config;
    } catch (parseError: any) {
      // If URL parsing fails, try to extract manually using regex
      console.warn('[DEBUG connection.ts] Failed to parse DATABASE_URL, trying manual extraction:', parseError.message);
      
      // Try regex extraction as fallback
      const match = connectionString.match(/postgresql?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (match) {
        const [, user, password, host, port, database] = match;
        // Ensure password is string primitive after decoding
        const decodedPassword = String(decodeURIComponent(password));
        return {
          host: host,
          port: parseInt(port, 10),
          database: database,
          user: decodeURIComponent(user),
          password: decodedPassword,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        };
      }
      
      // Last resort: throw error instead of using connectionString directly
      throw new Error(`Failed to parse DATABASE_URL: ${parseError.message}`);
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

// Get pool config and validate before creating Pool
let poolConfig: PoolConfig;
try {
  poolConfig = getPoolConfig();
  
  // Final validation before creating Pool
  if (poolConfig.password === undefined || poolConfig.password === null) {
    console.error('[DEBUG connection.ts] Password is undefined or null in config!');
    console.error('[DEBUG connection.ts] Config keys:', Object.keys(poolConfig));
    throw new Error('Password cannot be undefined or null');
  }
  
  if (typeof poolConfig.password !== 'string') {
    console.error('[DEBUG connection.ts] Password type:', typeof poolConfig.password);
    throw new Error(`Password must be a string, got ${typeof poolConfig.password}`);
  }
  
  console.log('[DEBUG connection.ts] Creating Pool with password type:', typeof poolConfig.password);
  console.log('[DEBUG connection.ts] Password length:', poolConfig.password.length);
} catch (error) {
  console.error('[DEBUG connection.ts] Error creating pool config:', error);
  throw error;
}

const pool = new Pool(poolConfig);

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





