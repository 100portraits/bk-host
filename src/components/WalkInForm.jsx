import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const WalkInForm = () => {
  const [bikeType, setBikeType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [otherBikeType, setOtherBikeType] = useState('');
  const [otherServiceType, setOtherServiceType] = useState('');
  const [otherAmountPaid, setOtherAmountPaid] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if required fields are filled
    if (
      !bikeType ||
      !serviceType ||
      !amountPaid ||
      (bikeType === 'Other' && !otherBikeType) ||
      (serviceType === 'Other' && !otherServiceType) ||
      (amountPaid === 'Other' && !otherAmountPaid)
    ) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const walkInData = {
      bikeType: bikeType === 'Other' ? otherBikeType : bikeType,
      serviceType: serviceType === 'Other' ? otherServiceType : serviceType,
      amountPaid: amountPaid === 'Other' ? otherAmountPaid : amountPaid,
      notes,
      timestamp: new Date(),
    };

    try {
      await addDoc(collection(db, 'walkIns'), walkInData);
      
      // Clear form and error message on success
      setBikeType('');
      setServiceType('');
      setAmountPaid('');
      setOtherBikeType('');
      setOtherServiceType('');
      setOtherAmountPaid('');
      setNotes('');
      setErrorMessage('');
      
      // Show success message
      setSuccessMessage('Walk-in successfully recorded!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000); // Hide the message after 3 seconds
    } catch (error) {
      setErrorMessage('An error occurred while submitting. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 shadow rounded border border-red-300 bg-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Walk-in Customer</h2>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-2 bg-red-200 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-2 bg-blue-200 text-blue-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Bike Type */}
      <div className="mb-4">
        <label>Bike Type</label>
        <div className="flex space-x-2">
          {['Road Bike', 'Dutch Bike', 'Mountain/Tour Bike', 'Other'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setBikeType(type)}
              className={`p-2 border rounded ${
                bikeType === type ? 'bg-red-500 text-white' : 'bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {bikeType === 'Other' && (
          <input
            type="text"
            value={otherBikeType}
            onChange={(e) => setOtherBikeType(e.target.value)}
            placeholder="Specify other type"
            className="mt-2 p-2 border rounded w-full focus:outline-none focus:border-red-500"
            required
          />
        )}
      </div>

      {/* Service Type */}
      <div className="mb-4">
        <label>Service Type</label>
        <div className="flex space-x-2">
          {['Tire/Tube', 'Chain', 'Brakes', 'Wheel', 'Other'].map(service => (
            <button
              key={service}
              type="button"
              onClick={() => setServiceType(service)}
              className={`p-2 border rounded ${
                serviceType === service ? 'bg-red-500 text-white' : 'bg-gray-100'
              }`}
            >
              {service}
            </button>
          ))}
        </div>
        {serviceType === 'Other' && (
          <input
            type="text"
            value={otherServiceType}
            onChange={(e) => setOtherServiceType(e.target.value)}
            placeholder="Specify other service"
            className="mt-2 p-2 border rounded w-full focus:outline-none focus:border-red-500"
            required
          />
        )}
      </div>

      {/* Amount Paid */}
      <div className="mb-4">
        <label>Amount Paid (€)</label>
        <div className="flex space-x-2">
          {['5', '8', 'Other'].map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => setAmountPaid(amount)}
              className={`p-2 border rounded ${
                amountPaid === amount ? 'bg-red-500 text-white' : 'bg-gray-100'
              }`}
            >
              {amount}€
            </button>
          ))}
        </div>
        {amountPaid === 'Other' && (
          <input
            type="number"
            value={otherAmountPaid}
            onChange={(e) => setOtherAmountPaid(e.target.value)}
            placeholder="Specify amount"
            className="mt-2 p-2 border rounded w-full focus:outline-none focus:border-red-500"
            required
          />
        )}
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:border-red-500"
          placeholder="Additional notes (optional)"
        ></textarea>
      </div>

      <button type="submit" className="p-2 bg-red-500 text-white rounded hover:bg-red-600">
        Submit
      </button>
    </form>
  );
};

export default WalkInForm;
