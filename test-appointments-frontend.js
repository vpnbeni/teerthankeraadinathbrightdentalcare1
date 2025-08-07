// Test script to check appointments API from frontend perspective
// Using built-in fetch (Node.js 18+)

const testAppointmentsFromFrontend = async () => {
  try {
    console.log("Testing appointments API from frontend perspective...");

    // Test without authentication first
    const response = await fetch("http://localhost:5000/api/appointments", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error testing appointments API:", error);
  }
};

testAppointmentsFromFrontend();
