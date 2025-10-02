#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  ADVERTENCIA: Esto eliminará todos los contenedores, imágenes y volúmenes de Conversatron${NC}"
echo -e "${YELLOW}    Esto incluye la base de datos SQLite y todos los datos${NC}"
read -p "¿Estás seguro? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Operación cancelada"
    exit 0
fi

echo -e "${RED}🗑️  Limpiando...${NC}"

echo "🧹 Limpiando contenedores de Convo Insights..."
docker-compose down -v

echo "🗑️  Eliminando imágenes de Convo Insights..."
docker rmi conversatron-dashboard-backend conversatron-dashboard-frontend 2>/dev/null || true

echo "🗑️  Eliminando contenedores huérfanos..."
docker container prune -f

echo "🗑️  Eliminando volúmenes no utilizados..."
docker volume prune -f

docker volume rm conversatron-dashboard_sqlite_data 2>/dev/null || true
docker volume rm conversatron-dashboard_sqlite_data_dev 2>/dev/null || true
docker volume rm conversatron-dashboard_backend_node_modules 2>/dev/null || true

echo -e "${GREEN}✅ Limpieza completada${NC}"
