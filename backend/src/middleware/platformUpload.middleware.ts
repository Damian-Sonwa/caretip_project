import multer from "multer";
import { MULTER_SAFE_LIMITS } from "../lib/multerUploadLimits.js";
import {
  assertMulterMimetypeAllowedForLogo,
  assertMulterMimetypeAllowedForVerification,
} from "../lib/uploadMimeGuard.js";

const logoFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  try {
    assertMulterMimetypeAllowedForLogo(file.mimetype);
    cb(null, true);
  } catch (e) {
    cb(e instanceof Error ? e : new Error(String(e)));
  }
};

const verificationFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  try {
    assertMulterMimetypeAllowedForVerification(file.mimetype);
    cb(null, true);
  } catch (e) {
    cb(e instanceof Error ? e : new Error(String(e)));
  }
};

/** Field name: `file`. Max 5 MB. */
export const platformUploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { ...MULTER_SAFE_LIMITS, fileSize: 5 * 1024 * 1024 },
  fileFilter: logoFilter,
}).single("file");

/** Field name: `file`. Max 10 MB. */
export const platformUploadVerification = multer({
  storage: multer.memoryStorage(),
  limits: { ...MULTER_SAFE_LIMITS, fileSize: 10 * 1024 * 1024 },
  fileFilter: verificationFilter,
}).single("file");
