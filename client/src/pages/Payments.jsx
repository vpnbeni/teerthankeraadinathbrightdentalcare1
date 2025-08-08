import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import DashboardLayout from "../components/common/DashboardLayout";
import PaymentHistory from "../components/payments/PaymentHistory";
import SubscriptionStatus from "../components/subscription/SubscriptionStatus";
import PlanUpgrade from "../components/subscription/PlanUpgrade";
import { checkAuthStatus } from "../store/authSlice";
import plansService from "../services/plans";

const Payments = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("subscription");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (user?.subscription?.planId) {
      plansService
        .getPlan(user.subscription.planId)
        .then((response) => {
          setPlan(response.data.data);
        })
        .catch((error) => {
          console.error("Failed to fetch plan details", error);
        });
    }
  }, [user]);

  const handleUpgradeSuccess = (paymentData) => {
    setShowUpgrade(false);
    dispatch(checkAuthStatus());
    console.log("Upgrade successful:", paymentData);
  };

  const tabs = [
    { id: "subscription", label: "Subscription", icon: "📋" },
    { id: "history", label: "Payment History", icon: "💳" },
  ];

  const renderContent = () => {
    if (showUpgrade) {
      return (
        <div>
          <button
            onClick={() => setShowUpgrade(false)}
            className="mb-4 text-[#346870] hover:text-[#2a5359] font-medium flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Subscription
          </button>
          <PlanUpgrade
            currentPlan={plan}
            onUpgradeSuccess={handleUpgradeSuccess}
          />
        </div>
      );
    }

    switch (activeTab) {
      case "subscription":
        return (
          <SubscriptionStatus
            subscription={user?.subscription}
            plan={plan}
            onUpgrade={() => setShowUpgrade(true)}
          />
        );
      case "history":
        return <PaymentHistory />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Payments & Subscription
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription, view payment history, and upgrade your
            plan
          </p>
        </div>

        {/* Tabs */}
        {!showUpgrade && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#346870] text-[#346870]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <div>{renderContent()}</div>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
