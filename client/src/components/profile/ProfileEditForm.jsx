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
        onPhotoUpdate(response.data.data.user);
        setSelectedFile(null);
        setShowPreview(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
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
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-teal-50/20 rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200/50 shadow-lg">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#346870]/5 to-teal-400/5 rounded-full blur-3xl"></div>
      <div className="relative">
        <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-5">
          <div className="h-6 md:h-8 w-1 bg-gradient-to-b from-[#346870] to-teal-400 rounded-full"></div>
          <h4 className="text-lg md:text-xl font-bold text-gray-800">Profile Photo</h4>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          {/* Photo Preview */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#346870] via-teal-400 to-blue-400 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full overflow-hidden bg-gradient-to-br from-[#346870] to-[#2a5359] flex items-center justify-center ring-2 md:ring-4 ring-white shadow-2xl">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-white text-5xl font-bold">
                  {currentPhoto ? "?" : "?"}
                </span>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-3 md:space-y-4 w-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 border border-gray-200/50">
              <p className="text-xs md:text-sm text-gray-700 font-medium mb-0.5 md:mb-1">
                Personalize Your Profile
              </p>
              <p className="text-xs text-gray-500">
                Upload a high-quality photo (300x300px recommended) to make your profile stand out
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <label className="group relative px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 text-sm md:text-base font-medium rounded-lg md:rounded-xl cursor-pointer inline-flex items-center transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                <svg className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 text-[#346870]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-[#346870] to-[#2a5359] hover:from-[#2a5359] hover:to-[#346870] text-white text-sm md:text-base font-medium rounded-lg md:rounded-xl inline-flex items-center transition-all duration-300 shadow-lg shadow-[#346870]/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="px-4 md:px-6 py-2 md:py-3 bg-white hover:bg-gray-50 text-gray-700 text-sm md:text-base font-medium rounded-lg md:rounded-xl transition-all duration-300 border border-gray-200 shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>JPEG, PNG, WebP • Max 5MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileEditForm = ({ profile, type, onUserUpdate }) => {
  const dispatch = useDispatch();
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
      <div className="space-y-4 md:space-y-6">
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
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-5">
              <div className="h-6 md:h-8 w-1 bg-gradient-to-b from-[#346870] to-teal-400 rounded-full"></div>
              <h4 className="text-lg md:text-xl font-bold text-gray-800">Contact Details</h4>
            </div>
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 ${
                    errors.name ? "border-red-500" : "border-gray-200 group-hover:border-gray-300"
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
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
                    className={`w-full px-4 py-3 pr-12 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 ${
                      errors.phone ? "border-red-500" : "border-gray-200 group-hover:border-gray-300"
                    } ${!canEditPhone ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    placeholder="Enter your phone number"
                  />
                  {isPhoneVerifiedForCurrentInput && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <div className="bg-green-100 rounded-full p-1">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
                  </p>
                )}
                
                {/* Phone OTP Section */}
                {formData.phone && !isPhoneVerifiedForCurrentInput && !phoneVerificationComplete && (
                  <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-200/50 space-y-3">
                    {!phoneOtpStep ? (
                      <button
                        type="button"
                        onClick={handleSendPhoneOTP}
                        disabled={otpLoading}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpLoading ? "Sending OTP..." : "Send Verification Code"}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP"
                          maxLength="6"
                          className="w-full px-4 py-2.5 text-center text-lg font-semibold tracking-widest border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOTP}
                          disabled={otpLoading || phoneOtp.length !== 6}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {otpLoading ? "Verifying..." : "Verify Code"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendPhoneOTP}
                          disabled={resendCooldown > 0 || otpLoading}
                          className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
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
                    className={`w-full px-4 py-3 pr-12 bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 ${
                      errors.email ? "border-red-500" : "border-gray-200 group-hover:border-gray-300"
                    } ${!canEditEmail ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    placeholder="Enter your email address"
                  />
                  {profile?.emailVerified && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <div className="bg-green-100 rounded-full p-1">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
                
                {/* Email OTP Section */}
                {formData.email && !profile?.emailVerified && !emailVerificationComplete && (
                  <div className="mt-4 p-4 bg-purple-50/50 rounded-xl border border-purple-200/50 space-y-3">
                    {!emailOtpStep ? (
                      <button
                        type="button"
                        onClick={handleSendEmailOTP}
                        disabled={otpLoading}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpLoading ? "Sending OTP..." : "Send Verification Code"}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP"
                          maxLength="6"
                          className="w-full px-4 py-2.5 text-center text-lg font-semibold tracking-widest border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOTP}
                          disabled={otpLoading || emailOtp.length !== 6}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {otpLoading ? "Verifying..." : "Verify Code"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSendEmailOTP}
                          disabled={emailResendCooldown > 0 || otpLoading}
                          className="w-full text-xs text-purple-600 hover:text-purple-700 font-medium disabled:text-gray-400"
                        >
                          {emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : "Resend Code"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  Alternative Phone
                </label>
                <input
                  type="tel"
                  name="alternativePhone"
                  value={formData.alternativePhone || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 group-hover:border-gray-300"
                  placeholder="Enter alternative phone number"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 group-hover:border-gray-300 cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2 group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 group-hover:border-gray-300 resize-none"
                  placeholder="Enter your complete address"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 md:pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-gradient-to-r from-[#346870] to-[#2a5359] hover:from-[#2a5359] hover:to-[#346870] text-white text-sm md:text-base font-semibold rounded-lg md:rounded-xl transition-all duration-300 shadow-lg shadow-[#346870]/30 hover:shadow-xl hover:shadow-[#346870]/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 md:space-x-3"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>Update Personal Information</span>
              <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (type === "medical") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-5">
            <div className="h-6 md:h-8 w-1 bg-gradient-to-b from-[#346870] to-teal-400 rounded-full"></div>
            <h4 className="text-lg md:text-xl font-bold text-gray-800">Medical History</h4>
          </div>
          <div className="space-y-4 md:space-y-5">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Systemic Diseases
              </label>
              <input
                type="text"
                name="systemicDiseases"
                value={formData.systemicDiseases || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 group-hover:border-gray-300"
                placeholder="e.g., Diabetes, Hypertension, Asthma"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Separate multiple diseases with commas
              </p>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Drug Allergies
              </label>
              <input
                type="text"
                name="drugAllergies"
                value={formData.drugAllergies || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 group-hover:border-gray-300"
                placeholder="e.g., Penicillin, Aspirin, Latex"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Separate multiple allergies with commas
              </p>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Past Treatments
              </label>
              <textarea
                name="pastTreatments"
                value={formData.pastTreatments || ""}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 group-hover:border-gray-300 resize-none"
                placeholder="e.g., Root canal, Tooth extraction, Dental implants"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Separate multiple treatments with commas
              </p>
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#346870]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Previous Experiences
              </label>
              <textarea
                name="previousExperiences"
                value={formData.previousExperiences || ""}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#346870]/20 focus:border-[#346870] transition-all duration-300 group-hover:border-gray-300 resize-none"
                placeholder="Share your previous dental experiences or concerns"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Separate multiple experiences with commas
              </p>
            </div>

            {formData.gender === "female" && (
              <div className="bg-pink-50/50 border-2 border-pink-200/50 rounded-xl p-4">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isPregnant"
                    checked={formData.isPregnant || false}
                    onChange={handleChange}
                    className="h-5 w-5 text-[#346870] focus:ring-2 focus:ring-[#346870] border-gray-300 rounded transition-all duration-300"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-[#346870] transition-colors">
                    Currently pregnant
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-gradient-to-r from-[#346870] to-[#2a5359] hover:from-[#2a5359] hover:to-[#346870] text-white text-sm md:text-base font-semibold rounded-lg md:rounded-xl transition-all duration-300 shadow-lg shadow-[#346870]/30 hover:shadow-xl hover:shadow-[#346870]/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 md:space-x-3"
          >
            {loading && <LoadingSpinner size="sm" />}
            <span>Update Medical Information</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </form>
    );
  }

  return null;
};

export default ProfileEditForm;
