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
  const { announce } = useAccessibility();

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
      <div className="text-center mb-12">
        <ResponsiveText
          size={{ mobile: "2xl", tablet: "3xl", desktop: "4xl" }}
          weight="bold"
          color="gray-800"
          className="mb-4"
        >
          Choose Your Dental Care Plan
        </ResponsiveText>
        <ResponsiveText
          size={{ mobile: "base", tablet: "lg", desktop: "xl" }}
          color="gray-600"
          className="max-w-3xl mx-auto"
        >
          Comprehensive dental care packages designed to meet your specific
          needs and budget
        </ResponsiveText>
      </div>

      {/* Plans Grid - Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
        {plans.map((plan, index) => (
          <div
            key={plan._id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <PlanCard
              plan={plan}
              onSelect={onPlanSelect}
              isSelected={selectedPlan?._id === plan._id}
            />
          </div>
        ))}
      </div>

      {/* Value Proposition Section */}
      <div className="mt-16 bg-gradient-to-r from-[#346870]/5 to-[#BDCFD1]/10 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Why Choose Our Dental Care Plans?
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            All our plans include essential dental care services with the
            flexibility to choose what works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#346870]"
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
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Expert Care
            </h4>
            <p className="text-gray-600 text-sm">
              Professional dental treatments by experienced practitioners
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#346870]"
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
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Flexible Scheduling
            </h4>
            <p className="text-gray-600 text-sm">
              Easy online booking with convenient time slots
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#346870]"
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
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Digital Records
            </h4>
            <p className="text-gray-600 text-sm">
              Secure digital health records accessible anytime
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#346870]"
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
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Comprehensive Care
            </h4>
            <p className="text-gray-600 text-sm">
              Complete dental solutions for optimal oral health
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto border border-gray-100">
          <div className="flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-[#346870] mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h4 className="text-lg font-semibold text-gray-800">
              Ready to get started?
            </h4>
          </div>
          <p className="text-gray-600 mb-4">
            Select a plan above to begin your journey to better dental health.
            All plans include our comprehensive care guarantee.
          </p>
          <div className="text-sm text-gray-500">
            Questions? Contact us for personalized plan recommendations.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelector;
