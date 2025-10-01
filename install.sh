#!/bin/bash

echo "🚀 Instalando Conversatron Dashboard..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js 18+ primero"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) encontrado${NC}"
echo ""

# Install backend dependencies
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias del backend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"

# Setup .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Por favor edita backend/.env y configura JWT_SECRET${NC}"
fi

# Initialize Prisma
echo "🗄️  Inicializando base de datos con Prisma..."
npm run db:generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cliente Prisma generado${NC}"
else
    echo -e "${RED}❌ Error generando cliente Prisma${NC}"
    exit 1
fi

# Run migrations
echo "📊 Ejecutando migraciones de base de datos..."
npm run db:migrate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migraciones aplicadas exitosamente${NC}"
else
    echo -e "${YELLOW}⚠️  Hubo un problema con las migraciones${NC}"
fi

cd ..

# Install frontend dependencies
echo "📦 Instalando dependencias del frontend..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias del frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias del frontend instaladas${NC}"
echo ""
echo -e "${GREEN}✅ ¡Instalación completada!${NC}"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Configura las variables de entorno:"
echo -e "   ${YELLOW}nano backend/.env${NC}"
echo "   Actualiza JWT_SECRET (genera uno seguro con):"
echo -e "   ${YELLOW}node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"${NC}"
echo ""
echo "2. (Opcional) Poblar base de datos con datos de ejemplo:"
echo -e "   ${YELLOW}cd backend && npm run db:seed${NC}"
echo ""
echo "3. Inicia el backend:"
echo -e "   ${YELLOW}cd backend && npm run dev${NC}"
echo ""
echo "4. En otra terminal, inicia el frontend:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "5. Abre tu navegador en:"
echo -e "   ${YELLOW}http://localhost:5173${NC}"
echo ""
echo "📖 Lee README.md para más detalles"
echo ""
