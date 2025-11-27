import fetch from "node-fetch";

/**
 * Automated Authentication Flow Testing Script
 * 
 * Tests the complete authentication flow:
 * 1. Registration
 * 2. Email verification
 * 3. Sign-in
 * 4. Session management
 * 5. Sign-out
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const TEST_EMAIL = `test-${Date.now()}@emtelaak-test.com`;
const TEST_PASSWORD = "TestPassword123!";

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, details = "") {
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testRegistration() {
  console.log("\n📝 Testing Registration Flow...\n");
  
  try {
    // Test 1: Register with valid data
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Test User",
      }),
    });
    
    const data = await response.json();
    logTest(
      "Register with valid data",
      response.ok,
      response.ok ? `User created: ${TEST_EMAIL}` : `Error: ${data.message}`
    );
    
    // Test 2: Register with duplicate email
    const dupResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Test User",
      }),
    });
    
    logTest(
      "Reject duplicate email registration",
      !dupResponse.ok,
      !dupResponse.ok ? "Correctly rejected duplicate" : "Should have rejected duplicate"
    );
    
    // Test 3: Register with weak password
    const weakPwResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `weak-${Date.now()}@test.com`,
        password: "123",
        name: "Test User",
      }),
    });
    
    logTest(
      "Reject weak password",
      !weakPwResponse.ok,
      !weakPwResponse.ok ? "Correctly rejected weak password" : "Should have rejected weak password"
    );
    
  } catch (error) {
    logTest("Registration flow", false, `Error: ${error.message}`);
  }
}

async function testSignIn() {
  console.log("\n🔐 Testing Sign-In Flow...\n");
  
  try {
    // Test 1: Sign in with valid credentials
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@emtelaak-test.com",
        password: "TestPassword123!",
      }),
    });
    
    const data = await response.json();
    const cookies = response.headers.get("set-cookie");
    
    logTest(
      "Sign in with valid credentials",
      response.ok && cookies,
      response.ok ? `Session created` : `Error: ${data.message}`
    );
    
    // Test 2: Sign in with wrong password
    const wrongPwResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@emtelaak-test.com",
        password: "WrongPassword123!",
      }),
    });
    
    logTest(
      "Reject wrong password",
      !wrongPwResponse.ok,
      !wrongPwResponse.ok ? "Correctly rejected wrong password" : "Should have rejected wrong password"
    );
    
    // Test 3: Sign in with non-existent email
    const noEmailResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@test.com",
        password: "TestPassword123!",
      }),
    });
    
    logTest(
      "Reject non-existent email",
      !noEmailResponse.ok,
      !noEmailResponse.ok ? "Correctly rejected non-existent email" : "Should have rejected non-existent email"
    );
    
    return cookies;
  } catch (error) {
    logTest("Sign-in flow", false, `Error: ${error.message}`);
    return null;
  }
}

async function testMultipleSignInOut(cookies) {
  console.log("\n🔄 Testing Multiple Sign-In/Sign-Out Cycles...\n");
  
  for (let i = 1; i <= 5; i++) {
    try {
      // Sign in
      const signInResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "investor1@emtelaak-test.com",
          password: "TestPassword123!",
        }),
      });
      
      const newCookies = signInResponse.headers.get("set-cookie");
      
      // Sign out
      const signOutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Cookie": newCookies || "",
        },
      });
      
      logTest(
        `Sign-in/Sign-out cycle #${i}`,
        signInResponse.ok && signOutResponse.ok,
        `Sign-in: ${signInResponse.ok}, Sign-out: ${signOutResponse.ok}`
      );
      
      // Wait a bit between cycles
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logTest(`Sign-in/Sign-out cycle #${i}`, false, `Error: ${error.message}`);
    }
  }
}

async function testSessionManagement(cookies) {
  console.log("\n📊 Testing Session Management...\n");
  
  try {
    // Test listing sessions
    const listResponse = await fetch(`${BASE_URL}/api/trpc/sessionManagement.listSessions`, {
      headers: {
        "Cookie": cookies || "",
      },
    });
    
    logTest(
      "List active sessions",
      listResponse.ok,
      listResponse.ok ? "Sessions retrieved" : "Failed to retrieve sessions"
    );
    
  } catch (error) {
    logTest("Session management", false, `Error: ${error.message}`);
  }
}

async function runTests() {
  console.log("🧪 Starting Comprehensive Authentication Tests");
  console.log(`🌐 Testing against: ${BASE_URL}\n`);
  console.log("=" .repeat(60));
  
  await testRegistration();
  const cookies = await testSignIn();
  await testMultipleSignInOut(cookies);
  if (cookies) {
    await testSessionManagement(cookies);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 Test Results Summary:");
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
  }
  
  console.log("\n✅ Testing complete!\n");
  
  return testResults.failed === 0 ? 0 : 1;
}

// Run tests
runTests()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error("\n💥 Test script failed:", error);
    process.exit(1);
  });
