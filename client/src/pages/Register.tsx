import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import InputField from '../components/InputField';

import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';

export function Register() {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [serverError, setServerError] = useState('');

  // Validation functions
  const validateNameField = (value: string) => {
    const err = validateName(value);
    setNameError(err);
    return !err;
  };

  const validateEmailField = (value: string) => {
    const err = validateEmail(value);
    setEmailError(err);
    return !err;
  };

  const validatePasswordField = (value: string) => {
    const err = validatePassword(value);
    setPasswordError(err);

    // Revalidate confirm password if it already has a value
    if (confirmPassword) {
      const confirmErr = validateConfirmPassword(confirmPassword, value);
      setConfirmPasswordError(confirmErr);
    }

    return !err;
  };

  const validateConfirmPasswordField = (value: string) => {
    const err = validateConfirmPassword(value, password);
    setConfirmPasswordError(err);
    return !err;
  };

  // Change Handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    validateNameField(val);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    validateEmailField(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    validatePasswordField(val);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    validateConfirmPasswordField(val);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const isNameValid = validateNameField(name);
    const isEmailValid = validateEmailField(email);
    const isPasswordValid = validatePasswordField(password);
    const isConfirmValid = validateConfirmPasswordField(confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      if (response.data && response.data.success) {
        // Redirect to Login page on success
        navigate('/login', { state: { successMessage: 'Registration successful! Please login.' } });
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#121212]">
      {/* Left side column: solid forest green */}
      <div className="w-[45%] bg-[#043314] h-full"></div>

      {/* Right side column: Register form area */}
      <div className="w-[55%] flex flex-col justify-center items-center h-full px-16 text-white overflow-y-auto py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-105 flex flex-col items-center">
          <h1 className="text-white text-6xl font-medium mb-10 tracking-wide">Register</h1>

          {/* General Server Error Banner */}
          {serverError && (
            <div className="w-full bg-red-950/40 border border-red-500/80 text-red-200 px-4 py-3 rounded-xl mb-6 text-center text-sm font-medium">
              {serverError}
            </div>
          )}

          <InputField
            label="Name:"
            type="text"
            name="name"
            value={name}
            placeholder="Enter Your Name"
            error={nameError}
            required
            onChange={handleNameChange}
            onBlur={() => validateNameField(name)}
            autoComplete="name"
          />

          <InputField
            label="Email:"
            type="email"
            name="email"
            value={email}
            placeholder="Enter Your Email"
            error={emailError}
            required
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
            required
            onChange={handlePasswordChange}
            onBlur={() => validatePasswordField(password)}
            autoComplete="new-password"
          />

          <InputField
            label="Confirm Password:"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            placeholder="Confirm Your Password"
            error={confirmPasswordError}
            required
            onChange={handleConfirmPasswordChange}
            onBlur={() => validateConfirmPasswordField(confirmPassword)}
            autoComplete="new-password"
          />

          {/* Form Action Button */}
          <button
            type="submit"
            className="mt-6 px-12 py-2.5 bg-[#043314] border border-white hover:bg-[#074c1f] rounded-xl text-white text-xl font-medium tracking-wide transition-colors duration-200 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#098032]"
          >
            Register
          </button>

          {/* Redirection Link */}
          <p className="mt-6 text-gray-400 text-base">
            Already have an account ?{' '}
            <Link to="/login" className="text-white hover:underline ml-1 font-medium">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
