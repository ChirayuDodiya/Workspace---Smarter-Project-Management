import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../pages/Login';
import { MemoryRouter } from 'react-router-dom';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
let mockLocationState: Record<string, string> | null = null;

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    loading: false,
    logout: vi.fn(),
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: mockLocationState,
    }),
  };
});

describe('Login Component Validation & Submission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
  });

  it('renders all form input fields and login button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Email:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('displays validation errors on input blur with invalid fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email:/i);
    const passwordInput = screen.getByLabelText(/Password:/i);

    // Trigger blur with empty inputs to verify "required" validation
    fireEvent.blur(emailInput);
    expect(screen.getByText('Email is required')).toBeInTheDocument();

    fireEvent.blur(passwordInput);
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    // Enter invalid format values and blur
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();

    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('does not submit the form and triggers error messages if inputs are empty', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(submitBtn);

    // Verify errors are displayed
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    // Verify useAuth login is not called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login function and navigates to homepage on valid form submission', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email:/i);
    const passwordInput = screen.getByLabelText(/Password:/i);
    const submitBtn = screen.getByRole('button', { name: /Login/i });

    // Fill in valid data (password matches passwordRegex in validation.ts: uppercase, lowercase, number, 8+ chars)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123@' } });

    fireEvent.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123@');
    // Wait for the async login execution to resolve navigate
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('renders server-side error banners on auth rejection', async () => {
    const errorMsg = 'Invalid email or password. Please try again.';
    mockLogin.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMsg,
        },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/Email:/i);
    const passwordInput = screen.getByLabelText(/Password:/i);
    const submitBtn = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123@' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays registration success message redirect banner if present in location state', () => {
    mockLocationState = { successMessage: 'Registration successful! Please login.' };

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText('Registration successful! Please login.')).toBeInTheDocument();
  });
});
