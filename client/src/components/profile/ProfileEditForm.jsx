import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchUserProfile } from "../../store/userSlice";
import userService from "../../services/user";
import { LoadingSpinner } from "../../shared/components";

const ProfileEditForm = ({ profile, type }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      if (type === "personal") {
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          address: profile.address || "",
          gender: profile.gender || "",
          alternativePhone: profile.alternativePhone || "",
        });
      } else if (type === "medical") {
        setFormData({
          systemicDiseases:
            profile.medicalInfo?.systemicDiseases?.join(", ") || "",
          drugAllergies: profile.medicalInfo?.drugAllergies?.join(", ") || "",
          isPregnant: profile.medicalInfo?.isPregnant || false,
          pastTreatments: profile.medicalInfo?.pastTreatments?.join(", ") || "",
          previousExperiences:
            profile.medicalInfo?.previousExperiences?.join(", ") || "",
        });
      }
    }
  }, [profile, type]);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (type === "personal") {
      if (!formData.name?.trim()) {
        newErrors.name = "Name is required";
      }
      if (!formData.phone?.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
        newErrors.phone = "Please enter a valid 10-digit phone number";
      }
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (type === "personal") {
        const personalData = {
          name: formData.name.trim(),
          email: formData.email?.trim() || null,
          phone: formData.phone.trim(),
          address: formData.address?.trim() || null,
          gender: formData.gender || null,
          alternativePhone: formData.alternativePhone?.trim() || null,
        };
        await userService.updatePersonalInfo(personalData);
      } else if (type === "medical") {
        const medicalData = {
          systemicDiseases: formData.systemicDiseases
            ? formData.systemicDiseases
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          drugAllergies: formData.drugAllergies
            ? formData.drugAllergies
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          isPregnant: formData.isPregnant,
          pastTreatments: formData.pastTreatments
            ? formData.pastTreatments
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          previousExperiences: formData.previousExperiences
            ? formData.previousExperiences
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        };
        await userService.updateMedicalInfo(medicalData);
      }

      // Refresh user profile in store
      await dispatch(fetchUserProfile()).unwrap();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (type === "personal") {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870] ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870] ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870] ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternative Phone
            </label>
            <input
              type="tel"
              name="alternativePhone"
              value={formData.alternativePhone || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870]"
              placeholder="Enter alternative phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870]"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870]"
            placeholder="Enter your complete address"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>Update Personal Info</span>
          </button>
        </div>
      </form>
    );
  }

  if (type === "medical") {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Systemic Diseases
            </label>
            <input
              type="text"
              name="systemicDiseases"
              value={formData.systemicDiseases || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870]"
              placeholder="Enter systemic diseases (comma-separated)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple diseases with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drug Allergies
            </label>
            <input
              type="text"
              name="drugAllergies"
              value={formData.drugAllergies || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870]"
              placeholder="Enter drug allergies (comma-separated)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple allergies with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Past Treatments
            </label>
            <textarea
              name="pastTreatments"
              value={formData.pastTreatments || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870]"
              placeholder="Enter past dental treatments (comma-separated)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple treatments with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Previous Experiences
            </label>
            <textarea
              name="previousExperiences"
              value={formData.previousExperiences || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870]"
              placeholder="Enter previous dental experiences (comma-separated)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple experiences with commas
            </p>
          </div>

          {formData.gender === "female" && (
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPregnant"
                checked={formData.isPregnant || false}
                onChange={handleChange}
                className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Currently pregnant
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>Update Medical Info</span>
          </button>
        </div>
      </form>
    );
  }

  return null;
};

export default ProfileEditForm;
