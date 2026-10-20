// Minimal statisk server til Playwright. Serverer kun index.html.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const fil = path.join(__dirname, "..", "index.html");
http.createServer((req, res) => {
  const sti = req.url.split(/[?#]/)[0];
  if (sti === "/" || sti === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(fs.readFileSync(fil));
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(4173, "127.0.0.1");
