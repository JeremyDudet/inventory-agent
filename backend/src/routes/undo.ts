import { Router, Request, Response } from "express";
import { authMiddleware } from "@/middleware/auth";
import { undoService } from "@/services/undoService";

const router = Router();

/**
 * GET /api/undo
 * Get user's undo actions
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const undoActions = await undoService.getUserUndoActions(userId, limit);

    res.json({
      success: true,
      data: undoActions,
    });
  } catch (error) {
    console.error("Error fetching undo actions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch undo actions",
    });
  }
});

/**
 * POST /api/undo/:id/execute
 * Execute an undo action
 */
router.post(
  "/:id/execute",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const undoActionId = req.params.id;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
        });
      }

      const success = await undoService.executeUndo(undoActionId, userId);

      if (success) {
        res.json({
          success: true,
          message: "Undo action executed successfully",
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Failed to execute undo action",
        });
      }
    } catch (error) {
      console.error("Error executing undo action:", error);

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to execute undo action",
        });
      }
    }
  }
);

/**
 * DELETE /api/undo/:id
 * Delete/dismiss an undo action
 */
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const undoActionId = req.params.id;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const success = await undoService.deleteUndoAction(undoActionId, userId);

    if (success) {
      res.json({
        success: true,
        message: "Undo action deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Undo action not found",
      });
    }
  } catch (error) {
    console.error("Error deleting undo action:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete undo action",
    });
  }
});

/**
 * POST /api/undo/cleanup
 * Clean up expired undo actions (admin/maintenance endpoint)
 */
router.post("/cleanup", authMiddleware, async (req: Request, res: Response) => {
  try {
    const deletedCount = await undoService.cleanupExpiredActions();

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired undo actions`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up expired undo actions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cleanup expired undo actions",
    });
  }
});

export default router;
