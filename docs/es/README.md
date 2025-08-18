# MCP Shrimp Task Manager

[![smithery badge](https://smithery.ai/badge/@cjo4m06/mcp-shrimp-task-manager)](https://smithery.ai/server/@cjo4m06/mcp-shrimp-task-manager)

> 🦐 **Gestión inteligente de tareas para desarrollo impulsado por IA** - Divide proyectos complejos en tareas manejables, mantiene el contexto entre sesiones y acelera tu flujo de trabajo de desarrollo.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cliente AI compatible con MCP (Claude Desktop, Cline, etc.)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/cjo4m06/mcp-shrimp-task-manager.git
cd mcp-shrimp-task-manager

# Instalar dependencias
npm install

# Construir el proyecto
npm run build
```

### Configurar tu Cliente AI

<details>
<summary><b>Configuración de Claude Desktop</b></summary>

Añadir a tu configuración de Claude Desktop:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-shrimp-task-manager": {
      "command": "node",
      "args": ["/ruta/a/mcp-shrimp-task-manager/dist/index.js"],
      "env": {
        "DATA_DIR": "/ruta/a/tu/directorio-de-datos"
      }
    }
  }
}
```
</details>

### Comenzar a Usar

1. **Inicializar tu proyecto**: `"init project rules"`
2. **Planificar una tarea**: `"plan task: implementar autenticación de usuario"`
3. **Ejecutar tareas**: `"execute task"` o `"continuous mode"`

## 💡 ¿Qué es Shrimp?

Shrimp Task Manager es un servidor MCP (Model Context Protocol) que transforma cómo los agentes de IA abordan el desarrollo de software. En lugar de perder contexto o repetir trabajo, Shrimp proporciona:

- **🧠 Memoria Persistente**: Las tareas y el progreso persisten entre sesiones
- **📋 Flujos de Trabajo Estructurados**: Procesos guiados para planificación, ejecución y verificación
- **🔄 Descomposición Inteligente**: Divide automáticamente tareas complejas en subtareas manejables
- **🎯 Preservación del Contexto**: Nunca pierdas tu lugar, incluso con límites de tokens

## ✨ Características Principales

### Gestión de Tareas
- **Planificación Inteligente**: Análisis profundo de requisitos antes de la implementación
- **Descomposición de Tareas**: Divide grandes proyectos en unidades atómicas y comprobables
- **Seguimiento de Dependencias**: Gestión automática de relaciones entre tareas
- **Monitoreo de Progreso**: Seguimiento y actualizaciones de estado en tiempo real

### Capacidades Avanzadas
- **🔬 Modo de Investigación**: Exploración sistemática de tecnologías y soluciones
- **🤖 Sistema de Agentes**: Asigna agentes de IA especializados a tareas específicas
- **📏 Reglas del Proyecto**: Define y mantiene estándares de codificación en tu proyecto
- **💾 Memoria de Tareas**: Respaldo y restauración automática del historial de tareas

### Interfaces Web

#### 🖥️ Visor de Tareas
Interfaz React moderna para gestión visual de tareas con arrastrar y soltar, búsqueda en tiempo real y soporte multi-perfil.

[📖 Documentación del Visor de Tareas](../../tools/task-viewer/README.md)

#### 🌐 GUI Web
Interfaz web ligera opcional para vista rápida de tareas.

Habilitar en `.env`: `ENABLE_GUI=true`

## 🛠️ Configuración

### Variables de Entorno

Crear un archivo `.env`:

```bash
# Requerido
DATA_DIR=/ruta/a/almacenamiento/datos

# Opcional
ENABLE_GUI=true          # Habilitar GUI web
WEB_PORT=3000           # Puerto web personalizado
PROMPT_LANGUAGE=es      # Idioma de prompts
```

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `init project rules` | Inicializar estándares del proyecto |
| `plan task [descripción]` | Crear un plan de tarea |
| `execute task [id]` | Ejecutar tarea específica |
| `continuous mode` | Ejecutar todas las tareas secuencialmente |
| `list tasks` | Mostrar todas las tareas |
| `research [tema]` | Entrar en modo investigación |
| `reflect task [id]` | Revisar y mejorar tarea |

## 📚 Documentación

- [🛠️ Herramientas Disponibles](../tools.md)
- [🤖 Gestión de Agentes](../agents.md)
- [🔧 Referencia API](../api.md)

## 🤝 Contribuir

¡Damos la bienvenida a las contribuciones! Por favor, consulta nuestra [Guía de Contribución](../../CONTRIBUTING.md) para más detalles.

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](../../LICENSE) para más detalles.

## 🌟 Créditos

Creado por [cjo4m06](https://github.com/cjo4m06) y mantenido por la comunidad.

---

<p align="center">
  <a href="https://github.com/cjo4m06/mcp-shrimp-task-manager">GitHub</a> •
  <a href="https://github.com/cjo4m06/mcp-shrimp-task-manager/issues">Problemas</a> •
  <a href="https://github.com/cjo4m06/mcp-shrimp-task-manager/discussions">Discusiones</a>
</p>