import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface DecodedUser {
  id: number;
  name: string;
  email: string;
  sector: string;
  role: "Administrador" | "Colaborador";
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Token de acesso ausente." });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Formato de token inválido. Use 'Bearer <token>'." });
    return;
  }

  const token = parts[1];
  const jwtSecret = process.env.JWT_SECRET || "resource-buddy-super-secret-key-98765";

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedUser;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token inválido ou expirado." });
    return;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as DecodedUser | undefined;
  if (!user || user.role !== "Administrador") {
    res.status(403).json({ error: "Acesso negado. Apenas administradores podem executar esta ação." });
    return;
  }
  next();
}
