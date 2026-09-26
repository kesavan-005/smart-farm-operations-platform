const axios = require('axios');

const API_BASE = 'http://localhost:8080/api/v1';

async function login(username, password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
  return res.data.data.token || res.data.data.accessToken;
}

async function test() {
  try {
    console.log('Logging in as Ramesh...');
    const ownerToken = await login('ramesh', 'Ramesh@2026');
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    const farmsRes = await axios.get(`${API_BASE}/farms`, { headers: ownerHeaders });
    const farmId = farmsRes.data.data.content[0].id;
    console.log('Found farm for Ramesh:', farmId);

    console.log('Fetching assignees for the farm...');
    const assigneesRes = await axios.get(`${API_BASE}/farms/${farmId}/activity-assignees`, { headers: ownerHeaders });
    console.log('Assignees response:', JSON.stringify(assigneesRes.data.data, null, 2));

    const fieldsRes = await axios.get(`${API_BASE}/fields?farmId=${farmId}`, { headers: ownerHeaders });
    const fieldId = fieldsRes.data.data.content.length > 0 ? fieldsRes.data.data.content[0].id : null;
    
    if (!fieldId) {
       console.log('No fields found to create activity on');
       return;
    }
    
    const randomUuid = '00000000-0000-0000-0000-000000000000';

    console.log('Attempting to create activity with invalid cross-farm worker...');
    try {
        await axios.post(`${API_BASE}/activities`, {
            title: 'Test Invalid Worker',
            farmId: farmId,
            fieldId: fieldId,
            activityType: 'IRRIGATION',
            scheduledDate: new Date().toISOString(),
            performedBy: randomUuid
        }, { headers: ownerHeaders });
        console.error('FAIL: Created activity with invalid worker');
    } catch (e) {
        console.log('PASS: Denied activity with invalid worker (expected). Status:', e.response?.status, 'Message:', e.response?.data?.message);
    }
    
    const validWorker = assigneesRes.data.data.workers.length > 0 ? assigneesRes.data.data.workers[0].id : null;
    const validSupervisor = assigneesRes.data.data.supervisors.length > 0 ? assigneesRes.data.data.supervisors[0].id : null;

    if (validWorker && validSupervisor) {
        console.log('Attempting to create activity with valid worker and supervisor...');
        try {
            const createRes = await axios.post(`${API_BASE}/activities`, {
                title: 'Test Valid Activity',
                farmId: farmId,
                fieldId: fieldId,
                activityType: 'IRRIGATION',
                scheduledDate: new Date().toISOString(),
                performedBy: validWorker,
                supervisorId: validSupervisor
            }, { headers: ownerHeaders });
            console.log('PASS: Successfully created activity:', createRes.data.data.id);
            
            // Clean up
            await axios.delete(`${API_BASE}/activities/${createRes.data.data.id}`, { headers: ownerHeaders });
            console.log('Cleaned up test activity.');
        } catch (e) {
            console.error('FAIL: Could not create activity with valid worker/supervisor:', e.response?.data || e.message);
        }
    } else {
        console.log('No valid workers or supervisors found to test successful creation.');
    }

  } catch (err) {
    console.error('Test execution failed:', err.message);
    if (err.response) console.error(err.response.data);
  }
}

test();
