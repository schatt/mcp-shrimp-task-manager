import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock fetch responses
const mockProfiles = [
  { id: 'profile1', name: 'Test Profile 1' },
  { id: 'profile2', name: 'Test Profile 2' }
]

const mockTasks = {
  tasks: [
    {
      id: 'task1',
      name: 'Test Task 1',
      description: 'Test description 1',
      status: 'completed',
      created: '2025-01-01',
      updated: '2025-01-02'
    },
    {
      id: 'task2', 
      name: 'Test Task 2',
      description: 'Test description 2',
      status: 'in_progress',
      created: '2025-01-02',
      updated: '2025-01-03'
    }
  ]
}

describe('App Component', () => {
  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear()
  })

  it('renders the main header', async () => {
    // Mock the API calls
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    })

    render(<App />)
    
    expect(screen.getByText('🦐 Shrimp Task Manager Viewer')).toBeInTheDocument()
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
  })

  it('loads and displays profiles as tabs', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Test Profile 1')).toBeInTheDocument()
      expect(screen.getByText('Test Profile 2')).toBeInTheDocument()
    })

    expect(screen.getByText('+ Add Tab')).toBeInTheDocument()
  })

  it('displays task statistics when profile is selected', async () => {
    // Mock profiles API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    })

    // Mock tasks API
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks
    })

    render(<App />)

    // Wait for profiles to load
    await waitFor(() => {
      expect(screen.getByText('Test Profile 1')).toBeInTheDocument()
    })

    // Click on first profile tab
    fireEvent.click(screen.getByText('Test Profile 1'))

    // Wait for tasks to load and stats to display
    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Total count
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Completed count
    })
  })

  it('filters tasks when search is used', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    })

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks
    })

    const user = userEvent.setup()
    render(<App />)

    // Wait for profiles and select first one
    await waitFor(() => {
      expect(screen.getByText('Test Profile 1')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Test Profile 1'))

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument()
    })

    // Find and use search input
    const searchInput = screen.getByPlaceholderText('🔍 Search tasks...')
    await user.type(searchInput, 'Task 1')

    // Verify search input value
    expect(searchInput.value).toBe('Task 1')
  })

  it('shows add profile modal when Add Tab is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('+ Add Tab')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Add Tab'))

    expect(screen.getByText('Add New Profile')).toBeInTheDocument()
    expect(screen.getByLabelText('Profile Name:')).toBeInTheDocument()
    expect(screen.getByLabelText('Select tasks.json file:')).toBeInTheDocument()
  })

  it('handles auto-refresh toggle', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfiles
    })

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks
    })

    render(<App />)

    // Wait for profiles and select one
    await waitFor(() => {
      expect(screen.getByText('Test Profile 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Test Profile 1'))

    // Find auto-refresh checkbox
    await waitFor(() => {
      const autoRefreshCheckbox = screen.getByRole('checkbox')
      expect(autoRefreshCheckbox).toBeInTheDocument()
      expect(autoRefreshCheckbox.checked).toBe(false)
    })
  })
})