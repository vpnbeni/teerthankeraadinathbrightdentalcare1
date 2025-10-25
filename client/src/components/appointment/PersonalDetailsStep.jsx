import React, { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { VALIDATION_RULES, ERROR_MESSAGES } from "../../shared/constants";
import EmailInput from "./EmailInput";
import PhoneInput from "./PhoneInput";

const PersonalDetailsStep = ({ data, onDataChange }) => {
  const { user } = useSelector((state) => state.auth);
  const [medicalExpanded, setMedicalExpanded] = useState(false);
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    isVerified: false,
    isAvailable: null,
  });
  const [phoneValidation, setPhoneValidation] = useState({
    isValid: false,
    isAvailable: null,
    isUnique: true,
  });

  const {
    register,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      ...data.personalDetails,
      ...data.medicalInfo,
    },
  });

  // Auto-save data on change
  useEffect(() => {
    const subscription = watch((formData) => {
      const personalDetails = {
        name: formData.name || "",
        phone: formData.phone || "",
        email: formData.email || "",
        address: formData.address || "",
        alternativePhone: formData.alternativePhone || "",
      };

      const medicalInfo = {
        systemicDiseases: formData.systemicDiseases || [],
        drugAllergies: formData.drugAllergies || [],
        isPregnant: formData.isPregnant || false,
        pastTreatments: formData.pastTreatments || [],
        previousExperiences: formData.previousExperiences || [],
      };

      onDataChange({ personalDetails, medicalInfo });
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataChange]);

  // Handle email validation changes
  const handleEmailValidationChange = useCallback((validation) => {
    setEmailValidation(validation);
  }, []);

  // Handle email input change
  const handleEmailChange = useCallback((email) => {
    setValue("email", email);
  }, [setValue]);

  // Handle phone validation changes
  const handlePhoneValidationChange = useCallback((validation) => {
    setPhoneValidation(validation);

    // Set form error if phone is not unique
    if (validation.isValid && !validation.isUnique) {
      setError("phone", {
        type: "manual",
        message: "This phone number is already registered",
      });
    } else if (validation.isValid && validation.isUnique) {
      clearErrors("phone");
    }
  }, [setError, clearErrors]);

  // Handle phone input change
  const handlePhoneChange = useCallback((phone) => {
    setValue("phone", phone);
  }, [setValue]);

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 md:p-6 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Personal Information</h3>
            <p className="text-xs text-gray-600">Verify your contact details</p>
          </div>
        </div>

        <div className="relative grid md:grid-cols-2 gap-4 md:gap-5">
          {/* Full Name */}
          <div className="group">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>Full Name</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#346870] transition-colors z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="name"
                type="text"
                className={`w-full pl-11 pr-4 py-3 bg-white border-2 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#346870]/20 ${errors.name
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-[#346870] hover:border-gray-300"
                  }`}
                placeholder="Enter your full name"
                {...register("name", {
                  required: ERROR_MESSAGES.REQUIRED,
                  minLength: {
                    value: VALIDATION_RULES.NAME.MIN_LENGTH,
                    message: `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`,
                  },
                  pattern: {
                    value: VALIDATION_RULES.NAME.PATTERN,
                    message: VALIDATION_RULES.NAME.MESSAGE,
                  },
                })}
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-xs mt-2 flex items-center gap-1 font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="group">
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>Phone Number</span>
              <span className="text-red-500">*</span>
            </label>
            <PhoneInput
              value={watch("phone")}
              onChange={handlePhoneChange}
              onValidationChange={handlePhoneValidationChange}
              error={errors.phone?.message}
              currentUserPhone={user?.phone}
            />
            <input
              type="hidden"
              {...register("phone", {
                required: ERROR_MESSAGES.REQUIRED,
                pattern: {
                  value: VALIDATION_RULES.PHONE.PATTERN,
                  message: VALIDATION_RULES.PHONE.MESSAGE,
                },
                validate: (value) => {
                  if (!phoneValidation.isUnique) {
                    return "This phone number is already registered";
                  }
                  return true;
                },
              })}
            />
          </div>

          {/* Email Address */}
          <div className="group">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>Email Address</span>
              <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </label>
            <EmailInput
              value={watch("email")}
              onChange={handleEmailChange}
              onValidationChange={handleEmailValidationChange}
              error={errors.email?.message}
            />
          </div>

          {/* Alternative Phone */}
          <div className="group">
            <label htmlFor="alternativePhone" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>Alternative Phone</span>
              <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#346870] transition-colors z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                id="alternativePhone"
                type="tel"
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#346870] focus:ring-2 focus:ring-[#346870]/20 hover:border-gray-300"
                placeholder="Alternative contact number"
                {...register("alternativePhone")}
              />
            </div>
          </div>

          {/* Address - Full Width */}
          <div className="md:col-span-2 group">
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>Address</span>
              <span className="text-xs text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-500 group-focus-within:text-[#346870] transition-colors z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <textarea
                id="address"
                rows={3}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#346870] focus:ring-2 focus:ring-[#346870]/20 hover:border-gray-300 resize-none"
                placeholder="Enter your complete address"
                {...register("address")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Medical Information Section - Collapsible */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100/30 to-emerald-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <button
          type="button"
          onClick={() => setMedicalExpanded(!medicalExpanded)}
          className="relative w-full flex items-center justify-between p-5 md:p-6 text-left group hover:bg-white/30 transition-all duration-300 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${medicalExpanded
              ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25"
              : "bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/25"
              }`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Medical Information</h3>
              <p className="text-xs text-gray-600">Optional health details for better care</p>
            </div>
          </div>
          <div className={`w-8 h-8 bg-white/50 rounded-xl flex items-center justify-center transition-transform duration-300 ${medicalExpanded ? "rotate-180" : ""
            }`}>
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {medicalExpanded && (
          <div className="relative px-5 pb-5 md:px-6 md:pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Systemic Diseases */}
            <div className="group">
              <label htmlFor="systemicDiseases" className="block text-sm font-semibold text-gray-700 mb-2">
                Systemic Diseases
              </label>
              <textarea
                id="systemicDiseases"
                rows={2}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 resize-none"
                placeholder="e.g., Diabetes, Hypertension, Heart disease..."
                {...register("systemicDiseases")}
              />
            </div>

            {/* Drug Allergies */}
            <div className="group">
              <label htmlFor="drugAllergies" className="block text-sm font-semibold text-gray-700 mb-2">
                Drug Allergies
              </label>
              <textarea
                id="drugAllergies"
                rows={2}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 resize-none"
                placeholder="List any known drug allergies..."
                {...register("drugAllergies")}
              />
            </div>

            {/* Past Treatments */}
            <div className="group">
              <label htmlFor="pastTreatments" className="block text-sm font-semibold text-gray-700 mb-2">
                Past Dental Treatments
              </label>
              <textarea
                id="pastTreatments"
                rows={2}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 resize-none"
                placeholder="Describe any previous dental treatments..."
                {...register("pastTreatments")}
              />
            </div>

            {/* Previous Experiences */}
            <div className="group">
              <label htmlFor="previousExperiences" className="block text-sm font-semibold text-gray-700 mb-2">
                Previous Dental Experiences
              </label>
              <textarea
                id="previousExperiences"
                rows={2}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 resize-none"
                placeholder="Share any relevant dental experiences or concerns..."
                {...register("previousExperiences")}
              />
            </div>

            {/* Pregnancy Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-pink-50/50 border border-pink-200/50 rounded-xl">
              <input
                id="isPregnant"
                type="checkbox"
                className="w-5 h-5 text-pink-600 focus:ring-pink-500 border-gray-300 rounded-lg cursor-pointer transition-all"
                {...register("isPregnant")}
              />
              <label htmlFor="isPregnant" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Currently pregnant
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalDetailsStep;
