import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisHorizontalIcon, PencilIcon, TrashIcon, StarIcon, CalendarIcon, ClockIcon, ExclamationTriangleIcon, CogIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const TemplateList = ({ templates = [], onEdit, onDelete, onRefresh }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDeleteClick = (template) => {
    setDeleteConfirm(template);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await onDelete(deleteConfirm._id);
      setDeleteConfirm(null);
    }
  };

  const formatTimeSlot = (start, end) => {
    return `${start} - ${end}`;
  };

  const formatBreakTimes = (breakTimes) => {
    if (!breakTimes || breakTimes.length === 0) {
      return 'None';
    }
    return breakTimes.map(bt => `${bt.start}-${bt.end} (${bt.reason})`).join(', ');
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-16">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <CalendarIcon className="h-10 w-10 text-indigo-600" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
        <p className="text-gray-600 mb-4">Create your first availability template to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            className="group bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100/50 hover:shadow-lg hover:shadow-indigo-200/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700 mb-1">Total Templates</p>
                <p className="text-3xl font-bold text-indigo-900">{templates.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -2 }}
            className="group bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-100/50 hover:shadow-lg hover:shadow-amber-200/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Default Template</p>
                <p className="text-3xl font-bold text-amber-900">{templates.filter(t => t.isDefault).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <StarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -2 }}
            className="group bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border border-cyan-100/50 hover:shadow-lg hover:shadow-cyan-200/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700 mb-1">Custom Templates</p>
                <p className="text-3xl font-bold text-cyan-900">{templates.filter(t => !t.isDefault).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Templates Cards */}
        <div className="space-y-4">
          {templates.map((template, index) => (
            <motion.div
              key={template._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                      template.isDefault 
                        ? 'bg-gradient-to-br from-amber-500 to-yellow-500 shadow-amber-500/25' 
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25'
                    }`}>
                      {template.isDefault ? (
                        <StarIconSolid className="h-5 w-5 text-white" />
                      ) : (
                        <CogIcon className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.templateName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {template.isDefault && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            Default
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          template.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Working Hours</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatTimeSlot(template.workingHours.start, template.workingHours.end)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Slot Duration</p>
                        <p className="text-sm font-medium text-gray-900">{template.slotDuration} min</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Break Times</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {template.breakTimes?.length || 0} break(s)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(template.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 lg:flex-col">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit(template)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="text-sm">Edit</span>
                  </motion.button>
                  {!template.isDefault && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteClick(template)}
                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="text-sm">Delete</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-gray-900/50 backdrop-blur-sm overflow-y-auto"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Template</h3>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete the template "{deleteConfirm?.templateName}"?
                      This action cannot be undone and will affect any dates where this template is applied.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all"
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>,
          document.body
        )}
    </>
  );
};

export default TemplateList;