import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import InputField from '../components/InputField';

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212]">
      {/* Left side column: solid forest green */}
      <div className="w-[45%] bg-[#043314] h-full"></div>

      {/* Right side column: Login form area */}
      <div className="w-[55%] flex flex-col justify-center items-center h-full px-16 text-white">
        <form onSubmit={handleSubmit} className="w-full max-w-105 flex flex-col items-center">
          <h1 className="text-white text-6xl font-medium mb-12 tracking-wide">Login</h1>

          {/* Registration Success Banner */}
          {registrationSuccess && !serverError && (
            <div className="w-full bg-emerald-950/40 border border-emerald-500/80 text-emerald-200 px-4 py-3 rounded-xl mb-6 text-center text-sm font-medium">
              {registrationSuccess}
            </div>
          )}

          {/* General Server Error Banner */}
          {serverError && (
            <div className="w-full bg-red-950/40 border border-red-500/80 text-red-200 px-4 py-3 rounded-xl mb-6 text-center text-sm font-medium">
              {serverError}
            </div>
          )}

          <InputField
            label="Email:"
            type="email"
            name="email"
            value={email}
            placeholder="Enter Your Email"
            error={emailError}
            onChange={handleEmailChange}
            onBlur={() => validateEmailField(email)}
            autoComplete="email"
          />

          <InputField
            label="Password:"
            type="password"
            name="password"
            value={password}
            placeholder="Enter Your Password"
            error={passwordError}
            onChange={handlePasswordChange}
            onBlur={() => validatePasswordField(password)}
            autoComplete="current-password"
          />

          {/* Form Action Button */}
          <button
            type="submit"
            className="mt-6 px-12 py-2.5 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
          >
            Login
          </button>

          {/* Redirection Link */}
          <p className="mt-8 text-gray-400 text-base">
            Don't have an account ?{' '}
            <Link to="/register" className="text-white hover:underline ml-1 font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
