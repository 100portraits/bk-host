import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { getAuth, signOut } from 'firebase/auth';

const Nav = () => {
  const { user, userStatus } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <nav className="bg-gray-100 shadow-md p-6">
      <ul className="flex items-center justify-between">
        <div className="flex space-x-4">
          {user && userStatus === 'approved' && (
            <>
              <li>
                <Link to="/" className="px-4 py-2 bg-red-200 text-gray-800 rounded-md shadow hover:bg-gray-300 transition duration-300">Dashboard</Link>
              </li>
              <li>
                <Link to="/walk-in" className="px-4 py-2 bg-red-200 text-gray-800 rounded-md shadow hover:bg-gray-300 transition duration-300">Walk-in Form</Link>
              </li>
            </>
          )}
        </div>
        <div className="flex space-x-4">
          {user ? (
            <>
              <li>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition duration-300">Logout</button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login" className="px-4 py-2 bg-red-200 text-gray-800 rounded-md shadow hover:bg-gray-300 transition duration-300">Login</Link>
            </li>
          )}
        </div>
      </ul>
    </nav>
  );
};

export default Nav;
