// Debug script to check authentication status
console.log("=== Admin Authentication Debug ===");

// Check if we're in browser environment
if (typeof localStorage !== "undefined") {
  const token = localStorage.getItem("adminToken");
  console.log("Admin token exists:", !!token);
  console.log("Token length:", token ? token.length : 0);
  console.log(
    "Token preview:",
    token ? token.substring(0, 20) + "..." : "No token"
  );

  // Try to decode JWT token (basic check)
  if (token) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log("Token payload:", payload);
        console.log("Token expires:", new Date(payload.exp * 1000));
        console.log("Token is expired:", Date.now() > payload.exp * 1000);
      }
    } catch (e) {
      console.log("Could not decode token:", e.message);
    }
  }
} else {
  console.log("Not in browser environment - cannot check localStorage");
}

// Test API call with current token
const testAuthenticatedCall = async () => {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await fetch(
      "http://localhost:5000/api/appointments/admin/all?page=1&limit=10",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      }
    );

    console.log("=== API Call Result ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);

    const responseText = await response.text();
    console.log("Response:", responseText);
  } catch (error) {
    console.error("API call failed:", error);
  }
};

// Run the test if in browser
if (typeof fetch !== "undefined") {
  testAuthenticatedCall();
}
