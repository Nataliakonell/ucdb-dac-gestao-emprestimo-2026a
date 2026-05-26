import express from "express";
import cors from "cors";
import multer from "multer";
import { EquipmentController } from "../../Adapters/Controllers/EquipmentController";
import { PrismaEquipmentRepository } from "../Repositories/PrismaEquipmentRepository";
import { BlobStorageService } from "../Storage/BlobStorageService";
import { AuthController } from "../../Adapters/Controllers/AuthController";
import { PrismaUserRepository } from "../Repositories/PrismaUserRepository";
import { LoanController } from "../../Adapters/Controllers/LoanController";
import { PrismaLoanRepository } from "../Repositories/PrismaLoanRepository";
import { NotificationController } from "../../Adapters/Controllers/NotificationController";
import { PrismaNotificationRepository } from "../Repositories/PrismaNotificationRepository";
import { authMiddleware, requireAdmin } from "../../Adapters/Middlewares/AuthMiddleware";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer to store uploaded files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const equipmentRepository = new PrismaEquipmentRepository();
const blobStorageService = new BlobStorageService();
const equipmentController = new EquipmentController(equipmentRepository, blobStorageService);

const userRepository = new PrismaUserRepository();
const authController = new AuthController(userRepository);

const loanRepository = new PrismaLoanRepository();
const notificationRepository = new PrismaNotificationRepository();
const loanController = new LoanController(loanRepository, equipmentRepository, notificationRepository, userRepository);
const notificationController = new NotificationController(notificationRepository);

// Authentication public routes
app.post("/api/auth/register", (req, res) => authController.register(req, res));
app.post("/api/auth/login", (req, res) => authController.login(req, res));

// Public asset serve proxy route (serves images uploaded to R2)
app.get("/api/uploads/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const file = await blobStorageService.getFile(filename);
    
    if (file.contentType) {
      res.setHeader("Content-Type", file.contentType);
    }
    
    if (file.body && typeof file.body.pipe === "function") {
      file.body.pipe(res);
    } else if (file.body && typeof file.body.transformToByteArray === "function") {
      const byteArray = await file.body.transformToByteArray();
      res.send(Buffer.from(byteArray));
    } else {
      res.send(file.body);
    }
  } catch (err: any) {
    res.status(404).json({ error: "Arquivo não encontrado." });
  }
});

// Protected routes (Authentication required for all)
app.get("/api/equipments", authMiddleware, (req, res) => equipmentController.getAll(req, res));
app.get("/api/equipment", authMiddleware, (req, res) => equipmentController.getAll(req, res));

// Loan flow routes (Protected)
app.post("/api/loans", authMiddleware, (req, res) => loanController.request(req, res));
app.get("/api/loans", authMiddleware, (req, res) => loanController.list(req, res));
app.patch("/api/loans/:id/approve", authMiddleware, requireAdmin, (req, res) => loanController.approve(req, res));
app.patch("/api/loans/:id/reject", authMiddleware, requireAdmin, (req, res) => loanController.reject(req, res));
app.patch("/api/loans/:id/return", authMiddleware, requireAdmin, (req, res) => loanController.returnLoan(req, res));

// Notification routes (Protected)
app.get("/api/notifications", authMiddleware, (req, res) => notificationController.list(req, res));
app.patch("/api/notifications/:id/read", authMiddleware, (req, res) => notificationController.markAsRead(req, res));

// Administrative routes (Admin only)
app.post("/api/equipments", authMiddleware, requireAdmin, upload.single("image"), (req, res) => equipmentController.create(req, res));
app.post("/api/equipment", authMiddleware, requireAdmin, upload.single("image"), (req, res) => equipmentController.create(req, res));

app.put("/api/equipments/:id", authMiddleware, requireAdmin, upload.single("image"), (req, res) => equipmentController.update(req, res));
app.put("/api/equipment/:id", authMiddleware, requireAdmin, upload.single("image"), (req, res) => equipmentController.update(req, res));

app.delete("/api/equipments/:id", authMiddleware, requireAdmin, (req, res) => equipmentController.delete(req, res));
app.delete("/api/equipment/:id", authMiddleware, requireAdmin, (req, res) => equipmentController.delete(req, res));

export default app;
// azurite api check fix

