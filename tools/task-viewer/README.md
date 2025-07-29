# 🦐 Shrimp Task Manager Viewer

A modern, React-based web interface for viewing and managing [Shrimp Task Manager](https://github.com/paulpreibisch/mcp-shrimp-task-manager) tasks created through the MCP (Model Context Protocol) tool. This visual interface allows you to see detailed task information, track progress across multiple projects, and easily copy task UUIDs for AI agent interactions.

## Why Use Shrimp Task Viewer?

When using Shrimp Task Manager as an MCP server with AI agents like Claude, this viewer provides essential visibility into your task ecosystem:

- **Visual Task Overview**: See all tasks, their status, dependencies, and progress in a clean tabbed interface
- **UUID Management**: Click any task badge to instantly copy its UUID for commands like `"Use task manager to complete this shrimp task: [UUID]"`
- **Parallel Execution**: Open multiple terminals and use the AI Actions column (🤖) to copy task instructions for parallel AI agent execution
- **Live Updates**: Direct file path reading ensures you always see the current task state
- **Multi-Project Support**: Manage tasks across different projects with draggable profile tabs

For information on setting up Shrimp Task Manager as an MCP server, see the [main repository](https://github.com/paulpreibisch/mcp-shrimp-task-manager).

## 📸 Screenshot

![Shrimp Task Manager Viewer Interface](screenshot.png)

*Modern tabbed interface showing task management with real-time search, configurable auto-refresh, and professional table display*

## 🌟 Features

### 🏷️ Modern Tab Interface
- **Draggable Tabs**: Reorder profiles by dragging tabs
- **Professional Design**: Browser-style tabs that connect seamlessly to content
- **Visual Feedback**: Clear active tab indication and hover effects
- **Add New Profiles**: Integrated "+ Add Tab" button matching the interface design

### 🔍 Advanced Search & Filtering
- **Real-time Search**: Instant task filtering by name, description, status, or ID
- **Sortable Columns**: Click column headers to sort by any field
- **TanStack Table**: Powerful table component with pagination and filtering
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### 🔄 Intelligent Auto-Refresh
- **Configurable Intervals**: Choose from 5s, 10s, 15s, 30s, 1m, 2m, or 5m
- **Smart Controls**: Auto-refresh toggles with interval selection
- **Visual Indicators**: Loading states and refresh status
- **Manual Refresh**: Dedicated refresh button for on-demand updates

### 📊 Comprehensive Task Management
- **Task Statistics**: Live counts for Total, Completed, In Progress, and Pending tasks
- **Profile Management**: Add/remove/reorder profiles via intuitive interface
- **Persistent Settings**: Profile configurations saved across sessions
- **Hot Reload**: Development mode with instant updates

### 🎨 Professional UI/UX
- **Dark Theme**: Optimized for development environments
- **Responsive Layout**: Adapts to all screen sizes
- **Accessibility**: Full keyboard navigation and screen reader support
- **Interactive Elements**: Hover tooltips and visual feedback throughout

## 🚀 Quick Start

### Installation & Setup

1. **Clone and navigate to the task viewer directory**
   ```bash
   cd path/to/mcp-shrimp-task-manager/tools/task-viewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the React application**
   ```bash
   npm run build
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   The viewer will be available at `http://localhost:9998`

### Development Mode

For development with hot reload:

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000` with automatic rebuilding on file changes.

### Production Deployment

#### Standard Deployment

```bash
# Build for production
npm run build

# Start the production server
node server.js
```

#### Systemd Service (Linux)

For automatic startup and process management:

1. **Install as a service**
   ```bash
   sudo ./install-service.sh
   ```

2. **Manage the service**
   ```bash
   # Check status
   systemctl status shrimp-task-viewer
   
   # Start/stop/restart
   sudo systemctl start shrimp-task-viewer
   sudo systemctl stop shrimp-task-viewer
   sudo systemctl restart shrimp-task-viewer
   
   # View logs
   journalctl -u shrimp-task-viewer -f
   
   # Disable/enable auto-start
   sudo systemctl disable shrimp-task-viewer
   sudo systemctl enable shrimp-task-viewer
   ```

3. **Uninstall the service**
   ```bash
   sudo ./uninstall-service.sh
   ```

## 🖥️ Usage

### Getting Started

1. **Start the server**:
   ```bash
   node server.js
   ```

2. **Open your browser**:
   Navigate to `http://127.0.0.1:9998`

3. **Add your first profile**:
   - Click the "**+ Add Tab**" button
   - Enter a descriptive profile name (e.g., "Team Alpha Tasks")
   - Enter the path to your shrimp data folder containing tasks.json
   - **Tip:** Navigate to your folder in terminal and type `pwd` to get the full path
   - Click "**Add Profile**"

4. **Manage your tasks**:
   - Switch between profiles using the tabs
   - Search tasks using the search box
   - Sort columns by clicking headers
   - Configure auto-refresh as needed


### Tab Management

- **Switch Profiles**: Click any tab to switch to that profile
- **Reorder Tabs**: Drag tabs to rearrange them in your preferred order
- **Add New Profile**: Click the "**+ Add Tab**" button
- **Remove Profile**: Click the × on any tab (with confirmation)

### Search & Filtering

- **Global Search**: Type in the search box to filter across all task fields
- **Column Sorting**: Click any column header to sort (click again to reverse)
- **Pagination**: Navigate large task lists with built-in pagination controls
- **Real-time Updates**: Search and sorting update instantly as you type

### Auto-Refresh Configuration

1. **Enable Auto-refresh**: Check the "Auto-refresh" checkbox
2. **Set Interval**: Choose from the dropdown (5s to 5m)
3. **Manual Refresh**: Click the 🔄 button anytime for immediate refresh
4. **Visual Feedback**: Spinner shows during refresh operations

## 🔧 Configuration

### Environment Variables

```bash
export SHRIMP_VIEWER_PORT=9998           # Server port (default: 9998)
export SHRIMP_VIEWER_HOST=127.0.0.1      # Server host (localhost only)
```

### Development Configuration

- **Development server with hot reload (Vite)**:
  ```bash
  npm run dev  # Runs on port 3000
  ```

- **Production build and serve**:
  ```bash
  npm run build && npm start  # Runs on port 9998
  ```

### Profile Data Storage

- **Settings File**: `~/.shrimp-task-viewer-settings.json`
- **Task Files**: Read directly from specified folder paths (no uploads)
- **Hot Reload**: Development changes rebuild automatically

## 🏗️ Technical Architecture

### Technology Stack

- **Frontend**: React 19 + Vite for hot reload development
- **Table Component**: TanStack React Table for advanced table features
- **Styling**: Custom CSS with dark theme and responsive design
- **Backend**: Node.js HTTP server with RESTful API
- **Build System**: Vite for fast development and optimized production builds

### File Structure

```
task-viewer/
├── src/
│   ├── App.jsx                 # Main React application
│   ├── components/
│   │   └── TaskTable.jsx       # TanStack table component
│   └── index.css              # Complete styling system
├── dist/                      # Built React application (generated)
├── server.js                  # Node.js backend server
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This documentation
```

### API Endpoints

- `GET /` - Serves the React application
- `GET /api/agents` - Lists all configured profiles
- `GET /api/tasks/{profileId}` - Returns tasks for specific profile
- `POST /api/add-profile` - Adds new profile with folder path
- `DELETE /api/remove-profile/{profileId}` - Removes profile
- `PUT /api/rename-profile/{profileId}` - Rename profile
- `PUT /api/update-profile/{profileId}` - Update profile settings
- `GET /api/readme` - Returns README content for help tab
- `GET /releases/*.md` - Serves release notes markdown files
- `GET /releases/*.png` - Serves release notes images

## 🛠️ Development

### Setting Up Development Environment

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Development server runs on http://localhost:3000
# Backend API server runs on http://localhost:9998
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Files are generated in dist/ directory
# Start production server
npm start
```

### Extending the Interface

The modular React architecture makes it easy to extend:

1. **Add New Components**: Create in `src/components/`
2. **Modify Styling**: Edit `src/index.css` with CSS custom properties
3. **Add Features**: Extend `App.jsx` with new state and functionality
4. **API Integration**: Add endpoints in `server.js`

## 🔒 Security & Performance

### Security Features

- **Localhost Binding**: Server only accessible from local machine
- **Direct File Access**: Reads task files directly from filesystem paths
- **No External Dependencies**: Self-contained with minimal attack surface
- **CORS Protection**: API endpoints protected with CORS headers

### Performance Optimizations

- **Hot Module Replacement**: Instant development updates
- **Code Splitting**: Optimized bundle loading
- **Efficient Re-rendering**: React optimization patterns
- **Caching**: Static asset caching for faster loads
- **Responsive Images**: Optimized for all device sizes

## 🐛 Troubleshooting

### Common Issues

**Server Won't Start**
```bash
# Check if port is in use
lsof -i :9998

# Kill existing processes
pkill -f "node.*server.js"

# Try different port
SHRIMP_VIEWER_PORT=8080 node server.js
```

**Help/Readme Tab Shows HTML**
If the Help tab displays HTML instead of the README content, the server needs to be restarted to load the new API endpoints:
```bash
# Stop the server (Ctrl+C) and restart
npm start
```

**Hot Reload Not Working**
```bash
# Ensure development dependencies are installed
npm install

# Restart development server
npm run dev
```

**Tasks Not Loading**
1. Check that `tasks.json` files contain valid JSON
2. Verify file permissions are readable
3. Check browser console for error messages
4. Use manual refresh button to reload data

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf dist/
npm run build
```

## 📋 Changelog

### Version 2.1.0 (Latest) - 2025-07-29

#### 🚀 Major Features
- **Direct File Path Support**: Replaced file upload with direct folder path input for live updates
- **Help/Readme Tab**: Added documentation tab with markdown rendering
- **Release Notes Tab**: In-app release notes viewer with image support  
- **Clickable Dependencies**: Navigate between dependent tasks easily
- **AI Actions Column**: Copy AI instructions for task completion
- **Enhanced UUID Management**: Click task badges to copy UUIDs
- **Profile Editing**: Rename profiles and configure project roots
- **ES Module Support**: Converted to ES modules for better compatibility

#### 🐛 Critical Fix
- **Fixed Static File Copy Issue**: Files are now read directly from specified paths instead of creating static copies in `/tmp/`

### Version 1.0.3 - 2025-07-26

#### 🧪 Testing & Reliability
- **Comprehensive Test Suite**: Added full test coverage with Vitest
- **Component Tests**: React Testing Library tests for all components
- **Integration Tests**: End-to-end testing of server and API endpoints
- **Bug Fixes**: Resolved multipart form data handling in profile management

### Version 1.0.2 - 2025-07-26

#### 🎨 Task Detail View
- **In-Tab Navigation**: Replaced modal with seamless in-tab task details
- **Back Button**: Easy navigation back to task list
- **Improved UX**: Better workflow without popup interruptions

### Version 1.0.1 - 2025-07-13

#### 🎨 Major UI Overhaul
- **Modern Tab Interface**: Professional browser-style tabs with drag & drop reordering
- **Connected Design**: Seamless visual connection between tabs and content
- **Improved Layout**: Search and controls repositioned for better workflow

#### ⚡ Enhanced Functionality  
- **Configurable Auto-refresh**: Choose intervals from 5 seconds to 5 minutes
- **Advanced Search**: Real-time filtering across all task fields
- **Sortable Columns**: Click headers to sort by any column
- **Hot Reload Development**: Instant updates during development

#### 🔧 Technical Improvements
- **React Architecture**: Complete rewrite using React 19 + Vite
- **TanStack Table**: Professional table component with pagination
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Performance**: Optimized rendering and efficient state management

### Version 1.0.0 - 2025-07-01

#### 🚀 Initial Release
- **Basic Viewer**: Initial implementation with basic web interface
- **Profile Management**: Add and remove task profiles
- **Server API**: RESTful endpoints for task data
- **Task Display**: View tasks from multiple projects

## 📄 License

MIT License - see the main project license for details.

## 🤝 Contributing

This tool is part of the MCP Shrimp Task Manager project. Contributions welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper testing
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Submit a pull request

### Development Guidelines

- Follow React best practices and hooks patterns
- Maintain responsive design principles
- Add proper TypeScript types where applicable
- Test across different browsers and devices
- Update documentation for new features

---

**Happy task management! 🦐✨**

Built with ❤️ using React, Vite, and modern web technologies.