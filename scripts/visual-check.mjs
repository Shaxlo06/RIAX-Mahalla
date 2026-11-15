import { writeFile } from "node:fs/promises";

const endpoint = process.argv[2] || "http://127.0.0.1:9222";
const output = process.argv[3] || "preview-next-admin.png";
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 1000);
const route = process.argv[6] || "/admin";
const waitMs = Number(process.argv[7] || 1800);
const clickSelector = process.argv[8];
const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("Chrome page target topilmadi.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function call(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await call("Page.enable");
await call("Network.enable");
await call("Runtime.enable");
await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
for (const [name, value] of [["riax_role", "admin"], ["riax_name", encodeURIComponent("SMART RIAX Administratori")]]) {
  await call("Network.setCookie", { name, value, url: "http://localhost:3000", path: "/", httpOnly: true, sameSite: "Lax" });
}
await call("Page.navigate", { url: `http://localhost:3000${route}` });
await new Promise((resolve) => setTimeout(resolve, waitMs));
if (clickSelector) {
  await call("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(clickSelector)})?.click()` });
  await new Promise((resolve) => setTimeout(resolve, 700));
}
const diagnostics = await call("Runtime.evaluate", { expression: `JSON.stringify(Array.from(document.images).filter((image) => image.src.includes('tile.openstreetmap')).map((image) => ({src:image.src,width:image.naturalWidth,height:image.naturalHeight,complete:image.complete})))`, returnByValue: true });
if (route.includes("mahallas")) console.log(`OSM tiles: ${diagnostics.result?.value ?? "[]"}`);
const screenshot = await call("Page.captureScreenshot", { format: "png", fromSurface: true });
await writeFile(output, Buffer.from(screenshot.data, "base64"));
socket.close();
console.log(`Dashboard render saqlandi: ${output}`);
