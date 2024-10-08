// src/components/UserProfile.jsx

import React from 'react';

const UserProfile = ({ user }) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-gray-700">Logged in as: {user.email}</span>
     
    </div>
  );
};

export default UserProfile;