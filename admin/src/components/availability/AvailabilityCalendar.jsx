import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, getDaysInMonth, getDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { toast } from 'react-hot-toast';
import { availabilityService } from '../../services/availability';

const AvailabilityCalendar = ({ templates = [], holidays = [], onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [availabilityData, setAvailabilityData] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Load availability data for current month
  useEffect(() => {
    loadMonthAvailability();
  }, [currentDate]);

  const loadMonthAvailability = async () => {
    setCalendarLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      const response = await availabilityService.getAvailabilityForDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      setAvailabilityData(response.data || {});
    } catch (error) {
      console.error('Error loading month availability:', error);
      toast.error('Failed to load availability data');
    } finally {
      setCalendarLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    
    const dateKey = date.toISOString().split('T')[0];
    setSelectedDates(prev => {
      const isSelected = prev.some(d => d.toISOString().split('T')[0] === dateKey);
      if (isSelected) {
        return prev.filter(d => d.toISOString().split('T')[0] !== dateKey);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleApplyTemplate = () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    setShowApplyModal(true);
  };

  const confirmApplyTemplate = async () => {
    setLoading(true);
    try {
      const dates = selectedDates.map(date => date.toISOString().split('T')[0]);
      await availabilityService.applyTemplateToDate(selectedTemplate, dates);
      
      setShowApplyModal(false);
      setSelectedDates([]);
      setSelectedTemplate('');
      await loadMonthAvailability();
      onRefresh();
      
      toast.success(`Template applied to ${dates.length} date(s) successfully`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template to selected dates');
    } finally {
      setLoading(false);
    }
  };

  const getDateInfo = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const availability = availabilityData[dateKey];
    const holiday = holidays.find(h => 
      isSameDay(new Date(h.date), date)
    );

    return {
      availability,
      holiday,
      isSelected: selectedDates.some(d => 
        d.toISOString().split('T')[0] === dateKey
      )
    };
  };

  const renderDateCell = (date) => {
    const { availability, holiday, isSelected } = getDateInfo(date);
    
    let bgColor = 'bg-white';
    let textColor = 'text-gray-900';
    let indicator = null;

    if (holiday) {
      bgColor = 'bg-red-50';
      textColor = 'text-red-700';
      indicator = (
        <div className="w-2 h-2 bg-red-500 rounded-full absolute top-1 right-1"></div>
      );
    } else if (availability) {
      if (availability.available) {
        if (availability.template?.isDefault) {
          bgColor = 'bg-green-50';
          textColor = 'text-green-700';
          indicator = (
            <div className="w-2 h-2 bg-green-500 rounded-full absolute top-1 right-1"></div>
          );
        } else {
          bgColor = 'bg-blue-50';
          textColor = 'text-blue-700';
          indicator = (
            <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1 right-1"></div>
          );
        }
      } else {
        bgColor = 'bg-gray-50';
        textColor = 'text-gray-500';
      }
    }

    if (isSelected) {
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-900';
    }

    return (
      <div 
        className={`
          relative p-2 h-10 w-10 flex items-center justify-center rounded cursor-pointer
          hover:bg-gray-100 transition-colors ${bgColor} ${textColor}
          ${isSelected ? 'ring-2 ring-purple-500' : ''}
        `}
        onClick={() => handleDateSelect(date)}
      >
        {format(date, 'd')}
        {indicator}
      </div>
    );
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const defaultTemplate = templates.find(t => t.isDefault);
  const customTemplates = templates.filter(t => !t.isDefault);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Legend</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm">Default Template</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-sm">Custom Template</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-sm">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
              <span className="text-sm">Selected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Template Application Controls */}
      <div className="border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Apply Template to Dates
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <select 
                  value={selectedTemplate} 
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select template to apply</option>
                  {templates.filter(t => !t.isDefault).map(template => (
                    <option key={template._id} value={template._id}>
                      {template.templateName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleApplyTemplate}
                disabled={selectedDates.length === 0 || !selectedTemplate}
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                Apply to {selectedDates.length} date(s)
              </button>
            </div>
            
            {selectedDates.length > 0 && (
              <div className="text-sm text-gray-600">
                Selected dates: {selectedDates.map(date => format(date, 'MMM dd')).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousMonth}
                disabled={calendarLoading}
                className="p-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                disabled={calendarLoading}
                className="p-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {calendarLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  return (
                    <div key={index} className={`${isCurrentMonth ? '' : 'opacity-50'}`}>
                      {renderDateCell(date)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Application Confirmation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Apply Template to Dates</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to apply the selected template to {selectedDates.length} date(s)?
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium">Template:</p>
                <p className="text-sm text-gray-600">
                  {templates.find(t => t._id === selectedTemplate)?.templateName}
                </p>
              </div>
              
              <div>
                <p className="font-medium">Selected Dates:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDates.map((date, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {format(date, 'MMM dd, yyyy')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Note:</p>
                  <p>This will override any existing custom templates for these dates.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApplyTemplate}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;