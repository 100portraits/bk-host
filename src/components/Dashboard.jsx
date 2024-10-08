import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [repairCount, setRepairCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [updatedData, setUpdatedData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().setHours(0, 0, 0, 0));

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
    const appointmentDoc = doc(db, 'appointments', id);
    await updateDoc(appointmentDoc, { completed: true });

    setAppointments((prevAppointments) =>
      prevAppointments.map((appointment) =>
        appointment.id === id ? { ...appointment, completed: true } : appointment
      )
    );
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

  return (
    <div className="p-6 shadow rounded border border-red-300 bg-red-100">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeDate(-1)} className="p-2 bg-blue-500 text-white rounded">
          Previous Day
        </button>
        <h2 className="text-3xl font-bold text-red-700">
          Appointments for {new Date(selectedDate).toLocaleDateString()}
        </h2>
        <button onClick={() => changeDate(1)} className="p-2 bg-blue-500 text-white rounded">
          Next Day
        </button>
      </div>
      <h3 className="text-xl font-bold">Total Repairs Completed: {repairCount}</h3>
      <ul>
        {appointments.map(appointment => (
          <li key={appointment.id} className="mb-4 p-4 bg-white shadow rounded border border-red-300">
            <div className="font-semibold text-lg">Name: {appointment.userInfo.name}</div>
            <div>Phone: {appointment.userInfo.phoneNumber}</div>
            <div>Email: {appointment.userInfo.email}</div>
            
            <h3 className="font-semibold mt-2">Booking Details:</h3>
            {Object.entries(appointment.bookingSelection).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {value}
              </div>
            ))}

            <div>Estimated Time: {appointment.estimatedTime} minutes</div>
            <div>Experience Level: {appointment.experience}</div>

            {/* Visual representation of experience */}
            <div className="flex space-x-1 mt-2">
              {[...Array(5)].map((_, index) => (
                <span
                  key={index}
                  className={`inline-block w-4 h-4 rounded-full ${index < parseInt(appointment.experience) ? 'bg-red-500' : 'bg-red-100'}`}
                ></span>
              ))}
            </div>

            <div>Date: {new Date(appointment.selectedDate).toLocaleDateString()}</div>
            <div>Time: {appointment.selectedTime}</div>
            <div>Status: {appointment.completed ? 'Completed' : appointment.noShow ? 'No-show' : 'Pending'}</div>

            {/* Show Undo if Completed or No-show */}
            {(appointment.completed || appointment.noShow) && (
              <button
                onClick={() => undoStatusChange(appointment.id)}
                className="p-2 bg-yellow-500 text-white rounded"
              >
                Undo
              </button>
            )}

            {!appointment.completed && !appointment.noShow && (
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => markAsCompleted(appointment.id)}
                  className="p-2 bg-blue-500 text-white rounded"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => markAsNoShow(appointment.id)}
                  className="p-2 bg-red-700 text-white rounded"
                >
                  No-show
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="text-3xl font-bold mt-8 mb-4 text-red-700">Today's Walk-ins</h2>
      <ul>
        {walkIns.map(walkIn => (
          <li key={walkIn.id} className="mb-4 p-4 bg-white shadow rounded border border-red-300">
            <div>Bike Type: {walkIn.bikeType}</div>
            <div>Service Type: {walkIn.serviceType}</div>
            <div>Amount Paid: {walkIn.amountPaid}€</div>
            <div>Time: {new Date(walkIn.timestamp.seconds * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>

            {/* Edit and Delete buttons */}
            <button
              onClick={() => toggleEditWalkIn(walkIn.id)}
              className="p-2 bg-blue-500 text-white rounded"
            >
              Edit
            </button>
            <button
              onClick={() => deleteWalkIn(walkIn.id)}
              className="p-2 bg-red-500 text-white rounded ml-2"
            >
              Delete
            </button>

            {/* Editable Form for Walk-in */}
            {isEditing && currentEditId === walkIn.id && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleWalkInUpdate(walkIn.id, updatedData);
                }}
              >
                <div className="mt-4">
                  <label>Bike Type</label>
                  <input
                    type="text"
                    defaultValue={walkIn.bikeType}
                    onChange={(e) => setUpdatedData({ ...updatedData, bikeType: e.target.value })}
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
                <div className="mt-4">
                  <label>Service Type</label>
                  <input
                    type="text"
                    defaultValue={walkIn.serviceType}
                    onChange={(e) => setUpdatedData({ ...updatedData, serviceType: e.target.value })}
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
                <div className="mt-4">
                  <label>Amount Paid</label>
                  <input
                    type="number"
                    defaultValue={walkIn.amountPaid}
                    onChange={(e) => setUpdatedData({ ...updatedData, amountPaid: e.target.value })}
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
                <button type="submit" className="mt-2 p-2 bg-green-500 text-white rounded">Update Walk-in</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;