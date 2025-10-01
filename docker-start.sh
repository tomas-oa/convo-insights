#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║   🐳 Conversatron Docker Setup       ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    echo "Por favor instala Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -e "${GREEN}✅ Docker encontrado${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker no está corriendo${NC}"
    echo "Por favor inicia Docker Desktop"
    exit 1
fi

echo -e "${GREEN}✅ Docker está corriendo${NC}"
echo ""

# Check for .env.docker.local, if not exists, copy from .env.docker
if [ ! -f .env.docker.local ]; then
    echo -e "${YELLOW}⚠️  Creando .env.docker.local desde .env.docker${NC}"
    cp .env.docker .env.docker.local
    echo -e "${YELLOW}⚠️  Por favor edita .env.docker.local con tus configuraciones${NC}"
    echo ""
fi

# Ask user which mode to run
echo "Selecciona el modo de ejecución:"
echo "1) Producción (optimizado, sin hot reload)"
echo "2) Desarrollo (con hot reload para backend)"
echo ""
read -p "Opción [1-2]: " mode

if [ "$mode" == "2" ]; then
    echo -e "${BLUE}🚀 Iniciando en modo DESARROLLO...${NC}"
    docker-compose -f docker-compose.dev.yml --env-file .env.docker.local up --build
else
    echo -e "${BLUE}🚀 Iniciando en modo PRODUCCIÓN...${NC}"
    docker-compose --env-file .env.docker.local up --build
fi
