import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isTuesday, isFriday, subMonths, addMonths, isSameMonth, startOfWeek, endOfWeek, isWeekend, isBefore, startOfDay } from 'date-fns';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, Timestamp, updateDoc, arrayUnion, arrayRemove, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const Calendar = () => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [datesToRemove, setDatesToRemove] = useState([]);
  const [calendarDates, setCalendarDates] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [usersMap, setUsersMap] = useState({}); // State to hold email to displayName mapping
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    generateCalendarDates(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Create a mapping of email to displayName
      const emailToNameMap = {};
      usersData.forEach(user => {
        if (user.email) {
          emailToNameMap[user.email] = user.displayName; // Assuming displayName is the field you want
        }
      });
      setUsersMap(emailToNameMap);
    };

    fetchUsers();
  }, []);

  const generateCalendarDates = (month) => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const dates = eachDayOfInterval({ start, end });
    setCalendarDates(dates);
    loadShifts(start, end);
  };

  const loadShifts = async (startDate, endDate) => {
    const shiftsRef = collection(db, 'shifts');
    const q = query(
      shiftsRef,
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    try {
      const querySnapshot = await getDocs(q);
      const loadedShifts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShifts(loadedShifts);
      console.log('Loaded shifts for displayed dates:', loadedShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  };

  const handleDateClick = (date) => {
    if (isTuesday(date) || isFriday(date) || isWeekend(date) || isBefore(date, startOfDay(new Date()))) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
    const isUserHost = shift?.hosts?.includes(currentUser?.displayName || currentUser?.email);

    if (isUserHost) {
      setDatesToRemove(prev => prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString]);
    } else {
      setSelectedDates(prev => prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString]);
    }
    setShowSaveButton(true);
  };

  const updateShiftsWithHost = async () => {
    for (const dateString of selectedDates) {
      const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
      if (shift) {
        const shiftRef = doc(db, 'shifts', shift.id);
        await updateDoc(shiftRef, {
          hosts: arrayUnion(currentUser.displayName || currentUser.email)
        });
      }
    }

    for (const dateString of datesToRemove) {
      const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
      if (shift) {
        const shiftRef = doc(db, 'shifts', shift.id);
        await updateDoc(shiftRef, {
          hosts: arrayRemove(currentUser.displayName || currentUser.email)
        });
      }
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    // Check if the user has a displayName
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists() || !userDoc.data().displayName) {
      setNotificationMessage('Please set your name and role in your Profile before saving the calendar.'); // Set notification message
      setShowNotification(true); // Show notification
      return;
    }

    try {
      await updateShiftsWithHost();
      console.log('Updated shifts with host:', selectedDates);
      console.log('Removed host from shifts:', datesToRemove);
      setShowSaveButton(false);
      setSelectedDates([]);
      setDatesToRemove([]);
      // Reload shifts to reflect the changes
      loadShifts(startOfMonth(currentMonth), endOfMonth(currentMonth));
    } catch (error) {
      console.error('Error updating shifts:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg mb-6">
      <h1 className="text-3xl font-bold mb-6 text-primary-700 dark:text-gray-200">Availability Calendar</h1>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousMonth}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors duration-200 dark:bg-primary-700 dark:hover:bg-primary-600"
        >
          &lt;
        </button>
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button
          onClick={handleNextMonth}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors duration-200 dark:bg-primary-700 dark:hover:bg-primary-600"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 md:gap-2 mb-4 gap-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold text-gray-600 dark:text-gray-400">{day}</div>
        ))}
        {calendarDates.map((date, index) => {
          const dateString = format(date, 'yyyy-MM-dd');
          const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
          const isUserHost = shift?.hosts?.includes(currentUser?.displayName || currentUser?.email);
          const isSelected = selectedDates.includes(dateString);
          const isToRemove = datesToRemove.includes(dateString);
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isPastDate = isBefore(date, startOfDay(new Date()));
          const isWeekendOrTuesdayOrFriday = isWeekend(date) || isTuesday(date) || isFriday(date);
          
          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && !isPastDate && !isWeekendOrTuesdayOrFriday && handleDateClick(date)}
              className={`p-2 text-center cursor-pointer border transition-colors duration-200
                ${!isCurrentMonth || isPastDate || isWeekendOrTuesdayOrFriday
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : isUserHost && !isToRemove
                    ? 'bg-primary-500 text-white'
                    : isSelected || isToRemove
                      ? 'bg-primary-300 text-white hover:bg-primary-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}
                sm:border sm:border-gray-300 sm:rounded-none sm:p-1
              `}
            >
              <div>{format(date, 'd')}</div>
              {shift?.hosts && (
                <div className="text-xs mt-1">
                  {shift.hosts.map(host => usersMap[host] || host).join(', ')} {/* Display user's name */}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showNotification && ( // Conditional rendering of the notification
        <div className="mt-4 p-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-md">
          {notificationMessage}
        </div>
      )}
      {showSaveButton && (
        <button
          onClick={handleSave}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors duration-200"
        >
          Save
        </button>
      )}
      
    </div>
  );
};

export default Calendar;
