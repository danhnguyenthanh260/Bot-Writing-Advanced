import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const rootDir = join(__dirname, '../../');
dotenv.config({ path: join(rootDir, '.env') });

console.log('🔍 Kiểm tra DATABASE_URL trong .env\n');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('❌ DATABASE_URL không được set trong .env');
  console.log('\n💡 Thêm vào file .env:');
  console.log('   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bot_writing_advanced');
  process.exit(1);
}

console.log('✅ DATABASE_URL đã được set');
console.log('📏 Độ dài:', databaseUrl.length, 'ký tự');

// Mask password for display
const maskedUrl = databaseUrl.replace(/:[^@]+@/, ':***@');
console.log('🔗 Connection string (masked):', maskedUrl);

// Parse URL to check format
try {
  const url = new URL(databaseUrl);
  
  console.log('\n📋 Phân tích URL:');
  console.log('   - Protocol:', url.protocol);
  console.log('   - Username:', url.username || '(empty)');
  console.log('   - Password:', url.password ? `[${url.password.length} chars]` : '(empty)');
  console.log('   - Host:', url.hostname);
  console.log('   - Port:', url.port || '5432 (default)');
  console.log('   - Database:', url.pathname.slice(1) || '(empty)');
  
  // Check for common issues
  console.log('\n🔎 Kiểm tra vấn đề tiềm ẩn:');
  
  let hasIssues = false;
  
  // Check protocol
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    console.log('   ❌ Protocol không đúng (phải là postgresql:// hoặc postgres://)');
    hasIssues = true;
  } else {
    console.log('   ✅ Protocol đúng');
  }
  
  // Check username
  if (!url.username) {
    console.log('   ⚠️  Username trống');
    hasIssues = true;
  } else {
    console.log('   ✅ Username có giá trị');
  }
  
  // Check password
  if (!url.password) {
    console.log('   ⚠️  Password trống');
    hasIssues = true;
  } else {
    console.log('   ✅ Password có giá trị');
    
    // Check if password needs encoding
    const decodedPassword = decodeURIComponent(url.password);
    const needsEncoding = /[@:?#[\]%]/.test(decodedPassword);
    
    if (needsEncoding && decodedPassword === url.password) {
      console.log('   ⚠️  Password có ký tự đặc biệt nhưng chưa được URL-encode');
      console.log('      Ví dụ: @ → %40, # → %23, : → %3A');
      hasIssues = true;
    } else if (needsEncoding && decodedPassword !== url.password) {
      console.log('   ✅ Password đã được URL-encode đúng');
    } else {
      console.log('   ✅ Password không có ký tự đặc biệt');
    }
  }
  
  // Check host
  if (!url.hostname) {
    console.log('   ❌ Hostname trống');
    hasIssues = true;
  } else {
    console.log('   ✅ Hostname có giá trị');
  }
  
  // Check database name
  const dbName = url.pathname.slice(1);
  if (!dbName) {
    console.log('   ⚠️  Database name trống');
    hasIssues = true;
  } else {
    console.log('   ✅ Database name có giá trị');
  }
  
  // Check for whitespace
  if (databaseUrl !== databaseUrl.trim()) {
    console.log('   ⚠️  DATABASE_URL có khoảng trắng thừa ở đầu/cuối');
    hasIssues = true;
  }
  
  // Check password type
  if (url.password) {
    const passwordType = typeof url.password;
    if (passwordType !== 'string') {
      console.log(`   ❌ Password type không đúng: ${passwordType} (phải là string)`);
      hasIssues = true;
    } else {
      console.log('   ✅ Password type đúng (string)');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (hasIssues) {
    console.log('\n⚠️  Phát hiện một số vấn đề tiềm ẩn');
    console.log('\n💡 Hướng dẫn sửa:');
    console.log('   1. Format đúng: postgresql://username:password@host:port/database');
    console.log('   2. Nếu password có ký tự đặc biệt, cần URL-encode:');
    console.log('      - @ → %40');
    console.log('      - # → %23');
    console.log('      - : → %3A');
    console.log('      - / → %2F');
    console.log('      - % → %25');
    console.log('   3. Ví dụ:');
    console.log('      DATABASE_URL=postgresql://postgres:pass%40123@localhost:5432/bot_writing_advanced');
    process.exit(1);
  } else {
    console.log('\n✅ DATABASE_URL có format đúng!');
    console.log('\n💡 Nếu vẫn gặp lỗi kết nối, thử:');
    console.log('   1. Kiểm tra PostgreSQL đang chạy');
    console.log('   2. Kiểm tra password có đúng không');
    console.log('   3. Kiểm tra database đã được tạo chưa');
    console.log('   4. Chạy: npm run db:test');
    process.exit(0);
  }
  
} catch (parseError: any) {
  console.log('\n❌ Không thể parse DATABASE_URL');
  console.log('   Lỗi:', parseError.message);
  console.log('\n💡 Format đúng:');
  console.log('   DATABASE_URL=postgresql://username:password@host:port/database');
  console.log('\n📝 Ví dụ:');
  console.log('   DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/bot_writing_advanced');
  process.exit(1);
}








