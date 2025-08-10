import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { VALIDATION_RULES, ERROR_MESSAGES } from "../../shared/constants";
import EmailInput from "./EmailInput";
import PhoneInput from "./PhoneInput";

const PersonalDetailsStep = ({ data, onNext, onDataChange }) => {
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
    handleSubmit,
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

  const onSubmit = (formData) => {
    // Validate phone uniqueness before proceeding
    if (!phoneValidation.isUnique) {
      return; // Don't proceed if phone is not unique
    }

    const personalDetails = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      alternativePhone: formData.alternativePhone,
    };

    const medicalInfo = {
      systemicDiseases: formData.systemicDiseases || [],
      drugAllergies: formData.drugAllergies || [],
      isPregnant: formData.isPregnant || false,
      pastTreatments: formData.pastTreatments || [],
      previousExperiences: formData.previousExperiences || [],
    };

    onDataChange({ personalDetails, medicalInfo });
    onNext();
  };

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              className={`input-field ${errors.name ? "border-red-500" : ""}`}
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
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number *
            </label>
            <PhoneInput
              value={watch("phone")}
              onChange={handlePhoneChange}
              onValidationChange={handlePhoneValidationChange}
              error={errors.phone?.message}
              currentUserPhone={user?.phone}
            />
            {/* Register the phone field for form validation */}
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

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <EmailInput
              value={watch("email")}
              onChange={handleEmailChange}
              onValidationChange={handleEmailValidationChange}
              error={errors.email?.message}
            />
          </div>

          <div>
            <label
              htmlFor="alternativePhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Alternative Phone
            </label>
            <input
              id="alternativePhone"
              type="tel"
              className="input-field"
              placeholder="Alternative contact number"
              {...register("alternativePhone")}
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            className="input-field"
            placeholder="Enter your complete address"
            {...register("address")}
          />
        </div>
      </div>

      {/* Medical Information */}
      <div>
        <button
          type="button"
          onClick={() => setMedicalExpanded(!medicalExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-800">
            Medical Information
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              medicalExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {medicalExpanded && (
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="systemicDiseases"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Systemic Diseases
              </label>
              <textarea
                id="systemicDiseases"
                rows={2}
                className="input-field"
                placeholder="List any systemic diseases (diabetes, hypertension, etc.)"
                {...register("systemicDiseases")}
              />
            </div>

            <div>
              <label
                htmlFor="drugAllergies"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Drug Allergies
              </label>
              <textarea
                id="drugAllergies"
                rows={2}
                className="input-field"
                placeholder="List any known drug allergies"
                {...register("drugAllergies")}
              />
            </div>

            <div>
              <label
                htmlFor="pastTreatments"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Past Dental Treatments
              </label>
              <textarea
                id="pastTreatments"
                rows={2}
                className="input-field"
                placeholder="Describe any previous dental treatments"
                {...register("pastTreatments")}
              />
            </div>

            <div>
              <label
                htmlFor="previousExperiences"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Previous Dental Experiences
              </label>
              <textarea
                id="previousExperiences"
                rows={2}
                className="input-field"
                placeholder="Share any relevant dental experiences or concerns"
                {...register("previousExperiences")}
              />
            </div>

            <div className="flex items-center">
              <input
                id="isPregnant"
                type="checkbox"
                className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded"
                {...register("isPregnant")}
              />
              <label
                htmlFor="isPregnant"
                className="ml-2 block text-sm text-gray-700"
              >
                Currently pregnant
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!phoneValidation.isUnique || !phoneValidation.isValid}
        >
          Continue to Date Selection
        </button>
      </div>
    </form>
  );
};

export default PersonalDetailsStep;
