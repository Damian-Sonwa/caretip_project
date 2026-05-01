import fs from "node:fs";
import path from "node:path";
import multer from "multer";

function ensureBusinessDir(businessId: string): string {
  const dir = path.join(process.cwd(), "uploads", "businesses", businessId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const businessId = (req as unknown as { businessId?: string }).businessId;
    if (!businessId || typeof businessId !== "string") {
      cb(new Error("Missing business id"), "");
      return;
    }
    cb(null, ensureBusinessDir(businessId));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    const base =
      path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_]/g, "")
        .slice(0, 48) || "upload";
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const logoFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (/^image\//.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Logo must be an image (e.g. PNG, JPEG, WebP)."));
  }
};

/** Field name: `file`. Max 5 MB. */
export const businessUploadLogo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: logoFilter,
}).single("file");

