# 🦐 Shrimp Task Manager Viewer

A web-based GUI for viewing and monitoring Shrimp Task Manager data across multiple agents and projects. Features automatic task file discovery and real-time task monitoring.

## Features

- **🔍 Auto-Discovery**: Automatically finds task files in your project structure
- **🌐 Web Interface**: Clean, responsive dashboard for viewing tasks
- **📊 Statistics**: Real-time task counts and status breakdown
- **🔄 Real-time Updates**: Refresh data with a single click
- **🎯 Filtering**: Filter tasks by status (pending, in progress, completed)
- **📁 Multi-Source**: Support for multiple task data sources
- **⚙️ Configurable**: Manual configuration or automatic discovery
- **🔒 Secure**: Localhost-only binding for security
- **🎨 Dark Theme**: Professional dark UI optimized for development

## Quick Start

### Installation

```bash
# Clone or navigate to your mcp-shrimp-task-manager directory
cd path/to/mcp-shrimp-task-manager/tools/task-viewer

# Make CLI executable (Linux/macOS)
chmod +x cli.js

# Start the viewer
./cli.js start
```

### Using the Viewer

1. **Start the server**:
   ```bash
   ./cli.js start
   ```

2. **Open your browser**:
   Navigate to http://127.0.0.1:9999

3. **Select a data source**:
   Choose from auto-discovered task files in the dropdown

4. **View and filter tasks**:
   Use the filter buttons to view tasks by status

## Usage

### Command Line Interface

```bash
# Start the server (default command)
./cli.js start

# Start with custom options
./cli.js start --port 8080 --data-dir ~/projects

# Stop the server
./cli.js stop

# Restart the server
./cli.js restart

# Check server status
./cli.js status

# Show help
./cli.js help
```

### Configuration Options

#### Environment Variables

```bash
export SHRIMP_VIEWER_PORT=9999           # Server port
export SHRIMP_VIEWER_HOST=127.0.0.1      # Server host
export SHRIMP_DATA_DIR=/path/to/project   # Base directory for discovery
export SHRIMP_CONFIG_FILE=/path/to/config.json  # Manual config file
```

#### Command Line Arguments

```bash
--port <number>     # Server port (default: 9999)
--host <host>       # Server host (default: 127.0.0.1)
--data-dir <path>   # Base directory for task discovery
--config <file>     # Configuration file path
```

### Auto-Discovery vs Manual Configuration

#### Auto-Discovery Mode (Default)

The viewer automatically searches for task files in common locations:

```
Base Directory/
├── shrimp_data/tasks.json
├── teams/
│   ├── team-1/
│   │   ├── dev__neo/shrimp_data/tasks.json
│   │   └── testing__trinity/shrimp_data/tasks.json
│   ├── team-2/
│   │   ├── dev__morpheus/shrimp_data/tasks.json
│   │   └── testing__cipher/shrimp_data_cipher/tasks.json
│   └── team-3/
│       ├── dev__homer/shrimp_data/tasks.json
│       └── testing__bart/shrimp_data_bart/tasks.json
├── agents/
│   └── agent-*/shrimp_data/tasks.json
└── data/tasks.json
```

#### Manual Configuration

Create a configuration file to specify exact data sources:

```json
{
  "agents": [
    {
      "id": "team1-neo",
      "name": "Team 1 - Neo (Development)",
      "path": "/absolute/path/to/team1/dev__neo/shrimp_data/tasks.json"
    },
    {
      "id": "team1-trinity", 
      "name": "Team 1 - Trinity (Testing)",
      "path": "/absolute/path/to/team1/testing__trinity/shrimp_data/tasks.json"
    }
  ]
}
```

Then start with the config file:

```bash
./cli.js start --config config.json
```

## Integration Examples

### SoraOrc Multi-Team Setup

For the SoraOrc project structure:

```bash
cd ~/claude/SoraOrc
./path/to/task-viewer/cli.js start --data-dir .
```

This will auto-discover all team task files:
- Team 1: Neo (dev), Trinity (testing)
- Team 2: Morpheus (dev), Cipher (testing)  
- Team 3: Homer (dev), Bart (testing)

### Single Project Setup

For a single project with Shrimp tasks:

```bash
cd ~/my-project
./path/to/task-viewer/cli.js start
```

Auto-discovers:
- `./shrimp_data/tasks.json`
- `./data/tasks.json`
- Any subdirectory task files

### Custom Directory Structure

For custom project layouts:

```bash
# Search a specific directory
./cli.js start --data-dir /path/to/my/projects

# Use manual configuration
./cli.js start --config my-projects-config.json
```

## Process Management

The CLI includes built-in process management:

```bash
# Start in background (daemon mode)
./cli.js start

# Check if running
./cli.js status
# Output: 🦐 Shrimp Task Viewer: Running (PID: 12345)

# Stop gracefully
./cli.js stop

# Restart (stop + start)
./cli.js restart

# Force kill if needed
./cli.js stop  # Tries SIGTERM first, then SIGKILL
```

PID file is stored as `.shrimp-viewer.pid` in the current directory.

## Web Interface Features

### Dashboard Overview

- **Task Statistics**: Total, completed, in progress, and pending counts
- **Data Source Selector**: Dropdown to switch between different agents/teams
- **Filter Controls**: Buttons to filter tasks by status
- **Real-time Refresh**: Manual refresh button for latest data

### Task Display

Each task card shows:
- **Task Name**: Clear title and description
- **Status Badge**: Color-coded status (pending/in progress/completed)
- **Timestamps**: Created and last updated dates
- **Task ID**: Unique identifier for reference
- **Related Files**: Associated files with type indicators
- **Summary**: Task completion summary when available
- **Notes**: Additional task notes and comments

### Responsive Design

- **Desktop**: Multi-column grid layout
- **Tablet**: Responsive grid adjustment
- **Mobile**: Single column stack
- **Dark Theme**: Professional appearance for development environments

## Security Considerations

- **Localhost Only**: Server binds to 127.0.0.1 by default
- **No External Access**: Not accessible from other machines
- **File System Access**: Only reads specified JSON files
- **No Authentication**: Designed for local development use

## Troubleshooting

### Server Won't Start

```bash
# Check if port is in use
lsof -i :9999

# Try different port
./cli.js start --port 8080

# Check for permission issues
ls -la .shrimp-viewer.pid
```

### No Task Files Found

```bash
# Verify data directory
./cli.js start --data-dir /correct/path

# Check file permissions
find . -name "tasks.json" -type f

# Use manual configuration
./cli.js start --config manual-config.json
```

### Tasks Not Loading

1. **Check file format**: Ensure tasks.json contains valid JSON with `tasks` array
2. **Verify paths**: Check that file paths in config are absolute and correct
3. **File permissions**: Ensure the viewer can read the task files
4. **JSON validity**: Validate JSON syntax in task files

### Browser Connection Issues

```bash
# Verify server is running
./cli.js status

# Check firewall settings (Windows/Linux)
# Ensure localhost connections are allowed

# Try different browser
# Clear browser cache
```

## Development

### File Structure

```
task-viewer/
├── server.js           # Main HTTP server with auto-discovery
├── cli.js              # Command-line interface and process management
├── package.json        # Node.js package configuration
├── example-config.json # Example configuration file
└── README.md          # This documentation
```

### API Endpoints

- `GET /` - Main web interface
- `GET /api/agents` - List available data sources
- `GET /api/tasks/{agentId}` - Get tasks for specific agent

### Extending the Viewer

The viewer is designed to be easily extensible:

1. **Custom Discovery**: Modify `discoverTaskFiles()` function
2. **Additional Endpoints**: Add new routes to the server
3. **UI Enhancements**: Modify the embedded HTML/CSS/JS
4. **Custom Filtering**: Extend the filtering logic

## License

MIT License - see the main project license for details.

## Contributing

This tool is part of the MCP Shrimp Task Manager project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy task viewing! 🦐**