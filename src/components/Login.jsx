// Login.jsx

import React, { useState } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { app, db } from '../firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      let user;
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        await updateProfile(user, { displayName: email.split('@')[0] });
        
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          status: "awaiting approval"
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      }
      // No need to manually refresh user status; useAuth handles it
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError(''); // Clear previous errors
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          status: "awaiting approval"
        });
      }
      // No need to manually refresh user status; useAuth handles it
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
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
              {isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            onClick={handleGoogleLogin}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-500"
          >
            Login with Google
          </button>
        </div>
        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            {isSignUp ? 'Already have an account? Login' : 'Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
