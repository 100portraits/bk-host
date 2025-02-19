import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AppointmentModal from './AppointmentModal'; // We'll create this component

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [repairCount, setRepairCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().setHours(0, 0, 0, 0));
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notification, setNotification] = useState(''); // New state for notifications

  useEffect(() => {
    const fetchAppointments = async () => {
      const startOfDay = new Date(selectedDate);
      const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);
      const q = query(
        collection(db, 'appointments'),
        where('timestamp', '>=', Timestamp.fromDate(new Date(startOfDay))),
        where('timestamp', '<=', Timestamp.fromDate(new Date(endOfDay)))
      );

      const querySnapshot = await getDocs(q);
      setAppointments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const fetchWalkIns = async () => {
      const startOfDay = new Date(selectedDate);
      const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);
      const q = query(
        collection(db, 'walkIns'),
        where('timestamp', '>=', Timestamp.fromDate(new Date(startOfDay))),
        where('timestamp', '<=', Timestamp.fromDate(new Date(endOfDay)))
      );

      const querySnapshot = await getDocs(q);
      setWalkIns(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchAppointments();
    fetchWalkIns();
  }, [selectedDate]);

  // Count completed repairs (appointments and walk-ins)
  useEffect(() => {
    const countCompletedRepairs = () => {
      const completedAppointments = appointments.filter(appointment => appointment.completed).length;
      const completedWalkIns = walkIns.length; // Assuming all walk-ins are completed when added
      return completedAppointments + completedWalkIns;
    };
    setRepairCount(countCompletedRepairs());
  }, [appointments, walkIns]);

  // Mark appointment as completed and update state
  const markAsCompleted = async (id) => {
    try {
      const appointmentDoc = doc(db, 'appointments', id);
      const appointmentSnapshot = await getDoc(appointmentDoc);
      const appointmentData = appointmentSnapshot.data();

      await updateDoc(appointmentDoc, { completed: true });

      // Send completion email
      const mailRef = collection(db, 'mail');
      await addDoc(mailRef, {
        to: appointmentData.userInfo.email,
        message: {
          subject: "Bedankt voor je bezoek aan Bike Kitchen UvA!",
          text: `Hey sleutelaar!

Bedankt voor je tijd! Is het allemaal gelukt met de reparatie?

Laat hier een review achter over hoe je het bezoek ervaren hebt:
https://forms.gle/AQcZFAddzHWT7dn26

Wil je op de hoogte blijven van de Bike Kitchen UvA of wil je onderdeel worden van de community waarmee je bijdraagt aan de ondersteuning van het project, neem dan een kijkje op https://student.uva.nl/en/topics/repair-your-bike-at-the-bike-kitchen

Hopelijk tot snel! Boek uw volgende afspraak hier: https://bikekitchen.nl

Vriendelijke groet,

Het Bike Kitchen UvA-team

---

Hey mechanic!

Thank you for your time! Did everything work out with the repair?

Please leave a review about your experience here:
https://forms.gle/AQcZFAddzHWT7dn26

Want to stay updated about Bike Kitchen UvA or become part of the community that helps support the project? Take a look at https://student.uva.nl/en/topics/repair-your-bike-at-the-bike-kitchen

Hope to see you soon! Book your next appointment here: https://bikekitchen.nl

Best regards,

The Bike Kitchen UvA team`,
          html: `<div style="font-family: Arial, sans-serif;">
  <h2>Hey sleutelaar!</h2>
  <p>Bedankt voor je tijd! Is het allemaal gelukt met de reparatie?</p>
  <p>Laat hier een review achter over hoe je het bezoek ervaren hebt:</p>
  <p><a href="https://forms.gle/AQcZFAddzHWT7dn26" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Geef je feedback</a></p>
  <p>Wil je op de hoogte blijven van de Bike Kitchen UvA of wil je onderdeel worden van de community waarmee je bijdraagt aan de ondersteuning van het project, neem dan een kijkje op <a href="https://student.uva.nl/en/topics/repair-your-bike-at-the-bike-kitchen" style="color: #ef4444; text-decoration: underline;">student.uva.nl/en/topics/repair-your-bike-at-the-bike-kitchen</a></p>
  <p>Hopelijk tot snel! <a href="https://bikekitchen.nl" style="color: #ef4444; text-decoration: underline;">Boek uw volgende afspraak hier</a>.</p>
  <p>Vriendelijke groet,<br>Het Bike Kitchen UvA-team</p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

  <h2>Hey mechanic!</h2>
  <p>Thank you for your time! Did everything work out with the repair?</p>
  <p>Please leave a review about your experience here:</p>
  <p><a href="https://forms.gle/AQcZFAddzHWT7dn26" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Give your feedback</a></p>
  <p>Want to stay updated about Bike Kitchen UvA or become part of the community that helps support the project? Take a look at <a href="https://student.uva.nl/en/topics/repair-your-bike-at-the-bike-kitchen" style="color: #ef4444; text-decoration: underline;">student.uva.nl/en/topics/repair-your-bike-at-the-bike-kitchen</a></p>
  <p>Hope to see you soon! <a href="https://bikekitchen.nl" style="color: #ef4444; text-decoration: underline;">Book your next appointment here</a>.</p>
  <p>Best regards,<br>The Bike Kitchen UvA team</p>
</div>`
        }
      });

      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === id ? { ...appointment, completed: true } : appointment
        )
      );

      setSelectedAppointment((prev) => ({ ...prev, completed: true }));
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
    }
  };

  // Mark appointment as no-show and update state
  const markAsNoShow = async (id) => {
    const appointmentDoc = doc(db, 'appointments', id);
    await updateDoc(appointmentDoc, { noShow: true });

    setAppointments((prevAppointments) =>
      prevAppointments.map((appointment) =>
        appointment.id === id ? { ...appointment, noShow: true } : appointment
      )
    );

    setSelectedAppointment((prev) => ({ ...prev, noShow: true })); // Update selected appointment state
  };

  // Undo appointment status and revert to pending
  const undoStatusChange = async (id) => {
    const appointmentDoc = doc(db, 'appointments', id);
    await updateDoc(appointmentDoc, { completed: false, noShow: false });

    setAppointments((prevAppointments) =>
      prevAppointments.map((appointment) =>
        appointment.id === id ? { ...appointment, completed: false, noShow: false } : appointment
      )
    );

    setSelectedAppointment((prev) => ({ ...prev, completed: false, noShow: false })); // Update selected appointment state
  };

  // Delete appointment and re-open available slot
  const deleteAppointment = async (id) => {
    try {
      const appointmentDoc = doc(db, 'appointments', id);
      const appointmentSnapshot = await getDoc(appointmentDoc);
      const appointmentData = appointmentSnapshot.data();

      // Add to deletedAppointments collection
      await addDoc(collection(db, 'deletedAppointments'), {
        ...appointmentData,
        noShow: true,
        deletedAt: Timestamp.now()
      });

      // Update available slots
      const startTime = appointmentData.timestamp.toDate();
      const endTime = new Date(startTime.getTime() + (appointmentData.estimatedTime * 60000));

      const slotsQuery = query(
        collection(db, 'availableSlots'),
        where('timestamp', '>=', Timestamp.fromDate(startTime)),
        where('timestamp', '<', Timestamp.fromDate(endTime))
      );

      const slotsSnapshot = await getDocs(slotsQuery);
      const updatePromises = slotsSnapshot.docs.map(slotDoc => 
        updateDoc(doc(db, 'availableSlots', slotDoc.id), { booked: false })
      );

      await Promise.all(updatePromises);

      // Delete the appointment
      await deleteDoc(appointmentDoc);

      // Send email notification
      const mailRef = collection(db, 'mail');
      await addDoc(mailRef, {
        to: appointmentData.userInfo.email,
        message: {
          subject: "Your Bike Kitchen UvA appointment has been cancelled by our staff",
          text: `Dear ${appointmentData.userInfo.name},

Your appointment with Bike Kitchen UvA has been cancelled by our mechanics.

Cancelled appointment details:
Date: ${new Date(appointmentData.timestamp.toDate()).toLocaleDateString()}
Time: ${new Date(appointmentData.timestamp.toDate()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}

If you have any questions about this cancellation, please contact us at bikekitchenuva@gmail.com.

If you need to make a new booking, please visit our website: https://bikekitchen.nl

Thank you for your understanding.

Best regards,
The Bike Kitchen UvA Team`,
          html: `<p>Dear ${appointmentData.userInfo.name},</p>

<p>Your appointment with Bike Kitchen UvA has been cancelled by our mechanics.</p>

<h3>Cancelled appointment details:</h3>
<ul>
  <li><strong>Date:</strong> ${new Date(appointmentData.timestamp.toDate()).toLocaleDateString()}</li>
  <li><strong>Time:</strong> ${new Date(appointmentData.timestamp.toDate()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</li>
</ul>

<p>If you have any questions about this cancellation, please contact us at <a href="mailto:bikekitchenuva@gmail.com">bikekitchenuva@gmail.com</a>.</p>

<p>If you need to make a new booking, please visit our website: <a href="https://bikekitchen.nl">https://bikekitchen.nl</a></p>

<p>Thank you for your understanding.</p>

<p>Best regards,<br>The Bike Kitchen UvA Team</p>`
        }
      });

      // Update local state to remove the appointment
      setAppointments(prevAppointments => 
        prevAppointments.filter(appointment => appointment.id !== id)
      );
      
      setSelectedAppointment(null);
      setNotification('Appointment deleted and slot reopened');

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setNotification('Error deleting appointment');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Edit Walk-in Record
  const handleWalkInUpdate = async (id, updatedData) => {
    const walkInDoc = doc(db, 'walkIns', id);
    await updateDoc(walkInDoc, updatedData);

    setWalkIns((prevWalkIns) =>
      prevWalkIns.map((walkIn) =>
        walkIn.id === id ? { ...walkIn, ...updatedData } : walkIn
      )
    );

    setIsEditing(false);
    setCurrentEditId(null);
  };

  // Delete Walk-in Record
  const deleteWalkIn = async (id) => {
    const walkInDoc = doc(db, 'walkIns', id);
    await deleteDoc(walkInDoc);

    setWalkIns((prevWalkIns) => prevWalkIns.filter((walkIn) => walkIn.id !== id));
  };

  // Toggle Edit form
  const toggleEditWalkIn = (id) => {
    setIsEditing(true);
    setCurrentEditId(id);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.setHours(0, 0, 0, 0));
  };

  const openAppointmentModal = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const closeAppointmentModal = () => {
    setSelectedAppointment(null);
  };

  // Mark appointment as "No Cure No Pay" and update state
  const markAsNoCureNoPay = async (id) => {
    try {
      const appointmentDoc = doc(db, 'appointments', id);
      await updateDoc(appointmentDoc, { noCure: true });

      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === id ? { ...appointment, noCure: true } : appointment
        )
      );

      setSelectedAppointment((prev) => ({ ...prev, noCure: true }));
    } catch (error) {
      console.error('Error marking appointment as No Cure No Pay:', error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-b-lg mb-6">
      {notification && <div className="notification">{notification}</div>} {/* Display notification */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => changeDate(-1)} className="btn btn-primary dark:bg-primary-700 dark:hover:bg-primary-600">
          &lt;
        </button>
        <h2 className="text-3xl font-bold text-primary-700 dark:text-gray-200">
          {new Date(selectedDate).toLocaleDateString()}
        </h2>
        <button onClick={() => changeDate(1)} className="btn btn-primary dark:bg-primary-700 dark:hover:bg-primary-600">
          &gt;
        </button>
      </div>
      <div className="bg-primary-100 dark:bg-primary-900 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-semibold text-black dark:text-gray-200">Total Repairs Completed: {repairCount}</h3>
      </div>
      <h3 className="text-xl font-semibold text-black dark:text-gray-200 mb-4">Today's Appointments</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {appointments.map(appointment => (
          <div 
            key={appointment.id} 
            className="p-4 bg-white dark:bg-gray-700 shadow-md rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300 border-l-4 border-primary-500"
            onClick={() => openAppointmentModal(appointment)}
          >
            <div className="font-semibold text-primary-700 dark:text-primary-300">{appointment.selectedTime}</div>
            <div className="text-gray-600 dark:text-gray-200">{appointment?.userInfo?.name ?? 'N/A'}</div>
          </div>
        ))}
      </div>

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={closeAppointmentModal}
          markAsCompleted={markAsCompleted}
          markAsNoShow={markAsNoShow}
          deleteAppointment={deleteAppointment}
          undoStatusChange={undoStatusChange}
          markAsNoCureNoPay={markAsNoCureNoPay}
        />
      )}

      <h2 className="text-xl mt-8 mb-4 font-semibold text-black dark:text-gray-200">Today's Walk-ins</h2>
      {walkIns.length > 0 ? (
        <ul className="space-y-4">
          {walkIns.map(walkIn => (
            <li key={walkIn.id} className="p-4 bg-white dark:bg-gray-700 shadow-md rounded-lg border-l-4 border-secondary-500">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-700 dark:text-gray-300">Bike Type: <span className="font-semibold">{walkIn.bikeType}</span></div>
                <div className="text-gray-700 dark:text-gray-300">Service Type: <span className="font-semibold">{walkIn.serviceType}</span></div>
                <div className="text-gray-700 dark:text-gray-300">Amount Paid: <span className="font-semibold">{walkIn.amountPaid}€</span></div>
                <div className="text-gray-700 dark:text-gray-300">Time: <span className="font-semibold">{new Date(walkIn.timestamp.seconds * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>
              </div>

              <div className="mt-4 space-x-2">
                <button
                  onClick={() => toggleEditWalkIn(walkIn.id)}
                  className="btn btn-primary"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteWalkIn(walkIn.id)}
                  className="btn btn-secondary"
                >
                  Delete
                </button>
              </div>

              {isEditing && currentEditId === walkIn.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleWalkInUpdate(walkIn.id, updatedData);
                  }}
                  className="mt-4 space-y-4"
                >
                  <input
                    type="text"
                    defaultValue={walkIn.bikeType}
                    onChange={(e) => setUpdatedData({ ...updatedData, bikeType: e.target.value })}
                    className="input dark:bg-gray-600 dark:text-white"
                    placeholder="Bike Type"
                    required
                  />
                  <input
                    type="text"
                    defaultValue={walkIn.serviceType}
                    onChange={(e) => setUpdatedData({ ...updatedData, serviceType: e.target.value })}
                    className="input dark:bg-gray-600 dark:text-white"
                    placeholder="Service Type"
                    required
                  />
                  <input
                    type="number"
                    defaultValue={walkIn.amountPaid}
                    onChange={(e) => setUpdatedData({ ...updatedData, amountPaid: e.target.value })}
                    className="input dark:bg-gray-600 dark:text-white"
                    placeholder="Amount Paid"
                    required
                  />
                  <button type="submit" className="btn btn-primary">Update Walk-in</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 dark:text-gray-400 text-center py-4 bg-gray-100 dark:bg-gray-700 rounded-lg">No walk-ins recorded yet.</p>
      )}
    </div>
  );
};

export default Dashboard;
