import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { PNG } from "pngjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const FIXTURE_PATH = "/frontend/tests/parity/fixtures/elephant_render.html";
const GOLDEN_STATS_PATH = path.resolve(__dirname, "../goldens/elephant/render_stats.json");

function getContentType(filePath) {
  if (filePath.endsWith(".js")) return "application/javascript";
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".css")) return "text/css";
  return "application/octet-stream";
}

function startStaticServer(rootDir, port = 4173) {
  const server = http.createServer(async (req, res) => {
    const urlPath = req.url === "/" ? FIXTURE_PATH : req.url;
    const filePath = path.join(rootDir, urlPath.replace(/^\//, ""));

    try {
      const data = await fs.readFile(filePath);
      res.setHeader("Content-Type", getContentType(filePath));
      res.writeHead(200);
      res.end(data);
    } catch (err) {
      console.warn(`[server] 404 for ${urlPath}`);
      res.writeHead(404);
      res.end("Not found");
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function captureScreenshot(page) {
  await page.goto(`http://localhost:4173${FIXTURE_PATH}`);
  await page.waitForFunction(() => window.__renderReady === true, null, { timeout: 15000 });
  const canvas = await page.$("#viewport");
  if (!canvas) {
    throw new Error("Viewport canvas not found in fixture page");
  }
  return await canvas.screenshot({ type: "png" });
}

async function loadPNG(buffer) {
  return PNG.sync.read(buffer);
}

function computeStats(png) {
  const { width, height, data } = png;
  const pixelCount = width * height;
  const sums = { r: 0, g: 0, b: 0, a: 0 };
  const mins = { r: 255, g: 255, b: 255, a: 255 };
  const maxes = { r: 0, g: 0, b: 0, a: 0 };
  const luminanceBins = new Array(10).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    sums.r += r;
    sums.g += g;
    sums.b += b;
    sums.a += a;
    mins.r = Math.min(mins.r, r);
    mins.g = Math.min(mins.g, g);
    mins.b = Math.min(mins.b, b);
    mins.a = Math.min(mins.a, a);
    maxes.r = Math.max(maxes.r, r);
    maxes.g = Math.max(maxes.g, g);
    maxes.b = Math.max(maxes.b, b);
    maxes.a = Math.max(maxes.a, a);
    const luminance = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const binIndex = Math.min(9, Math.floor((luminance / 255) * 10));
    luminanceBins[binIndex] += 1;
  }

  const averages = {
    r: sums.r / pixelCount,
    g: sums.g / pixelCount,
    b: sums.b / pixelCount,
    a: sums.a / pixelCount,
  };

  const normalizedLuminance = luminanceBins.map((count) => count / pixelCount);

  return {
    width,
    height,
    averages,
    mins,
    maxes,
    luminanceBins: normalizedLuminance,
  };
}

function assertWithinTolerance(label, actual, expected, tolerance) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label} out of tolerance. Expected ${expected.toFixed(3)}, got ${actual.toFixed(3)}`);
  }
}

function compareStats(actual, expected) {
  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(
      `Golden dimensions ${expected.width}x${expected.height} do not match actual ${actual.width}x${actual.height}`,
    );
  }

  const channelTolerance = 1.5;
  assertWithinTolerance("Average R", actual.averages.r, expected.averages.r, channelTolerance);
  assertWithinTolerance("Average G", actual.averages.g, expected.averages.g, channelTolerance);
  assertWithinTolerance("Average B", actual.averages.b, expected.averages.b, channelTolerance);

  const luminanceTolerance = 0.02;
  actual.luminanceBins.forEach((value, idx) => {
    assertWithinTolerance(`Luminance bin ${idx}`, value, expected.luminanceBins[idx], luminanceTolerance);
  });
}

async function main() {
  const server = await startStaticServer(REPO_ROOT);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  page.on("console", (msg) => console.log(`[browser] ${msg.type()}: ${msg.text()}`));
  page.on("pageerror", (err) => console.error("[browser] pageerror", err));

  try {
    const screenshotBuffer = await captureScreenshot(page);
    const stats = computeStats(await loadPNG(screenshotBuffer));

    const goldenExists = await fs
      .access(GOLDEN_STATS_PATH)
      .then(() => true)
      .catch(() => false);

    if (!goldenExists) {
      await fs.mkdir(path.dirname(GOLDEN_STATS_PATH), { recursive: true });
      await fs.writeFile(GOLDEN_STATS_PATH, JSON.stringify(stats, null, 2));
      console.log(`Golden stats created at ${GOLDEN_STATS_PATH}`);
      return;
    }

    const goldenStats = JSON.parse(await fs.readFile(GOLDEN_STATS_PATH, "utf-8"));
    compareStats(stats, goldenStats);
    console.log("Elephant render matches golden statistics.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error("Elephant render parity test failed", err);
  process.exitCode = 1;
});
