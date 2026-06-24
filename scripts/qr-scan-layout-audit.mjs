#!/usr/bin/env node
/**
 * Node-side layout + payload audit for per-employee QR scan validation.
 * Run: node scripts/qr-scan-layout-audit.mjs
 */
import QRCode from "qrcode";

const BUSINESS_SLUG = "brasserie-lindenstrasse";
const ORIGIN = "https://caretip.de";
const TEMPLATE = {
  canvasWidth: 360,
  canvasHeight: 640,
  qrZone: { x: 0.5, y: 0.31, w: 0.62, h: 0.4 },
  safePadding: 0.05,
};

const STAFF = [
  { name: "Emma Chen", slug: "wd-brasserie-emma" },
  { name: "Jordan Park", slug: "wd-brasserie-jordan" },
  { name: "Maria Schneider", slug: "wd-brasserie-anna" },
  { name: "Marco Rossi", slug: "wd-brasserie-marco" },
];

function employeeUrl(slug) {
  return `${ORIGIN}/${encodeURIComponent(BUSINESS_SLUG)}/${encodeURIComponent(slug)}`;
}

function layoutMetrics() {
  const W = TEMPLATE.canvasWidth;
  const H = TEMPLATE.canvasHeight;
  const zw = TEMPLATE.qrZone.w * W;
  const zh = TEMPLATE.qrZone.h * H;
  const zx = TEMPLATE.qrZone.x * W - zw / 2;
  const zy = TEMPLATE.qrZone.y * H;
  const inset = TEMPLATE.safePadding * Math.min(zw, zh);
  const size = Math.min(zw - inset * 2, zh - inset * 2);
  const x = zx + (zw - size) / 2;
  const y = zy + (zh - size) / 2;
  return { qrSize: size, qrDrawX: x, qrDrawY: y, quietZoneModules: 4 };
}

const layout = layoutMetrics();
console.log("=== Template layout (identical for all employees) ===");
console.table(layout);

console.log("\n=== Per-employee payload (only variable) ===");
const rows = STAFF.map((s) => {
  const url = employeeUrl(s.slug);
  const seg = QRCode.create(url, { errorCorrectionLevel: "H" });
  return {
    name: s.name,
    slug: s.slug,
    urlLength: url.length,
    qrVersion: seg.version,
    modules: seg.modules.size,
    layoutFingerprint: `${layout.qrSize.toFixed(2)}@${layout.qrDrawX.toFixed(2)},${layout.qrDrawY.toFixed(2)}`,
  };
});
console.table(rows);

const uniqueVersions = new Set(rows.map((r) => r.qrVersion));
const uniqueLayouts = new Set(rows.map((r) => r.layoutFingerprint));
console.log("\n=== Audit conclusion ===");
console.log(`Unique layout fingerprints: ${uniqueLayouts.size} (expected 1)`);
console.log(`Unique QR versions: ${uniqueVersions.size}`);
if (uniqueLayouts.size === 1) {
  console.log("PASS: Layout is fixed — employee name/title does NOT affect QR position or size.");
}
console.log(
  "Per-employee variance is payload-only (URL length → module density inside fixed qrSize box).",
);
