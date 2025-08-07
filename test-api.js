const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: result
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCustomTemplatesAPI() {
  console.log('🧪 Testing Custom Templates API...\n');

  try {
    // Test 1: GET all custom templates
    console.log('1. Testing GET /api/admin/custom-templates');
    const getOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/custom-templates',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const getResult = await makeRequest(getOptions);
    console.log(`   Status: ${getResult.status}`);
    console.log(`   Response:`, JSON.stringify(getResult.data, null, 2));
    
    if (getResult.status === 200) {
      console.log('   ✅ GET request successful\n');
    } else {
      console.log('   ❌ GET request failed\n');
    }

    // Test 2: Test existing availability template API
    console.log('2. Testing GET /api/admin/availability/template');
    const templateOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/availability/template',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const templateResult = await makeRequest(templateOptions);
    console.log(`   Status: ${templateResult.status}`);
    console.log(`   Response:`, JSON.stringify(templateResult.data, null, 2));
    
    if (templateResult.status === 200) {
      console.log('   ✅ Template API working\n');
    } else {
      console.log('   ❌ Template API failed\n');
    }

    console.log('🎉 API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCustomTemplatesAPI();
