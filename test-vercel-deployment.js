// Quick test script for your Vercel deployment
// Replace YOUR_VERCEL_URL with your actual deployment URL

const VERCEL_URL = 'https://your-app-name.vercel.app';

async function testEndpoints() {
  console.log('🧪 Testing Vercel deployment...\n');
  
  const tests = [
    {
      name: 'Health Check (404 handler)',
      url: `${VERCEL_URL}/api/nonexistent`,
      method: 'GET'
    },
    {
      name: 'Plans Endpoint',
      url: `${VERCEL_URL}/api/plans`,
      method: 'GET'
    },
    {
      name: 'Auth Register (should fail without data)',
      url: `${VERCEL_URL}/api/auth/register`,
      method: 'POST'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`✅ Status: ${response.status}`);
      console.log(`📝 Response:`, JSON.stringify(data, null, 2));
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error testing ${test.name}:`, error.message);
      console.log('---\n');
    }
  }
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
  testEndpoints();
}