// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import WalkInForm from './components/WalkInForm';
import Login from './components/Login';
import { app } from './firebase';

const App = () => {
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogin = () => {
    setUser(auth.currentUser);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="p-4 text-black">
        <nav className="mb-4 flex justify-start">
          <Link
            to="/"
            className="mr-4 p-2 text-white bg-red-700 rounded hover:bg-red-600"
          >
            Dashboard
          </Link>
          <Link
            to="/walk-in"
            className="p-2 text-white bg-red-700 rounded hover:bg-red-600"
          >
            Record Walk-in
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/walk-in" element={<WalkInForm />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;