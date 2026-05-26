import { Request, Response } from "express";
import { INotificationRepository } from "../../Domain/Repositories/INotificationRepository";

export class NotificationController {
  constructor(private notificationRepository: INotificationRepository) {}

  async list(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const notifications = await this.notificationRepository.getByUserId(user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido." });
        return;
      }
      
      const notification = await this.notificationRepository.markAsRead(id);
      if (!notification) {
        res.status(404).json({ error: "Notificação não encontrada." });
        return;
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
