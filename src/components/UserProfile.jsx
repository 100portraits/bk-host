// src/components/UserProfile.jsx

import React from 'react';

const UserProfile = ({ user }) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-gray-700">{user.displayName || user.email}</span>
      <img
        src={user.photoURL || 'https://via.placeholder.com/40'}
        alt="User Avatar"
        className="w-10 h-10 rounded-full"
      />
    </div>
  );
};

export default UserProfile;