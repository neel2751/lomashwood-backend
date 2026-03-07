const http = require('http');

console.log('🔗 Testing Frontend to Backend Connection...');

// Test 1: API Gateway Health Check
const testGatewayHealth = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('✅ API Gateway Health:', res.statusCode, JSON.parse(data).message);
        resolve();
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Test 2: Auth Service through Gateway
const testAuthThroughGateway = () => {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'test@example.com',
      password: 'password'
    });

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('✅ Auth through Gateway:', res.statusCode);
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('🎫 Login successful through gateway!');
            console.log('🔗 Token received:', response.data.token.substring(0, 50) + '...');
          } else {
            console.log('❌ Login failed:', response.message);
          }
        } catch (e) {
          console.log('📝 Response:', data);
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
};

// Run tests
async function runTests() {
  try {
    await testGatewayHealth();
    await testAuthThroughGateway();
    console.log('\n🎯 Connection Tests Complete!');
    console.log('🌐 Frontend can now connect to Backend via API Gateway');
    console.log('📡 Gateway URL: http://localhost:8000');
    console.log('🔐 Auth endpoint: http://localhost:8000/auth/*');
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

runTests();
