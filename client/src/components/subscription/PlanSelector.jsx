import React, { useState, useEffect } from "react";
import PlanCard from "./PlanCard";
import plansService from "../../services/plans";
import {
  LoadingSpinner,
  ResponsiveGrid,
  ResponsiveText,
  ResponsiveCard,
} from "../../shared/components";
import { useAccessibility } from "../../shared/hooks";

// Plan Comparison Data
const planComparisonFeatures = [
  {
    category: "Basic Services",
    features: [
      { name: "Scaling & Polishing", toothProtector: "1 session", dentalShield: "2 sessions", smileSaver: "Unlimited" },
      { name: "OPG (Panoramic X-ray)", toothProtector: "2 lines", dentalShield: "Simple + Complicated", smileSaver: "Unlimited" },
      { name: "RVG (Digital X-ray)", toothProtector: "As required", dentalShield: "As required", smileSaver: "Unlimited" },
    ]
  },
  {
    category: "Restorative Treatments",
    features: [
      { name: "Fillings", toothProtector: "2 teeth", dentalShield: "Composite/GIC - up to 6 teeth", smileSaver: "Unlimited" },
      { name: "RCT (Root Canal)", toothProtector: "2 single-rooted teeth", dentalShield: "Single-rooted (unlimited)", smileSaver: "All teeth" },
      { name: "PFM Crown", toothProtector: "1 crown", dentalShield: "4 crowns", smileSaver: "6 PFM crowns" },
    ]
  },
  {
    category: "Advanced Treatments",
    features: [
      { name: "Zirconia Crown", toothProtector: false, dentalShield: "1 crown (5 Year Warranty)", smileSaver: "4 crowns (5 Year Warranty)" },
      { name: "RPD (Partial Denture)", toothProtector: false, dentalShield: "Acrylic (up to 3 teeth)", smileSaver: "Flexible - up to 5 teeth" },
      { name: "Simple Extractions", toothProtector: "Yes", dentalShield: "Yes", smileSaver: "Yes" },
      { name: "Gum Treatment", toothProtector: false, dentalShield: false, smileSaver: "Yes" },
    ]
  }
];

// Plan Comparison Table Component
const PlanComparisonTable = ({ plans }) => {
  const toothProtectorPlan = plans.find(p => p.name === "Tooth Protector Plan" || p.name === "Basic Plan");
  const dentalShieldPlan = plans.find(p => p.name === "Dental Shield Plan" || p.name === "Standard Plan");
  const smileSaverPlan = plans.find(p => p.name === "Smile Saver Plan" || p.name === "Premium Plan");

  if (!toothProtectorPlan || !dentalShieldPlan || !smileSaverPlan) return null;

  const renderValue = (value) => {
    if (value === true || value === "Yes") {
      return (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      );
    }
    if (value === false) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      );
    }
    return <span className="text-sm font-medium text-gray-700">{value}</span>;
  };

  return (
    <div className="relative max-w-7xl mx-auto mb-16">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-4">
          <span className="text-sm font-semibold text-[#346870] bg-[#346870]/10 px-4 py-2 rounded-full">
            📊 Detailed Comparison
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-gray-800 mb-4 bg-gradient-to-r from-[#346870] to-[#2a5359] bg-clip-text text-transparent">
          Compare Plans Side by Side
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          See exactly what's included in each plan to make the best choice for your dental care needs
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 bg-gradient-to-r from-[#346870] via-[#2a5359] to-[#346870]">
          <div className="p-4 md:p-6 text-white font-bold text-lg border-r border-white/20">
            Features
          </div>
          <div className="p-4 md:p-6 text-center border-r border-white/20">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm md:text-base">Tooth Protector</span>
              <span className="text-white/80 text-xs md:text-sm mt-1">₹6,999</span>
            </div>
          </div>
          <div className="p-4 md:p-6 text-center border-r border-white/20 bg-white/10">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-yellow-400/30 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm md:text-base">Dental Shield</span>
              <span className="text-yellow-300 text-xs md:text-sm mt-1 font-semibold">₹12,999 • Popular</span>
            </div>
          </div>
          <div className="p-4 md:p-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-orange-400/30 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm md:text-base">Smile Saver</span>
              <span className="text-white/80 text-xs md:text-sm mt-1">₹24,999</span>
            </div>
          </div>
        </div>

        {/* Table Body */}
        {planComparisonFeatures.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            {/* Category Header */}
            <div className="grid grid-cols-4 bg-gradient-to-r from-[#346870]/10 to-[#BDCFD1]/10 border-b border-gray-100">
              <div className="col-span-4 p-4 font-bold text-[#346870] flex items-center">
                <div className="w-8 h-8 bg-[#346870]/20 rounded-lg flex items-center justify-center mr-3">
                  {categoryIndex === 0 && (
                    <svg className="w-4 h-4 text-[#346870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {categoryIndex === 1 && (
                    <svg className="w-4 h-4 text-[#346870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  )}
                  {categoryIndex === 2 && (
                    <svg className="w-4 h-4 text-[#346870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                {category.category}
              </div>
            </div>

            {/* Feature Rows */}
            {category.features.map((feature, featureIndex) => (
              <div
                key={featureIndex}
                className={`grid grid-cols-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 ${featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
              >
                <div className="p-4 md:p-5 flex items-center text-gray-700 font-medium border-r border-gray-100">
                  <span className="text-sm md:text-base">{feature.name}</span>
                </div>
                <div className="p-4 md:p-5 flex items-center justify-center text-center border-r border-gray-100">
                  {renderValue(feature.toothProtector)}
                </div>
                <div className="p-4 md:p-5 flex items-center justify-center text-center border-r border-gray-100 bg-[#346870]/5">
                  {renderValue(feature.dentalShield)}
                </div>
                <div className="p-4 md:p-5 flex items-center justify-center text-center">
                  {renderValue(feature.smileSaver)}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Table Footer with CTA */}
        <div className="grid grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
          <div className="p-4 md:p-6 font-bold text-gray-700 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#346870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Best Value
          </div>
          <div className="p-4 md:p-6 flex justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Starting at</div>
              <div className="text-xl font-black text-[#346870]">₹6,999</div>
            </div>
          </div>
          <div className="p-4 md:p-6 flex justify-center bg-[#346870]/5">
            <div className="text-center">
              <div className="text-xs text-[#346870] font-semibold mb-1">⭐ Most Popular</div>
              <div className="text-xl font-black text-[#346870]">₹12,999</div>
            </div>
          </div>
          <div className="p-4 md:p-6 flex justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Premium Care</div>
              <div className="text-xl font-black text-[#346870]">₹24,999</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          All plans include 12 months validity • Priority booking • Digital health records
        </p>
      </div>
    </div>
  );
};

const PlanSelector = ({ onPlanSelect, selectedPlan }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showKidsPlans, setShowKidsPlans] = useState(false);
  const { announce } = useAccessibility();

  // Separate adult and kids plans
  const adultPlans = plans.filter(plan => plan.category === 'adult' || !plan.category);
  const kidsPlans = plans.filter(plan => plan.category === 'kids');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await plansService.getPlans();
        setPlans(response.data.data);
        announce(`${response.data.data.length} subscription plans loaded`);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setError("Failed to load subscription plans. Please try again.");
        announce("Failed to load subscription plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center mb-8">
          <ResponsiveText
            size={{ mobile: "xl", tablet: "2xl", desktop: "3xl" }}
            weight="bold"
            color="gray-800"
            className="mb-4"
          >
            Choose Your Dental Care Plan
          </ResponsiveText>
          <ResponsiveText
            size={{ mobile: "base", tablet: "lg", desktop: "lg" }}
            color="gray-600"
          >
            Select the plan that best fits your dental care needs
          </ResponsiveText>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner
            size="large"
            ariaLabel="Loading subscription plans"
            text="Loading plans..."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-center mb-8">
          <ResponsiveText
            size={{ mobile: "xl", tablet: "2xl", desktop: "3xl" }}
            weight="bold"
            color="gray-800"
            className="mb-4"
          >
            Choose Your Dental Care Plan
          </ResponsiveText>
          <ResponsiveText
            size={{ mobile: "base", tablet: "lg", desktop: "lg" }}
            color="gray-600"
          >
            Select the plan that best fits your dental care needs
          </ResponsiveText>
        </div>
        <div className="text-center py-12">
          <ResponsiveCard
            padding={{ mobile: 4, tablet: 6, desktop: 6 }}
            background="bg-red-50"
            border="border border-red-200"
            className="text-red-700 max-w-md mx-auto"
          >
            <div role="alert" aria-live="assertive">
              {error}
            </div>
          </ResponsiveCard>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-center mb-16 relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-[#346870]/5 rounded-full blur-xl"></div>
          <div className="absolute top-20 right-20 w-32 h-32 bg-[#BDCFD1]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-[#346870]/10 rounded-full blur-lg"></div>
        </div>

        <div className="relative">
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold text-[#346870] bg-[#346870]/10 px-4 py-2 rounded-full">
              🦷 Premium Dental Care
            </span>
          </div>

          <ResponsiveText
            size={{ mobile: "3xl", tablet: "4xl", desktop: "5xl" }}
            weight="black"
            className="mb-6 bg-gradient-to-r from-[#346870] via-[#2a5359] to-[#346870] bg-clip-text text-transparent"
          >
            Choose Your Perfect Plan
          </ResponsiveText>

          <ResponsiveText
            size={{ mobile: "lg", tablet: "xl", desktop: "2xl" }}
            color="gray-600"
            className="max-w-4xl mx-auto leading-relaxed"
          >
            Transform your dental health with our comprehensive care packages,
            designed to provide exceptional value and peace of mind
          </ResponsiveText>

          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-8 mt-8 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Trusted by 15000+ patients
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expert dental care
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Flexible scheduling
            </div>
          </div>
        </div>
      </div>

      {/* Adult Plans Grid - Enhanced Layout */}
      <div className="relative max-w-7xl mx-auto mb-16">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#346870]/5 via-transparent to-[#BDCFD1]/5 rounded-3xl blur-3xl"></div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8">
          {adultPlans.map((plan, index) => (
            <div
              key={plan._id}
              className="animate-fade-in-up transform hover:scale-105 transition-all duration-500"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <PlanCard
                plan={plan}
                onSelect={onPlanSelect}
                isSelected={selectedPlan?._id === plan._id}
              />
            </div>
          ))}
        </div>

        {/* Floating elements */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-[#346870]/10 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#BDCFD1]/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Plan Comparison Table */}
      {adultPlans.length >= 3 && <PlanComparisonTable plans={adultPlans} />}

      {/* Kids Plans Section - Accordion */}
      {kidsPlans.length > 0 && (
        <div className="relative max-w-7xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-blue-300/50">
            {/* Kids Plans Header Button */}
            <button
              onClick={() => {
                setShowKidsPlans(!showKidsPlans);
                announce(showKidsPlans ? "Kids plans collapsed" : "Kids plans expanded");
              }}
              className="w-full flex items-center justify-between p-5 md:p-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl"
              aria-expanded={showKidsPlans}
              aria-controls="kids-plans-content"
            >
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl flex-shrink-0">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-xl md:text-2xl font-bold">Kids Dental Plans</h3>
                  <p className="text-blue-100 text-xs md:text-sm mt-0.5">For children aged 3-14 years • {kidsPlans.length} special plans</p>
                </div>
              </div>
              <div className={`transform transition-transform duration-300 flex-shrink-0 ${showKidsPlans ? 'rotate-180' : ''}`}>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Kids Plans Grid - Collapsible */}
            <div
              id="kids-plans-content"
              className={`transition-all duration-500 ease-in-out ${showKidsPlans ? 'max-h-[3000px] opacity-100 mt-6 md:mt-8' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6">
                {kidsPlans.map((plan, index) => (
                  <div
                    key={plan._id}
                    className="transform transition-all duration-300"
                  >
                    <PlanCard
                      plan={plan}
                      onSelect={onPlanSelect}
                      isSelected={selectedPlan?._id === plan._id}
                    />
                  </div>
                ))}
              </div>

              {/* Kids Plans Info Banner */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 md:p-6 border-2 border-blue-200 shadow-lg">
                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-2.5 md:p-3 rounded-xl flex-shrink-0 shadow-lg">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2 text-base md:text-lg">Special Care for Growing Smiles</h4>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      Our kids dental plans are specifically designed for children aged 3-14 years,
                      providing comprehensive preventive and restorative care to ensure healthy dental development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Value Proposition Section */}
      <div className="relative mt-20 overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#346870]/10 via-white to-[#BDCFD1]/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#346870]/5 to-transparent"></div>

        <div className="relative rounded-3xl p-12 border border-[#346870]/20 shadow-2xl">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="text-sm font-bold text-[#346870] bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-[#346870]/20 shadow-lg">
                ✨ Why Choose Us?
              </span>
            </div>

            <h3 className="text-4xl font-black text-gray-800 mb-6 bg-gradient-to-r from-[#346870] to-[#2a5359] bg-clip-text text-transparent">
              Exceptional Dental Care Experience
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience the difference with our comprehensive dental care plans,
              designed to provide you with the best oral health solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#346870] to-[#2a5359] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">
                Expert Care
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Professional dental treatments by experienced practitioners with years of expertise
              </p>
            </div>

            <div className="text-center group">
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#346870] to-[#2a5359] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">
                Flexible Scheduling
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Easy online booking with convenient time slots that fit your busy schedule
              </p>
            </div>

            <div className="text-center group">
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#346870] to-[#2a5359] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">
                Digital Records
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Secure digital health records accessible anytime, anywhere for your convenience
              </p>
            </div>

            <div className="text-center group">
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#346870] to-[#2a5359] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">
                Comprehensive Care
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Complete dental solutions for optimal oral health and beautiful smiles
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default PlanSelector;
