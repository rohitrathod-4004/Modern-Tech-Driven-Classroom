import { Request, Response } from 'express';
import { SearchService } from './search.service';

export class SearchController {
  static async search(req: Request, res: Response) {
    const userId = req.user!.id;
    const role = req.user!.role;
    const q = req.query.q as string;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({ data: [] });
    }

    const results = await SearchService.search(userId, role, q.trim());
    res.status(200).json({ data: results });
  }
}
