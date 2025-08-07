export const mockUser = {
  name: "John Doe",
  phone: "9876543210",
  email: "john@example.com",
  address: "123 Main St, City",
  gender: "male",
  medicalInfo: {
    systemicDiseases: ["Diabetes"],
    drugAllergies: ["Penicillin"],
    isPregnant: false,
    pastTreatments: ["Root Canal"],
    previousExperiences: ["Good experience with previous dentist"],
  },
  subscription: {
    planId: null, // Will be set in tests
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    sessionsRemaining: 6,
    totalSessions: 6,
    status: "active",
  },
  role: "patient",
  isVerified: true,
};

export const mockAdminUser = {
  name: "Admin User",
  phone: "9876543211",
  email: "admin@example.com",
  role: "admin",
  isVerified: true,
};

export const mockUserRegistration = {
  name: "Jane Smith",
  phone: "9876543212",
  email: "jane@example.com",
  planId: null, // Will be set in tests
};

export const mockLoginCredentials = {
  phone: "9876543210",
  password: "password123",
};
