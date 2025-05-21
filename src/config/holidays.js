// bk-host/src/config/holidays.js

// Add holiday dates here in 'YYYY-MM-DD' format.
// These dates will be disabled in the Host Calendar and Admin Availability management.
export const holidayDates = [
  // Example format:
  // '2024-12-25', // Christmas Day
  // '2025-01-01', // New Year's Day
  // Add your specific holiday dates below:
  '2025-04-21',

  '2025-05-05',
  '2025-05-29',
  '2025-06-09',
  
  // Summer Holiday Closure (June 20 to August 24) - Mondays, Wednesdays, Thursdays only
  // June 2025
  '2025-06-23', '2025-06-25', '2025-06-26', '2025-06-30',
  // July 2025
  '2025-07-02', '2025-07-03', '2025-07-07', '2025-07-09', '2025-07-10',
  '2025-07-14', '2025-07-16', '2025-07-17', '2025-07-21', '2025-07-23', 
  '2025-07-24', '2025-07-28', '2025-07-30', '2025-07-31',
  // August 2025
  '2025-08-04', '2025-08-06', '2025-08-07', '2025-08-11', '2025-08-13', 
  '2025-08-14', '2025-08-18', '2025-08-20', '2025-08-21'
  // ... add more dates as needed
]; 

// Map specific holiday periods to custom display text
export const holidayLabels = {
  // Format: 'YYYY-MM-DD': 'Custom Text'
  // Summer Holiday dates - Mondays, Wednesdays, Thursdays only
  // June 2025
  '2025-06-23': 'Summer Holiday', '2025-06-25': 'Summer Holiday', '2025-06-26': 'Summer Holiday', '2025-06-30': 'Summer Holiday',
  // July 2025
  '2025-07-02': 'Summer Holiday', '2025-07-03': 'Summer Holiday', '2025-07-07': 'Summer Holiday', '2025-07-09': 'Summer Holiday', '2025-07-10': 'Summer Holiday',
  '2025-07-14': 'Summer Holiday', '2025-07-16': 'Summer Holiday', '2025-07-17': 'Summer Holiday', '2025-07-21': 'Summer Holiday', '2025-07-23': 'Summer Holiday', 
  '2025-07-24': 'Summer Holiday', '2025-07-28': 'Summer Holiday', '2025-07-30': 'Summer Holiday', '2025-07-31': 'Summer Holiday',
  // August 2025
  '2025-08-04': 'Summer Holiday', '2025-08-06': 'Summer Holiday', '2025-08-07': 'Summer Holiday', '2025-08-11': 'Summer Holiday', '2025-08-13': 'Summer Holiday', 
  '2025-08-14': 'Summer Holiday', '2025-08-18': 'Summer Holiday', '2025-08-20': 'Summer Holiday', '2025-08-21': 'Summer Holiday'
}; 