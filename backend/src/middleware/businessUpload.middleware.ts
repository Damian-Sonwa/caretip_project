import multer from "multer";

const logoFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (/^image\//.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Logo must be an image (e.g. PNG, JPEG, WebP)."));
  }
};

/** Field name: `file`. Max 5 MB. Memory storage — buffer is uploaded to persistent storage before DB update. */
export const businessUploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: logoFilter,
}).single("file");
