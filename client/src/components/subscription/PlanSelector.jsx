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
              className={`transition-all duration-500 ease-in-out ${
                showKidsPlans ? 'max-h-[3000px] opacity-100 mt-6 md:mt-8' : 'max-h-0 opacity-0 overflow-hidden'
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
