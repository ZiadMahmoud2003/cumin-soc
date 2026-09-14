const TOKEN = "cumin_GjynCIFJtyoZ_73wasCoWNYf7Y-Pk0jMffHEdRzblBg";

const policy = ["package runtime", "import rego.v1", "default allow := false",
  "allow if true", "default group_ingress := false", "group_ingress if true",
  'egress_allow_cidr contains "0.0.0.0/0"'].join("\n");

async function t(method, url, body) {
  const opts = { method, headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(url, opts);
    const text = await r.text();
    const hit = r.status !== 404;
    console.log(hit ? "💡 HIT!" : "   ", method.padEnd(6), url.replace("https://cumin.dev","").padEnd(30), "->", r.status, ":", text.substring(0, 200));
    return { status: r.status, text };
  } catch(e) { console.log("   ERR", method, url, e.message); }
}

async function main() {
  console.log("=== Network Policy — 405 means endpoint EXISTS, wrong method ===\n");

  // cumin.dev (not api.cumin.dev) returns 405 for PUT — endpoint exists!
  // Try GET and PATCH on the same paths
  const paths = ["/network-policy", "/api/network-policy", "/v1/network-policy", "/network-policies", "/v1/network-policies"];
  
  for (const path of paths) {
    await t("GET",   "https://cumin.dev" + path);
    await t("PATCH", "https://cumin.dev" + path, { policy });
    await t("POST",  "https://cumin.dev" + path, { policy });
    await t("POST",  "https://cumin.dev" + path, { rego: policy });
    await t("PATCH", "https://cumin.dev" + path, { rego: policy });
    console.log("");
  }

  // Also try with different payload keys
  console.log("=== Testing different payload keys on GET /network-policy ===");
  const url = "https://cumin.dev/network-policy";
  await t("GET", url);
  await t("PATCH", url, { network_policy: policy });
  await t("PATCH", url, { data: policy });
  await t("PUT",   url, { rego: policy });
}

main();
