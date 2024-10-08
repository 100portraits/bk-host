// App.jsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import WalkInForm from './components/WalkInForm';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import AwaitingApproval from './components/AwaitingApproval';
import { useAuth } from './useAuth';
import Nav from './components/Nav';

const App = () => {
  const { user, userStatus, loading, userStatusLoading } = useAuth();

  if (loading || userStatusLoading) {
    return <div>Loading...</div>;
  }

  const showNav = user && userStatus === 'approved';

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {showNav && <Nav />}
        <div className="flex-grow">
          <Routes>
            {/* Public Route */}
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />

            {/* Awaiting Approval Route */}
            <Route
              path="/awaiting-approval"
              element={
                user && userStatus === 'awaiting approval' ? (
                  <AwaitingApproval />
                ) : user ? (
                  // If user is logged in but status is not 'awaiting approval', redirect accordingly
                  userStatus === 'approved' ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Protected Dashboard Route */}
            <Route
              path="/"
              element={
                user ? (
                  userStatus === 'approved' ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/awaiting-approval" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Other Routes */}
            <Route path="/walk-in" element={<WalkInForm />} />
            <Route path="/profile" element={<UserProfile user={user} />} />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
