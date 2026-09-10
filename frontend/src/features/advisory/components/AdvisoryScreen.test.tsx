import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdvisoryScreen from './AdvisoryScreen';
import { useFarmStore } from '@/store/farmStore';
import { useFarm } from '@/features/farms/api/farmsApi';
import { useFields } from '@/features/fields/api/fieldsApi';
import { useGenerateAdvisory } from '../api/advisoryApi';

// Mock dependencies
vi.mock('@/store/farmStore', () => ({
  useFarmStore: vi.fn(),
}));

vi.mock('@/features/farms/api/farmsApi', () => ({
  useFarm: vi.fn(),
}));

vi.mock('@/features/fields/api/fieldsApi', () => ({
  useFields: vi.fn(),
}));

vi.mock('../api/advisoryApi', () => ({
  useGenerateAdvisory: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
  }),
}));

// Mock scrollIntoView to prevent errors in JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('AdvisoryScreen', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (useFarmStore as any).mockReturnValue({ activeFarmId: 'farm-123' });
    (useFarm as any).mockReturnValue({ data: { id: 'farm-123', name: 'Test Farm' } });
    (useFields as any).mockReturnValue({
      data: [{ id: 'field-1', name: 'North Field' }],
    });
    (useGenerateAdvisory as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <AdvisoryScreen />
      </MemoryRouter>
    );

  it('renders missing farm state when activeFarmId is null', () => {
    (useFarmStore as any).mockReturnValue({ activeFarmId: null });
    renderComponent();

    expect(screen.getByText('Please select a farm before using AI Advisory.')).toBeInTheDocument();
  });

  it('renders empty state initially', () => {
    renderComponent();

    expect(screen.getByText('Ask AI Advisory about your farm')).toBeInTheDocument();
    expect(screen.getByText('Test Farm')).toBeInTheDocument(); // Farm name is displayed
  });

  it('rejects empty input', () => {
    renderComponent();

    const input = screen.getByLabelText('Chat input');
    const sendBtn = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: '   ' } });
    expect(sendBtn).toBeDisabled();

    fireEvent.click(sendBtn);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('sends message and appends assistant response', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      answer: 'This is the AI response',
      sources: [],
      weatherUsed: true,
    });

    renderComponent();

    const input = screen.getByLabelText('Chat input');
    const sendBtn = screen.getByLabelText('Send message');

    // Type a question
    fireEvent.change(input, { target: { value: 'How to water?' } });
    expect(sendBtn).not.toBeDisabled();

    // Send it
    fireEvent.click(sendBtn);

    // User message should appear immediately
    expect(screen.getByText('How to water?')).toBeInTheDocument();
    
    // API is called
    expect(mockMutateAsync).toHaveBeenCalledWith({
      question: 'How to water?',
      fieldId: undefined, // "Entire farm" is selected by default ("" value in select)
    });

    // Assistant response appears eventually
    await waitFor(() => {
      expect(screen.getByText('This is the AI response')).toBeInTheDocument();
    });
  });

  it('populates input when example question is clicked without submitting', async () => {
    renderComponent();

    // The empty state example question should be present
    const exampleBtn = screen.getByText('Why are my leaves turning yellow?');
    
    // Click the example question
    fireEvent.click(exampleBtn);

    // The input should now contain the question
    const input = screen.getByLabelText('Chat input');
    expect(input).toHaveValue('Why are my leaves turning yellow?');

    // The API mutation should NOT have been called
    expect(mockMutateAsync).not.toHaveBeenCalled();

    // The chat history should not contain the message yet as a sent message (only empty state is visible)
    // We check that the empty state heading is still there, which implies messages array is empty
    expect(screen.getByText('Ask AI Advisory about your farm')).toBeInTheDocument();
  });

  it('sends message with selected field', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      answer: 'Field specific advice',
    });

    renderComponent();

    const select = screen.getByLabelText('Select Field');
    fireEvent.change(select, { target: { value: 'field-1' } });

    const input = screen.getByLabelText('Chat input');
    const sendBtn = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Check field' } });
    fireEvent.click(sendBtn);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      question: 'Check field',
      fieldId: 'field-1',
    });

    await waitFor(() => {
      expect(screen.getByText('Field specific advice')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('API Failed'));

    renderComponent();

    const input = screen.getByLabelText('Chat input');
    const sendBtn = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Break it' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Unable to generate an advisory right now. Please try again.')).toBeInTheDocument();
    });

    // The user's message is preserved
    expect(screen.getByText('Break it')).toBeInTheDocument();
  });

  it('maps HTTP 401 error code to unauthorized message', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      code: 'UNAUTHORIZED',
      response: { status: 401 }
    });

    renderComponent();

    const input = screen.getByLabelText('Chat input');
    const sendBtn = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Auth issue' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    });
  });

  it('renders sources and weather indicator', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      answer: 'This is the AI response with sources',
      sources: [
        { title: 'Test Document', source: 'Agricultural Dept', publishedDate: '2025' }
      ],
      weatherUsed: true,
    });

    renderComponent();

    const input = screen.getByLabelText('Chat input');
    const sendBtn = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'How to water?' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('This is the AI response with sources')).toBeInTheDocument();
    });

    // Check sources
    expect(screen.getByText('Knowledge sources used for this advisory')).toBeInTheDocument();
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('Source: Agricultural Dept')).toBeInTheDocument();
    expect(screen.getByText('Published: 2025')).toBeInTheDocument();

    // Check weather
    expect(screen.getByText('Weather context was considered for this advisory.')).toBeInTheDocument();
  });

  it('clears conversation and resets selected field when active farm switches', async () => {
    let mockStoreFarmId = 'farm-A';
    (useFarmStore as any).mockImplementation(() => ({ activeFarmId: mockStoreFarmId }));
    
    mockMutateAsync.mockResolvedValueOnce({
      answer: 'Advice for Farm A',
    });

    const { rerender } = render(
      <MemoryRouter>
        <AdvisoryScreen />
      </MemoryRouter>
    );

    // Initial state setup for Farm A
    const input = screen.getByLabelText('Chat input');
    const sendBtn = screen.getByLabelText('Send message');
    const select = screen.getByLabelText('Select Field');
    
    // Select a field and send a message
    fireEvent.change(select, { target: { value: 'field-1' } });
    fireEvent.change(input, { target: { value: 'Question A' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Advice for Farm A')).toBeInTheDocument();
    });

    // Simulate farm switch to Farm B
    mockStoreFarmId = 'farm-B';
    (useFarm as any).mockReturnValue({ data: { id: 'farm-B', name: 'Farm B' } });
    (useFields as any).mockReturnValue({ data: [{ id: 'field-2', name: 'South Field' }] });
    
    rerender(
      <MemoryRouter>
        <AdvisoryScreen />
      </MemoryRouter>
    );

    // Verify UI reset
    expect(screen.queryByText('Advice for Farm A')).not.toBeInTheDocument();
    expect(screen.queryByText('Question A')).not.toBeInTheDocument();
    
    // Empty state should be visible again
    expect(screen.getByText('Ask AI Advisory about your farm')).toBeInTheDocument();

    // The field selection should reset to empty ("Entire farm")
    const updatedSelect = screen.getByLabelText('Select Field');
    expect(updatedSelect).toHaveValue('');
    expect(screen.getByText('Entire farm')).toBeInTheDocument();
    
    // New fields should be loaded (South Field)
    expect(screen.getByText('South Field')).toBeInTheDocument();
    expect(screen.queryByText('North Field')).not.toBeInTheDocument();
  });
});
