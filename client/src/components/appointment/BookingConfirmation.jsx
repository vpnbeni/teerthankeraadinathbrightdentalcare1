import { useState } from "react";

const BookingConfirmation = ({ data, onDataChange }) => {
  const [notes, setNotes] = useState(data.notes || "");

  const selectedDate = new Date(data.selectedDate);

  const formatTime = (timeString) => {
    const [start, end] = timeString.split("-");
    const formatSingleTime = (time) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
  };

  // Auto-save notes when they change
  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (onDataChange) {
      onDataChange({ notes: newNotes });
    }
  };

  return (
    <div className="space-y-5">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100/30 to-emerald-100/30 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Confirm Your Appointment</h3>
              <p className="text-gray-600 text-xs md:text-sm">Review all details before final confirmation</p>
            </div>
          </div>
        </div>

        {/* Premium Appointment Summary */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-100/20 to-purple-100/20 rounded-full blur-3xl -mr-16 -mb-16"></div>
        
        <div className="relative flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-base md:text-lg font-bold text-gray-900">Appointment Details</h4>
        </div>

        <div className="relative grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date</p>
            <p className="text-sm md:text-base font-bold text-gray-900">
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Time</p>
            <p className="text-sm md:text-base font-bold text-gray-900">{formatTime(data.selectedTimeSlot)}</p>
          </div>
        </div>
      </div>

      {/* Premium Personal Information */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-3xl -ml-16 -mt-16"></div>
        
        <div className="relative flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h4 className="text-base md:text-lg font-bold text-gray-900">Personal Information</h4>
        </div>

        <div className="relative space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-sm font-bold text-gray-900">{data.personalDetails.name}</p>
            </div>

            <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-sm font-bold text-gray-900">{data.personalDetails.phone}</p>
            </div>

            {data.personalDetails.email && (
              <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-bold text-gray-900">{data.personalDetails.email}</p>
              </div>
            )}

            {data.personalDetails.alternativePhone && (
              <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Alternative Phone</p>
                <p className="text-sm font-bold text-gray-900">{data.personalDetails.alternativePhone}</p>
              </div>
            )}
          </div>

          {data.personalDetails.address && (
            <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</p>
              <p className="text-sm font-bold text-gray-900">{data.personalDetails.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Medical Information */}
      {(data.medicalInfo.systemicDiseases ||
        data.medicalInfo.drugAllergies ||
        data.medicalInfo.pastTreatments ||
        data.medicalInfo.previousExperiences ||
        data.medicalInfo.isPregnant) && (
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 md:p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100/20 to-teal-100/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-base md:text-lg font-bold text-gray-900">Medical Information</h4>
          </div>

          <div className="relative space-y-3">
            {data.medicalInfo.systemicDiseases && (
              <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Systemic Diseases</p>
                <p className="text-sm font-bold text-gray-900">{data.medicalInfo.systemicDiseases}</p>
              </div>
            )}

            {data.medicalInfo.drugAllergies && (
              <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Drug Allergies</p>
                <p className="text-sm font-bold text-gray-900">{data.medicalInfo.drugAllergies}</p>
              </div>
            )}

            {data.medicalInfo.pastTreatments && (
              <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Past Treatments</p>
                <p className="text-sm font-bold text-gray-900">{data.medicalInfo.pastTreatments}</p>
              </div>
            )}

            {data.medicalInfo.previousExperiences && (
              <div className="p-3 bg-white/60 backdrop-blur-sm border border-gray-200/40 rounded-xl">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Previous Experiences</p>
                <p className="text-sm font-bold text-gray-900">{data.medicalInfo.previousExperiences}</p>
              </div>
            )}

            {data.medicalInfo.isPregnant && (
              <div className="flex items-center gap-3 p-3 bg-pink-50/60 backdrop-blur-sm border border-pink-200/50 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-pink-700 font-bold text-sm">Currently pregnant</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Additional Notes */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-5 md:p-6 shadow-lg">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-100/20 to-orange-100/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
        
        <div className="relative flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h4 className="text-base md:text-lg font-bold text-gray-900">Additional Notes</h4>
            <p className="text-xs text-gray-600">Optional - Share any specific concerns</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            rows={4}
            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 hover:border-gray-300 resize-none"
            placeholder="Any specific concerns, requests, or information you'd like to share about your appointment..."
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">Share any relevant details to help us serve you better</p>
            <span className={`text-xs font-semibold ${notes.length > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
              {notes.length}/500
            </span>
          </div>
        </div>
      </div>

      {/* Premium Profile Update Notice */}
      {data.personalDetails.email && (
        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 border border-green-200/60 rounded-2xl p-5 shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-2xl -mr-12 -mt-12"></div>
          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-2 text-sm md:text-base">Profile Update</h4>
              <p className="text-xs md:text-sm text-green-800 leading-relaxed">
                Your verified email address and updated information will be saved to your profile and used for future appointment confirmations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Important Information */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/60 rounded-2xl p-5 shadow-md">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-300/20 to-yellow-300/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
        <div className="relative flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-amber-900 mb-3 text-sm md:text-base">Important Information</h4>
            <ul className="space-y-2 text-xs md:text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Please arrive 10 minutes before your appointment time</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Bring a valid ID and any relevant medical documents</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>You can reschedule or cancel up to 24 hours before your appointment</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Late arrivals may result in shortened appointment time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
