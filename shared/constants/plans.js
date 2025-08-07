// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = [
  {
    id: "plan_6_sessions",
    name: "6 Sessions Plan",
    sessions: 6,
    duration: 12, // months
    price: 15000, // in INR
    originalPrice: 18000,
    discount: 17,
    features: [
      "6 Dental Sessions",
      "Valid for 12 months",
      "Comprehensive dental examination",
      "Basic dental treatments included",
      "Priority booking",
      "Digital health records",
    ],
    popular: false,
    description: "Perfect for basic dental care needs",
  },
  {
    id: "plan_8_sessions",
    name: "8 Sessions Plan",
    sessions: 8,
    duration: 12, // months
    price: 20000, // in INR
    originalPrice: 24000,
    discount: 17,
    features: [
      "8 Dental Sessions",
      "Valid for 12 months",
      "Comprehensive dental examination",
      "Advanced dental treatments",
      "Priority booking",
      "Digital health records",
      "Free consultation calls",
    ],
    popular: true,
    description: "Most popular choice for regular dental care",
  },
  {
    id: "plan_12_sessions",
    name: "12 Sessions Plan",
    sessions: 12,
    duration: 12, // months
    price: 28000, // in INR
    originalPrice: 36000,
    discount: 22,
    features: [
      "12 Dental Sessions",
      "Valid for 12 months",
      "Comprehensive dental examination",
      "All dental treatments included",
      "Priority booking",
      "Digital health records",
      "Free consultation calls",
      "Emergency dental support",
      "Teeth whitening session",
    ],
    popular: false,
    description: "Complete dental care package for the whole year",
  },
];

// Plan Status
export const PLAN_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DRAFT: "draft",
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  SUSPENDED: "suspended",
  CANCELLED: "cancelled",
};
