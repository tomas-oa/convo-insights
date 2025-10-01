# Configuración de Gemini AI

## ✅ Implementación Completada

Se ha integrado exitosamente Google Gemini AI en el sistema de chat con las siguientes características:

### 🎯 Funcionalidades Implementadas

1. **Integración con Gemini AI**
   - Servicio de IA configurado en `backend/src/services/gemini.service.ts`
   - Usa el modelo `gemini-pro` de Google
   - Soporte para system prompts personalizados por agente

2. **System Prompts (Personalidad del Agente)**
   - Los agentes utilizan el campo `text` del modelo `Prompt` en la base de datos
   - Cada conversación puede tener un prompt asignado que define la personalidad del agente
   - Si no hay prompt asignado, usa un prompt por defecto

3. **Indicador de "Escribiendo..."**
   - Implementado con WebSocket en tiempo real
   - El usuario ve cuando la IA está procesando la respuesta
   - Animación de puntos mientras la IA "escribe"

4. **WebSocket para Actualizaciones en Tiempo Real**
   - Conexión WebSocket entre frontend y backend
   - Eventos:
     - `ai-typing`: Indica cuando la IA está escribiendo
     - `new-message`: Envía el mensaje de la IA cuando está listo
     - `join-conversation`: El cliente se une a una sala de conversación
     - `leave-conversation`: El cliente sale de la sala

5. **Historial de Conversación**
   - El servicio de Gemini mantiene contexto de los últimos 10 mensajes
   - Permite conversaciones coherentes y con memoria

### 📁 Archivos Modificados/Creados

#### Backend
- ✅ `backend/src/services/gemini.service.ts` - Servicio de Gemini AI (NUEVO)
- ✅ `backend/src/routes/chat.routes.ts` - Integración con Gemini y WebSocket
- ✅ `backend/src/config/env.ts` - Configuración de API key
- ✅ `backend/.env` - API key agregada
- ✅ `backend/.env.example` - Ejemplo actualizado
- ✅ `backend/package.json` - Dependencia `@google/generative-ai` agregada

#### Frontend
- ✅ `src/pages/Chat.tsx` - WebSocket y UI de typing indicator
- ✅ `package.json` - Dependencia `socket.io-client` agregada

### 🔑 API Key Configurada

La API key de Gemini ya está configurada en el archivo `.env` del backend:
```
GEMINI_API_KEY=AIzaSyCHQCqXstV7itTXp2llCWyuPx-pPZDwk5Y
```

### 🚀 Cómo Usar

1. **Iniciar el Backend**
   ```bash
   cd backend
   bun run dev
   ```

2. **Iniciar el Frontend**
   ```bash
   cd ..
   bun run dev
   ```

3. **Crear/Editar Prompts**
   - Ve a la sección "Prompts" en el dashboard
   - Crea o edita prompts con diferentes personalidades
   - El campo "Texto del Prompt" define cómo se comportará la IA

4. **Iniciar una Conversación**
   - Crea una nueva conversación
   - Asigna un prompt (opcional)
   - Envía mensajes y la IA responderá usando Gemini

### 🎭 Ejemplo de System Prompts

**Asistente Técnico:**
```
Eres un asistente técnico especializado en tecnología. Responde de manera precisa y técnica, 
usando terminología apropiada. Sé conciso pero completo en tus explicaciones.
```

**Asistente Amigable:**
```
Eres un asistente amigable y cercano. Usa un tono casual y empático. 
Haz que el usuario se sienta cómodo y apoyado en cada interacción.
```

**Asistente de Ventas:**
```
Eres un asistente de ventas profesional. Tu objetivo es ayudar al cliente a encontrar 
la mejor solución para sus necesidades, siendo persuasivo pero no agresivo.
```

### 🔧 Configuración Técnica

**Parámetros de Generación (Gemini):**
- `maxOutputTokens`: 1000
- `temperature`: 0.7 (creatividad moderada)
- `topP`: 0.8
- `topK`: 40

**WebSocket:**
- Puerto: 3001 (mismo que el backend)
- Transports: WebSocket y polling (fallback)
- Autenticación: JWT token

### 📊 Flujo de Mensajes

1. Usuario escribe mensaje → Frontend
2. Frontend envía mensaje → Backend API (`POST /api/chat`)
3. Backend guarda mensaje del usuario en BD
4. Backend emite evento `ai-typing: true` → WebSocket
5. Frontend muestra indicador de "escribiendo..."
6. Backend consulta historial y genera respuesta con Gemini
7. Backend guarda respuesta de IA en BD
8. Backend emite evento `ai-typing: false` → WebSocket
9. Backend emite evento `new-message` con respuesta → WebSocket
10. Frontend muestra mensaje de IA

### ⚠️ Notas Importantes

- La API key de Gemini está en el `.env` del backend (no commitear a git)
- El `.env` está en `.gitignore` por seguridad
- Si la API key no está configurada, el sistema mostrará un mensaje de error pero no crasheará
- El historial de conversación se limita a 10 mensajes para optimizar tokens

### 🐛 Troubleshooting

**La IA no responde:**
- Verifica que `GEMINI_API_KEY` esté en `backend/.env`
- Revisa los logs del backend para errores
- Verifica que el WebSocket esté conectado (console del navegador)

**El indicador de "escribiendo" no aparece:**
- Verifica la conexión WebSocket en la consola del navegador
- Asegúrate de que el backend esté corriendo
- Revisa que el puerto 3001 esté disponible

**Errores de API de Gemini:**
- Verifica que la API key sea válida
- Revisa los límites de uso de la API de Google
- Consulta los logs del backend para detalles del error
