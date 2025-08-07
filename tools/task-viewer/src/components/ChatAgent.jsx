import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

function ChatAgent({ 
  currentPage, 
  currentTask, 
  tasks, 
  profileId,
  profileName,
  projectRoot,
  projectInnerTab,
  isInDetailView,
  showToast,
  onTaskUpdate 
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgents, setSelectedAgents] = useState({});
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [openAIKey, setOpenAIKey] = useState('');
  const [agentsExpanded, setAgentsExpanded] = useState(() => {
    // Load expanded state from localStorage
    const saved = localStorage.getItem('chatAgentsExpanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Load saved agent selections for this project
  const loadSavedSelections = () => {
    const saved = localStorage.getItem(`chatAgentSelections_${profileId}`);
    if (saved) {
      try {
        const selections = JSON.parse(saved);
        setSelectedAgents(selections);
      } catch {
        setSelectedAgents({ openai: true });
      }
    } else {
      setSelectedAgents({ openai: true });
    }
  };

  // Save agent selections for this project
  const saveSelections = (selections) => {
    localStorage.setItem(`chatAgentSelections_${profileId}`, JSON.stringify(selections));
  };

  // Load available agents and OpenAI key when profile changes
  useEffect(() => {
    if (profileId) {
      loadAvailableAgents();
      loadOpenAIKey();
      loadSavedSelections();
      
      // Clear messages when switching projects to avoid confusion
      setMessages([]);
    }
  }, [profileId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Store previous context to detect significant changes
  const prevContextRef = useRef({ profileId, projectInnerTab, isInDetailView });
  
  // Handle context changes (tab switches, detail view changes)
  useEffect(() => {
    const prevContext = prevContextRef.current;
    const contextChanged = 
      prevContext.projectInnerTab !== projectInnerTab ||
      prevContext.isInDetailView !== isInDetailView;
    
    if (contextChanged && messages.length > 0) {
      // Add a system message about context change
      const contextMessage = {
        id: Date.now(),
        role: 'system',
        content: `Context switched to: ${currentPage}${currentTask ? ' - ' + currentTask.name : ''}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, contextMessage]);
    }
    
    // Update ref for next comparison
    prevContextRef.current = { profileId, projectInnerTab, isInDetailView };
  }, [projectInnerTab, isInDetailView, currentPage, currentTask, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOpenAIKey = async () => {
    try {
      const response = await fetch('/api/global-settings');
      if (response.ok) {
        const settings = await response.json();
        setOpenAIKey(settings.openAIKey || '');
      }
    } catch (err) {
      console.error('Error loading OpenAI key:', err);
    }
  };

  const loadAvailableAgents = async () => {
    if (!profileId) return;
    
    setAgentsLoading(true);
    try {
      // Load combined list of global and project agents
      const response = await fetch(`/api/agents/combined/${profileId}`);
      if (response.ok) {
        const agents = await response.json();
        console.log('Loaded agents for chat:', agents);
        
        // Transform agent data for display
        const formattedAgents = agents.map(agent => {
          // Debug log to see what we're getting
          console.log('Agent metadata:', agent.name, agent.metadata);
          
          return {
            id: agent.name.replace(/\.(md|yaml|yml)$/, ''), // Remove file extension for ID
            name: agent.metadata?.name || agent.name.replace(/\.(md|yaml|yml)$/, '').replace(/-/g, ' '),
            description: agent.metadata?.description || '',
            type: agent.type,
            color: agent.metadata?.color || null,
            tools: agent.metadata?.tools || []
          };
        });
        
        setAvailableAgents(formattedAgents);
      }
    } catch (err) {
      console.error('Error loading agents:', err);
      setAvailableAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  };

  // Memoize the context to avoid unnecessary recomputation
  const getPageContext = React.useCallback(() => {
    const context = {
      currentPage,
      timestamp: new Date().toISOString()
    };

    if (currentTask) {
      context.currentTask = {
        id: currentTask.id,
        name: currentTask.name,
        description: currentTask.description,
        status: currentTask.status,
        assignedAgent: currentTask.assignedAgent || null,
        dependencies: currentTask.dependencies,
        relatedFiles: currentTask.relatedFiles,
        implementationGuide: currentTask.implementationGuide,
        verificationCriteria: currentTask.verificationCriteria,
        notes: currentTask.notes
      };
    }

    if (tasks && tasks.length > 0) {
      context.tasksSummary = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length
      };
      
      // Include full task list for list page
      if (currentPage === 'task-list' || currentPage === 'history') {
        context.tasks = tasks.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          status: t.status,
          assignedAgent: t.assignedAgent || null,
          dependencies: t.dependencies || [],
          implementationGuide: t.implementationGuide || '',
          verificationCriteria: t.verificationCriteria || '',
          notes: t.notes || '',
          relatedFiles: t.relatedFiles || []
        }));
        
        // Add specific completed tasks details for better summaries
        context.completedTasks = tasks
          .filter(t => t.status === 'completed')
          .map(t => ({
            name: t.name,
            description: t.description || '',
            summary: t.summary || ''
          }));
          
        context.inProgressTasks = tasks
          .filter(t => t.status === 'in_progress')
          .map(t => ({
            name: t.name,
            description: t.description || ''
          }));
          
        context.pendingTasks = tasks
          .filter(t => t.status === 'pending')
          .map(t => ({
            name: t.name,
            description: t.description || ''
          }));
          
        // Add agent assignment statistics
        const agentStats = {};
        tasks.forEach(task => {
          if (task.assignedAgent) {
            if (!agentStats[task.assignedAgent]) {
              agentStats[task.assignedAgent] = {
                total: 0,
                completed: 0,
                inProgress: 0,
                pending: 0,
                tasks: []
              };
            }
            agentStats[task.assignedAgent].total++;
            agentStats[task.assignedAgent][task.status === 'in_progress' ? 'inProgress' : task.status]++;
            agentStats[task.assignedAgent].tasks.push({
              name: task.name,
              status: task.status
            });
          }
        });
        
        context.agentAssignments = agentStats;
        
        // Count unassigned tasks
        const unassignedTasks = tasks.filter(t => !t.assignedAgent);
        context.unassignedTasks = {
          total: unassignedTasks.length,
          completed: unassignedTasks.filter(t => t.status === 'completed').length,
          inProgress: unassignedTasks.filter(t => t.status === 'in_progress').length,
          pending: unassignedTasks.filter(t => t.status === 'pending').length,
          tasks: unassignedTasks.map(t => ({ name: t.name, status: t.status }))
        };
      }
    }
    
    // Always include available agents information
    if (availableAgents && availableAgents.length > 0) {
      context.availableAgents = availableAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description || 'No description available',
        type: agent.type,
        color: agent.color,
        tools: agent.tools || []
      }));
    }

    return context;
  }, [currentPage, currentTask, tasks, availableAgents]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const selectedAgentsList = Object.entries(selectedAgents)
        .filter(([_, selected]) => selected)
        .map(([agentId, _]) => agentId);

      if (selectedAgentsList.length === 0) {
        throw new Error('Please select at least one agent to chat with');
      }

      const contextData = getPageContext();
      console.log('Sending context to AI:', contextData);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          agents: selectedAgentsList,
          context: contextData,
          profileId,
          openAIKey,
          availableAgents: availableAgents
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from agents');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        agents: data.respondingAgents || selectedAgentsList,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle task modifications if suggested
      if (data.taskModification && currentTask) {
        const shouldModify = window.confirm(
          'The AI suggests modifying the current task. Would you like to apply these changes?'
        );
        
        if (shouldModify && onTaskUpdate) {
          await onTaskUpdate(currentTask.id, data.taskModification);
          showToast('Task updated successfully', 'success');
        }
      }

    } catch (err) {
      console.error('Error sending message:', err);
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev => {
      const newSelections = {
        ...prev,
        [agentId]: !prev[agentId]
      };
      saveSelections(newSelections);
      return newSelections;
    });
  };

  const toggleAgentsExpanded = () => {
    const newState = !agentsExpanded;
    setAgentsExpanded(newState);
    localStorage.setItem('chatAgentsExpanded', JSON.stringify(newState));
  };

  if (!isOpen) {
    return (
      <button
        className="chat-agent-fab"
        onClick={() => setIsOpen(true)}
        title="Open AI Chat Assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div className={`chat-agent-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-agent-header">
        <div className="chat-agent-title">
          <span className="chat-icon">🤖</span>
          <span>AI Chat Assistant</span>
        </div>
        <div className="chat-agent-controls">
          <button
            className="chat-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            className="chat-control-btn"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-agent-agents">
            <div className="agents-selection-header">
              <div className="agents-header-row" onClick={toggleAgentsExpanded}>
                <span className="agents-label">
                  <span className="expand-chevron">{agentsExpanded ? '▼' : '▶'}</span>
                  Chat with:
                  {agentsLoading && <span className="agents-loading"> (Loading agents...)</span>}
                </span>
                <span className="agents-count">
                  {Object.values(selectedAgents).filter(v => v).length} selected
                </span>
              </div>
              {agentsExpanded && (
                <div className="agents-checkboxes">
                <label className="agent-checkbox" title="OpenAI GPT-4 - General purpose AI assistant">
                  <input
                    type="checkbox"
                    checked={selectedAgents.openai || false}
                    onChange={() => toggleAgent('openai')}
                  />
                  <span className="agent-name openai-agent">
                    🤖 OpenAI GPT-4
                  </span>
                </label>
                {availableAgents.map(agent => (
                  <label 
                    key={agent.id} 
                    className="agent-checkbox" 
                    title={`${agent.name}\n${agent.description || 'No description available'}\nType: ${agent.type === 'project' ? 'Project' : 'Global'} agent${agent.tools && agent.tools.length > 0 ? '\nTools: ' + agent.tools.join(', ') : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAgents[agent.id] || false}
                      onChange={() => toggleAgent(agent.id)}
                    />
                    <span 
                      className={`agent-name ${agent.type}`}
                      style={agent.color ? { 
                        backgroundColor: `${agent.color}33`,  // 20% opacity
                        color: agent.color,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${agent.color}66`,  // 40% opacity
                        fontWeight: '500'
                      } : {}}
                    >
                      🤖 {agent.name || agent.id}
                    </span>
                  </label>
                ))}
                {!agentsLoading && availableAgents.length === 0 && (
                  <span className="no-agents-message">No project agents found</span>
                )}
              </div>
              )}
            </div>
          </div>

          <div className="chat-agent-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>Welcome! I can help you with:</p>
                <ul>
                  {currentPage === 'task-list' && (
                    <li>• Summarizing all tasks and their statuses</li>
                  )}
                  {currentPage === 'task-detail' && currentTask && (
                    <li>• Analyzing the current task: "{currentTask.name}"</li>
                  )}
                  {currentPage === 'history' && (
                    <li>• Reviewing historical task data</li>
                  )}
                  <li>• Suggesting task assignments to agents</li>
                  <li>• Analyzing agent workloads and assignments</li>
                  <li>• Answering questions about your project</li>
                  {currentTask && <li>• Modifying current task details</li>}
                </ul>
                <p className="chat-context-info">
                  <strong>Project:</strong> {profileName || profileId}<br/>
                  <strong>Context:</strong> {currentPage}
                  {currentTask && ` - Task: ${currentTask.name}`}<br/>
                  <strong>Available Agents:</strong> {availableAgents.length + 1} (OpenAI + {availableAgents.length} project agents)
                </p>
              </div>
            )}
            
            {messages.map(message => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                {message.role === 'system' ? (
                  <div className="system-message">
                    <span className="system-icon">ℹ️</span>
                    <span className="system-text">{message.content}</span>
                  </div>
                ) : (
                  <>
                    <div className="message-header">
                      <span className="message-role">
                        {message.role === 'user' ? '👤 You' : '🤖 AI'}
                      </span>
                      {message.agents && message.agents.length > 0 && (
                        <span className="message-agents">
                          ({message.agents.join(', ')})
                        </span>
                      )}
                    </div>
                    <div className="message-content">
                      {message.content}
                    </div>
                    <div className="message-timestamp">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant loading">
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-agent-input">
            <textarea
              ref={chatInputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              disabled={isLoading}
              rows="2"
            />
            <button
              className="chat-send-btn"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatAgent;