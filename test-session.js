const BASE = "http://127.0.0.1:3000";
const email = `session${Date.now()}@example.com`;
const password = "Research2026!";

async function main() {
  const registration = await fetch(BASE + "/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Session Test User",
      email,
      password
    })
  });

  console.log("Registration:", registration.status);

  const login = await fetch(BASE + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  console.log("Login:", login.status);

  const setCookie = login.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("No session cookie received");
  }

  const cookie = setCookie.split(";")[0];

  const before = await fetch(BASE + "/api/me", {
    headers: { Cookie: cookie }
  });

  console.log("Before logout:", before.status);

  const logout = await fetch(BASE + "/api/logout", {
    method: "POST",
    headers: { Cookie: cookie }
  });

  console.log("Logout:", logout.status);

  const after = await fetch(BASE + "/api/me", {
    headers: { Cookie: cookie }
  });

  console.log("After logout:", after.status);
}

main().catch(console.error);