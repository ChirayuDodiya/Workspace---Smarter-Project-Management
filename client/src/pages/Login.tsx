import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import InputField from '../components/Auth/InputField';

import { validateEmail, validatePassword } from '../utils/validation';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Success message from registration redirect
  const registrationSuccess = location.state?.successMessage || '';

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Error states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  // Validate single field
  const validateEmailField = (value: string) => {
    const err = validateEmail(value);
    setEmailError(err);
    return !err;
  };

  const validatePasswordField = (value: string) => {
    const err = validatePassword(value);
    setPasswordError(err);
    return !err;
  };

  // Change Handlers
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) {
      validateEmailField(val);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (passwordError) {
      validatePasswordField(val);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const isEmailValid = validateEmailField(email);
    const isPasswordValid = validatePasswordField(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosError.response?.data?.message || 'Invalid email or password. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen w-full md:overflow-hidden bg-[#121212]">
      {/* Left side column: Rich gradient background with branding & highlights */}
      <div className="hidden md:flex md:w-[42%] bg-linear-to-br from-[#03290f] via-[#043314] to-[#011408] border-r border-zinc-800/30 h-full flex-col justify-between p-12 text-white">
        {/* Branding header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#098032] to-[#043314] flex items-center justify-center border border-[#098032]/30 shadow-md">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight bg-linear-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
            Workspace
          </span>
        </div>

        {/* Highlight points */}
        <div className="my-auto max-w-sm space-y-8 text-left">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Manage your projects and tasks in one unified space.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Track progress, collaborate seamlessly with team members, and meet deadlines without the friction.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Interactive Kanban Boards</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Visualize your team's workflow and manage task states in real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Team Collaboration</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Invite members, assign roles, and work together on tasks.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 shrink-0 w-5 h-5 rounded-full bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Project Dashboards</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Monitor progress with real-time statistics and summaries.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer brand */}
        <p className="text-zinc-500 text-xs font-medium">
          &copy; {new Date().getFullYear()} Workspace. All rights reserved.
        </p>
      </div>

      {/* Right side column: Login form area */}
      <div className="w-full md:w-[58%] flex flex-col justify-center items-center min-h-screen md:h-full px-6 sm:px-16 py-10 text-white overflow-y-auto">
        <div className="w-full max-w-105 bg-[#181818] border border-zinc-800/80 rounded-2xl shadow-xl p-8 sm:p-10 flex flex-col">
          <form onSubmit={handleSubmit} className="w-full flex flex-col">
            {/* Header info */}
            <div className="text-left w-full mb-6">
              <h1 className="text-white text-3xl font-bold tracking-tight mb-1.5">
                Sign in
              </h1>
              <p className="text-zinc-400 text-sm">
                Welcome back! Please enter your details.
              </p>
            </div>

            {/* Registration Success Banner */}
            {registrationSuccess && !serverError && (
              <div className="w-full flex items-center gap-2.5 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 px-3.5 py-2.5 rounded-xl mb-5 text-sm font-medium">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{registrationSuccess}</span>
              </div>
            )}

            {/* General Server Error Banner */}
            {serverError && (
              <div className="w-full flex items-center gap-2.5 bg-red-950/30 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-xl mb-5 text-sm font-medium">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{serverError}</span>
              </div>
            )}

            <InputField
              label="Email"
              type="email"
              name="email"
              value={email}
              placeholder="Enter your email"
              error={emailError}
              onChange={handleEmailChange}
              onBlur={() => validateEmailField(email)}
              autoComplete="email"
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={password}
              placeholder="Enter your password"
              error={passwordError}
              onChange={handlePasswordChange}
              onBlur={() => validatePasswordField(password)}
              autoComplete="current-password"
            />

            {/* Form Action Button */}
            <button
              type="submit"
              className="mt-6 w-full py-2.5 bg-[#045c22] hover:bg-[#074c1f] rounded-xl text-white text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-md hover:shadow-[0_4px_12px_rgba(4,92,34,0.25)] focus:outline-none focus:ring-2 focus:ring-[#098032] focus:ring-offset-2 focus:ring-offset-[#181818]"
            >
              Sign in
            </button>

            {/* Redirection Link */}
            <p className="mt-6 text-zinc-400 text-sm text-center">
              Don't have an account? &nbsp;
              <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-150 ml-1">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
