// src/components/UserProfile.jsx

import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const UserProfile = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // New state for success message

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setDisplayName(userDoc.data().displayName || '');
          setRole(userDoc.data().role || '');
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleUpdate = async () => {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        role
      });
      setSuccessMessage('Profile updated successfully!'); // Set success message
      setTimeout(() => {
        setSuccessMessage(''); // Clear message after 3 seconds
      }, 3000);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">User Profile</h2>
      
      {successMessage && ( // Display success message
        <div className="mb-4 p-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-md">
          {successMessage}
        </div>
      )}

      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display Name"
        className="input mb-4 dark:bg-gray-600 dark:text-white"
      />
      <select value={role} onChange={(e) => setRole(e.target.value)} className="input mb-4 dark:bg-gray-600 dark:text-white">
        <option value="">Select Role</option>
        <option value="host">Host</option>
        <option value="mechanic">Mechanic</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={handleUpdate} className="btn btn-primary dark:bg-primary-700 dark:hover:bg-primary-600">
        Update Profile
      </button>
    </div>
  );
};

export default UserProfile;
