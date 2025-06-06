import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isTuesday, isFriday, subMonths, addMonths, isSameMonth, startOfWeek, endOfWeek, isWeekend, isBefore, startOfDay } from 'date-fns';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, Timestamp, updateDoc, arrayUnion, arrayRemove, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { holidayDates, holidayLabels } from '../config/holidays'; // Import holiday labels

const Calendar = () => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [datesToRemove, setDatesToRemove] = useState([]);
  const [calendarDates, setCalendarDates] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [usersMap, setUsersMap] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    generateCalendarDates(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const userDataMap = {};
        
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          if (userData.email) {
            userDataMap[userData.email] = {
              displayName: userData.displayName,
              role: userData.role
            };
          }
        });

        console.log('Loaded user data:', userDataMap);
        setUsersMap(userDataMap);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
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

  const isHoliday = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidayDates.includes(dateString);
  };

  const getHolidayLabel = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidayLabels[dateString] || 'Holiday';
  };

  const handleDateClick = (date) => {
    if (isHoliday(date) || isTuesday(date) || isFriday(date) || isWeekend(date) || isBefore(date, startOfDay(new Date()))) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
    
    const isUserHost = shift?.hosts?.includes(currentUser.email);

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
          hosts: arrayUnion(currentUser.email)
        });
      }
    }

    for (const dateString of datesToRemove) {
      const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
      if (shift) {
        const shiftRef = doc(db, 'shifts', shift.id);
        await updateDoc(shiftRef, {
          hosts: arrayRemove(currentUser.email)
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
      loadShifts(startOfWeek(startOfMonth(currentMonth)), endOfWeek(endOfMonth(currentMonth))); // Reload shifts for the full displayed range
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
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg mb-6 max-h-[100vh] overflow-y-auto">
      {/* Summer Holiday closure message */}
      <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200">
        <p className="font-bold">Summer Holiday Closure!</p>
        <p>The Bike Kitchen will be closed from June 27th to August 24th, 2025. See you after the summer! 🌞</p>
      </div>

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
          <div key={day} className="text-center font-bold text-gray-600 dark:text-gray-400 mb-2">{day}</div>
        ))}
        {calendarDates.map((date, index) => {
          const dateString = format(date, 'yyyy-MM-dd');
          const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
          const isUserHost = shift?.hosts?.includes(currentUser.email);
          const isSelected = selectedDates.includes(dateString);
          const isToRemove = datesToRemove.includes(dateString);
          const isCurrentMonthFlag = isSameMonth(date, currentMonth);
          const isPastDateFlag = isBefore(date, startOfDay(new Date()));
          const isWeekendOrTueFri = isWeekend(date) || isTuesday(date) || isFriday(date);
          const isHolidayFlag = isHoliday(date);

          // Check if at least one host is a mechanic or admin
          const hasMechanicOrAdmin = shift?.hosts?.some(hostEmail => {
            const userData = usersMap[hostEmail];
            return userData?.role === 'mechanic' || userData?.role === 'admin';
          });

          // Need red border if: Not a holiday AND needs a mechanic/admin
          const needsRedBorder = (!shift?.hosts || shift.hosts.length === 0 || !hasMechanicOrAdmin) 
            && !isHolidayFlag 
            && isCurrentMonthFlag 
            && !isPastDateFlag 
            && !isWeekendOrTueFri;
            
          // Determine if the date is disabled
          const isDisabled = !isCurrentMonthFlag || isPastDateFlag || isWeekendOrTueFri || isHolidayFlag;

          return (
            <div
              key={index}
              onClick={() => !isDisabled && handleDateClick(date)}
              className={`p-2 text-center transition-colors duration-200 md:rounded-lg
                ${isDisabled
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : isUserHost && !isToRemove
                    ? 'bg-primary-500 text-white cursor-pointer'
                    : isSelected || isToRemove
                      ? 'bg-primary-300 text-white hover:bg-primary-400 cursor-pointer'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-pointer'}
                ${isHolidayFlag ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white dark:text-white' : ''}
                ${needsRedBorder ? 'border-2 border-red-500' : ''}
                sm:rounded-none sm:p-1
              `}
            >
              <div>{format(date, 'd')}</div>
              {shift?.hosts && !isHolidayFlag && (
                <div className="text-xs mt-1">
                  {shift.hosts.map(hostEmail => {
                    const userData = usersMap[hostEmail];
                    return userData?.displayName || hostEmail;
                  }).join(', ')}
                </div>
              )}
              {isHolidayFlag && (
                <div className="text-xs mt-1">{getHolidayLabel(date)}</div>
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

      <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200">
        <p className="font-bold">Note:</p>
        <p>Days with a red border still need a mechanic!</p>
      </div>
    </div>
  );
};

export default Calendar;
