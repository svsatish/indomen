#!/bin/bash

# Test Notification System
# This script creates a test credit and notification for the user "sam"

echo "🧪 Testing Notification System"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
ADMIN_EMAIL="admin@freshfarm.com"
ADMIN_PASSWORD="password"
TEST_USER_ID="1764888441796"
TEST_USER_EMAIL="sam@gmail.com"
TEST_USER_NAME="sam"

echo -e "${BLUE}Step 1: Login as Admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

if [[ $LOGIN_RESPONSE == *"admin"* ]]; then
  echo -e "${GREEN}✅ Admin login successful${NC}"
else
  echo -e "${RED}❌ Admin login failed${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Issue Credit to User${NC}"
CREDIT_RESPONSE=$(curl -s -X POST "$API_URL/api/credits/issue" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"userId\":\"$TEST_USER_ID\",
    \"userEmail\":\"$TEST_USER_EMAIL\",
    \"userName\":\"$TEST_USER_NAME\",
    \"amount\":25.00,
    \"reason\":\"Test credit - Product unavailable\",
    \"type\":\"credit\"
  }")

if [[ $CREDIT_RESPONSE == *"CREDIT_"* ]]; then
  echo -e "${GREEN}✅ Credit issued successfully${NC}"
  echo "   Amount: \$25.00"
  echo "   Reason: Test credit - Product unavailable"
else
  echo -e "${RED}❌ Failed to issue credit${NC}"
  echo "Response: $CREDIT_RESPONSE"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Check Notification Created${NC}"
# Sleep for a moment to ensure notification is created
sleep 1

# Login as test user to check notification
USER_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c user_cookies.txt \
  -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"password\"}")

if [[ $USER_LOGIN == *"$TEST_USER_EMAIL"* ]]; then
  echo -e "${GREEN}✅ User login successful${NC}"

  # Check for notifications
  NOTIFICATIONS=$(curl -s -X GET "$API_URL/api/notifications/unread" \
    -b user_cookies.txt)

  if [[ $NOTIFICATIONS == *"credit"* ]]; then
    echo -e "${GREEN}✅ Notification created successfully${NC}"
    echo "   Type: Credit"
    echo "   Status: Unread"
  else
    echo -e "${RED}❌ No notification found${NC}"
    echo "Response: $NOTIFICATIONS"
  fi
else
  echo -e "${RED}❌ User login failed${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Issue Debit to User${NC}"
# Login as admin again
curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" > /dev/null

DEBIT_RESPONSE=$(curl -s -X POST "$API_URL/api/credits/issue" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"userId\":\"$TEST_USER_ID\",
    \"userEmail\":\"$TEST_USER_EMAIL\",
    \"userName\":\"$TEST_USER_NAME\",
    \"amount\":10.00,
    \"reason\":\"Test debit - Extra items purchased\",
    \"type\":\"debit\"
  }")

if [[ $DEBIT_RESPONSE == *"DEBIT_"* ]]; then
  echo -e "${GREEN}✅ Debit issued successfully${NC}"
  echo "   Amount: \$10.00"
  echo "   Reason: Test debit - Extra items purchased"
else
  echo -e "${RED}❌ Failed to issue debit${NC}"
fi

# Cleanup
rm -f cookies.txt user_cookies.txt

echo ""
echo "================================"
echo -e "${GREEN}✅ Testing Complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Go to http://localhost:5173"
echo "2. Login as: $TEST_USER_EMAIL / password"
echo "3. You should see a FLASHING GREEN BANNER with \$25.00 credit"
echo "4. Click 'View Balance' to see full account details"
echo ""
echo "💡 The notification will flash 3 times to grab attention!"

