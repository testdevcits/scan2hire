const fs = require("fs");
const path = require("path");
const workerPath = path.join(__dirname, "../public/assets/workers/pdf.worker.min.mjs");

fs.mkdirSync(path.dirname(workerPath), { recursive: true });
fs.copyFileSync(require.resolve("pdfjs-dist/build/pdf.worker.min.mjs"), workerPath);
