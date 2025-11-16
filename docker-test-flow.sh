#!/bin/bash
# Script để kiểm tra luồng hoạt động trên Docker

set -e

echo "🔍 Kiểm tra luồng hoạt động Docker..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Checking $name... "
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        if [ ! -z "$expected" ]; then
            response=$(curl -s "$url")
            echo "  Response: $response"
        fi
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Wait for services to be ready
echo "⏳ Đợi services khởi động..."
sleep 10

# Check services
echo ""
echo "📊 Kiểm tra Health Checks:"
echo ""

check_service "PostgreSQL" "http://localhost:5432" || echo "  (PostgreSQL không có HTTP endpoint, kiểm tra qua backend)"
check_service "Embedding Server" "http://localhost:8000/health" "status"
check_service "Backend API" "http://localhost:3001/health" "status"
check_service "Frontend" "http://localhost:3000" || echo "  (Frontend có thể cần thời gian build)"

echo ""
echo "🔧 Kiểm tra Database Connection:"
echo ""

# Test database connection via backend
if docker-compose exec -T backend npm run db:test 2>/dev/null; then
    echo -e "${GREEN}✓ Database connection OK${NC}"
else
    echo -e "${YELLOW}⚠ Database connection test failed (có thể do schema chưa deploy)${NC}"
fi

echo ""
echo "📝 Kiểm tra Schema:"
echo ""

if docker-compose exec -T backend npm run db:check 2>/dev/null; then
    echo -e "${GREEN}✓ Schema check OK${NC}"
else
    echo -e "${YELLOW}⚠ Schema check failed${NC}"
fi

echo ""
echo "🧪 Test Embedding Service:"
echo ""

# Test embedding
embedding_test=$(curl -s -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}' 2>/dev/null)

if [ ! -z "$embedding_test" ]; then
    echo -e "${GREEN}✓ Embedding service working${NC}"
    echo "  Response preview: $(echo $embedding_test | cut -c1-100)..."
else
    echo -e "${RED}✗ Embedding service test failed${NC}"
fi

echo ""
echo "✅ Kiểm tra hoàn tất!"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Embedding: http://localhost:8000"
echo "  Database: localhost:5432"
echo ""
echo "📋 Xem logs: docker-compose logs -f"
echo "🛑 Dừng services: docker-compose down"


