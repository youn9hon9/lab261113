const BASE = "http://127.0.0.1:3000";
const unique = Date.now();

async function request(path, method, body, cookie = "") {
  const response = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();
  return { response, data };
}

async function createAccount(name, email) {
  const result = await request("/api/register", "POST", {
    name,
    email,
    password: "Research2026!"
  });

  if (result.response.status !== 201) {
    throw new Error(result.data.message);
  }
}

async function login(email) {
  const result = await request("/api/login", "POST", {
    email,
    password: "Research2026!"
  });

  if (!result.response.ok) {
    throw new Error(result.data.message);
  }

  const setCookie = result.response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Session cookie missing");
  }

  return setCookie.split(";")[0];
}

async function main() {
  const emailA = `researcherA${unique}@example.com`;
  const emailB = `researcherB${unique}@example.com`;

  await createAccount("Researcher A", emailA);
  await createAccount("Researcher B", emailB);

  const cookieA = await login(emailA);
  const cookieB = await login(emailB);

  const created = await request("/api/projects", "POST", {
    title: "Confidential Research A",
    description: "Private project for researcher A"
  }, cookieA);

  console.log("Project creation:", created.response.status);

  const projectsA = await request(
    "/api/projects", "GET", null, cookieA
  );

  const projectsB = await request(
    "/api/projects", "GET", null, cookieB
  );

  console.log("Researcher A projects:", projectsA.data.projects);
  console.log("Researcher B projects:", projectsB.data.projects);

  const isolated = projectsA.data.projects.some(
    p => p.title === "Confidential Research A"
  ) && !projectsB.data.projects.some(
    p => p.title === "Confidential Research A"
  );

  console.log("Project isolation successful:", isolated);
}

main().catch(console.error);