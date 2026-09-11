// Test script for API Specification & Reference Guide
import http from 'http';
import https from 'https';

const BASE_URLS = [
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:4000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8000',
  'http://localhost:8080',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5001',
  'https://danish-chat-1.onrender.com'
];

async function request(url, options = {}, body = null) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https:');
    const lib = isHttps ? https : http;
    const parsed = new URL(url);

    const req = lib.request(
      parsed,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        timeout: 15000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsedBody = null;
          try {
            parsedBody = JSON.parse(raw);
          } catch {
            parsedBody = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsedBody });
        });
      }
    );

    req.on('error', (err) => resolve({ error: err.message, status: 0 }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'TIMEOUT', status: 0 });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function findActiveBaseUrl() {
  for (const baseUrl of BASE_URLS) {
    try {
      const res = await request(`${baseUrl}/api/admin/getstats`, { method: 'GET' });
      if (res.status === 200 || res.status === 401 || res.status === 403) {
        return baseUrl;
      }
    } catch {}
  }
  return 'https://danish-chat-1.onrender.com';
}

async function runTests() {
  console.log('🔍 Detecting active server URL...');
  const baseUrl = await findActiveBaseUrl();
  console.log(`🌐 Testing against Base URL: ${baseUrl}\n`);

  let token = null;

  // 1. Try to login as admin
  const loginAttempts = [
    { loginId: 'admin', password: 'admin123' },
    { username: 'admin', password: 'admin123' },
    { email: 'admin@dchat.local', password: 'admin123' },
    { loginId: 'admin@dchat.local', password: 'admin123' },
    { username: 'admin', password: 'password123' },
    { email: 'admin@dchat.local', password: 'AdminPassword123!' },
    { username: 'user1', password: 'user123' },
  ];

  for (const cred of loginAttempts) {
    const res = await request(`${baseUrl}/api/auth/login`, { method: 'POST' }, cred);
    const tokenFound =
      res.body?.accessToken ||
      res.body?.data?.accessToken ||
      res.body?.data?.token ||
      res.body?.token ||
      res.body?.message?.accessToken ||
      res.body?.message?.token;

    if (tokenFound) {
      token = tokenFound;
      console.log(`✅ Logged in successfully with: ${JSON.stringify(cred)}`);
      break;
    } else {
      console.log(`Login attempt with ${JSON.stringify(cred)} -> Status ${res.status}:`, res.body?.error?.message || res.body?.message || res.body);
    }
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const testResults = [];

  async function testEndpoint(name, path, method = 'GET', body = null, expectedStatuses = [200, 201]) {
    const url = `${baseUrl}${path}`;
    const start = Date.now();
    const res = await request(url, { method, headers: authHeaders }, body);
    const duration = Date.now() - start;

    const isPassed = !res.error && expectedStatuses.includes(res.status);
    const hasEnvelope = res.body && typeof res.body === 'object' && ('success' in res.body);
    
    testResults.push({
      name,
      path,
      method,
      status: res.status || 'ERR',
      passed: isPassed,
      envelope: hasEnvelope,
      duration: `${duration}ms`,
      details: isPassed ? 'OK' : res.error || JSON.stringify(res.body?.error || res.body),
    });

    const statusIcon = isPassed ? '✅' : '❌';
    console.log(`${statusIcon} [${method}] ${path} -> ${res.status} (${duration}ms)`);
    return res;
  }

  console.log('\n--- 1. Testing Admin Stats & Aliases ---');
  await testEndpoint('Stats Primary', '/api/admin/getstats');
  await testEndpoint('Stats Alias: /getallstats', '/api/admin/getallstats');
  await testEndpoint('Stats Alias: /stats', '/api/admin/stats');
  await testEndpoint('Stats Alias: /dashboard', '/api/admin/dashboard');
  await testEndpoint('Stats Alias: /overview', '/api/admin/overview');
  await testEndpoint('Stats Alias: /systemstats', '/api/admin/systemstats');

  console.log('\n--- 2. Testing User Management APIs & Aliases ---');
  await testEndpoint('Get All Users Primary', '/api/admin/getallusers');
  await testEndpoint('Get All Users Alias: /users', '/api/admin/users');
  await testEndpoint('Get All Users Alias: /getusers', '/api/admin/getusers');
  await testEndpoint('Get All Users Filter: role=ADMIN', '/api/admin/getallusers?role=ADMIN&page=1&limit=5');
  await testEndpoint('Get All Users Filter: status=active', '/api/admin/getallusers?status=active');

  const testUsername = `testuser_${Date.now()}`;
  const testUserPayload = {
    username: testUsername,
    email: `${testUsername}@example.com`,
    password: 'Password@123',
    displayName: 'Test Automation User',
    role: 'USER',
  };

  let createdUserId = null;

  console.log('\n--- 3. Testing User Lifecycle (Create -> Get -> Update -> Status -> Password -> Delete) ---');
  const createRes = await testEndpoint('Create User Primary', '/api/admin/createuser', 'POST', testUserPayload, [200, 201]);
  if (createRes.body?.data?.user?._id || createRes.body?.data?._id || createRes.body?.user?._id) {
    createdUserId = createRes.body?.data?.user?._id || createRes.body?.data?._id || createRes.body?.user?._id;
  }

  if (createdUserId) {
    console.log(`\nCreated test user ID: ${createdUserId}`);
    await testEndpoint('Get User by ID Primary', `/api/admin/getuserbyid/${createdUserId}`);
    await testEndpoint('Get User by ID Alias: /users/:id', `/api/admin/users/${createdUserId}`);
    await testEndpoint('Get User by ID Alias: /getuser/:id', `/api/admin/getuser/${createdUserId}`);

    await testEndpoint('Update User Primary', `/api/admin/updateuser/${createdUserId}`, 'PUT', { displayName: 'Updated Automation User' });
    await testEndpoint('Update User Alias: /users/:id (PATCH)', `/api/admin/users/${createdUserId}`, 'PATCH', { displayName: 'Updated User Patch' });

    await testEndpoint('Set User Status Primary', `/api/admin/usersstatus/${createdUserId}`, 'PUT', { isActive: false });
    await testEndpoint('Set User Status Alias: /userstatus/:id', `/api/admin/userstatus/${createdUserId}`, 'PUT', { isActive: true });
    await testEndpoint('Set User Status Alias: /users/:id/status', `/api/admin/users/${createdUserId}/status`, 'PATCH', { isActive: true });

    await testEndpoint('Reset Password Primary', `/api/admin/resetpassword/${createdUserId}`, 'POST', { newPassword: 'NewPassword@2026!' });
    await testEndpoint('Reset Password Alias: /reset-password/:id', `/api/admin/reset-password/${createdUserId}`, 'POST', { newPassword: 'NewPassword@2026!' });

    await testEndpoint('Delete User Primary', `/api/admin/deleteuser/${createdUserId}`, 'DELETE');
  }

  console.log('\n--- 4. Testing Monitoring & Audit APIs ---');
  await testEndpoint('Get Conversations Primary', '/api/admin/getallconversations');
  await testEndpoint('Get Conversations Alias: /conversations', '/api/admin/conversations');
  await testEndpoint('Get Files Primary', '/api/admin/getallfiles');
  await testEndpoint('Get Files Alias: /files', '/api/admin/files');
  await testEndpoint('Get Audit Logs Primary', '/api/admin/getalllogs');
  await testEndpoint('Get Audit Logs Alias: /logs', '/api/admin/logs');
  await testEndpoint('Get Audit Logs Alias: /auditlogs', '/api/admin/auditlogs');

  console.log('\n========================================');
  console.log('          TEST SUMMARY REPORT           ');
  console.log('========================================');
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  console.log(`Total: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Endpoints:');
    testResults.filter(r => !r.passed).forEach(r => {
      console.log(`- [${r.method}] ${r.path} -> Status: ${r.status} (${r.details})`);
    });
  }
}

runTests().catch(console.error);
