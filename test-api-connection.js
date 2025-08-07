// Simple test to check API connectivity
const testApiConnection = async () => {
  try {
    console.log("Testing API connection...");

    // Test basic server connectivity
    const healthResponse = await fetch("http://localhost:5000/api/health");
    console.log("Health check status:", healthResponse.status);

    // Test appointments endpoint
    const appointmentsResponse = await fetch(
      "http://localhost:5000/api/appointments/admin/all?page=1&limit=10",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add auth token if needed
          Authorization:
            "Bearer " + (localStorage.getItem("adminToken") || "test-token"),
        },
        credentials: "include",
      }
    );

    console.log("Appointments API status:", appointmentsResponse.status);
    console.log("Appointments API headers:", [
      ...appointmentsResponse.headers.entries(),
    ]);

    if (appointmentsResponse.ok) {
      const data = await appointmentsResponse.json();
      console.log("Appointments API response:", data);
    } else {
      const errorText = await appointmentsResponse.text();
      console.log("Appointments API error:", errorText);
    }
  } catch (error) {
    console.error("API connection test failed:", error);
  }
};

// Run the test
testApiConnection();
