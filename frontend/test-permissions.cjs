4const axios = require('axios');

const API_BASE = 'http://localhost:8080/api/v1';

async function login(username, password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
  return res.data.data.token || res.data.data.accessToken;
}

async function test() {
  try {
    console.log('Logging in as Murugan...');
    const ownerToken = await login('Murugan', 'Murugan123@!');
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    const farmsRes = await axios.get(`${API_BASE}/farms`, { headers: ownerHeaders });
    const farmId = farmsRes.data.data.content[0].id;
    console.log('Found farm for Murugan:', farmId);

    console.log('Registering test user...');
    let testUserId;
    let testUserPassword = 'Password123!';
    let testUsername = 'TestManager' + Date.now();
    try {
      const regRes = await axios.post(`${API_BASE}/auth/register`, {
        username: testUsername,
        password: testUserPassword,
        confirmPassword: testUserPassword,
        phone: '+91' + Math.floor(1000000000 + Math.random() * 9000000000),
        email: testUsername + '@example.com',
        role: 'USER'
      });
      console.log('Registered test user');

      const loginRes = await axios.post(`${API_BASE}/auth/login`, { username: testUsername, password: testUserPassword });
      testUserId = loginRes.data.data.user.id;
      console.log('Test Manager ID:', testUserId);
    } catch (e) {
      console.error('Failed to create test user', e.response?.data || e.message);
      return;
    }

    const kumaranId = testUserId; // Reusing variable name to avoid refactoring the whole file

    console.log('Assigning Manager with NO_ACCESS to Operations...');
    await axios.post(`${API_BASE}/farms/${farmId}/permissions/managers`, {
      userId: kumaranId,
      moduleAccess: { OPERATIONS: 'NO_ACCESS', FARM_MANAGEMENT: 'VIEW_ONLY' },
      sensitivePermissions: []
    }, { headers: ownerHeaders }).catch(() => {});

    await axios.put(`${API_BASE}/farms/${farmId}/permissions/managers/${kumaranId}`, {
      moduleAccess: { OPERATIONS: 'NO_ACCESS', FARM_MANAGEMENT: 'VIEW_ONLY' },
      sensitivePermissions: []
    }, { headers: ownerHeaders });

    console.log('Logging in as Manager...');
    const managerToken = await login(testUsername, testUserPassword);
    const managerHeaders = { Authorization: `Bearer ${managerToken}` };

    console.log('Kumaran attempting to read fields with NO_ACCESS...');
    try {
      await axios.get(`${API_BASE}/fields?farmId=${farmId}`, { headers: managerHeaders });
      console.error('FAIL: Kumaran was able to read fields despite NO_ACCESS');
    } catch (e) {
      if (e.response && e.response.status === 403) {
        console.log('PASS: Kumaran correctly denied access to read fields (403)');
      } else {
        console.error('FAIL: Unexpected error', e.message);
      }
    }

    console.log('Owner upgrading Kumaran to VIEW_ONLY for Operations...');
    await axios.put(`${API_BASE}/farms/${farmId}/permissions/managers/${kumaranId}`, {
      moduleAccess: { OPERATIONS: 'VIEW_ONLY', FARM_MANAGEMENT: 'VIEW_ONLY' },
      sensitivePermissions: []
    }, { headers: ownerHeaders });

    console.log('Kumaran attempting to read fields with VIEW_ONLY...');
    try {
      await axios.get(`${API_BASE}/fields?farmId=${farmId}`, { headers: managerHeaders });
      console.log('PASS: Kumaran successfully read fields');
    } catch (e) {
      console.error('FAIL: Kumaran failed to read fields', e.message);
    }

    console.log('Kumaran attempting to create field with VIEW_ONLY...');
    try {
      await axios.post(`${API_BASE}/fields`, {
        farmId,
        name: 'Test Field by Kumaran',
        area: 5,
        areaUnit: 'ACRE',
        status: 'ACTIVE'
      }, { headers: managerHeaders });
      console.error('FAIL: Kumaran created field despite VIEW_ONLY');
    } catch (e) {
      if (e.response && e.response.status === 403) {
        console.log('PASS: Kumaran correctly denied access to create fields (403)');
      } else {
        console.error('FAIL: Unexpected error', e.message);
      }
    }

    console.log('Owner upgrading Kumaran to FULL_ACCESS for Operations...');
    await axios.put(`${API_BASE}/farms/${farmId}/permissions/managers/${kumaranId}`, {
      moduleAccess: { OPERATIONS: 'FULL_ACCESS', FARM_MANAGEMENT: 'VIEW_ONLY' },
      sensitivePermissions: []
    }, { headers: ownerHeaders });

    console.log('Kumaran attempting to create field with FULL_ACCESS...');
    let createRes;
    try {
      createRes = await axios.post(`${API_BASE}/fields`, {
        farmId,
        name: 'Test Field by Kumaran',
        area: 5,
        areaUnit: 'ACRE',
        status: 'ACTIVE'
      }, { headers: managerHeaders });
      console.log('PASS: Kumaran successfully created field! Field Code:', createRes.data.data.fieldCode);
    } catch (e) {
      console.error('FAIL: Kumaran failed to create field despite FULL_ACCESS', e.response?.data || e.message);
      return;
    }

    console.log('Kumaran attempting to delete field...');
    try {
      await axios.delete(`${API_BASE}/fields/${createRes.data.data.id}`, { headers: managerHeaders });
      console.log('PASS: Cleaned up test field.');
    } catch (e) {
      console.error('FAIL: Kumaran failed to delete field', e.response?.data || e.message);
    }

    console.log('--- ALL TESTS COMPLETED ---');

  } catch (err) {
    console.error('Test execution failed:', err.message);
    if (err.response) console.error(err.response.data);
  }
}

test();
