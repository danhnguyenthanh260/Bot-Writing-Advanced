import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const rootDir = join(__dirname, '../../');
dotenv.config({ path: join(rootDir, '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

console.log('Original DATABASE_URL length:', databaseUrl.length);
console.log('DATABASE_URL (masked):', databaseUrl.replace(/:[^@]+@/, ':***@'));

try {
  const url = new URL(databaseUrl);
  console.log('\nParsed URL components:');
  console.log('- Protocol:', url.protocol);
  console.log('- Username:', url.username);
  console.log('- Password type:', typeof url.password);
  console.log('- Password value:', url.password);
  console.log('- Password length:', url.password?.length || 0);
  console.log('- Password is null?', url.password === null);
  console.log('- Password is undefined?', url.password === undefined);
  console.log('- Password after String():', String(url.password || ''));
  console.log('- Host:', url.hostname);
  console.log('- Port:', url.port);
  console.log('- Database:', url.pathname.slice(1));
  
  // Check if password needs encoding
  if (url.password) {
    const decoded = decodeURIComponent(url.password);
    console.log('\nPassword encoding check:');
    console.log('- Original:', url.password);
    console.log('- Decoded:', decoded);
    console.log('- Needs encoding?', decoded !== url.password);
    console.log('- Has special chars?', /[@:?#[\]%]/.test(url.password));
  }
  
  // Test creating config
  const password = url.password || '';
  const config = {
    host: url.hostname,
    port: parseInt(url.port || '5432', 10),
    database: url.pathname.slice(1) || 'bot_writing_advanced',
    user: url.username || 'postgres',
    password: String(password),
  };
  
  console.log('\nConfig object:');
  console.log('- password type:', typeof config.password);
  console.log('- password value:', config.password);
  console.log('- password length:', config.password.length);
  
} catch (error: any) {
  console.error('Error parsing URL:', error.message);
  process.exit(1);
}


