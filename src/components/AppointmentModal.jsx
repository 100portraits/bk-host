import React, { useState } from 'react';

const AppointmentModal = ({ appointment, onClose, togglePaidStatus, deleteAppointment, getStatusInfo, isHistorical }) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    deleteAppointment(appointment.id);
    setShowDeleteConfirmation(false);
  };

  // Get status text using the helper function passed from Dashboard
  const statusInfo = getStatusInfo(appointment);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Appointment Details</h2>
        <div className="mb-4 text-gray-700 dark:text-gray-300">
          <div className="font-semibold text-lg">Name: {appointment?.userInfo?.name ?? 'N/A'}</div>
          <div>Phone: {appointment?.userInfo?.phoneNumber ?? 'N/A'}</div>
          <div>Email: {appointment?.userInfo?.email ?? 'N/A'}</div>
          
          <h3 className="font-semibold mt-2">Booking Details:</h3>
          {appointment?.bookingSelection && Object.entries(appointment.bookingSelection).map(([key, value]) => (
            <div key={key}>
              <span className="font-medium">{key}:</span> {value ?? 'N/A'}
            </div>
          ))}

          <div>Estimated Time: {appointment?.estimatedTime ?? 'N/A'} {appointment?.estimatedTime ? 'minutes' : ''}</div>
          <div>Experience Level: {appointment?.experience ?? 'N/A'}</div>

          {/* Visual representation of experience */}
          <div className="flex space-x-1 mt-2">
            {[...Array(5)].map((_, index) => (
              <span
                key={index}
                className={`inline-block w-4 h-4 rounded-full ${
                  index < parseInt(appointment?.experience ?? 0) 
                    ? 'bg-primary-500' 
                    : 'bg-primary-200 dark:bg-primary-700'
                }`}
              ></span>
            ))}
          </div>

          <div>Date: {appointment?.selectedDate ? new Date(appointment.selectedDate).toLocaleDateString() : 'N/A'}</div>
          <div>Time: {appointment?.selectedTime ?? 'N/A'}</div>
          {/* Use the status text from getStatusInfo */}
          <div>Status: {statusInfo.text}</div> 
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Only show status toggle buttons for non-historical appointments */}
          {!isHistorical && (
            appointment.member === true ? (
              // Buttons for Community Members
              appointment.paid === 1 ? (
                <button
                  onClick={() => togglePaidStatus(appointment.id, false)}
                  className="btn btn-secondary"
                >
                  Mark as Not Completed
                </button>
              ) : (
                <button
                  onClick={() => togglePaidStatus(appointment.id, true)}
                  className="btn btn-primary"
                >
                  Mark as Completed
                </button>
              )
            ) : (
              // Buttons for Non-Members
              appointment.paid === 1 ? (
                <button
                  onClick={() => togglePaidStatus(appointment.id, false)}
                  className="btn btn-secondary"
                >
                  Mark as Not Paid
                </button>
              ) : (
                <button
                  onClick={() => togglePaidStatus(appointment.id, true)}
                  className="btn btn-primary"
                >
                  Mark as Paid
                </button>
              )
            )
          )}
          {/* Always show Delete and Close buttons */}
          <button
            onClick={handleDelete}
            className="btn bg-red-500 hover:bg-red-600 text-white"
          >
            Delete Appointment
          </button>
          <button
            onClick={onClose}
            className="btn bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Confirm Deletion
              </h3>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this appointment? This will:
                <ul className="list-disc ml-6 mt-2">
                  <li>Delete the appointment from the system</li>
                  <li>Re-open the timeslot for new bookings</li>
                  <li>Send a cancellation email to the customer</li>
                  <li>Keep a record in deleted appointments</li>
                </ul>
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={confirmDelete}
                  className="btn bg-red-500 hover:bg-red-600 text-white"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="btn bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;
