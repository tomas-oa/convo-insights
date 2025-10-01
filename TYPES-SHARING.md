# Compartir Tipos entre Backend y Frontend

## Problema Original

La solución inicial de duplicar manualmente los tipos en `src/types/api.types.ts` tenía varios problemas:
- **Mantenimiento manual**: Cada cambio en el esquema de Prisma requería actualizar manualmente los tipos del frontend
- **Propenso a errores**: Fácil que los tipos se desincronicen entre backend y frontend
- **Duplicación de código**: Misma información en múltiples lugares

## Solución Implementada

### 1. Tipos Compartidos desde el Backend

Los tipos ahora se definen una sola vez en el backend (`backend/src/types/index.ts`) y se exportan para uso del frontend:

```typescript
// backend/src/types/index.ts
export type {
  User,
  Conversation,
  Message,
  Prompt,
  ConversationStatus,
  ChannelType,
  MessageRole,
} from '../../generated/index.js'; // Prisma genera estos automáticamente
```

### 2. Configuración de TypeScript Path Mapping

El frontend importa los tipos del backend usando un alias configurado en `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@backend/types": ["./backend/src/types/index.ts"]
    }
  }
}
```

### 3. Uso en el Frontend

```typescript
// src/lib/api.ts
import type {
  User,
  Conversation,
  ConversationStatus,
  // ... otros tipos
} from '@backend/types';
```

## Ventajas de esta Solución

1. **Single Source of Truth**: Los tipos base vienen directamente de Prisma
2. **Sincronización automática**: Al cambiar el esquema de Prisma, los tipos se actualizan automáticamente
3. **Type Safety**: TypeScript valida que frontend y backend usen los mismos tipos
4. **Mantenimiento reducido**: Solo se mantienen los tipos de respuesta/request adicionales

## Alternativas Consideradas

### Opción A: Monorepo con Workspace Compartido (Más Robusto)

Crear un paquete separado para tipos compartidos:

```
/packages
  /shared-types
    package.json
    index.ts
  /backend
  /frontend
```

**Ventajas:**
- Separación clara de responsabilidades
- Puede publicarse como paquete npm independiente
- Mejor para proyectos grandes o múltiples frontends

**Desventajas:**
- Más complejo de configurar
- Requiere herramientas de monorepo (pnpm workspaces, yarn workspaces, nx, turborepo)

### Opción B: Generación de Tipos con Herramientas

Usar herramientas como:
- **tRPC**: Define tipos en el backend, se infieren automáticamente en el frontend
- **GraphQL Code Generator**: Genera tipos desde el schema GraphQL
- **OpenAPI/Swagger**: Genera tipos desde la especificación OpenAPI

**Ventajas:**
- Muy robustas y probadas en producción
- Incluyen validación en runtime
- Mejor para APIs públicas o equipos grandes

**Desventajas:**
- Requiere cambiar la arquitectura de la API
- Curva de aprendizaje adicional
- Overhead para proyectos pequeños

### Opción C: Prisma Client en el Frontend (No Recomendado)

Instalar `@prisma/client` en el frontend para usar los tipos generados.

**Ventajas:**
- Acceso directo a todos los tipos de Prisma

**Desventajas:**
- Incluye código del cliente de base de datos en el bundle del frontend
- Aumenta el tamaño del bundle significativamente
- Mezcla concerns de backend y frontend

## Workflow de Desarrollo

### Cuando cambias el esquema de Prisma:

1. Edita `backend/prisma/schema.prisma`
2. Ejecuta `npm run db:generate` en el backend
3. Los tipos de Prisma se regeneran automáticamente
4. Si necesitas tipos de respuesta adicionales, agrégalos en `backend/src/types/index.ts`
5. El frontend automáticamente tiene acceso a los nuevos tipos

### Ejemplo de Flujo:

```bash
# Backend
cd backend
# Editar schema.prisma
npm run db:generate
npm run db:migrate

# Frontend (automático)
# Los tipos ya están disponibles vía @backend/types
```

## Mejoras Futuras

Si el proyecto crece, considera:

1. **Migrar a tRPC**: Para type-safety end-to-end con inferencia automática
2. **Validación en runtime**: Usar Zod para validar tipos en runtime
3. **Monorepo completo**: Con pnpm workspaces o similar
4. **CI/CD checks**: Validar que los tipos estén sincronizados en CI

## Archivos Clave

- `backend/src/types/index.ts`: Definición de tipos compartidos
- `backend/package.json`: Exporta los tipos vía `exports.types`
- `tsconfig.app.json`: Configura el path mapping `@backend/types`
- `src/lib/api.ts`: Usa los tipos compartidos
- `src/types/index.ts`: Re-exporta los tipos para conveniencia

## Recursos

- [Prisma Type Generation](https://www.prisma.io/docs/concepts/components/prisma-client/advanced-type-safety)
- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [tRPC](https://trpc.io/) - Para type-safety completo
- [Monorepo Tools Comparison](https://monorepo.tools/)
