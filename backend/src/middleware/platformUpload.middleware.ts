import fs from "node:fs";
import path from "node:path";
import type { Request } from "express";
import multer from "multer";

function ensureBusinessDir(businessId: string): string {
  const dir = path.join(process.cwd(), "uploads", "platform", "businesses", businessId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const id = req.params["id"];
    if (!id || typeof id !== "string") {
      cb(new Error("Missing business id"), "");
      return;
    }
    cb(null, ensureBusinessDir(id));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    const base = path
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

const verificationFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ok =
    /^image\//.test(file.mimetype) ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ok) {
    cb(null, true);
  } else {
    cb(new Error("Allowed: images, PDF, or Word documents."));
  }
};

/** Field name: `file`. Max 5 MB. */
export const platformUploadLogo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: logoFilter,
}).single("file");

/** Field name: `file`. Max 10 MB. */
export const platformUploadVerification = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: verificationFilter,
}).single("file");
