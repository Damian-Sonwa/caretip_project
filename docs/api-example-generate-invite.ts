/**
 * Example Express route for POST /api/business/generate-invite
 * Add this to your PERN backend. Requires: role === 'business' (auth middleware).
 *
 * Expected response: { inviteCode: string; expiresAt: string }
 */

import { Request, Response } from "express";
import { pool } from "../db"; // your pg pool

export async function generateInviteCode(req: Request, res: Response) {
  const userId = req.user?.id; // from auth middleware
  const role = req.user?.role;

  if (role !== "business") {
    return res.status(403).json({ message: "Only business owners can generate invite codes." });
  }

  const client = await pool.connect();
  try {
    const businessResult = await client.query(
      "SELECT id FROM businesses WHERE owner_id = $1 LIMIT 1",
      [userId]
    );
    const business = businessResult.rows[0];
    if (!business) {
      return res.status(404).json({ message: "Business not found." });
    }

    const inviteCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await client.query(
      `UPDATE businesses 
       SET invite_code = $1, invite_code_expires_at = $2, updated_at = NOW() 
       WHERE id = $3`,
      [inviteCode, expiresAt, business.id]
    );

    return res.json({
      inviteCode,
      expiresAt: expiresAt.toISOString(),
    });
  } finally {
    client.release();
  }
}
