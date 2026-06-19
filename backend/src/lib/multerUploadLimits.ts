import type multer from "multer";

/** multer 2.2.0 limits — `fieldNestingDepth` not yet in @types/multer */
type MulterLimits = NonNullable<multer.Options["limits"]> & {
  fieldNestingDepth?: number;
};

/**
 * DoS-safe defaults for multer >= 2.2.0 (GHSA-72gw-mp4g-v24j, GHSA-3p4h-7m6x-2hcm).
 * Upload routes use flat field names (`file`) — no bracket nesting required.
 */
export const MULTER_SAFE_LIMITS: MulterLimits = {
  files: 1,
  fields: 10,
  fieldNestingDepth: 0,
};
