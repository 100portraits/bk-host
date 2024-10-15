import { db } from '../firebase.js'
import { collection, addDoc, Timestamp } from 'firebase/firestore';

function generateShiftDays(startDate, endDate) {
  const shiftDays = [];
  for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 4) { // Monday, Wednesday, Thursday
      shiftDays.push(new Date(day));
    }
  }
  return shiftDays;
}

async function addShiftsUntil2025() {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-12-31');

  const shiftDays = generateShiftDays(startDate, endDate);

  for (const day of shiftDays) {
    try {
      const docRef = await addDoc(collection(db, 'shifts'), {
        date: Timestamp.fromDate(day)
      });
      console.log(`Added shift for ${day.toDateString()} with ID: ${docRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  console.log('Finished adding shifts');
}

addShiftsUntil2025().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
