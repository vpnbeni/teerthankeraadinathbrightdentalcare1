import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { availabilityService } from '../../services/availability';
import HolidayForm from './HolidayForm';
import { motion } from 'framer-motion';

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
        <div className="text-center py-16">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <CalendarIcon className="h-10 w-10 text-amber-600" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No holidays defined</h3>
          <p className="text-gray-600 mb-6">
            Add holidays to block unavailable dates in the appointment system.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Add Your First Holiday
          </motion.button>
        </div>
      ) : (
        <div className="space-y-4">
          {holidays.map((holiday, index) => (
            <motion.div
              key={holiday._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      holiday.type === 'public_holiday'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25'
                        : holiday.type === 'clinic_closed'
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 shadow-red-500/25'
                        : 'bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/25'
                    }`}>
                      <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{holiday.reason}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          holiday.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {holiday.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 capitalize">
                          {holiday.type?.replace('_', ' ')}
                        </span>
                        {holiday.isRecurring && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 capitalize">
                            {holiday.recurringPattern}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(holiday.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    {holiday.isRecurring && holiday.recurringEndDate && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Until</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(holiday.recurringEndDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 lg:flex-col">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(holiday)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="text-sm">Edit</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(holiday._id)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="text-sm">Delete</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
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