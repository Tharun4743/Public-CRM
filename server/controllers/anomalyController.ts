import { Request, Response } from "express";
import { anomalyService } from "../services/anomalyService.ts";

export const anomalyController = {
  getActiveAlerts: async (req: Request, res: Response) => {
    try {
      const alerts = await anomalyService.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching anomaly alerts" });
    }
  },

  acknowledgeAlert: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;
      await anomalyService.acknowledgeAlert(id, adminId);
      res.json({ message: "Alert acknowledged" });
    } catch (error) {
      res.status(500).json({ message: "Error acknowledging alert" });
    }
  }
};
