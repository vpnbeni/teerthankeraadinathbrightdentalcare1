import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "../../store/authSlice";
import userService from "../../services/user";
import { LoadingSpinner } from "../../shared/components";
import { sendPhoneOTPForProfile, verifyPhoneOTPForProfile, sendEmailOTP, verifyEmailOTP } from "../../services/auth";
import showToast from "../../shared/utils/toast";
import { useAuth } from "../../hooks/useAuth";

// Profile Photo Upload Component
const ProfilePhotoUpload = ({ currentPhoto, onPhotoUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentPhoto || null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setPreviewUrl(currentPhoto || null);
  }, [currentPhoto]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast.error("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const response = await userService.uploadProfilePhoto(selectedFile);
      if (response.data.success && response.data.data.user) {
        showToast.success("Profile photo updated successfully!");
        onPhotoUpdate(response.data.data.user);
        setSelectedFile(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast.error(error.response?.data?.message || "Failed to upload profile photo");
      // Revert preview
      setPreviewUrl(currentPhoto || null);
      setSelectedFile(null);
      setShowPreview(false);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(currentPhoto || null);
    setShowPreview(false);
  };

  return (
    <div className="bg-gradient-to-r from-[#346870]/5 to-blue-50 rounded-lg p-6 border border-[#346870]/20">
      <h4 className="text-md font-semibold text-gray-800 mb-4">Profile Photo</h4>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Photo Preview */}
        <div className="relative">
          <div className="h-32 w-32 rounded-full overflow-hidden bg-[#346870] flex items-center justify-center border-4 border-white shadow-lg">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-white text-4xl font-medium">
                {currentPhoto ? "?" : "?"}
              </span>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <p className="text-sm text-gray-600">
            Upload a profile photo to personalize your account. Recommended size: 300x300px
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="btn-secondary cursor-pointer inline-flex items-center">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Choose Photo
            </label>

            {showPreview && selectedFile && (
              <>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary inline-flex items-center"
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Upload Photo
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Accepted formats: JPEG, PNG, WebP • Max size: 5MB
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfileEditForm = ({ profile, type, onUserUpdate }) => {
  const dispatch = useDispatch();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(profile);
  // Control editability of verified fields
  const [canEditPhone, setCanEditPhone] = useState(true);
  const [canEditEmail, setCanEditEmail] = useState(true);
  
  // OTP verification states
  const [phoneOtpStep, setPhoneOtpStep] = useState(false);
  const [emailOtpStep, setEmailOtpStep] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [phoneVerificationComplete, setPhoneVerificationComplete] = useState(false);
  const [emailVerificationComplete, setEmailVerificationComplete] = useState(false);

  // Track which phone number is verified; if input differs, hide verified badge
  const [verifiedPhone, setVerifiedPhone] = useState(
    profile?.phoneVerified ? profile?.phone : null
  );

  useEffect(() => {
    setVerifiedPhone(profile?.phoneVerified ? profile?.phone : null);
  }, [profile]);

  const isPhoneVerifiedForCurrentInput = useMemo(() => {
    const result = Boolean(
      verifiedPhone && formData?.phone && verifiedPhone === formData.phone
    );
    console.log("isPhoneVerifiedForCurrentInput:", {
      result,
      verifiedPhone,
      formDataPhone: formData?.phone,
      phoneVerified: profile?.phoneVerified,
      phoneVerificationComplete
    });
    return result;
  }, [verifiedPhone, formData?.phone, profile?.phoneVerified, phoneVerificationComplete]);

  useEffect(() => {
    if (profile) {
      console.log("ProfileEditForm: Profile updated", profile);
      setCurrentUser(profile);
      // Initialize editability based on verification flags from profile
      setCanEditPhone(!Boolean(profile.phoneVerified));
      setCanEditEmail(!Boolean(profile.emailVerified));
      setPhoneVerificationComplete(Boolean(profile.phoneVerified));
      setEmailVerificationComplete(Boolean(profile.emailVerified));
      
      // Reset OTP states when profile changes (e.g., after verification)
      setPhoneOtpStep(false);
      setPhoneOtp("");
      setEmailOtpStep(false);
      setEmailOtp("");
      
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
      if (result.data && result.data.user) {
        const userData = result.data.user;
        setCurrentUser(userData);
        // Update verifiedPhone to the newly verified phone number
        setVerifiedPhone(userData.phone);
        // Update form data to match the verified phone number
        setFormData(prev => ({
          ...prev,
          phone: userData.phone
        }));
        // Update the auth store directly
        dispatch(updateUser(userData));
        // Update the user data in parent component
        if (onUserUpdate) {
          onUserUpdate(userData);
        }
        // Lock phone editing after successful verification/update
        if (userData.phoneVerified) {
          setCanEditPhone(false);
          setPhoneVerificationComplete(true);
        }
        
        // Refresh auth context to ensure all components have updated user data
        try {
          await refreshUser();
        } catch (refreshError) {
          console.warn("Failed to refresh user after phone verification:", refreshError);
        }
      } else if (result.user) {
        // Fallback for direct user object in response
        setCurrentUser(result.user);
        setVerifiedPhone(result.user.phone);
        setFormData(prev => ({
          ...prev,
          phone: result.user.phone
        }));
        dispatch(updateUser(result.user));
        if (onUserUpdate) {
          onUserUpdate(result.user);
        }
        if (result.user.phoneVerified) {
          setCanEditPhone(false);
          setPhoneVerificationComplete(true);
        }
        
        // Refresh auth context to ensure all components have updated user data
        try {
          await refreshUser();
        } catch (refreshError) {
          console.warn("Failed to refresh user after phone verification:", refreshError);
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
      // Lock email editing after successful verification/update
      setCanEditEmail(false);
      setEmailVerificationComplete(true);
    } catch (error) {
      showToast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    // Prevent editing of verified contact fields
    if ((name === "phone" && !canEditPhone) || (name === "email" && !canEditEmail)) {
      return;
    }
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
        setPhoneVerificationComplete(false);
      }
    }
    
    // Reset email verification state when email changes
    if (name === "email") {
      setEmailOtpStep(false);
      setEmailOtp("");
      setEmailVerificationComplete(false);
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
    if (type === "personal" && formData.phone && !isPhoneVerifiedForCurrentInput && !phoneVerificationComplete) {
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
          // Lock fields based on verification flags after successful update
          if (response.data.user.phoneVerified) {
            setCanEditPhone(false);
          }
          if (response.data.user.emailVerified) {
            setCanEditEmail(false);
          }
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
        {/* Profile Photo Upload Section */}
        <ProfilePhotoUpload 
          currentPhoto={currentUser?.profilePhoto} 
          onPhotoUpdate={(updatedUser) => {
            setCurrentUser(updatedUser);
            dispatch(updateUser(updatedUser));
            if (onUserUpdate) {
              onUserUpdate(updatedUser);
            }
          }}
        />
        
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
                  disabled={!canEditPhone}
                  readOnly={!canEditPhone}
                  title={!canEditPhone ? "Verified phone cannot be changed." : undefined}
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
              {formData.phone && !isPhoneVerifiedForCurrentInput && !phoneVerificationComplete && (
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
                  disabled={!canEditEmail}
                  readOnly={!canEditEmail}
                  title={!canEditEmail ? "Verified email cannot be changed." : undefined}
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
              {formData.email && !profile?.emailVerified && !emailVerificationComplete && (
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
