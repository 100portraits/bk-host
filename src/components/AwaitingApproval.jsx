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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-primary-700">Account Awaiting Approval</h1>
        <p className="text-gray-600">
          Your account is currently awaiting approval. Please check back later or contact the administrator.
        </p>
        <button
          onClick={handleSignOut}
          className="btn btn-secondary w-full"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AwaitingApproval;