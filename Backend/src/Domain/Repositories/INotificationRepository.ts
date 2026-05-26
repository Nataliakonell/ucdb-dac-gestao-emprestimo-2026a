import { Notification } from "../Entities/Notification";

export interface INotificationRepository {
  create(data: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification>;
  getByUserId(userId: number): Promise<Notification[]>;
  markAsRead(id: number): Promise<Notification | null>;
}
