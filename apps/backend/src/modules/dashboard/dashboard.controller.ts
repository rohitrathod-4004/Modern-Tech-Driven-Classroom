import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    const userId = req.user!.id;
    const role = req.user!.role;
    
    const stats = await DashboardService.getStats(userId, role);
    
    res.status(200).json({ data: stats });
  }

  static async getRecentLectures(req: Request, res: Response) {
    const userId = req.user!.id;
    const role = req.user!.role;
    const limit = parseInt(req.query.limit as string) || 3;
    
    const lectures = await DashboardService.getRecentLectures(userId, role, limit);
    
    res.status(200).json({ data: lectures });
  }
}
