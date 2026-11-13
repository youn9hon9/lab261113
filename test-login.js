const BASE_URL = "http://127.0.0.1:3000";

async function testLogin(email, password) {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  console.log("HTTP status:", response.status);
  console.log("Server message:", data.message);
  console.log("--------------------------");
}

async function main() {
  console.log("TEST 1: Unknown account");
  await testLogin("unknown@example.com", "WrongPassword123!");

  console.log("TEST 2: Empty password");
  await testLogin("alice@example.com", "");
}

main().catch(console.error);