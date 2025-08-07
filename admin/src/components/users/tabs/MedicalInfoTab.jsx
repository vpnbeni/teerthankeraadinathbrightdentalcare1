import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "../../../store/userSlice";
import { LoadingSpinner } from "../../../shared/components";
import { formatDate } from "../../../shared/utils/formatters";
import { toast } from "react-hot-toast";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  HeartIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const MedicalInfoTab = ({ user, onUserUpdate }) => {
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState({});
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [newItems, setNewItems] = useState({});

  const medicalInfo = user.medicalInfo || {};

  const handleEdit = (field) => {
    setEditMode({ ...editMode, [field]: true });
    if (field === "systemicDiseases" || field === "drugAllergies") {
      setEditData({ ...editData, [field]: [...(medicalInfo[field] || [])] });
    } else if (field === "pastTreatments" || field === "previousExperiences") {
      setEditData({ ...editData, [field]: [...(medicalInfo[field] || [])] });
    } else {
      setEditData({ ...editData, [field]: medicalInfo[field] || false });
    }
  };

  const handleCancel = (field) => {
    setEditMode({ ...editMode, [field]: false });
    setEditData({ ...editData, [field]: null });
    setNewItems({ ...newItems, [field]: "" });
  };

  const handleSave = async (field) => {
    setLoading(true);
    try {
      const updatedMedicalInfo = {
        ...medicalInfo,
        [field]: editData[field],
      };

      await dispatch(
        updateUser({
          userId: user._id,
          userData: { medicalInfo: updatedMedicalInfo },
        })
      ).unwrap();

      setEditMode({ ...editMode, [field]: false });
      toast.success("Medical information updated successfully");
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      toast.error(error || "Failed to update medical information");
    } finally {
      setLoading(false);
    }
  };

  const handleArrayAdd = (field) => {
    const newItem = newItems[field]?.trim();
    if (newItem) {
      const currentArray = editData[field] || [];
      if (!currentArray.includes(newItem)) {
        setEditData({
          ...editData,
          [field]: [...currentArray, newItem],
        });
        setNewItems({ ...newItems, [field]: "" });
      } else {
        toast.error("Item already exists");
      }
    }
  };

  const handleArrayRemove = (field, index) => {
    const currentArray = editData[field] || [];
    setEditData({
      ...editData,
      [field]: currentArray.filter((_, i) => i !== index),
    });
  };

  const handleBooleanChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const renderArrayField = (
    field,
    label,
    placeholder,
    colorClass = "bg-gray-100 text-gray-800"
  ) => {
    const isEditing = editMode[field];
    const items = medicalInfo[field] || [];

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {!isEditing && (
            <button
              onClick={() => handleEdit(field)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={loading}
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItems[field] || ""}
                onChange={(e) =>
                  setNewItems({ ...newItems, [field]: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                placeholder={placeholder}
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), handleArrayAdd(field))
                }
              />
              <button
                onClick={() => handleArrayAdd(field)}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(editData[field] || []).map((item, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${colorClass}`}
                >
                  {item}
                  <button
                    onClick={() => handleArrayRemove(field, index)}
                    className="ml-2 text-current hover:text-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleSave(field)}
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
                onClick={() => handleCancel(field)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            {items.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {items.map((item, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${colorClass}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">None reported</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBooleanField = (field, label, description) => {
    const isEditing = editMode[field];
    const value = medicalInfo[field];

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => handleEdit(field)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={loading}
            >
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={field}
                  checked={editData[field] === true}
                  onChange={() => handleBooleanChange(field, true)}
                  className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={field}
                  checked={editData[field] === false}
                  onChange={() => handleBooleanChange(field, false)}
                  className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(field)}
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
                onClick={() => handleCancel(field)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                value === true
                  ? "bg-red-100 text-red-800"
                  : value === false
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {value === true
                ? "Yes"
                : value === false
                ? "No"
                : "Not specified"}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Medical Conditions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HeartIcon className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Medical Conditions
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderArrayField(
            "systemicDiseases",
            "Systemic Diseases",
            "Add systemic disease",
            "bg-red-100 text-red-800"
          )}
          {renderArrayField(
            "drugAllergies",
            "Drug Allergies",
            "Add drug allergy",
            "bg-orange-100 text-orange-800"
          )}
          {renderBooleanField(
            "isPregnant",
            "Pregnancy Status",
            "Current pregnancy status (for female patients)"
          )}
        </div>
      </div>

      {/* Treatment History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Treatment History
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {renderArrayField(
            "pastTreatments",
            "Past Treatments",
            "Add past treatment",
            "bg-blue-100 text-blue-800"
          )}
          {renderArrayField(
            "previousExperiences",
            "Previous Dental Experiences",
            "Add previous experience",
            "bg-purple-100 text-purple-800"
          )}
        </div>
      </div>

      {/* Medical History Summary */}
      {(medicalInfo.systemicDiseases?.length > 0 ||
        medicalInfo.drugAllergies?.length > 0 ||
        medicalInfo.isPregnant === true) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Medical Alert Summary
              </h4>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This patient has the following medical considerations:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {medicalInfo.systemicDiseases?.length > 0 && (
                    <li>
                      Systemic diseases:{" "}
                      {medicalInfo.systemicDiseases.join(", ")}
                    </li>
                  )}
                  {medicalInfo.drugAllergies?.length > 0 && (
                    <li>
                      Drug allergies: {medicalInfo.drugAllergies.join(", ")}
                    </li>
                  )}
                  {medicalInfo.isPregnant === true && (
                    <li>Currently pregnant</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {user.updatedAt && (
        <div className="text-sm text-gray-500 text-center">
          Medical information last updated: {formatDate(user.updatedAt)}
        </div>
      )}
    </div>
  );
};

export default MedicalInfoTab;
