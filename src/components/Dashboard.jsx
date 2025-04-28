import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AppointmentModal from './AppointmentModal'; // We'll create this component

// Define the date when the status system changed
const TRANSITION_DATE = new Date(2025, 2, 25); // Month is 0-indexed (2 = March)

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

  // Count completed repairs, considering the transition date
  useEffect(() => {
    const countCompletedRepairs = () => {
      const completed = appointments.filter(appointment => {
        const apptDate = appointment.timestamp.toDate();
        if (apptDate < TRANSITION_DATE) {
          return appointment.completed === true;
        } else {
          return appointment.paid === 1;
        }
      }).length;
      const completedWalkIns = walkIns.length; // Assuming all walk-ins are completed
      return completed + completedWalkIns;
    };
    setRepairCount(countCompletedRepairs());
  }, [appointments, walkIns]);

  // Toggle appointment paid status (only for appointments on/after transition date)
  const togglePaidStatus = async (id, isPaid) => {
      const appointmentDoc = doc(db, 'appointments', id);
      const appointmentSnapshot = await getDoc(appointmentDoc);
      const appointmentData = appointmentSnapshot.data();
    const apptDate = appointmentData.timestamp.toDate();

    // Only allow status changes for new system appointments
    if (apptDate < TRANSITION_DATE) {
      setNotification('Cannot change status for historical appointments.');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    try {
      const paidValue = isPaid ? 1 : 0;
      await updateDoc(appointmentDoc, { paid: paidValue });

      // Send completion email if marked as paid
      if (isPaid) {
      const mailRef = collection(db, 'mail');
      await addDoc(mailRef, {
        to: appointmentData.userInfo.email,
        message: {
          subject: "Bedankt voor je bezoek aan Bike Kitchen UvA!",
            text: `Hey sleutelaar!\n\nBedankt voor je tijd! Is het allemaal gelukt met de reparatie?\n\nLaat hier een review achter over hoe je het bezoek ervaren hebt:\nhttps://forms.gle/AQcZFAddzHWT7dn26\n\nBen je geïnteresseerd in workshops, andere evenementen en het ondersteunen van de Bike Kitchen (inclusief gratis gebruik van de ruimte!)? Word dan lid voor slechts 4 euro per maand. Meer informatie vind je hier: https://doneren.auf.nl/bike-kitchen\n\nHopelijk tot snel! Boek uw volgende afspraak hier: https://bikekitchen.nl\n\nVriendelijke groet,\n\nHet Bike Kitchen UvA-team\n\n---\n\nHey mechanic!\n\nThank you for your time! Did everything work out with the repair?\n\nPlease leave a review about your experience here:\nhttps://forms.gle/AQcZFAddzHWT7dn26\n\nInterested in participating in workshops, other events and supporting the Bike Kitchen (including free use of the space!)? Consider becoming a member for just 4 euros per month. More information here: https://doneren.auf.nl/bike-kitchen\n\nHope to see you soon! Book your next appointment here: https://bikekitchen.nl\n\nBest regards,\n\nThe Bike Kitchen UvA team`,
            html: `<div style="font-family: Arial, sans-serif;">\n  <h2>Hey sleutelaar!</h2>\n  <p>Bedankt voor je tijd! Is het allemaal gelukt met de reparatie?</p>\n  <p>Laat hier een review achter over hoe je het bezoek ervaren hebt:</p>\n  <p><a href="https://forms.gle/AQcZFAddzHWT7dn26" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Geef je feedback</a></p>\n  <p>Ben je geïnteresseerd in workshops, andere evenementen en het ondersteunen van de Bike Kitchen (inclusief gratis gebruik van de ruimte!)? Word dan lid voor slechts 4 euro per maand. Meer informatie vind je <a href="https://doneren.auf.nl/bike-kitchen" style="color: #ef4444; text-decoration: underline;">hier</a>.</p>\n  <p>Hopelijk tot snel! <a href="https://bikekitchen.nl" style="color: #ef4444; text-decoration: underline;">Boek uw volgende afspraak hier</a>.</p>\n  <p>Vriendelijke groet,<br>Het Bike Kitchen UvA-team</p>\n\n  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">\n\n  <h2>Hey mechanic!</h2>\n  <p>Thank you for your time! Did everything work out with the repair?</p>\n  <p>Please leave a review about your experience here:</p>\n  <p><a href="https://forms.gle/AQcZFAddzHWT7dn26" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Give your feedback</a></p>\n  <p>Interested in participating in workshops, other events and supporting the Bike Kitchen (including free use of the space!)? Consider becoming a member for just 4 euros per month. More information <a href="https://doneren.auf.nl/bike-kitchen" style="color: #ef4444; text-decoration: underline;">here</a>.</p>\n  <p>Hope to see you soon! <a href="https://bikekitchen.nl" style="color: #ef4444; text-decoration: underline;">Book your next appointment here</a>.</p>\n  <p>Best regards,<br>The Bike Kitchen UvA team</p>\n</div>`
        }
      });
      }

      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === id ? { ...appointment, paid: paidValue } : appointment
        )
      );

      setSelectedAppointment((prev) => 
        prev && prev.id === id ? { ...prev, paid: paidValue } : prev
      );
      
      setNotification(`Appointment marked as ${isPaid ? 'paid' : 'not paid'}`);
      setTimeout(() => setNotification(''), 3000);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setNotification('Error updating payment status');
      setTimeout(() => setNotification(''), 3000);
    }
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
          text: `Dear ${appointmentData.userInfo.name},\n\nYour appointment with Bike Kitchen UvA has been cancelled by our mechanics.\n\nCancelled appointment details:\nDate: ${new Date(appointmentData.timestamp.toDate()).toLocaleDateString()}\nTime: ${new Date(appointmentData.timestamp.toDate()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\n\nIf you have any questions about this cancellation, please contact us at bikekitchenuva@gmail.com.\n\nIf you need to make a new booking, please visit our website: https://bikekitchen.nl\n\nThank you for your understanding.\n\nBest regards,\nThe Bike Kitchen UvA Team`,
          html: `<p>Dear ${appointmentData.userInfo.name},</p>\n\n<p>Your appointment with Bike Kitchen UvA has been cancelled by our mechanics.</p>\n\n<h3>Cancelled appointment details:</h3>\n<ul>\n  <li><strong>Date:</strong> ${new Date(appointmentData.timestamp.toDate()).toLocaleDateString()}</li>\n  <li><strong>Time:</strong> ${new Date(appointmentData.timestamp.toDate()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</li>\n</ul>\n\n<p>If you have any questions about this cancellation, please contact us at <a href="mailto:bikekitchenuva@gmail.com">bikekitchenuva@gmail.com</a>.</p>\n\n<p>If you need to make a new booking, please visit our website: <a href="https://bikekitchen.nl">https://bikekitchen.nl</a></p>\n\n<p>Thank you for your understanding.</p>\n\n<p>Best regards,<br>The Bike Kitchen UvA Team</p>`
        }
      });

      setAppointments(prevAppointments => 
        prevAppointments.filter(appointment => appointment.id !== id)
      );
      
      setSelectedAppointment(null);
      setNotification('Appointment deleted and slot reopened');
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

  // Helper to get status text based on transition date
  const getStatusInfo = (appointment) => {
    const apptDate = appointment.timestamp.toDate();
    
    if (apptDate < TRANSITION_DATE) {
      // Old system logic
      if (appointment.completed) return { text: 'Completed (Old)', color: 'border-green-500 text-green-600 dark:text-green-400' };
      if (appointment.noShow) return { text: 'No-show (Old)', color: 'border-red-500 text-red-600 dark:text-red-400' };
      if (appointment.noCure) return { text: 'No Cure (Old)', color: 'border-yellow-500 text-yellow-600 dark:text-yellow-400' };
      return { text: 'Pending (Old)', color: 'border-gray-500 text-gray-600 dark:text-gray-400' };
    } else {
      // New system logic
      if (appointment.paid === 1) {
        // If paid/completed, check if they are a member for specific text
        if (appointment.member === true) {
          return { text: 'Completed (Member)', color: 'border-green-500 text-green-600 dark:text-green-400' };
        } else {
          return { text: 'Paid', color: 'border-green-500 text-green-600 dark:text-green-400' };
        }
      }
      // If not paid/completed, check if they are a member
      if (appointment.member === true) {
         return { text: 'Community Member', color: 'border-blue-500 text-blue-600 dark:text-blue-400' };
      }
      // Default for non-members who haven't paid
      return { text: 'Not Paid', color: 'border-primary-500 text-gray-500 dark:text-gray-400' };
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-b-lg mb-6">
      {notification && 
        <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-md ${notification.includes('Error') || notification.includes('Cannot') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {notification}
        </div>
      }
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
        {appointments.map(appointment => {
          const statusInfo = getStatusInfo(appointment);
          const statusColorClasses = statusInfo.color.split(' ');
          
          return (
          <div 
            key={appointment.id} 
              className={`p-4 bg-white dark:bg-gray-700 shadow-md rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-300 border-l-4 ${statusColorClasses[0]}`}
            onClick={() => openAppointmentModal(appointment)}
          >
            <div className="font-semibold text-primary-700 dark:text-primary-300">{appointment.selectedTime}</div>
            <div className="text-gray-600 dark:text-gray-200">{appointment?.userInfo?.name ?? 'N/A'}</div>
              <div className={`text-xs mt-1 ${statusColorClasses[1]} ${statusColorClasses[2]}`}>
                {statusInfo.text}
              </div>
          </div>
          );
        })}
      </div>

      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={closeAppointmentModal}
          togglePaidStatus={togglePaidStatus} // Pass the potentially restricted toggle function
          deleteAppointment={deleteAppointment}
          getStatusInfo={getStatusInfo} // Pass helper function to modal
          isHistorical={selectedAppointment.timestamp.toDate() < TRANSITION_DATE} // Pass flag indicating if it's historical
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
