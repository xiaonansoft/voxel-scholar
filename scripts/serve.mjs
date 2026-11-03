import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const built = spawnSync(process.execPath, [join(root, "scripts/build.mjs")], { stdio: "inherit" });
if (built.status) process.exit(built.status ?? 1);

const dist = join(root, "dist");
const port = Number(process.env.PORT || 41731);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const file = normalize(join(dist, pathname));
    if (file !== dist && !file.startsWith(dist + sep)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "content-type": types[extname(file)] || "application/octet-stream",
      "cache-control": "no-cache",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`方块备考 Block Prep  http://127.0.0.1:${port}`);
});
