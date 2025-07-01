#!/usr/bin/env node

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
    port: process.env.SHRIMP_VIEWER_PORT || 9999,
    host: process.env.SHRIMP_VIEWER_HOST || '127.0.0.1',
    dataDir: process.env.SHRIMP_DATA_DIR || process.cwd(),
    configFile: process.env.SHRIMP_CONFIG_FILE || null
};

// Auto-discovery of task data files
async function discoverTaskFiles(baseDir) {
    const taskFiles = [];
    
    try {
        // Common patterns for Shrimp task data locations
        const patterns = [
            'shrimp_data/tasks.json',
            'shrimp_data_*/tasks.json', 
            'tasks.json',
            'data/tasks.json',
            '**/shrimp_data/tasks.json',
            '**/tasks.json'
        ];
        
        // Simple directory traversal for common patterns
        const searchDirs = [
            baseDir,
            path.join(baseDir, 'teams'),
            path.join(baseDir, 'agents'),
            path.join(baseDir, 'data')
        ];
        
        for (const searchDir of searchDirs) {
            try {
                const entries = await fs.readdir(searchDir, { withFileTypes: true });
                
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const subDir = path.join(searchDir, entry.name);
                        
                        // Check for shrimp_data folders
                        if (entry.name.includes('shrimp') || entry.name.includes('task')) {
                            const tasksFile = path.join(subDir, 'tasks.json');
                            try {
                                await fs.access(tasksFile);
                                taskFiles.push({
                                    id: generateId(entry.name, subDir),
                                    name: formatName(entry.name, subDir),
                                    path: tasksFile
                                });
                            } catch {} // File doesn't exist, skip
                        }
                        
                        // Recurse into team/agent directories
                        if (entry.name.startsWith('team') || entry.name.startsWith('agent')) {
                            try {
                                const subEntries = await fs.readdir(subDir, { withFileTypes: true });
                                for (const subEntry of subEntries) {
                                    if (subEntry.isDirectory()) {
                                        const subSubDir = path.join(subDir, subEntry.name);
                                        const patterns = ['shrimp_data', 'shrimp_data_cipher', 'shrimp_data_bart'];
                                        
                                        for (const pattern of patterns) {
                                            const dataDir = path.join(subSubDir, pattern);
                                            const tasksFile = path.join(dataDir, 'tasks.json');
                                            try {
                                                await fs.access(tasksFile);
                                                taskFiles.push({
                                                    id: generateId(`${entry.name}-${subEntry.name}`, dataDir),
                                                    name: formatName(`${entry.name}-${subEntry.name}`, dataDir),
                                                    path: tasksFile
                                                });
                                            } catch {} // File doesn't exist, skip
                                        }
                                    }
                                }
                            } catch {} // Can't read subdirectory, skip
                        }
                    }
                }
            } catch {} // Can't read directory, skip
        }
    } catch (err) {
        console.warn('Discovery warning:', err.message);
    }
    
    return taskFiles;
}

function generateId(name, filePath) {
    // Generate a clean ID from name and path
    return name.toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function formatName(name, filePath) {
    // Format display name
    return name
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/Team(\d+)/i, 'Team $1')
        .trim();
}

// Load configuration from file if provided
async function loadConfig() {
    if (config.configFile) {
        try {
            const configData = await fs.readFile(config.configFile, 'utf8');
            const fileConfig = JSON.parse(configData);
            
            if (fileConfig.agents) {
                return fileConfig.agents;
            }
        } catch (err) {
            console.warn('Could not load config file:', err.message);
        }
    }
    
    // Auto-discover task files
    console.log('Auto-discovering task files...');
    const discovered = await discoverTaskFiles(config.dataDir);
    console.log(`Found ${discovered.length} task file(s)`);
    
    return discovered;
}

// HTML content for the viewer
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shrimp Task Manager Viewer</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #1a1a2e;
            color: #eee;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #4fbdba;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .agent-selector {
            text-align: center;
            margin-bottom: 30px;
        }
        .agent-selector select {
            padding: 10px 20px;
            font-size: 16px;
            background: #16213e;
            color: #eee;
            border: 2px solid #0f4c75;
            border-radius: 5px;
            cursor: pointer;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #0f4c75;
        }
        .stat-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: #4fbdba;
        }
        .filter-controls {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .filter-btn {
            padding: 8px 20px;
            background: #16213e;
            border: 2px solid #0f4c75;
            color: #eee;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .filter-btn:hover, .filter-btn.active {
            background: #0f4c75;
            color: white;
        }
        .tasks-grid {
            display: grid;
            gap: 20px;
        }
        .task-card {
            background: #16213e;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .task-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
        }
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .task-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #4fbdba;
            margin: 0;
            flex: 1;
        }
        .task-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending {
            background: #e74c3c;
            color: white;
        }
        .status-in_progress {
            background: #f39c12;
            color: white;
        }
        .status-completed {
            background: #27ae60;
            color: white;
        }
        .task-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
            font-size: 0.9rem;
            color: #aaa;
            flex-wrap: wrap;
        }
        .task-description {
            color: #ddd;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .task-notes {
            background: #0f3460;
            padding: 10px;
            border-radius: 5px;
            font-style: italic;
            color: #aaa;
            margin-bottom: 15px;
        }
        .task-files {
            margin-top: 15px;
        }
        .task-files h4 {
            margin: 0 0 10px 0;
            color: #0f4c75;
        }
        .file-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 5px 0;
            font-size: 0.9rem;
        }
        .file-type {
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .type-TO_MODIFY {
            background: #e67e22;
            color: white;
        }
        .type-REFERENCE {
            background: #3498db;
            color: white;
        }
        .type-CREATE {
            background: #2ecc71;
            color: white;
        }
        .type-DEPENDENCY {
            background: #9b59b6;
            color: white;
        }
        .loading {
            text-align: center;
            padding: 50px;
            font-size: 1.2rem;
        }
        .error {
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }
        .summary-section {
            background: #0f3460;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .summary-section h4 {
            margin: 0 0 10px 0;
            color: #4fbdba;
        }
        .task-id {
            font-family: monospace;
            font-size: 0.8rem;
            color: #666;
        }
        .refresh-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            background: #0f4c75;
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            font-size: 1rem;
            transition: all 0.3s;
        }
        .refresh-btn:hover {
            background: #4fbdba;
            transform: scale(1.05);
        }
        .config-info {
            background: #0f3460;
            padding: 10px 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🦐 Shrimp Task Manager Viewer</h1>
        
        <div id="configInfo" class="config-info" style="display: none;"></div>
        
        <div class="agent-selector">
            <label for="agent">Select Data Source: </label>
            <select id="agent" onchange="loadTasks()">
                <option value="">Select a data source...</option>
            </select>
        </div>

        <div id="stats" class="stats" style="display: none;">
            <div class="stat-card">
                <h3>Total Tasks</h3>
                <div class="value" id="totalTasks">0</div>
            </div>
            <div class="stat-card">
                <h3>Completed</h3>
                <div class="value" id="completedTasks">0</div>
            </div>
            <div class="stat-card">
                <h3>In Progress</h3>
                <div class="value" id="inProgressTasks">0</div>
            </div>
            <div class="stat-card">
                <h3>Pending</h3>
                <div class="value" id="pendingTasks">0</div>
            </div>
        </div>

        <div id="filterControls" class="filter-controls" style="display: none;">
            <button class="filter-btn active" onclick="filterTasks('all', this)">All Tasks</button>
            <button class="filter-btn" onclick="filterTasks('completed', this)">Completed</button>
            <button class="filter-btn" onclick="filterTasks('in_progress', this)">In Progress</button>
            <button class="filter-btn" onclick="filterTasks('pending', this)">Pending</button>
        </div>

        <div id="loading" class="loading">Select a data source to view tasks...</div>
        <div id="error" class="error" style="display: none;"></div>
        <div id="tasks" class="tasks-grid" style="display: none;"></div>
    </div>

    <button class="refresh-btn" onclick="loadTasks()">🔄 Refresh</button>

    <script>
        let currentTasks = [];
        let filteredTasks = [];
        let currentFilter = 'all';

        async function loadAgents() {
            try {
                const response = await fetch('/api/agents');
                const data = await response.json();
                
                const select = document.getElementById('agent');
                select.innerHTML = '<option value="">Select a data source...</option>' + 
                    data.agents.map(agent => 
                        '<option value="' + agent.id + '">' + agent.name + '</option>'
                    ).join('');
                
                // Show config info if available
                if (data.config) {
                    const configInfo = document.getElementById('configInfo');
                    configInfo.innerHTML = 'Found ' + data.agents.length + ' data source(s) in: ' + data.config.baseDir;
                    configInfo.style.display = 'block';
                }
                
            } catch (err) {
                console.error('Error loading agents:', err);
                const error = document.getElementById('error');
                error.textContent = 'Error loading data sources: ' + err.message;
                error.style.display = 'block';
            }
        }

        async function loadTasks() {
            const agentId = document.getElementById('agent').value;
            if (!agentId) return;

            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            const tasksContainer = document.getElementById('tasks');
            const stats = document.getElementById('stats');
            const filterControls = document.getElementById('filterControls');

            loading.style.display = 'block';
            loading.textContent = 'Loading tasks...';
            error.style.display = 'none';
            tasksContainer.style.display = 'none';
            stats.style.display = 'none';
            filterControls.style.display = 'none';

            try {
                const response = await fetch('/api/tasks/' + agentId);
                if (!response.ok) {
                    throw new Error('Failed to load tasks');
                }
                
                const data = await response.json();
                currentTasks = data.tasks || [];
                
                // Sort tasks by updatedAt descending
                currentTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                
                filterTasks(currentFilter);
                updateStats();

                loading.style.display = 'none';
                tasksContainer.style.display = 'grid';
                stats.style.display = 'grid';
                filterControls.style.display = 'flex';

            } catch (err) {
                loading.style.display = 'none';
                error.style.display = 'block';
                error.textContent = 'Error loading tasks: ' + err.message;
            }
        }

        function filterTasks(filter, buttonElement) {
            currentFilter = filter;
            
            // Update button states
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to the clicked button or find it by filter
            if (buttonElement) {
                buttonElement.classList.add('active');
            } else {
                // Find button by filter value when called programmatically
                const buttons = document.querySelectorAll('.filter-btn');
                buttons.forEach(btn => {
                    if (btn.textContent.toLowerCase().includes(filter) || 
                        (filter === 'all' && btn.textContent.includes('All'))) {
                        btn.classList.add('active');
                    }
                });
            }
            
            if (filter === 'all') {
                filteredTasks = currentTasks;
            } else {
                filteredTasks = currentTasks.filter(task => task.status === filter);
            }
            
            displayTasks();
        }

        function displayTasks() {
            const container = document.getElementById('tasks');
            
            if (filteredTasks.length === 0) {
                container.innerHTML = '<div class="loading">No tasks found</div>';
                return;
            }
            
            container.innerHTML = filteredTasks.map(task => {
                const createdDate = new Date(task.createdAt).toLocaleDateString() + ' ' + 
                                   new Date(task.createdAt).toLocaleTimeString();
                const updatedDate = new Date(task.updatedAt).toLocaleDateString() + ' ' + 
                                   new Date(task.updatedAt).toLocaleTimeString();
                
                return '<div class="task-card">' +
                    '<div class="task-header">' +
                        '<h3 class="task-title">' + escapeHtml(task.name) + '</h3>' +
                        '<span class="task-status status-' + task.status + '">' + task.status.replace('_', ' ') + '</span>' +
                    '</div>' +
                    
                    '<div class="task-id">ID: ' + task.id + '</div>' +
                    
                    '<div class="task-meta">' +
                        '<span>Created: ' + createdDate + '</span>' +
                        '<span>Updated: ' + updatedDate + '</span>' +
                    '</div>' +
                    
                    '<div class="task-description">' + escapeHtml(task.description) + '</div>' +
                    
                    (task.notes ? '<div class="task-notes">' + escapeHtml(task.notes) + '</div>' : '') +
                    
                    (task.summary ? 
                        '<div class="summary-section">' +
                            '<h4>Summary</h4>' +
                            '<div>' + escapeHtml(task.summary) + '</div>' +
                        '</div>' 
                    : '') +
                    
                    (task.relatedFiles && task.relatedFiles.length > 0 ? 
                        '<div class="task-files">' +
                            '<h4>Related Files (' + task.relatedFiles.length + ')</h4>' +
                            task.relatedFiles.map(file => 
                                '<div class="file-item">' +
                                    '<span class="file-type type-' + file.type + '">' + file.type + '</span>' +
                                    '<span>' + escapeHtml(file.path) + 
                                    (file.lineStart ? ' (lines ' + file.lineStart + '-' + file.lineEnd + ')' : '') + 
                                    '</span>' +
                                '</div>'
                            ).join('') +
                        '</div>' 
                    : '') +
                '</div>';
            }).join('');
        }

        function updateStats() {
            const stats = {
                total: currentTasks.length,
                completed: currentTasks.filter(t => t.status === 'completed').length,
                inProgress: currentTasks.filter(t => t.status === 'in_progress').length,
                pending: currentTasks.filter(t => t.status === 'pending').length
            };

            document.getElementById('totalTasks').textContent = stats.total;
            document.getElementById('completedTasks').textContent = stats.completed;
            document.getElementById('inProgressTasks').textContent = stats.inProgress;
            document.getElementById('pendingTasks').textContent = stats.pending;
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return (text || '').replace(/[&<>"']/g, m => map[m]);
        }

        // Initialize on page load
        window.onload = loadAgents;
    </script>
</body>
</html>`;

// Initialize agents configuration
let agents = [];

// Create server
const server = http.createServer(async (req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent);
    } else if (req.url === '/api/agents') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            agents: agents,
            config: {
                baseDir: config.dataDir,
                port: config.port,
                discoveryEnabled: !config.configFile
            }
        }));
    } else if (req.url.startsWith('/api/tasks/')) {
        const agentId = req.url.split('/').pop();
        const agent = agents.find(a => a.id === agentId);
        
        if (!agent) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Data source not found' }));
            return;
        }

        try {
            const data = await fs.readFile(agent.path, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        } catch (err) {
            console.error(`Error reading file ${agent.path}:`, err);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Tasks file not found', details: err.message }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Initialize and start server
async function startServer() {
    try {
        agents = await loadConfig();
        
        server.listen(config.port, config.host, () => {
            console.log(`
🦐 Shrimp Task Manager Viewer Server
=====================================
Server is running at: http://${config.host}:${config.port}
Base directory: ${config.dataDir}
Config file: ${config.configFile || 'Auto-discovery mode'}

Available data sources:
${agents.map(a => `  - ${a.name} (${a.path})`).join('\n')}

Open your browser to view tasks!
            `);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start the server
startServer();