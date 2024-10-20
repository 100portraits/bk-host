import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import { getAuth, signOut } from 'firebase/auth';
import DarkModeToggle from './DarkModeToggle';
import { FaHome, FaClipboardList, FaCalendarAlt, FaUser } from 'react-icons/fa'; // Import icons

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
    <nav className="bg-primary-50 dark:bg-gray-700 shadow-md">
      <div className="mx-auto">
        <div className="flex justify-between h-16 py-2">
          <div className="flex">
            {user && userStatus === 'approved' && (
              <>
                <Link to="/" className="flex items-center px-3 ml-4 py-2 rounded-md text-sm lg:text-md font-medium text-black dark:text-gray-200 hover:text-primary-900 dark:hover:text-white hover:bg-primary-50 dark:hover:bg-gray-700">
                  <span className="hidden lg:inline">Dashboard</span> {/* Text hidden on small screens */}
                  <FaHome className="lg:hidden" /> {/* Icon shown on small screens */}
                </Link>
                <Link to="/walk-in" className="flex items-center px-3 py-2 rounded-md text-sm lg:text-md font-medium text-black dark:text-gray-200 hover:text-primary-900 dark:hover:text-white hover:bg-primary-50 dark:hover:bg-gray-700">
                  <span className="hidden lg:inline">Walk-in Form</span>
                  <FaClipboardList className="lg:hidden" />
                </Link>
                <Link to="/calendar" className="flex items-center px-3 py-2 rounded-md text-sm lg:text-md font-medium text-black dark:text-gray-200 hover:text-primary-900 dark:hover:text-white hover:bg-primary-50 dark:hover:bg-gray-700">
                  <span className="hidden lg:inline">Calendar</span>
                  <FaCalendarAlt className="lg:hidden" />
                </Link>
                <Link to="/profile" className="flex items-center px-3 py-2 rounded-md text-sm lg:text-md font-medium text-black dark:text-gray-200 hover:text-primary-900 dark:hover:text-white hover:bg-primary-50 dark:hover:bg-gray-700">
                  <span className="hidden lg:inline">Profile</span>
                  <FaUser className="lg:hidden" />
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4 mr-4">
            <DarkModeToggle />
            {user ? (
              <button onClick={handleLogout} className="btn btn-secondary ">
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary ">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
