const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Utility helper to make requests using HTTP standard module (to avoid needing packages)
function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('==================================================');
  console.log('       AURORA HEALTH COMPANION - SYSTEM TEST       ');
  console.log('==================================================\n');

  let testCount = 0;
  let passedCount = 0;

  function printTestResult(name, passed, detail = '') {
    testCount++;
    if (passed) {
      passedCount++;
      console.log(`✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
    } else {
      console.log(`❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
    }
  }

  // Test 1: Status Ping
  try {
    const res = await makeRequest('http://localhost:3000/status');
    printTestResult('Server Status Ping', res.status === 'online', `Status: ${res.status}`);
  } catch (e) {
    printTestResult('Server Status Ping', false, e.message);
  }

  // Test 2: User Onboarding
  try {
    const payload = {
      name: 'John Doe',
      age: 28,
      gender: 'male',
      height: 180,
      weight: 75,
      wake_time: '07:00',
      bed_time: '23:00',
      goals: ['Improve Hydration', 'Sleep Better'],
      notifications: { hydration: true, sleep: true }
    };
    const res = await makeRequest(`${BASE_URL}/onboarding`, 'POST', payload);
    printTestResult('User Onboarding Endpoint', res.success === true, `Message: ${res.message}`);
  } catch (e) {
    printTestResult('User Onboarding Endpoint', false, e.message);
  }

  // Test 3: Fetch Profile
  try {
    const res = await makeRequest(`${BASE_URL}/user`);
    printTestResult('Fetch Profile Details', res.success === true && res.user.name === 'John Doe', `User Name: ${res.user ? res.user.name : 'none'}`);
  } catch (e) {
    printTestResult('Fetch Profile Details', false, e.message);
  }

  // Test 4: Log Water
  try {
    const res = await makeRequest(`${BASE_URL}/water`, 'POST', { amount: 500 });
    printTestResult('Log Water Intake (500ml)', res.success === true, `Logged: ${res.message}`);
  } catch (e) {
    printTestResult('Log Water Intake (500ml)', false, e.message);
  }

  // Test 5: Log Sleep
  try {
    const res = await makeRequest(`${BASE_URL}/sleep`, 'POST', { duration: 7.5, quality: 4 });
    printTestResult('Log Sleep Window (7.5 hours)', res.success === true, `Logged: ${res.message}`);
  } catch (e) {
    printTestResult('Log Sleep Window (7.5 hours)', false, e.message);
  }

  // Test 6: Create New Habit
  let createdHabitId = null;
  try {
    const res = await makeRequest(`${BASE_URL}/habit`, 'POST', { name: 'Read Book', icon: 'book' });
    createdHabitId = res.id;
    printTestResult('Create New Custom Habit', res.success === true, `Habit ID: ${createdHabitId}`);
  } catch (e) {
    printTestResult('Create New Custom Habit', false, e.message);
  }

  // Test 7: Toggle Habit Checkbox
  try {
    if (createdHabitId) {
      const res = await makeRequest(`${BASE_URL}/habit/toggle`, 'POST', { habitId: createdHabitId });
      printTestResult('Toggle Habit Complete Status', res.success === true && res.completed === true, `Message: ${res.message}`);
    } else {
      printTestResult('Toggle Habit Complete Status', false, 'Habit was not created');
    }
  } catch (e) {
    printTestResult('Toggle Habit Complete Status', false, e.message);
  }

  // Test 8: Log Meal (Macro estimation fallback)
  try {
    const payload = {
      meal_type: 'lunch',
      description: 'Salad with eggs',
      calories: 0 // trigger backend estimate
    };
    const res = await makeRequest(`${BASE_URL}/meals`, 'POST', payload);
    printTestResult('Meal Macro Estimator Logging', res.success === true, `Estimated Cals: ${res.meal.calories} kcal`);
  } catch (e) {
    printTestResult('Meal Macro Estimator Logging', false, e.message);
  }

  // Test 9: Voice AI Agent Conversation & Tool Action Dispatching
  try {
    const res = await makeRequest(`${BASE_URL}/chat`, 'POST', { messageText: 'I drank 250ml water' });
    const isSuccess = res.success && res.response.actionTaken === 'logWater' && res.response.actionDetails.amount === 250;
    printTestResult('AI Agent Chat Dispatcher (Tool Water)', isSuccess, `Detected Action: ${res.response ? res.response.actionTaken : 'none'}`);
  } catch (e) {
    printTestResult('AI Agent Chat Dispatcher (Tool Water)', false, e.message);
  }

  // Test 10: Aggregate Dashboard Summary
  try {
    const res = await makeRequest(`${BASE_URL}/dashboard`);
    // Check if total water logged is computed (500ml manual + 250ml agentic = 750ml)
    const isWaterSync = res.dashboard.waterIntake >= 750;
    printTestResult(
      'Dashboard Aggregation Sync Check',
      res.success === true && isWaterSync,
      `Calculated Water: ${res.dashboard ? res.dashboard.waterIntake : 0}ml, Sleep: ${res.dashboard ? res.dashboard.sleepDuration : 0}h`
    );
  } catch (e) {
    printTestResult('Dashboard Aggregation Sync Check', false, e.message);
  }

  console.log('\n==================================================');
  console.log(`    TEST RUN SUMMARY: ${passedCount} / ${testCount} Passed (${Math.round((passedCount/testCount)*100)}%)`);
  console.log('==================================================');
}

runAllTests().catch(console.error);
