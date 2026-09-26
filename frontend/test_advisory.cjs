const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', { username: 'Murugan', password: 'Murugan123@!' });
    const token = loginRes.data.data.token || loginRes.data.data.accessToken;
    
    const farmsRes = await axios.get('http://localhost:8080/api/v1/farms', { headers: { Authorization: `Bearer ${token}` } });
    const farmId = farmsRes.data.data.content[0].id;
    
    console.log("Found farm:", farmId);
    
    const advisoryRes = await axios.post(`http://localhost:8080/api/v1/farms/${farmId}/advisory`, {
      question: "What should I do about pests?"
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log(advisoryRes.data);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error body:", err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}
test();
