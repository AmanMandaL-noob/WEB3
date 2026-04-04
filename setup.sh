#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  DeFi DEX System - Setup Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

# Check Node.js
echo -e "${YELLOW}[1/5] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v16+${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} found${NC}\n"

# Check npm
echo -e "${YELLOW}[2/5] Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm ${NPM_VERSION} found${NC}\n"

# Install contracts
echo -e "${YELLOW}[3/5] Installing contracts dependencies...${NC}"
cd contracts
if ! npm install > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to install contracts dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Contracts dependencies installed${NC}\n"

# Install frontend
echo -e "${YELLOW}[4/5] Installing frontend dependencies...${NC}"
cd ../frontend
if ! npm install > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend dependencies installed${NC}\n"

# Install bot
echo -e "${YELLOW}[5/5] Installing bot dependencies...${NC}"
cd ../bot
if ! npm install > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to install bot dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Bot dependencies installed${NC}\n"

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════\n${NC}"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Open Terminal 1: cd contracts && npx hardhat node"
echo -e "  2. Open Terminal 2: cd contracts && npx hardhat run scripts/deploy.js --network localhost"
echo -e "  3. Open Terminal 3: cd frontend && npm start"
echo -e "  4. Open Terminal 4: cd bot && node bot.js"
echo ""
echo -e "${YELLOW}Frontend URL: http://localhost:3000${NC}"
echo -e "${YELLOW}Blockchain RPC: http://127.0.0.1:8545${NC}"
