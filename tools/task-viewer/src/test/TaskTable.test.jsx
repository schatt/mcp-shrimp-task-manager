import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskTable from '../components/TaskTable'

const mockTasks = [
  {
    id: 'task1',
    name: 'Complete authentication system',
    description: 'Implement OAuth2 authentication with JWT tokens',
    status: 'completed',
    created: '2025-01-01T10:00:00Z',
    updated: '2025-01-02T15:30:00Z'
  },
  {
    id: 'task2',
    name: 'Setup database schema', 
    description: 'Create PostgreSQL tables and relationships',
    status: 'in_progress',
    created: '2025-01-02T09:00:00Z',
    updated: '2025-01-03T11:45:00Z'
  },
  {
    id: 'task3',
    name: 'Write unit tests',
    description: 'Add comprehensive test coverage for API endpoints',
    status: 'pending',
    created: '2025-01-03T14:00:00Z',
    updated: '2025-01-03T14:00:00Z'
  }
]

describe('TaskTable Component', () => {
  it('renders task data correctly', () => {
    const mockOnFilterChange = vi.fn()
    
    render(
      <TaskTable 
        data={mockTasks}
        globalFilter=""
        onGlobalFilterChange={mockOnFilterChange}
      />
    )

    // Check if task names are rendered
    expect(screen.getByText('Complete authentication system')).toBeInTheDocument()
    expect(screen.getByText('Setup database schema')).toBeInTheDocument()
    expect(screen.getByText('Write unit tests')).toBeInTheDocument()

    // Check if status badges are rendered
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()
  })

  it('displays task numbers correctly', () => {
    const mockOnFilterChange = vi.fn()
    
    render(
      <TaskTable 
        data={mockTasks}
        globalFilter=""
        onGlobalFilterChange={mockOnFilterChange}
      />
    )

    // Check if task numbers are displayed
    expect(screen.getByText('TASK 1')).toBeInTheDocument()
    expect(screen.getByText('TASK 2')).toBeInTheDocument()
    expect(screen.getByText('TASK 3')).toBeInTheDocument()
  })

  it('shows task descriptions', () => {
    const mockOnFilterChange = vi.fn()
    
    render(
      <TaskTable 
        data={mockTasks}
        globalFilter=""
        onGlobalFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByText('Implement OAuth2 authentication with JWT tokens')).toBeInTheDocument()
    expect(screen.getByText('Create PostgreSQL tables and relationships')).toBeInTheDocument()
    expect(screen.getByText('Add comprehensive test coverage for API endpoints')).toBeInTheDocument()
  })

  it('displays formatted dates', () => {
    const mockOnFilterChange = vi.fn()
    
    render(
      <TaskTable 
        data={mockTasks}
        globalFilter=""
        onGlobalFilterChange={mockOnFilterChange}
      />
    )

    // Check if dates are properly formatted (will depend on locale)
    expect(screen.getByText('2025-01-01')).toBeInTheDocument()
    expect(screen.getByText('2025-01-02')).toBeInTheDocument()
    expect(screen.getByText('2025-01-03')).toBeInTheDocument()
  })

  it('handles empty data gracefully', () => {
    const mockOnFilterChange = vi.fn()
    
    render(
      <TaskTable 
        data={[]}
        globalFilter=""
        onGlobalFilterChange={mockOnFilterChange}
      />
    )

    // Should render table headers even with no data
    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText('Task Name')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders pagination controls', () => {
    const mockOnFilterChange = vi.fn()
    
    render(
      <TaskTable 
        data={mockTasks}
        globalFilter=""
        onGlobalFilterChange={mockOnFilterChange}
      />
    )

    // Check for pagination info
    expect(screen.getByText(/Showing \d+ to \d+ of \d+ tasks/)).toBeInTheDocument()
    
    // Check for pagination controls  
    expect(screen.getByText('<<')).toBeInTheDocument()
    expect(screen.getByText('<')).toBeInTheDocument()
    expect(screen.getByText('>')).toBeInTheDocument()
    expect(screen.getByText('>>')).toBeInTheDocument()
  })

  it('applies correct CSS classes for status badges', () => {
    const mockOnFilterChange = vi.fn()
    
    render(
      <TaskTable 
        data={mockTasks}
        globalFilter=""
        onGlobalFilterChange={mockOnFilterChange}
      />
    )

    // Check if status badges have correct CSS classes
    const completedBadge = screen.getByText('COMPLETED')
    const inProgressBadge = screen.getByText('IN PROGRESS') 
    const pendingBadge = screen.getByText('PENDING')

    expect(completedBadge).toHaveClass('status-badge', 'status-completed')
    expect(inProgressBadge).toHaveClass('status-badge', 'status-in_progress')
    expect(pendingBadge).toHaveClass('status-badge', 'status-pending')
  })
})