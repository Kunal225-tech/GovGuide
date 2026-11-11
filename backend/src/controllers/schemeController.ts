import { Request, Response } from "express";
import mongoose from "mongoose";
import { SchemeService } from "../services/schemeService";

export class SchemeController {
  /**
   * Create a new government scheme (Admin Only)
   * POST /api/schemes
   */
  static async createScheme(req: Request, res: Response): Promise<void> {
    try {
      const schemeData = req.body;
      const newScheme = await SchemeService.createScheme(schemeData);
      res.status(201).json({
        success: true,
        message: "Scheme created successfully",
        data: newScheme,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: "A scheme with this exact name already exists",
        });
        return;
      }
      if (error.name === "ValidationError") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Failed to create scheme",
      });
    }
  }

  /**
   * Retrieve all available government schemes (Public)
   * GET /api/schemes
   */
  static async getAllSchemes(_req: Request, res: Response): Promise<void> {
    try {
      const schemes = await SchemeService.getAllSchemes();
      res.status(200).json({
        success: true,
        count: schemes.length,
        data: schemes,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch schemes",
      });
    }
  }

  /**
   * Retrieve a specific scheme by ID (Public)
   * GET /api/schemes/:id
   */
  static async getSchemeById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({
          success: false,
          message: "Scheme not found",
        });
        return;
      }

      const scheme = await SchemeService.getSchemeById(id);

      if (!scheme) {
        res.status(404).json({
          success: false,
          message: "Scheme not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: scheme,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch scheme details",
      });
    }
  }

  /**
   * Update an existing scheme (Admin Only)
   * PUT /api/schemes/:id
   */
  static async updateScheme(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({
          success: false,
          message: "Scheme not found",
        });
        return;
      }

      const updated = await SchemeService.updateScheme(id, req.body);

      if (!updated) {
        res.status(404).json({
          success: false,
          message: "Scheme not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Scheme updated successfully",
        data: updated,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: "Another scheme already exists with this name",
        });
        return;
      }
      if (error.name === "ValidationError") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Failed to update scheme",
      });
    }
  }

  /**
   * Delete an existing scheme (Admin Only)
   * DELETE /api/schemes/:id
   */
  static async deleteScheme(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({
          success: false,
          message: "Scheme not found",
        });
        return;
      }

      const deleted = await SchemeService.deleteScheme(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Scheme not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Scheme deleted successfully",
        data: { id: deleted._id },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete scheme",
      });
    }
  }
}

export default SchemeController;
