import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const HolidayForm = ({ holiday, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
    type: 'public_holiday',
    isRecurring: false,
    recurringPattern: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (holiday) {
      setFormData({
        date: holiday.date ? holiday.date.split('T')[0] : '',
        reason: holiday.reason || '',
        type: holiday.type || 'public_holiday',
        isRecurring: holiday.isRecurring || false,
        recurringPattern: holiday.recurringPattern || '',
        isActive: holiday.isActive !== undefined ? holiday.isActive : true
      });
    }
  }, [holiday]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (formData.isRecurring && !formData.recurringPattern) {
      newErrors.recurringPattern = 'Recurring pattern is required when holiday is recurring';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Clean up formData before sending
      const cleanedData = { ...formData };
      
      // Remove recurringPattern if not recurring or if it's empty
      if (!cleanedData.isRecurring || cleanedData.recurringPattern === '') {
        delete cleanedData.recurringPattern;
      }
      
      await onSave(cleanedData);
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast.error(error.response?.data?.message || 'Failed to save holiday');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleRecurringToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      isRecurring: checked,
      recurringPattern: checked ? prev.recurringPattern : undefined
    }));
    
    if (!checked && errors.recurringPattern) {
      setErrors(prev => ({
        ...prev,
        recurringPattern: undefined
      }));
    }
  };

  const typeOptions = [
    { value: 'public_holiday', label: 'Public Holiday', description: 'National or religious holidays' },
    { value: 'clinic_closed', label: 'Clinic Closed', description: 'Clinic is closed for business' },
    { value: 'doctor_unavailable', label: 'Doctor Unavailable', description: 'Doctor is not available' },
    { value: 'maintenance', label: 'Maintenance', description: 'Equipment or facility maintenance' }
  ];

  const recurringOptions = [
    { value: 'yearly', label: 'Yearly', description: 'Repeats every year on the same date' },
    { value: 'monthly', label: 'Monthly', description: 'Repeats every month on the same day' },
    { value: 'weekly', label: 'Weekly', description: 'Repeats every week on the same day' }
  ];

  // Ensure DOM exists for portal (avoid SSR/test issues)
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-gray-900/50 backdrop-blur-sm overflow-y-auto"
    >
      <div className="min-h-full flex items-start justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative mt-6 w-full max-w-md p-6 md:p-8 border border-gray-200 shadow-2xl rounded-3xl bg-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {holiday ? 'Edit Holiday' : 'Add New Holiday'}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {holiday ? 'Update the holiday information.' : 'Add a new holiday or unavailable date.'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date *
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.date ? 'border-red-500' : ''
                }`}
              />
              <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Reason *
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="e.g., Christmas, Doctor Sick, Clinic Maintenance"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                errors.reason ? 'border-red-500' : ''
              }`}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center space-x-2">
            <input
              id="isRecurring"
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => handleRecurringToggle(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="space-y-0.5">
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                Recurring Holiday
              </label>
              <p className="text-sm text-gray-500">
                Holiday repeats based on a pattern
              </p>
            </div>
          </div>

          {/* Recurring Pattern */}
          {formData.isRecurring && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Recurring Pattern *
              </label>
              <select
                value={formData.recurringPattern}
                onChange={(e) => handleInputChange('recurringPattern', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.recurringPattern ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select pattern</option>
                {recurringOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.recurringPattern && (
                <p className="text-sm text-red-500">{errors.recurringPattern}</p>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Recurring Holiday Info</p>
                  <p className="text-blue-700">This holiday will automatically apply to future dates based on the selected pattern.</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Active Toggle */}
          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving...' : (holiday ? 'Update Holiday' : 'Add Holiday')}
            </motion.button>
          </div>
        </form>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
};

export default HolidayForm;