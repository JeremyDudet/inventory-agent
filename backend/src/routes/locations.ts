import express from "express";
import db from "../db";
import { locations, user_locations, user_roles } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user's accessible locations
router.get("/", async (req, res) => {
  try {
    // Handle both AuthUser and AuthTokenPayload types
    const userId = "id" in req.user! ? req.user.id : req.user!.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get all locations the user has access to
    const userLocations = await db
      .select({
        id: locations.id,
        name: locations.name,
        role: user_roles.name,
        created_at: locations.created_at,
        updated_at: locations.updated_at,
      })
      .from(locations)
      .innerJoin(user_locations, eq(locations.id, user_locations.location_id))
      .innerJoin(user_roles, eq(user_locations.role_id, user_roles.id))
      .where(eq(user_locations.user_id, userId));

    res.json({
      locations: userLocations.map((location: any) => ({
        id: location.id,
        name: location.name,
        role: location.role,
        created_at: location.created_at,
        updated_at: location.updated_at,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch user locations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get details of a specific location
router.get("/:locationId", async (req, res) => {
  try {
    // Handle both AuthUser and AuthTokenPayload types
    const userId = "id" in req.user! ? req.user.id : req.user!.userId;
    const { locationId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify user has access to this location
    const userLocation = await db
      .select({
        id: locations.id,
        name: locations.name,
        role: user_roles.name,
        created_at: locations.created_at,
        updated_at: locations.updated_at,
      })
      .from(locations)
      .innerJoin(user_locations, eq(locations.id, user_locations.location_id))
      .innerJoin(user_roles, eq(user_locations.role_id, user_roles.id))
      .where(
        and(eq(locations.id, locationId), eq(user_locations.user_id, userId))
      )
      .limit(1);

    if (userLocation.length === 0) {
      return res
        .status(404)
        .json({ message: "Location not found or access denied" });
    }

    res.json({
      location: userLocation[0],
    });
  } catch (error) {
    console.error("Failed to fetch location details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
