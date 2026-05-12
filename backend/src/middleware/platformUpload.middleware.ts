import multer from "multer";

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
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: logoFilter,
}).single("file");

/** Field name: `file`. Max 10 MB. */
export const platformUploadVerification = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: verificationFilter,
}).single("file");
