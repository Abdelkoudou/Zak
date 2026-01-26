# Load Testing Implementation Plan

**Goal**: Test how many concurrent users the React Native medical quiz app can handle without crashing, while protecting Supabase production bandwidth.

**Architecture**: Three-layer testing approach:
1. **Mock API Server** - Simulates Supabase responses for load testing
2. **k6 Load Testing** - Stress tests the API layer with virtual users
3. **Client Performance Profiling** - Tests React Native rendering under load

**Tech Stack**:
- k6 (JavaScript-based load testing)
- Express.js (Mock API server)
- React Native Performance Monitor
- Flipper (optional, for detailed profiling)

---

## Phase 1: Mock API Server Setup

### Task 1.1: Create Mock Server Directory Structure

**Files**:
- Create: `load-tests/mock-server/server.js`
- Create: `load-tests/mock-server/data/questions.json`
- Create: `load-tests/mock-server/package.json`

**Step 1: Create package.json**
```json
{
  "name": "fmc-mock-server",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

**Step 2: Create mock questions data**
Generate 500+ mock questions to simulate realistic load.

**Step 3: Create Express server**
Endpoints to mock:
- `GET /rest/v1/questions` - Returns paginated questions
- `POST /auth/v1/token` - Mock login
- `GET /rest/v1/saved_questions` - Returns saved items

**Step 4: Verify server starts**
- Command: `cd load-tests/mock-server && npm install && npm start`
- Expected: Server running on `http://localhost:3001`

---

## Phase 2: k6 Load Testing Setup

### Task 2.1: Install and Configure k6

**Files**:
- Create: `load-tests/k6/load-test.js`
- Create: `load-tests/k6/stress-test.js`
- Create: `load-tests/k6/config.js`

**Step 1: Install k6**
```powershell
# Windows (via Chocolatey)
choco install k6

# Or via winget
winget install k6
```

**Step 2: Create load test script**
```javascript
// load-tests/k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // <1% failure rate
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Simulate user flow: login -> fetch questions -> answer
  const questions = http.get(`${BASE_URL}/rest/v1/questions?limit=20`);
  check(questions, { 'questions loaded': (r) => r.status === 200 });
  
  sleep(1); // Think time between actions
}
```

**Step 3: Create stress test script**
Tests breaking point (how many users until failure).

**Step 4: Run load test**
- Command: `k6 run load-tests/k6/load-test.js`
- Expected: Report showing requests/sec, latency percentiles, error rate

---

## Phase 3: Client Performance Profiling

### Task 3.1: React Native Performance Testing

**Files**:
- Create: `load-tests/client/stress-data.json` (1000+ questions)
- Modify: `app/practice/[moduleId].tsx` (add performance markers)

**Step 1: Create stress test data loader**
Modify the app to load 500+ questions at once to test:
- FlatList virtualization performance
- Memory usage
- Frame rate during rapid scrolling

**Step 2: Add performance markers**
```typescript
// Add to [moduleId].tsx
import { PerformanceObserver } from 'react-native';

// Measure question render time
const startMark = performance.now();
// ... render
const endMark = performance.now();
console.log(`Render time: ${endMark - startMark}ms`);
```

**Step 3: Test scenarios**
1. Load 100 questions → measure FPS
2. Load 500 questions → measure FPS
3. Load 1000 questions → measure FPS
4. Rapid tab switching (50 times) → check for crashes

**Step 4: Measure with Flipper (optional)**
- Install Flipper desktop app
- Connect to running app
- Use Performance plugin to capture flame graphs

---

## Phase 4: Run Full Test Suite

### Task 4.1: Execute Load Tests

**Step 1: Start mock server**
```powershell
cd load-tests/mock-server
npm start
```

**Step 2: Run k6 load test**
```powershell
k6 run load-tests/k6/load-test.js
```

**Step 3: Analyze results**
- Requests per second achieved
- 95th percentile latency
- Error rate at peak load
- Breaking point (when errors > 5%)

**Step 4: Generate report**
```powershell
k6 run --out json=results.json load-tests/k6/load-test.js
```

---

## Expected Outputs

| Metric | Target | Measured |
|--------|--------|----------|
| Concurrent users (no errors) | 100+ | TBD |
| Requests/second | 500+ | TBD |
| P95 latency | < 500ms | TBD |
| Error rate at 100 users | < 1% | TBD |
| Client FPS with 500 questions | > 30 | TBD |

---

## Safety: Supabase Protection

> [!IMPORTANT]
> All load tests run against the **mock server** (`localhost:3001`), NOT against production Supabase. This ensures:
> - Zero bandwidth consumption
> - No rate limiting triggered
> - No database stress
> - No cost impact

To test against **local Supabase** (optional, more realistic):
```powershell
npx supabase start  # Starts local Postgres + Auth + Storage
# Then update k6 BASE_URL to http://localhost:54321
```

---

## Execution Order

1. [ ] Task 1.1: Create mock server
2. [ ] Task 1.2: Generate test data (500 questions)
3. [ ] Task 2.1: Install k6
4. [ ] Task 2.2: Write load test scripts
5. [ ] Task 2.3: Write stress test scripts
6. [ ] Task 3.1: Add client performance markers
7. [ ] Task 4.1: Run full test suite
8. [ ] Task 4.2: Generate final report
