import { PrismaClient } from "@prisma/client";
import { INotificationRepository } from "../../Domain/Repositories/INotificationRepository";
import { Notification } from "../../Domain/Entities/Notification";

const prisma = new PrismaClient();

export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        message: data.message,
      },
    });
    return notification;
  }

  async getByUserId(userId: number): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return notifications;
  }

  async markAsRead(id: number): Promise<Notification | null> {
    try {
      const notification = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
      return notification;
    } catch {
      return null;
    }
  }
}
