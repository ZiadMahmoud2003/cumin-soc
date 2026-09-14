// Deploy Script - Reads src/ files and deploys to Cumin
const fs = require("fs");
const path = require("path");

const CUMIN_TOKEN = "cumin_GjynCIFJtyoZ_73wasCoWNYf7Y-Pk0jMffHEdRzblBg";
const PROJECT_ID = "178bfad9-5edc-409f-833c-6fffca7aed5a";
const API = "https://api.cumin.dev";
let SESSION_ID = null;

async function mcpRequest(method, params, id) {
  const body = { jsonrpc: "2.0", method, id };
  if (params) body.params = params;
  const headers = { Authorization: `Bearer ${CUMIN_TOKEN}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (SESSION_ID) headers["Mcp-Session-Id"] = SESSION_ID;
  const res = await fetch(`${API}/mcp`, { method: "POST", headers, body: JSON.stringify(body) });
  const sid = res.headers.get("Mcp-Session-Id");
  if (sid) SESSION_ID = sid;
  const data = await res.json();
  if (data.error) throw new Error(`MCP: ${JSON.stringify(data.error)}`);
  return data.result;
}

function extractId(raw) { try { return JSON.parse(raw).id; } catch { const m = raw.match(/"id"\s*:\s*"([^"]+)"/); return m ? m[1] : null; } }

async function callTool(name, args) {
  const r = await mcpRequest("tools/call", { name, arguments: args }, Date.now());
  const text = r.content?.map(c => c.text || "").join("") || JSON.stringify(r);
  if (r.isError) { console.log(`  ⚠️ ${text}`); return { error: text }; }
  return text;
}

async function main() {
  console.log("═══ SOC PLATFORM DEPLOY ═══\n");

  await mcpRequest("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "soc", version: "3.0" } }, 1);
  console.log("✅ MCP connected\n");

  // 1. Clean old apps
  console.log("🧹 Cleaning old apps...");
  const existing = await callTool("list_apps", { project_id: PROJECT_ID });
  try {
    const apps = JSON.parse(existing);
    for (const app of apps) {
      if (app.name.startsWith("soc-")) {
        console.log(`  Deleting ${app.name}...`);
        await callTool("delete_app", { project_id: PROJECT_ID, id: app.id });
      }
    }
  } catch (e) { console.log("  Parse:", e.message); }

  console.log("  ⏳ Waiting 5s...\n");
  await new Promise(r => setTimeout(r, 5000));

  // 2. Deploy Backend
  console.log("📦 Deploying soc-backend...");
  const backendCode = fs.readFileSync(path.join(__dirname, "..", "src", "backend.js"), "utf-8");
  console.log(`  Code: ${backendCode.length} chars`);

  const backend = await callTool("create_app", {
    project_id: PROJECT_ID,
    name: "soc-backend",
    image: "node:22-alpine",
    cpu: 250, memory: 512,
    instances: 1, hibernated: false,
    ports: [{ name: "http", number: 4000, health: { path: "/health" } }],
    env: [
      { name: "PORT", value: "4000" },
      { name: "APP_CODE_B64", value: Buffer.from(backendCode).toString("base64") }
    ],
    mounts: [],
    args: ["sh", "-c", "echo $APP_CODE_B64 | base64 -d > /app.js && node /app.js"],
    tags: { component: "backend", platform: "soc" }
  });

  if (backend.error) { console.log("  ❌ Backend failed:", backend.error); return; }
  console.log("  ✅ Backend ID:", extractId(backend));

  // Wait for backend
  console.log("  ⏳ Waiting 20s for backend boot...\n");
  await new Promise(r => setTimeout(r, 20000));

  // Get backend URL
  const apps2 = await callTool("list_apps", { project_id: PROJECT_ID });
  let backendUrl = null;
  try {
    const list = JSON.parse(apps2);
    const be = list.find(a => a.name === "soc-backend");
    if (be) {
      backendUrl = be.ports?.[0]?.hostname;
      console.log(`  Backend: ${be.status} → ${backendUrl}\n`);
    }
  } catch (e) { console.log("  Error:", e.message); }

  if (!backendUrl) { console.log("  ❌ No backend URL!"); return; }

  // 3. Deploy Gateway
  console.log("🌐 Deploying soc-gateway...");
  let gatewayCode = fs.readFileSync(path.join(__dirname, "..", "src", "gateway.js"), "utf-8");
  // Inject the actual backend URL
  gatewayCode = gatewayCode.replace(
    /const BACKEND = process\.env\.BACKEND_URL \|\| "[^"]+"/,
    `const BACKEND = process.env.BACKEND_URL || "${backendUrl}"`
  );
  console.log(`  Code: ${gatewayCode.length} chars`);

  const gateway = await callTool("create_app", {
    project_id: PROJECT_ID,
    name: "soc-gateway",
    image: "node:22-alpine",
    cpu: 150, memory: 250,
    instances: 1, hibernated: false,
    ports: [{ name: "http", number: 3000, health: { path: "/health" } }],
    env: [
      { name: "PORT", value: "3000" },
      { name: "BACKEND_URL", value: backendUrl },
      { name: "APP_CODE_B64", value: Buffer.from(gatewayCode).toString("base64") }
    ],
    mounts: [],
    args: ["sh", "-c", "echo $APP_CODE_B64 | base64 -d > /app.js && node /app.js"],
    tags: { component: "gateway", platform: "soc" }
  });

  if (gateway.error) { console.log("  ❌ Gateway failed:", gateway.error); return; }
  console.log("  ✅ Gateway ID:", extractId(gateway));

  // Final status
  console.log("\n  ⏳ Waiting 15s...\n");
  await new Promise(r => setTimeout(r, 15000));

  const finalApps = await callTool("list_apps", { project_id: PROJECT_ID });
  try {
    const list = JSON.parse(finalApps);
    console.log("═══ FINAL STATUS ═══\n");
    list.forEach(a => {
      const url = a.ports?.[0]?.hostname || "no URL";
      const icon = a.status === "running" ? "🟢" : "🟡";
      console.log(`  ${icon} ${a.name}: ${a.status} → ${url}`);
    });
  } catch (e) { console.log("Error:", e.message); }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
