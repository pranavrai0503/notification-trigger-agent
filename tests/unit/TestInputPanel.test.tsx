import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestInputPanel from '../../src/frontend/components/TestInputPanel';

describe('TestInputPanel', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders the panel title', () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    expect(screen.getByText('Test Configuration')).toBeInTheDocument();
  });

  it('renders the cURL textarea', () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/cURL Command/i)).toBeInTheDocument();
  });

  it('renders username and password fields', () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders app state radio buttons', () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    expect(screen.getByRole('radio', { name: /foreground/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /background/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /killed/i })).toBeInTheDocument();
  });

  it('renders platform checkboxes', () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    expect(screen.getByRole('checkbox', { name: /android/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /ios/i })).toBeInTheDocument();
  });

  it('renders the Run Test submit button', () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    expect(screen.getByRole('button', { name: /run test/i })).toBeInTheDocument();
  });

  it('shows "Running Test…" and disables button when loading', () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Running Test…');
    expect(button).toBeDisabled();
  });

  it('updates cURL textarea value on change', async () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    const textarea = screen.getByLabelText(/cURL Command/i);
    await userEvent.type(textarea, "curl 'https://api.example.com'");
    expect(textarea).toHaveValue("curl 'https://api.example.com'");
  });

  it('shows extracted parameters preview when URL is typed', async () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    const textarea = screen.getByLabelText(/cURL Command/i);
    fireEvent.change(textarea, {
      target: { value: "curl -X POST 'https://api.example.com/notify'" },
    });
    expect(screen.getByText('Extracted Parameters')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/notify')).toBeInTheDocument();
  });

  it('shows validation error when submitting with empty curlCommand', async () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    const button = screen.getByRole('button', { name: /run test/i });
    await userEvent.click(button);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('changes selected app state on radio click', async () => {
    render(<TestInputPanel onSubmit={mockOnSubmit} />);
    const backgroundRadio = screen.getByRole('radio', { name: /background/i });
    await userEvent.click(backgroundRadio);
    expect(backgroundRadio).toBeChecked();
  });
});
