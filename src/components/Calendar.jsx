import React, { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, addWeeks, isTuesday, isFriday } from 'date-fns';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, Timestamp, updateDoc, arrayUnion, arrayRemove, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const Calendar = () => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [datesToRemove, setDatesToRemove] = useState([]);
  const [calendarDates, setCalendarDates] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [shifts, setShifts] = useState([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    let dates = [];

    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 5; day++) {
        const date = addDays(addWeeks(start, week), day);
        dates.push(date);
      }
    }

    setCalendarDates(dates);
    setDateRange(`${format(dates[0], 'MMM d')} - ${format(dates[dates.length - 1], 'MMM d')}`);
    loadShifts(dates[0], dates[dates.length - 1]);
  }, []);

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
    if (isTuesday(date) || isFriday(date)) return;

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
    
    try {
      await updateShiftsWithHost();
      console.log('Updated shifts with host:', selectedDates);
      console.log('Removed host from shifts:', datesToRemove);
      setShowSaveButton(false);
      setSelectedDates([]);
      setDatesToRemove([]);
      // Reload shifts to reflect the changes
      loadShifts(calendarDates[0], calendarDates[calendarDates.length - 1]);
    } catch (error) {
      console.error('Error updating shifts:', error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg mb-6">
      <h1 className="text-3xl font-bold mb-6 text-primary-700 dark:text-gray-200">Availability Calendar</h1>
      <div className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
        {dateRange}
      </div>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
          <div key={day} className="text-center font-bold text-gray-600 dark:text-gray-400">{day}</div>
        ))}
        {calendarDates.map((date, index) => {
          const dateString = format(date, 'yyyy-MM-dd');
          const shift = shifts.find(s => format(s.date.toDate(), 'yyyy-MM-dd') === dateString);
          const isUserHost = shift?.hosts?.includes(currentUser?.displayName || currentUser?.email);
          const isSelected = selectedDates.includes(dateString);
          const isToRemove = datesToRemove.includes(dateString);
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                p-2 text-center cursor-pointer border rounded transition-colors duration-200
                ${isTuesday(date) || isFriday(date) 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : isUserHost && !isToRemove
                    ? 'bg-primary-500 text-white'
                    : isSelected || isToRemove
                      ? 'bg-primary-300 text-white hover:bg-primary-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'}
              `}
            >
              <div>{format(date, 'd')}</div>
              {shift?.hosts && (
                <div className="text-xs mt-1">
                  {shift.hosts.join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
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