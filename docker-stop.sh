#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Deteniendo Conversatron...${NC}"

# Stop all containers
docker-compose down
docker-compose -f docker-compose.dev.yml down

echo -e "${GREEN}✅ Contenedores detenidos${NC}"
