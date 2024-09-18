// app.jsx 

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import WalkInForm from './components/WalkInForm';

const App = () => {
  return (
    <Router>
      <div className="p-4  text-black">
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
