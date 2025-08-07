// Quick test to check appointments API
import fetch from "node-fetch";

const testAppointmentsAPI = async () => {
  try {
    // You'll need to replace this with a valid JWT token from a logged-in user
    const token = "YOUR_JWT_TOKEN_HERE";

    const response = await fetch("http://localhost:5000/api/appointments", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Appointments API Response:", JSON.stringify(data, null, 2));

    if (data.success && data.data.appointments) {
      console.log(`Found ${data.data.appointments.length} appointments`);
      data.data.appointments.forEach((apt, index) => {
        console.log(`Appointment ${index + 1}:`, {
          id: apt._id,
          date: apt.date,
          status: apt.status,
          timeSlot: apt.timeSlot,
        });
      });
    }
  } catch (error) {
    console.error("Error testing appointments API:", error);
  }
};

// Uncomment and run with a valid token to test
// testAppointmentsAPI();

console.log("To test the appointments API:");
console.log("1. Login to get a JWT token");
console.log("2. Replace YOUR_JWT_TOKEN_HERE with the actual token");
console.log("3. Uncomment the testAppointmentsAPI() call");
console.log("4. Run: node test-appointments-api.js");
