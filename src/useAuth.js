// useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatusLoading, setUserStatusLoading] = useState(true);
  const auth = getAuth();

  const refreshUserStatus = useCallback(async (currentUser) => {
    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const newStatus = userDoc.data().status;
          setUserStatus((prevStatus) => {
            if (prevStatus !== newStatus) {
              return newStatus;
            }
            return prevStatus;
          });
        } else {
          setUserStatus((prevStatus) => (prevStatus !== null ? null : prevStatus));
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
        setUserStatus((prevStatus) => (prevStatus !== null ? null : prevStatus));
      }
    } else {
      setUserStatus((prevStatus) => (prevStatus !== null ? null : prevStatus));
    }
    setUserStatusLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setUserStatusLoading(true);
      await refreshUserStatus(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, refreshUserStatus]);

  return { user, userStatus, loading, userStatusLoading };
}
