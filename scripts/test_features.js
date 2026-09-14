// GitHub: Create repo + get username via API
const EMAIL = "ziadalex2003@gmail.com";
const PASS = "2062003MZ*";

// Use Basic Auth to get user info and create repo
const basicAuth = Buffer.from(`${EMAIL}:${PASS}`).toString("base64");

async function ghRequest(method, path, body) {
  const opts = {
    method,
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json",
      "User-Agent": "cumin-soc-deployer",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`https://api.github.com${path}`, opts);
  const data = await r.json();
  return { status: r.status, data };
}

async function main() {
  console.log("=== GitHub Setup ===\n");

  // Get current user
  const { status: s1, data: user } = await ghRequest("GET", "/user");
  console.log("GET /user →", s1);
  if (s1 === 200) {
    console.log("  Username:", user.login);
    console.log("  Name:", user.name);
    console.log("  Email:", user.email);
  } else {
    console.log("  Error:", JSON.stringify(user));
    console.log("\n⚠️  Basic auth might not work — GitHub requires PAT for API since 2020");
  }
}
main().catch(e => console.error(e.message));
