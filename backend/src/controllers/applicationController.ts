import { Request, Response } from "express";
import mongoose from "mongoose";
import Application from "../models/Application";
import Scheme from "../models/Scheme";

// ============================================================
// Application Controller - Save, Unsave & Application Tracking
// ============================================================

/**
 * Save a scheme for the authenticated user.
 * POST /api/applications/saved OR POST /api/saved
 * Body: { schemeId: string } or Params: /:schemeId
 */
export const saveScheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const schemeId = (req.params.schemeId || req.params.id || req.body.schemeId || req.body.id) as string;

    if (!schemeId) {
      res.status(400).json({
        success: false,
        message: "schemeId is required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      res.status(400).json({
        success: false,
        message: "Invalid schemeId format",
      });
      return;
    }

    // Verify scheme actually exists in database
    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      res.status(404).json({
        success: false,
        message: "Scheme not found",
      });
      return;
    }

    const userId = req.userId!;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const schemeObjectId = new mongoose.Types.ObjectId(schemeId);

    // Check if user already has an application record for this scheme
    try {
      let application = await Application.findOne({
        userId: userObjectId,
        schemeId: schemeObjectId,
      });

      if (application) {
        if (application.status !== "saved") {
          application.status = "saved";
          await application.save();
        }
        res.status(200).json({
          success: true,
          message: "Scheme saved successfully",
          data: application,
        });
        return;
      }

      // Create new application record with status = "saved"
      application = await Application.create({
        userId: userObjectId,
        schemeId: schemeObjectId,
        status: "saved",
        appliedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Scheme saved successfully",
        data: application,
      });
      return;
    } catch (dbErr: any) {
      // Gracefully handle unique index collision (duplicate save attempt)
      if (dbErr.code === 11000) {
        const existing = await Application.findOne({
          userId: userObjectId,
          schemeId: schemeObjectId,
        });
        res.status(200).json({
          success: true,
          message: "Scheme is already saved",
          data: existing,
        });
        return;
      }
      throw dbErr;
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save scheme",
    });
  }
};

/**
 * Remove (unsave) a scheme from the authenticated user's saved list.
 * DELETE /api/applications/saved/:schemeId OR DELETE /api/saved/:schemeId
 */
export const unsaveScheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const schemeId = (req.params.schemeId || req.params.id || req.body.schemeId || req.body.id) as string;

    if (!schemeId) {
      res.status(400).json({
        success: false,
        message: "schemeId is required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      res.status(400).json({
        success: false,
        message: "Invalid schemeId format",
      });
      return;
    }

    const userId = req.userId!;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const targetObjectId = new mongoose.Types.ObjectId(schemeId);

    // Remove the application record for this user and scheme (or by Application _id)
    await Application.findOneAndDelete({
      userId: userObjectId,
      $or: [{ schemeId: targetObjectId }, { _id: targetObjectId }],
    });

    res.status(200).json({
      success: true,
      message: "Scheme removed from saved list",
      data: { schemeId },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to unsave scheme",
    });
  }
};

/**
 * Retrieve all saved schemes for the authenticated user.
 * GET /api/applications/saved OR GET /api/saved
 */
export const getSavedSchemes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const applications = await Application.find({
      userId: userObjectId,
      status: "saved",
    })
      .populate("schemeId")
      .sort({ createdAt: -1 });

    // Filter out applications whose scheme record might have been deleted
    const validApplications = applications.filter((app) => app.schemeId != null);

    res.status(200).json({
      success: true,
      count: validApplications.length,
      data: validApplications.map((app) => ({
        _id: app._id,
        scheme: app.schemeId,
        schemeId: (app.schemeId as any)._id,
        status: app.status,
        savedAt: (app as any).createdAt || app.appliedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve saved schemes",
    });
  }
};

/**
 * Retrieve all tracked applications for the authenticated user across all statuses.
 * GET /api/applications?status=...
 */
export const getUserApplications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { status } = req.query;

    const filter: Record<string, any> = { userId: userObjectId };
    if (status && typeof status === "string" && status !== "all") {
      if (status === "in-progress" || status === "in-progess") {
        filter.status = { $in: ["in-progress", "in-progess"] };
      } else {
        filter.status = status;
      }
    }

    const applications = await Application.find(filter)
      .populate("schemeId")
      .sort({ updatedAt: -1, createdAt: -1 });

    // Filter out applications whose scheme record might have been deleted
    const validApplications = applications.filter((app) => app.schemeId != null);

    res.status(200).json({
      success: true,
      count: validApplications.length,
      data: validApplications.map((app) => {
        const rawStatus = app.status;
        const normalizedStatus = rawStatus === "in-progess" ? "in-progress" : rawStatus;
        return {
          _id: app._id,
          schemeId: (app.schemeId as any)._id,
          scheme: app.schemeId,
          status: normalizedStatus,
          notes: app.notes || "",
          appliedAt: app.appliedAt || (app as any).createdAt,
          createdAt: (app as any).createdAt,
          updatedAt: (app as any).updatedAt,
        };
      }),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve user applications",
    });
  }
};

/**
 * Update an application's status, notes, or date.
 * PUT /api/applications/:id
 * Body: { status?: string, notes?: string, appliedAt?: Date | string }
 */
export const updateApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;
    const { status, notes, appliedAt } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid application or scheme ID format",
      });
      return;
    }

    const validStatuses = ["saved", "in-progress", "in-progess", "submitted", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.filter((s) => s !== "in-progess").join(", ")}`,
      });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const targetObjectId = new mongoose.Types.ObjectId(id);

    // Find by Application._id OR schemeId, strictly scoped to userId
    const application = await Application.findOne({
      userId: userObjectId,
      $or: [{ _id: targetObjectId }, { schemeId: targetObjectId }],
    });

    if (!application) {
      res.status(404).json({
        success: false,
        message: "Application tracking record not found for this user",
      });
      return;
    }

    if (status !== undefined) {
      application.status = status as any;
    }
    if (notes !== undefined) {
      application.notes = typeof notes === "string" ? notes.trim() : notes;
    }
    if (appliedAt !== undefined) {
      const parsedDate = new Date(appliedAt);
      if (!isNaN(parsedDate.getTime())) {
        application.appliedAt = parsedDate;
      }
    }

    await application.save();
    await application.populate("schemeId");

    const rawStatus = application.status;
    const normalizedStatus = rawStatus === "in-progess" ? "in-progress" : rawStatus;

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: {
        _id: application._id,
        schemeId: (application.schemeId as any)?._id || application.schemeId,
        scheme: application.schemeId,
        status: normalizedStatus,
        notes: application.notes || "",
        appliedAt: application.appliedAt,
        createdAt: (application as any).createdAt,
        updatedAt: (application as any).updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update application",
    });
  }
};

/**
 * Create or update an application record with custom status, notes, or date.
 * POST /api/applications
 * Body: { schemeId: string, status?: string, notes?: string, appliedAt?: Date | string }
 */
export const createOrUpdateApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schemeId, status, notes, appliedAt } = req.body;
    const userId = req.userId!;

    if (!schemeId) {
      res.status(400).json({ success: false, message: "schemeId is required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      res.status(400).json({ success: false, message: "Invalid schemeId format" });
      return;
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      res.status(404).json({ success: false, message: "Scheme not found" });
      return;
    }

    const validStatuses = ["saved", "in-progress", "in-progess", "submitted", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.filter((s) => s !== "in-progess").join(", ")}`,
      });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const schemeObjectId = new mongoose.Types.ObjectId(schemeId);

    let application = await Application.findOne({
      userId: userObjectId,
      schemeId: schemeObjectId,
    });

    if (application) {
      if (status !== undefined) application.status = status as any;
      if (notes !== undefined) application.notes = typeof notes === "string" ? notes.trim() : notes;
      if (appliedAt !== undefined) {
        const parsed = new Date(appliedAt);
        if (!isNaN(parsed.getTime())) application.appliedAt = parsed;
      }
      await application.save();
    } else {
      application = await Application.create({
        userId: userObjectId,
        schemeId: schemeObjectId,
        status: (status as any) || "in-progress",
        notes: typeof notes === "string" ? notes.trim() : "",
        appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      });
    }

    await application.populate("schemeId");
    const rawStatus = application.status;
    const normalizedStatus = rawStatus === "in-progess" ? "in-progress" : rawStatus;

    res.status(200).json({
      success: true,
      message: "Application tracked successfully",
      data: {
        _id: application._id,
        schemeId: (application.schemeId as any)?._id || application.schemeId,
        scheme: application.schemeId,
        status: normalizedStatus,
        notes: application.notes || "",
        appliedAt: application.appliedAt,
        createdAt: (application as any).createdAt,
        updatedAt: (application as any).updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create or update application",
    });
  }
};

/**
 * Remove an application tracking record.
 * DELETE /api/applications/:id
 */
export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid application ID format" });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const targetObjectId = new mongoose.Types.ObjectId(id);

    const deleted = await Application.findOneAndDelete({
      userId: userObjectId,
      $or: [{ _id: targetObjectId }, { schemeId: targetObjectId }],
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: "Application record not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Application tracking record removed successfully",
      data: { id: deleted._id },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete application tracking record",
    });
  }
};
