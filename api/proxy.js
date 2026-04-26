const http = require("http");
const https = require("https");

const TARGET_HOST = process.env.TARGET_HOST;
const TARGET_PORT = parseInt(process.env.TARGET_PORT || "80", 10);
const TARGET_PATH = process.env.TARGET_PATH || "/";
const TARGET_TLS  = process.env.TARGET_TLS === "true";

if (!TARGET_HOST) {
  throw new Error("TARGET_HOST env variable is required");
}

module.exports = (req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: TARGET_PATH,
    method: req.method,
    headers: {
      ...req.headers,
      host: TARGET_HOST,
    },
  };

  const transport = TARGET_TLS ? https : http;

  const proxy = transport.request(options, (serverRes) => {
    res.writeHead(serverRes.statusCode, serverRes.headers);
    serverRes.pipe(res, { end: true });
  });

  proxy.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
    }
    res.end("Bad Gateway");
  });

  req.pipe(proxy, { end: true });
};

module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
