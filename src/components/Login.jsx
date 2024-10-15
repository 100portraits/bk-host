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
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-primary-700">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h2>
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
              className="input"
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
              className="input"
            />
          </div>
          {error && (
            <div className="text-secondary-600">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <div className="text-center">
          <button
            onClick={handleGoogleLogin}
            className="btn btn-secondary w-full"
          >
            Login with Google
          </button>
        </div>
        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary-600 hover:underline"
          >
            {isSignUp ? 'Already have an account? Login' : 'Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;