import React, { useState } from 'react';
import { LOGIN_PASSWORD } from '../config';

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === LOGIN_PASSWORD) {
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  console.log(LOGIN_PASSWORD)
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          {error && (
            <div className="text-red-600">
              {error}
            </div>
          )}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-red-700 rounded hover:bg-red-600"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;