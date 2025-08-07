import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "../../../store/userSlice";
import { LoadingSpinner } from "../../../shared/components";
import {
  formatDate,
  formatPhoneNumber,
} from "../../../shared/utils/formatters";
import { toast } from "react-hot-toast";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const PersonalInfoTab = ({ user, onUserUpdate }) => {
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState({});
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);

  const personalFields = [
    {
      key: "name",
      label: "Full Name",
      icon: UserIcon,
      type: "text",
      required: true,
    },
    {
      key: "phone",
      label: "Phone Number",
      icon: PhoneIcon,
      type: "tel",
      required: true,
      formatter: formatPhoneNumber,
    },
    {
      key: "email",
      label: "Email Address",
      icon: EnvelopeIcon,
      type: "email",
    },
    {
      key: "alternativePhone",
      label: "Alternative Phone",
      icon: PhoneIcon,
      type: "tel",
      formatter: formatPhoneNumber,
    },
    {
      key: "address",
      label: "Address",
      icon: MapPinIcon,
      type: "textarea",
    },
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: [
        { value: "", label: "Select Gender" },
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
      ],
    },
  ];

  const handleEdit = (field) => {
    setEditMode({ ...editMode, [field]: true });
    setEditData({ ...editData, [field]: user[field] || "" });
  };

  const handleCancel = (field) => {
    setEditMode({ ...editMode, [field]: false });
    setEditData({ ...editData, [field]: "" });
  };

  const handleSave = async (field) => {
    if (
      !editData[field] &&
      personalFields.find((f) => f.key === field)?.required
    ) {
      toast.error(
        `${personalFields.find((f) => f.key === field)?.label} is required`
      );
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        updateUser({
          userId: user._id,
          userData: { [field]: editData[field] },
        })
      ).unwrap();

      setEditMode({ ...editMode, [field]: false });
      toast.success("Information updated successfully");
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      toast.error(error || "Failed to update information");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const renderField = (field) => {
    const isEditing = editMode[field.key];
    const value = user[field.key];
    const displayValue = field.formatter ? field.formatter(value) : value;

    return (
      <div
        key={field.key}
        className="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {field.icon && <field.icon className="h-4 w-4 text-gray-500" />}
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          {!isEditing && (
            <button
              onClick={() => handleEdit(field.key)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={loading}
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            {field.type === "textarea" ? (
              <textarea
                value={editData[field.key] || ""}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                rows={3}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : field.type === "select" ? (
              <select
                value={editData[field.key] || ""}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={editData[field.key] || ""}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(field.key)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => handleCancel(field.key)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-900">
            {displayValue || (
              <span className="text-gray-400 italic">Not provided</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalFields.map(renderField)}
        </div>
      </div>

      {/* Account Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Registration Date
            </label>
            <div className="text-gray-900">{formatDate(user.createdAt)}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Verification Status
            </label>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.isVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {user.isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              User Role
            </label>
            <div className="text-gray-900 capitalize">
              {user.role || "Patient"}
            </div>
          </div>

          {user.lastLoginAt && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Last Login
              </label>
              <div className="text-gray-900">
                {formatDate(user.lastLoginAt)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
