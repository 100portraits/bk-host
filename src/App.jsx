// App.jsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import WalkInForm from './components/WalkInForm';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import AwaitingApproval from './components/AwaitingApproval';
import Calendar from './components/Calendar'; // Import the Calendar component
import { useAuth } from './useAuth';
import Nav from './components/Nav';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';

const AppContent = () => {
  const { user, userStatus, loading, userStatusLoading } = useAuth();
  const { isDarkMode } = useTheme();

  if (loading || userStatusLoading) {
    return <div>Loading...</div>;
  }

  const showNav = user && userStatus === 'approved';

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {showNav && <Nav />}
      <div className={`flex-grow ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
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
          
          {/* Calendar Route */}
          <Route
            path="/calendar"
            element={
              user && userStatus === 'approved' ? (
                <Calendar />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;
