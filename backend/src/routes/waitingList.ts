import express from "express";
import db from "../db";
import { waiting_list } from "../db/schema";
import { eq } from "drizzle-orm";
import { ValidationError } from "../errors";

const router = express.Router();

// Add a new user to the waiting list
router.post("/", async (req, res, next) => {
  try {
    const { email, name, phone, businessType, inventoryMethod, softwareName } =
      req.body;

    // Validate required fields
    if (!email || !name || !businessType) {
      throw new ValidationError("Email, name, and business type are required");
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(waiting_list)
      .where(eq(waiting_list.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ValidationError("Email already registered");
    }

    // Insert new waiting list entry
    await db.insert(waiting_list).values({
      email,
      name,
      phone,
      business_type: businessType,
      inventory_method: inventoryMethod,
      software_name: softwareName,
    });

    res.status(201).json({
      message: "Successfully added to waiting list",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
