// Cleanup Script - Delete all SOC apps from Cumin project
const CUMIN_TOKEN = "cumin_GjynCIFJtyoZ_73wasCoWNYf7Y-Pk0jMffHEdRzblBg";
const PROJECT_ID = "178bfad9-5edc-409f-833c-6fffca7aed5a";
const API = "https://api.cumin.dev";
let SESSION_ID = null;

async function mcpRequest(method, params, id) {
  const body = { jsonrpc: "2.0", method, id };
  if (params) body.params = params;
  const headers = { Authorization: `Bearer ${CUMIN_TOKEN}`, "Content-Type": "application/json" };
  if (SESSION_ID) headers["Mcp-Session-Id"] = SESSION_ID;
  const res = await fetch(`${API}/mcp`, { method: "POST", headers, body: JSON.stringify(body) });
  const sid = res.headers.get("Mcp-Session-Id");
  if (sid) SESSION_ID = sid;
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

async function callTool(name, args) {
  const r = await mcpRequest("tools/call", { name, arguments: args }, Date.now());
  return r.content?.map(c => c.text || "").join("") || JSON.stringify(r);
}

async function main() {
  console.log("🧹 SOC Cleanup\n");
  await mcpRequest("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "cleanup", version: "1.0" } }, 1);
  
  const result = await callTool("list_apps", { project_id: PROJECT_ID });
  const apps = JSON.parse(result);
  console.log(`Found ${apps.length} apps\n`);
  
  for (const app of apps) {
    console.log(`  Deleting ${app.name} (${app.id})...`);
    await callTool("delete_app", { project_id: PROJECT_ID, id: app.id });
    console.log(`  ✅ Done`);
  }
  console.log("\n🧹 All clean!");
}

main().catch(e => { console.error("Error:", e); process.exit(1); });
