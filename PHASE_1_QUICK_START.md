# Phase 1 Quick Start Guide

## 🚀 Getting Started

### Step 1: Install Dependencies ✅
```bash
npm install pg @types/pg
```
**Status:** ✅ Already done!

---

### Step 2: Setup PostgreSQL + pgvector

**On Windows:**
1. Install PostgreSQL: https://www.postgresql.org/download/windows/
2. Install pgvector extension:
   ```sql
   -- Connect to PostgreSQL
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

**On Mac (using Homebrew):**
```bash
brew install postgresql@15
brew install pgvector
```

**On Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-15 postgresql-contrib
# Install pgvector (see: https://github.com/pgvector/pgvector)
```

---

### Step 3: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bot_writing_advanced;

# Connect to database
\c bot_writing_advanced

# Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

### Step 4: Run Schema

```bash
# From project root
psql -U postgres -d bot_writing_advanced -f server/db/schema.sql
```

Or run from `psql`:
```sql
\i server/db/schema.sql
```

---

### Step 5: Setup Environment Variables

1. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

2. Update `.env` with your database URL:
```bash
DATABASE_URL=postgres://user:password@localhost:5432/bot_writing_advanced
```

---

### Step 6: Test Database Connection

```bash
npm run server
```

You should see:
```
Database connected
```

---

## ✅ Phase 1 Checklist

### Week 1: Database Setup
- [x] Install PostgreSQL dependencies (pg)
- [ ] Install PostgreSQL (version 15+)
- [ ] Install pgvector extension
- [ ] Create database và user
- [ ] Run schema.sql
- [ ] Configure environment variables
- [ ] Test database connection

### Week 2: Basic Services
- [ ] Content hash utility (✅ created)
- [ ] Embedding cache service
- [ ] Change detection service
- [ ] Database connection service (✅ created)
- [ ] Basic CRUD operations

---

## 📝 Next Steps

1. **Complete database setup** (PostgreSQL + pgvector)
2. **Run schema** (server/db/schema.sql)
3. **Test connection** (npm run server)
4. **Continue with services** (Week 2)

---

## 🐛 Troubleshooting

### pgvector extension not found
- Make sure pgvector is installed
- Check PostgreSQL version (15+ required)
- See: https://github.com/pgvector/pgvector#installation

### Database connection error
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check firewall/network settings

---

**Status:** In Progress  
**Next:** Complete PostgreSQL setup, then continue with services


