import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const WalkInForm = () => {
  const [bikeType, setBikeType] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [otherBikeType, setOtherBikeType] = useState('');
  const [otherServiceType, setOtherServiceType] = useState('');
  const [otherAmountPaid, setOtherAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Check if required fields are filled
    if (
      !bikeType ||
      !serviceType ||
      !amountPaid ||
      !selectedDate ||
      (bikeType === 'Other' && !otherBikeType) ||
      (serviceType === 'Other' && !otherServiceType) ||
      (amountPaid === 'Other' && !otherAmountPaid)
    ) {
      setErrorMessage('Please fill in all required fields, including the date.');
      return;
    }
    
    // Create timestamp from selected date (set time to noon to avoid timezone issues)
    const dateParts = selectedDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2], 10);
    const timestampDate = new Date(year, month, day, 12, 0, 0); // Set to noon

    // Determine final amount and community member status
    const isCommunityMember = amountPaid === 'Community Member';
    const finalAmount = isCommunityMember ? '0' : (amountPaid === 'Other' ? otherAmountPaid : amountPaid);

    const walkInData = {
      bikeType: bikeType === 'Other' ? otherBikeType : bikeType,
      serviceType: serviceType === 'Other' ? otherServiceType : serviceType,
      amountPaid: finalAmount,
      isCommunityMember: isCommunityMember,
      notes,
      timestamp: Timestamp.fromDate(timestampDate),
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
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setErrorMessage('');
      
      // Show success message
      setSuccessMessage('Walk-in successfully recorded!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000); // Hide the message after 3 seconds
    } catch (error) {
      console.error("Error adding walk-in:", error);
      setErrorMessage('An error occurred while submitting. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-b-lg">
      <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-gray-200">Record Walk-in Customer</h2>

      {errorMessage && (
        <div className="mb-4 p-2 bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 rounded-md">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="walkin-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            id="walkin-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bike Type</label>
          <div className="flex flex-wrap gap-2">
            {['Road Bike', 'Dutch Bike', 'Mountain/Tour Bike', 'Other'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setBikeType(type)}
                className={`px-3 py-1 rounded-full ${
                  bikeType === type 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
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
              className="input mt-2 dark:bg-gray-700 dark:text-white"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Type</label>
          <div className="flex flex-wrap gap-2">
            {['Tire/Tube', 'Chain', 'Brakes', 'Wheel', 'Other'].map(service => (
              <button
                key={service}
                type="button"
                onClick={() => setServiceType(service)}
                className={`px-3 py-1 rounded-full ${
                  serviceType === service 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
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
              className="input mt-2 dark:bg-gray-700 dark:text-white"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Paid (€)</label>
          <div className="flex flex-wrap gap-2">
            {['5', '8', 'Community Member', 'Other'].map(amount => (
              <button
                key={amount}
                type="button"
                onClick={() => setAmountPaid(amount)}
                className={`px-3 py-1 rounded-full ${
                  amountPaid === amount 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                {amount === 'Community Member' ? 'Community Member (Free)' : `${amount}€`}
              </button>
            ))}
          </div>
          {amountPaid === 'Other' && (
            <input
              type="number"
              value={otherAmountPaid}
              onChange={(e) => setOtherAmountPaid(e.target.value)}
              placeholder="Specify amount"
              className="input mt-2 dark:bg-gray-700 dark:text-white"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input dark:bg-gray-700 dark:text-white"
            placeholder="Additional notes (optional)"
            rows="3"
          ></textarea>
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-6">
        Submit
      </button>
    </form>
  );
};

export default WalkInForm;