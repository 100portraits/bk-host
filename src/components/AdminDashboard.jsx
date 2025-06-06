import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
         isMonday, isWednesday, isThursday, startOfDay, endOfDay } from 'date-fns';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, deleteDoc } from 'firebase/firestore';
import { holidayDates } from '../config/holidays'; // Import the holiday dates

const getCalendarDays = (month) => {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  
  // Calculate the start of the week for the first day of the month
  const firstDayOfMonth = start.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const startOfCalendar = new Date(start);
  startOfCalendar.setDate(start.getDate() - firstDayOfMonth);

  // Calculate the end of the week for the last day of the month
  const lastDayOfMonth = end.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const endOfCalendar = new Date(end);
  endOfCalendar.setDate(end.getDate() + (6 - lastDayOfMonth));

  const days = eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });

  // Adjust start and end to potentially cover 6 weeks for consistent grid height
  if (days.length < 42) { 
    const daysToAdd = 42 - days.length;
    const lastDate = days[days.length - 1];
    for (let i = 1; i <= daysToAdd; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        days.push(nextDate);
    }
  }
  
  return days;
};

const AdminDashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const timeSlots = {
    1: { name: 'Monday', start: 14, end: 18 },
    3: { name: 'Wednesday', start: 12, end: 16 },
    4: { name: 'Thursday', start: 16, end: 20 }
  };

  // Generate time slots for a specific day
  const generateTimeSlots = (startHour, endHour) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Load available dates for the current month
  useEffect(() => {
    loadAvailableDates();
  }, [currentMonth]);

  const loadAvailableDates = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const availableSlotsRef = collection(db, 'availableSlots');
      const q = query(
        availableSlotsRef,
        where('timestamp', '>=', Timestamp.fromDate(monthStart)),
        where('timestamp', '<=', Timestamp.fromDate(monthEnd))
      );

      const querySnapshot = await getDocs(q);
      const dates = querySnapshot.docs.map(doc => 
        format(doc.data().timestamp.toDate(), 'yyyy-MM-dd')
      );
      setAvailableDates([...new Set(dates)]); // Remove duplicates
    } catch (error) {
      console.error('Error loading available dates:', error);
      setMessage('Error loading available dates');
    } finally {
      setLoading(false);
    }
  };

  // Clear slots for a specific date
  const clearSlotsForDate = async (date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const availableSlotsRef = collection(db, 'availableSlots');
    const q = query(
      availableSlotsRef,
      where('timestamp', '>=', Timestamp.fromDate(dayStart)),
      where('timestamp', '<=', Timestamp.fromDate(dayEnd))
    );

    try {
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error clearing slots:', error);
      throw error;
    }
  };

  // Add slots for a specific date
  const addSlotsForDate = async (date) => {
    const dayOfWeek = date.getDay();
    if (!timeSlots[dayOfWeek]) return 0;

    const { start, end } = timeSlots[dayOfWeek];
    const slots = generateTimeSlots(start, end);
    let addedCount = 0;

    for (const time of slots) {
      const [hours, minutes] = time.split(':');
      const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                               parseInt(hours), parseInt(minutes));
      
      try {
        await addDoc(collection(db, 'availableSlots'), {
          booked: false,
          timestamp: Timestamp.fromDate(timestamp)
        });
        addedCount++;
      } catch (error) {
        console.error('Error adding slot:', error);
        throw error;
      }
    }

    return addedCount;
  };

  // Add helper to check for holidays
  const isHoliday = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return holidayDates.includes(dateString);
  };

  const handleDateClick = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = format(date, 'yyyy-MM-dd');

    // Prevent selecting dates in the past, non-eligible days, or holidays
    if (date < today) {
      setMessage('Cannot modify dates in the past.');
      return;
    }
    if (!isMonday(date) && !isWednesday(date) && !isThursday(date)) {
      setMessage('Only Monday, Wednesday, and Thursday can be modified.');
      return;
    }
    if (isHoliday(date)) {
      setMessage('Cannot modify holiday dates.');
      return;
    }
    
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
    setMessage(''); // Clear message on valid click
  };

  // Add this new function to check for existing appointments
  const checkForExistingAppointments = async (date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('timestamp', '>=', Timestamp.fromDate(dayStart)),
      where('timestamp', '<=', Timestamp.fromDate(dayEnd))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Check dates that are being removed
      const datesToRemove = selectedDates.filter(dateStr => availableDates.includes(dateStr));
      
      // Check for existing appointments on dates being removed
      for (const dateStr of datesToRemove) {
        const date = new Date(dateStr);
        // Adjust date to local noon to avoid timezone issues with date comparison
        date.setHours(12, 0, 0, 0);
        const appointmentCount = await checkForExistingAppointments(date);
        
        if (appointmentCount > 0) {
          const confirmRemoval = window.confirm(
            `There are ${appointmentCount} existing appointment(s) on ${dateStr}. Are you sure you want to remove this date?`
          );
          
          if (!confirmRemoval) {
            setLoading(false);
            setMessage('Save cancelled.'); // Provide feedback
            return;
          }
        }
      }

      // Proceed with saving changes
      let changesMade = false;
      for (const dateStr of selectedDates) {
        const date = new Date(dateStr);
        // Adjust date to local noon to avoid timezone issues
        date.setHours(12, 0, 0, 0); 
        const isDateAvailable = availableDates.includes(dateStr);

        if (isDateAvailable) {
          await clearSlotsForDate(date);
        } else {
          await addSlotsForDate(date);
        }
        changesMade = true;
      }

      if (changesMade) {
        await loadAvailableDates(); // Reload only if changes were actually processed
        setSelectedDates([]);
        setMessage('Changes saved successfully.');
      } else {
        setMessage('No changes to save.'); // Handle case where save was cancelled
      }

    } catch (error) {
      console.error('Error saving changes:', error);
      setMessage('Error saving changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch data from Firestore
  const fetchData = async (collectionName) => {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // Function to download data as JSON
  const downloadData = async () => {
    try {
      const appointments = await fetchData('appointments');
      const walkIns = await fetchData('walkIns');

      const data = {
        appointments,
        walkIns
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-primary-700 dark:text-gray-200">Admin Dashboard</h1>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${ 
          message.includes('Error') || message.includes('Cannot') || message.includes('cancelled')
            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        }`}> 
          {message}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
          Manage Open Dates
        </h2>
        
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            disabled={loading}
          >
            &lt;
          </button>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button
            onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            disabled={loading}
          >
            &gt;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
          {getCalendarDays(currentMonth).map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="p-4" />;

            const dateStr = format(date, 'yyyy-MM-dd');
            const isAvailable = availableDates.includes(dateStr);
            const isSelected = selectedDates.includes(dateStr);
            const isValidDay = isMonday(date) || isWednesday(date) || isThursday(date);
            const isPast = date < new Date().setHours(0, 0, 0, 0);
            const isHolidayFlag = isHoliday(date); // Check if it's a holiday
            const isCurrentMonthFlag = isSameMonth(date, currentMonth);

            const isDisabled = isPast || !isValidDay || isHolidayFlag;

            return (
              <div
                key={i}
                onClick={() => !loading && !isDisabled && isCurrentMonthFlag && handleDateClick(date)} // Prevent click on disabled/holiday/outside month
                className={`
                  p-4 text-center rounded-lg transition-colors
                  ${!isCurrentMonthFlag ? 'opacity-50' : ''}
                  ${isDisabled 
                    ? `cursor-not-allowed ${isHolidayFlag ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'}` 
                    : isSelected 
                      ? 'bg-primary-500 text-white cursor-pointer' 
                      : isAvailable 
                        ? 'bg-green-500 text-white cursor-pointer' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer'
                  }
                `}
              >
                {format(date, 'd')}
                {isHolidayFlag && isCurrentMonthFlag && <span className="block text-xs mt-1">Holiday</span>} {/* Add Holiday text */}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Selected dates: {selectedDates.length}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Open</span>
            </div>
            <button
              onClick={handleSave}
              disabled={loading || selectedDates.length === 0}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={downloadData}
        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Download Data
      </button>
    </div>
  );
};

export default AdminDashboard; 