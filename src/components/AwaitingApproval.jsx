// AwaitingApproval.jsx

import React from 'react';
import { getAuth, signOut } from 'firebase/auth';

const AwaitingApproval = () => {
  const auth = getAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-700">Account Awaiting Approval</h1>
        <p className="text-gray-600">
          Your account is currently awaiting approval. Please check back later or contact the administrator.
        </p>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-white bg-red-700 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AwaitingApproval;
