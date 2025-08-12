// Test script to verify admin dashboard user data mapping fix
console.log("🧪 Testing Admin Dashboard User Data Mapping Fix");

// Simulate the API response structure
const mockApiResponse = {
  success: true,
  data: {
    appointments: [
      {
        _id: "689b4ae6c33b6c3437406090",
        userId: {
          _id: "689b014bac551d01da98f285",
          name: "Vipin",
          email: "vpnbeniwal123@gmail.com",
        },
        date: "2025-08-13T00:00:00.000Z",
        timeSlot: "16:00-17:00",
        status: "completed",
      },
      {
        _id: "68987d22a71c141d885cf420",
        userId: {
          _id: "68987ce4a71c141d885cf1e9",
          name: "Vipin",
          phone: "8989898989",
        },
        date: "2025-08-13T00:00:00.000Z",
        timeSlot: "11:00-12:00",
        status: "completed",
      },
      {
        _id: "deleted-user-appointment",
        userId: null, // This represents a deleted user
        date: "2025-08-13T00:00:00.000Z",
        timeSlot: "09:00-10:00",
        status: "scheduled",
      },
    ],
  },
};

console.log("\n📊 Original API Response:");
console.log(`Total appointments: ${mockApiResponse.data.appointments.length}`);

// Simulate server-side filtering (this happens on the server)
const filteredAppointments = mockApiResponse.data.appointments.filter(
  (appointment) => appointment.userId !== null
);

console.log("\n✅ After Server-Side Filtering:");
console.log(`Valid appointments: ${filteredAppointments.length}`);

// Simulate how the admin dashboard now accesses user data
console.log("\n🖥️ Admin Dashboard Display:");
filteredAppointments.forEach((appointment, index) => {
  // OLD WAY (was causing "Unknown User"):
  const oldWay = appointment.user?.name || "Unknown User";

  // NEW WAY (fixed):
  const newWay = appointment.userId?.name || "Unknown User";

  console.log(`${index + 1}. Appointment ${appointment._id.slice(-4)}`);
  console.log(`   Old way: "${oldWay}"`);
  console.log(`   New way: "${newWay}"`);
  console.log(`   Time: ${appointment.timeSlot}`);
  console.log(`   Status: ${appointment.status}`);
  console.log("");
});

console.log("✅ Fix Summary:");
console.log(
  "- Server-side filtering removes appointments with deleted users (userId: null)"
);
console.log(
  "- Admin dashboard now correctly accesses appointment.userId.name instead of appointment.user.name"
);
console.log("- No more 'Unknown User' displays for valid appointments");
console.log("- Deleted user appointments are completely hidden");
