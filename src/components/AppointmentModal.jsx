import React from 'react';

const AppointmentModal = ({ appointment, onClose, markAsCompleted, markAsNoShow, undoStatusChange }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Appointment Details</h2>
        <div className="mb-4 text-gray-700 dark:text-gray-300">
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
                className={`inline-block w-4 h-4 rounded-full ${
                  index < parseInt(appointment.experience) 
                    ? 'bg-primary-500' 
                    : 'bg-primary-200 dark:bg-primary-700'
                }`}
              ></span>
            ))}
          </div>

          <div>Date: {new Date(appointment.selectedDate).toLocaleDateString()}</div>
          <div>Time: {appointment.selectedTime}</div>
          <div>Status: {appointment.completed ? 'Completed' : appointment.noShow ? 'No-show' : 'Pending'}</div>
        </div>

        <div className="flex space-x-2">
          {(appointment.completed || appointment.noShow) ? (
            <button
              onClick={() => undoStatusChange(appointment.id)}
              className="btn btn-secondary"
            >
              Undo
            </button>
          ) : (
            <>
              <button
                onClick={() => markAsCompleted(appointment.id)}
                className="btn btn-primary"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => markAsNoShow(appointment.id)}
                className="btn btn-secondary"
              >
                No-show
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="btn bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
