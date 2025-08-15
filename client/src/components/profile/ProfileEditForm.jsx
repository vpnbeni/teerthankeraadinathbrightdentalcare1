import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "../../store/authSlice";
import userService from "../../services/user";
import { LoadingSpinner } from "../../shared/components";
import { sendPhoneOTPForProfile, verifyPhoneOTPForProfile, sendEmailOTP, verifyEmailOTP } from "../../services/auth";
import showToast from "../../shared/utils/toast";

const ProfileEditForm = ({ profile, type, onUserUpdate }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(profile);
  
  // OTP verification states
  const [phoneOtpStep, setPhoneOtpStep] = useState(false);
  const [emailOtpStep, setEmailOtpStep] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  // Track which phone number is verified; if input differs, hide verified badge
  const [verifiedPhone, setVerifiedPhone] = useState(
    profile?.phoneVerified ? profile?.phone : null
  );

  useEffect(() => {
    setVerifiedPhone(profile?.phoneVerified ? profile?.phone : null);
  }, [profile]);

  const isPhoneVerifiedForCurrentInput = useMemo(() => {
    return Boolean(
      verifiedPhone && formData?.phone && verifiedPhone === formData.phone
    );
  }, [verifiedPhone, formData?.phone]);

  useEffect(() => {
    if (profile) {
      setCurrentUser(profile);
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

  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSendPhoneOTP = async () => {
    if (!validatePhone(formData.phone)) {
      showToast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setOtpLoading(true);
    try {
      await sendPhoneOTPForProfile(formData.phone);
      setPhoneOtpStep(true);
      showToast.success("OTP sent to your phone number");
      startResendCooldown();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      showToast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      const result = await verifyPhoneOTPForProfile(formData.phone, phoneOtp);
      showToast.success("Phone number verified successfully!");
      setPhoneOtpStep(false);
      setPhoneOtp("");
      
      // Update local user state immediately
      if (result.user) {
        setCurrentUser(result.user);
        setVerifiedPhone(result.user.phone || formData.phone);
        // Update the auth store directly
        dispatch(updateUser(result.user));
        // Update the user data in parent component
        if (onUserUpdate) {
          onUserUpdate(result.user);
        }
      }
    } catch (error) {
      showToast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startEmailResendCooldown = () => {
    setEmailResendCooldown(30);
    const interval = setInterval(() => {
      setEmailResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSendEmailOTP = async () => {
    if (!validateEmail(formData.email)) {
      showToast.error("Please enter a valid email address");
      return;
    }

    setOtpLoading(true);
    try {
      await sendEmailOTP(formData.email);
      setEmailOtpStep(true);
      showToast.success("OTP sent to your email address");
      startEmailResendCooldown();
    } catch (error) {
      showToast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      showToast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      const result = await verifyEmailOTP(formData.email, emailOtp);
      showToast.success("Email address verified successfully!");
      setEmailOtpStep(false);
      setEmailOtp("");
      
      // Update local user state immediately
      const updatedUser = { ...profile, emailVerified: true };
      setCurrentUser(updatedUser);
      // Update the auth store directly
      dispatch(updateUser(updatedUser));
      // Update the user data in parent component
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (error) {
      showToast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    let nextValue = inputType === "checkbox" ? checked : value;
    if (name === "phone" || name === "alternativePhone") {
      nextValue = nextValue.replace(/\D/g, "");
    }
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Reset OTP UI when phone number changes
    if (name === "phone") {
      setPhoneOtpStep(false);
      setPhoneOtp("");
      // Reset verified badge unless matches previously verified number
      if (verifiedPhone && nextValue !== verifiedPhone) {
        setVerifiedPhone(null);
      }
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

    // If phone number was changed and not verified for current input, trigger OTP and block submit
    if (type === "personal" && formData.phone && !isPhoneVerifiedForCurrentInput) {
      showToast.info("Please verify your new phone number via OTP");
      if (!phoneOtpStep) {
        try {
          await handleSendPhoneOTP();
        } catch {}
      }
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
        const response = await userService.updatePersonalInfo(personalData);
        // Update user in auth store with the response
        if (response.data.user) {
          dispatch(updateUser(response.data.user));
          setCurrentUser(response.data.user);
          if (response.data.user.phoneVerified) {
            setVerifiedPhone(response.data.user.phone);
          }
          showToast.success("Personal information updated successfully");
        }
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
        const response = await userService.updateMedicalInfo(medicalData);
        // Update user in auth store with the response
        if (response.data.user) {
          dispatch(updateUser(response.data.user));
          setCurrentUser(response.data.user);
          showToast.success("Medical information updated successfully");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (type === "personal") {
    return (
      <div className="space-y-6">
        
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
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  maxLength="10"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870] ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your phone number"
                />
                {isPhoneVerifiedForCurrentInput && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
              
              {/* Phone OTP Section */}
              {formData.phone && !isPhoneVerifiedForCurrentInput && (
                <div className="mt-3 space-y-3">
                  {!phoneOtpStep ? (
                    <button
                      type="button"
                      onClick={handleSendPhoneOTP}
                      disabled={otpLoading}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 disabled:opacity-50"
                    >
                      {otpLoading ? "Sending..." : "Send OTP"}
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#346870]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhoneOTP}
                        disabled={otpLoading || phoneOtp.length !== 6}
                        className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-md hover:bg-green-100 disabled:opacity-50"
                      >
                        {otpLoading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  )}
                  {phoneOtpStep && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOTP}
                      disabled={resendCooldown > 0 || otpLoading}
                      className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#346870] ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your email address"
                />
                {profile?.emailVerified && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
              
              {/* Email OTP Section */}
              {formData.email && !profile?.emailVerified && (
                <div className="mt-3 space-y-3">
                  {!emailOtpStep ? (
                    <button
                      type="button"
                      onClick={handleSendEmailOTP}
                      disabled={otpLoading}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md hover:bg-blue-100 disabled:opacity-50"
                    >
                      {otpLoading ? "Sending..." : "Send OTP"}
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#346870]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOTP}
                        disabled={otpLoading || emailOtp.length !== 6}
                        className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-md hover:bg-green-100 disabled:opacity-50"
                      >
                        {otpLoading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  )}
                  {emailOtpStep && (
                    <button
                      type="button"
                      onClick={handleSendEmailOTP}
                      disabled={emailResendCooldown > 0 || otpLoading}
                      className="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : "Resend OTP"}
                    </button>
                  )}
                </div>
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
      </div>
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
