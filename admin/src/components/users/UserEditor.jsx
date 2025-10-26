import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../../shared/components";
import userService from "../../services/users";
import { toast } from "react-hot-toast";
import { 
  XMarkIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  CheckCircleIcon 
} from "@heroicons/react/24/outline";

const UserEditor = ({ user, onClose, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gender: "",
    alternativePhone: "",
  });

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
        gender: user.gender || "",
        alternativePhone: user.alternativePhone || "",
      });
    }
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setLoading(true);

    try {
      if (user) {
        // Update existing user
        await userService.updateUser(user._id, formData);
        toast.success("User updated successfully");
      } else {
        // Create new user (if needed)
        toast.error("User creation not implemented yet");
        return;
      }

      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 md:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#5fa8b5]/20 to-[#346870]/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#5fa8b5] to-[#346870] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shadow-[#346870]/30 flex-shrink-0">
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                  {user ? "Edit User" : "Create User"}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">
                  {user ? "Update user information" : "Add a new user to the system"}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              disabled={loading}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all disabled:opacity-50 flex-shrink-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength={10}
                className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all"
                placeholder="Enter 10-digit phone number"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                Alternative Phone
              </label>
              <input
                type="tel"
                name="alternativePhone"
                value={formData.alternativePhone}
                onChange={handleChange}
                maxLength={10}
                className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all"
                placeholder="Enter alternative phone number"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all resize-none"
              placeholder="Enter complete address"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={
                loading || !formData.name.trim() || !formData.phone.trim()
              }
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#346870] to-[#5fa8b5] hover:shadow-lg hover:shadow-[#346870]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  {user ? "Update User" : "Create User"}
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UserEditor;
