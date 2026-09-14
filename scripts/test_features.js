// Full advanced features test + integration with SOC system
const TOKEN = "cumin_GjynCIFJtyoZ_73wasCoWNYf7Y-Pk0jMffHEdRzblBg";
const PROJECT_ID = "178bfad9-5edc-409f-833c-6fffca7aed5a";
const API = "https://api.cumin.dev";
let SESSION_ID = null;

async function mcpRequest(method, params, id) {
  const body = { jsonrpc: "2.0", method, id };
  if (params) body.params = params;
  const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (SESSION_ID) headers["Mcp-Session-Id"] = SESSION_ID;
  const res = await fetch(`${API}/mcp`, { method: "POST", headers, body: JSON.stringify(body) });
  const sid = res.headers.get("Mcp-Session-Id");
  if (sid) SESSION_ID = sid;
  const data = await res.json();
  if (data.error) throw new Error(`MCP error: ${JSON.stringify(data.error)}`);
  return data.result;
}

async function callTool(name, args) {
  const r = await mcpRequest("tools/call", { name, arguments: args }, Date.now());
  const text = r.content?.map(c => c.text || "").join("") || JSON.stringify(r);
  if (r.isError) return { error: text };
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  console.log("═══ ADVANCED FEATURES - FULL INTEGRATION ═══\n");

  await mcpRequest("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "soc-features", version: "2.0" } }, 1);
  console.log("✅ MCP Session:", SESSION_ID, "\n");

  // List all available tools first
  console.log("━━━ AVAILABLE MCP TOOLS ━━━");
  const tools = await mcpRequest("tools/list", {}, Date.now());
  if (tools?.tools) {
    tools.tools.forEach(t => console.log(" -", t.name));
  }
  console.log();

  // ═══ 1. SECRETS ═══
  console.log("━━━ 1. SECRETS ━━━");
  
  const secretsList = await callTool("list_secrets", { project_id: PROJECT_ID });
  console.log("  Existing secrets:", JSON.stringify(secretsList));

  // Value MUST be base64 encoded
  const secrets = [
    { name: "soc-api-key", value: Buffer.from("soc-api-key-2026-prod").toString("base64") },
    { name: "soc-threat-intel-token", value: Buffer.from("threat-intel-feed-token-xyz").toString("base64") },
    { name: "soc-db-password", value: Buffer.from("SOC_DB_P@ssw0rd!2026").toString("base64") },
  ];

  const createdSecrets = [];
  for (const s of secrets) {
    const r = await callTool("create_secret", { project_id: PROJECT_ID, name: s.name, value: s.value });
    if (r.error) {
      console.log(`  ⚠️  ${s.name}: ${r.error}`);
    } else {
      console.log(`  ✅ Created secret: ${s.name} → ID: ${r.id || JSON.stringify(r)}`);
      createdSecrets.push({ name: s.name, id: r.id });
    }
  }

  // ═══ 2. CONSTELLATIONS ═══
  console.log("\n━━━ 2. CONSTELLATIONS ━━━");

  const constList = await callTool("list_constellations", { project_id: PROJECT_ID });
  console.log("  Existing constellations:", JSON.stringify(constList));

  // Create SOC private network
  const constResult = await callTool("create_constellation", {
    project_id: PROJECT_ID,
    name: "soc-private-network"
  });
  console.log("  ✅ Created constellation:", JSON.stringify(constResult));
  const constId = constResult.id || constResult;

  // Try to add our apps to the constellation
  const appsList = await callTool("list_apps", { project_id: PROJECT_ID });
  const apps = typeof appsList === 'string' ? JSON.parse(appsList) : appsList;
  console.log("\n  Apps to add to constellation:");
  apps.forEach(a => console.log(`    - ${a.name}: ${a.id} (${a.status})`));

  // Try adding apps to constellation
  for (const app of apps) {
    const addResult = await callTool("add_app_to_constellation", {
      project_id: PROJECT_ID,
      constellation_id: constId,
      app_id: app.id
    });
    if (addResult && addResult.error) {
      console.log(`  ⚠️  add ${app.name}: ${addResult.error}`);
    } else {
      console.log(`  ✅ Added ${app.name} to constellation`);
    }
  }

  // ═══ 3. PULL SECRETS ═══
  console.log("\n━━━ 3. PULL SECRETS ━━━");

  const pullList = await callTool("list_pull_secrets", { project_id: PROJECT_ID });
  console.log("  Existing pull secrets:", JSON.stringify(pullList));

  const createPull = await callTool("create_pull_secret", {
    project_id: PROJECT_ID,
    name: "soc-ghcr",
    server: "ghcr.io",
    username: "soc-deployer",
    password: Buffer.from("ghp_placeholder_token").toString("base64")
  });
  console.log("  create_pull_secret:", JSON.stringify(createPull));

  // ═══ FINAL STATE ═══
  console.log("\n━━━ FINAL STATE ━━━");
  
  const finalSecrets = await callTool("list_secrets", { project_id: PROJECT_ID });
  console.log("  Secrets:", JSON.stringify(finalSecrets));
  
  const finalConst = await callTool("list_constellations", { project_id: PROJECT_ID });
  console.log("  Constellations:", JSON.stringify(finalConst));

  const finalPull = await callTool("list_pull_secrets", { project_id: PROJECT_ID });
  console.log("  Pull Secrets:", JSON.stringify(finalPull));
}

main().catch(e => console.error("Fatal:", e.message));
