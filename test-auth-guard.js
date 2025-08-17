/**
 * Test script to verify authentication guard functionality
 * This script tests that admin tokens cannot be used in client app and vice versa
 */

console.log("=== Testing Authentication Guard ===");

// Mock localStorage for testing
const mockLocalStorage = {
  adminToken: null,
  userToken: null,
  adminUser: null,
  user: null,
  
  setItem(key, value) {
    this[key] = value;
    console.log(`localStorage.setItem(${key}, ${value})`);
  },
  
  getItem(key) {
    const value = this[key];
    console.log(`localStorage.getItem(${key}) = ${value}`);
    return value;
  },
  
  removeItem(key) {
    this[key] = null;
    console.log(`localStorage.removeItem(${key})`);
  },
  
  clear() {
    this.adminToken = null;
    this.userToken = null;
    this.adminUser = null;
    this.user = null;
    console.log("localStorage.clear()");
  }
};

// Mock the auth guard functions
const mockAuthGuard = {
  checkForAdminToken() {
    const adminToken = mockLocalStorage.getItem('adminToken');
    return !!adminToken;
  },
  
  clearAdminTokens() {
    mockLocalStorage.removeItem('adminToken');
    mockLocalStorage.removeItem('adminUser');
    console.log('Admin tokens cleared to prevent role confusion');
  },
  
  validateUserAuthContext(user) {
    if (!user) return false;
    
    if (user.role === 'admin') {
      console.warn('Admin user detected in client application - clearing session');
      mockAuthGuard.clearAdminTokens();
      return false;
    }
    
    return true;
  },
  
  checkForUserToken() {
    const userToken = mockLocalStorage.getItem('token') || 
                     mockLocalStorage.getItem('userToken') || 
                     mockLocalStorage.getItem('authToken');
    return !!userToken;
  },
  
  clearUserTokens() {
    mockLocalStorage.removeItem('token');
    mockLocalStorage.removeItem('userToken');
    mockLocalStorage.removeItem('authToken');
    mockLocalStorage.removeItem('user');
    console.log('User tokens cleared to prevent role confusion');
  },
  
  validateAdminAuthContext(user) {
    if (!user) return false;
    
    if (user.role !== 'admin') {
      console.warn('Non-admin user detected in admin application - clearing session');
      mockAuthGuard.clearUserTokens();
      return false;
    }
    
    return true;
  }
};

// Test scenarios
function testAdminTokenInClientApp() {
  console.log("\n--- Test 1: Admin token in client app ---");
  
  // Simulate admin login
  mockLocalStorage.setItem('adminToken', 'admin-jwt-token');
  mockLocalStorage.setItem('adminUser', JSON.stringify({ role: 'admin', name: 'Admin User' }));
  
  console.log("Admin tokens set in localStorage");
  
  // Simulate client app checking for admin tokens
  if (mockAuthGuard.checkForAdminToken()) {
    console.log("Admin token detected in client app");
    mockAuthGuard.clearAdminTokens();
  }
  
  // Verify tokens are cleared
  console.log("Admin token after clearing:", mockLocalStorage.getItem('adminToken'));
  console.log("Admin user after clearing:", mockLocalStorage.getItem('adminUser'));
}

function testUserTokenInAdminApp() {
  console.log("\n--- Test 2: User token in admin app ---");
  
  // Simulate user login
  mockLocalStorage.setItem('token', 'user-jwt-token');
  mockLocalStorage.setItem('user', JSON.stringify({ role: 'user', name: 'Regular User' }));
  
  console.log("User tokens set in localStorage");
  
  // Simulate admin app checking for user tokens
  if (mockAuthGuard.checkForUserToken()) {
    console.log("User token detected in admin app");
    mockAuthGuard.clearUserTokens();
  }
  
  // Verify tokens are cleared
  console.log("User token after clearing:", mockLocalStorage.getItem('token'));
  console.log("User data after clearing:", mockLocalStorage.getItem('user'));
}

function testUserAuthContextValidation() {
  console.log("\n--- Test 3: User auth context validation ---");
  
  // Test with admin user (should fail)
  const adminUser = { role: 'admin', name: 'Admin User' };
  const isValidForClient = mockAuthGuard.validateUserAuthContext(adminUser);
  console.log(`Admin user valid for client app: ${isValidForClient}`);
  
  // Test with regular user (should pass)
  const regularUser = { role: 'user', name: 'Regular User' };
  const isValidForClient2 = mockAuthGuard.validateUserAuthContext(regularUser);
  console.log(`Regular user valid for client app: ${isValidForClient2}`);
}

function testAdminAuthContextValidation() {
  console.log("\n--- Test 4: Admin auth context validation ---");
  
  // Test with regular user (should fail)
  const regularUser = { role: 'user', name: 'Regular User' };
  const isValidForAdmin = mockAuthGuard.validateAdminAuthContext(regularUser);
  console.log(`Regular user valid for admin app: ${isValidForAdmin}`);
  
  // Test with admin user (should pass)
  const adminUser = { role: 'admin', name: 'Admin User' };
  const isValidForAdmin2 = mockAuthGuard.validateAdminAuthContext(adminUser);
  console.log(`Admin user valid for admin app: ${isValidForAdmin2}`);
}

function testTokenConflictResolution() {
  console.log("\n--- Test 5: Token conflict resolution ---");
  
  // Set both admin and user tokens (simulating switching between apps)
  mockLocalStorage.setItem('adminToken', 'admin-jwt-token');
  mockLocalStorage.setItem('token', 'user-jwt-token');
  
  console.log("Both admin and user tokens set");
  
  // Simulate client app startup
  console.log("Client app starting - clearing admin tokens");
  mockAuthGuard.clearAdminTokens();
  
  // Simulate admin app startup
  console.log("Admin app starting - clearing user tokens");
  mockAuthGuard.clearUserTokens();
  
  // Verify all tokens are cleared
  console.log("Admin token after conflict resolution:", mockLocalStorage.getItem('adminToken'));
  console.log("User token after conflict resolution:", mockLocalStorage.getItem('token'));
}

// Run all tests
function runAllTests() {
  console.log("Starting authentication guard tests...\n");
  
  testAdminTokenInClientApp();
  testUserTokenInAdminApp();
  testUserAuthContextValidation();
  testAdminAuthContextValidation();
  testTokenConflictResolution();
  
  console.log("\n=== All tests completed ===");
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runAllTests();
} else {
  // Browser environment
  console.log("Running in browser - tests will execute automatically");
  setTimeout(runAllTests, 1000);
}
