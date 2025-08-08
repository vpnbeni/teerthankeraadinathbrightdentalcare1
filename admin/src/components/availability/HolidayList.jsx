import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { availabilityService } from '../../services/availability';
import HolidayForm from './HolidayForm';

const HolidayList = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await availabilityService.getHolidays();
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  const handleDelete = async (holidayId) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      await availabilityService.deleteHoliday(holidayId);
      toast.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Failed to delete holiday');
    }
  };

  const handleSave = async (holidayData) => {
    try {
      if (editingHoliday) {
        await availabilityService.updateHoliday(editingHoliday._id, holidayData);
        toast.success('Holiday updated successfully');
      } else {
        await availabilityService.createHoliday(holidayData);
        toast.success('Holiday created successfully');
      }
      
      setShowForm(false);
      setEditingHoliday(null);
      fetchHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast.error(`Failed to ${editingHoliday ? 'update' : 'create'} holiday`);
    }
  };

  return (
    <div className="space-y-6">
      

      {loading ? (
        <div className="text-center py-8">
          <p>Loading holidays...</p>
        </div>
      ) : holidays.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No holidays defined</h3>
            <p className="text-gray-500 mb-4">
              Add holidays to block unavailable dates in the appointment system.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Your First Holiday
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {holidays.map((holiday) => (
            <div key={holiday._id} className="border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{holiday.reason}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      holiday.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {holiday.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(holiday._id)}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded text-red-600 bg-white hover:bg-red-50"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 capitalize">{holiday.type?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2">
                      {new Date(holiday.date).toLocaleDateString()}
                    </span>
                  </div>
                  {holiday.isRecurring && (
                    <>
                      <div>
                        <span className="font-medium text-gray-700">Recurring:</span>
                        <span className="ml-2 capitalize">{holiday.recurringPattern}</span>
                      </div>
                      {holiday.recurringEndDate && (
                        <div>
                          <span className="font-medium text-gray-700">Until:</span>
                          <span className="ml-2">
                            {new Date(holiday.recurringEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Reason:</span>
                    <span className="ml-2">{holiday.reason}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <HolidayForm
          holiday={editingHoliday}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingHoliday(null);
          }}
        />
      )}
    </div>
  );
};

export default HolidayList;