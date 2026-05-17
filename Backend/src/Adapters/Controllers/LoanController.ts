import { Request, Response } from "express";
import { RequestLoan } from "../../UseCases/Loans/RequestLoan";
import { GetLoans } from "../../UseCases/Loans/GetLoans";
import { ApproveLoan } from "../../UseCases/Loans/ApproveLoan";
import { RejectLoan } from "../../UseCases/Loans/RejectLoan";
import { ReturnEquipment } from "../../UseCases/Loans/ReturnEquipment";
import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";

export class LoanController {
  private requestLoan: RequestLoan;
  private getLoans: GetLoans;
  private approveLoan: ApproveLoan;
  private rejectLoan: RejectLoan;
  private returnEquipment: ReturnEquipment;

  constructor(
    loanRepository: ILoanRepository,
    equipmentRepository: IEquipmentRepository
  ) {
    this.requestLoan = new RequestLoan(loanRepository, equipmentRepository);
    this.getLoans = new GetLoans(loanRepository);
    this.approveLoan = new ApproveLoan(loanRepository, equipmentRepository);
    this.rejectLoan = new RejectLoan(loanRepository);
    this.returnEquipment = new ReturnEquipment(loanRepository, equipmentRepository);
  }

  async request(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { equipmentId, sector, days, notes } = req.body;

      const newLoan = await this.requestLoan.execute({
        equipmentId: parseInt(equipmentId, 10),
        userId: user.id,
        sector: sector || user.sector,
        days: parseInt(days, 10),
        notes,
      });

      res.status(201).json(newLoan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      const loans = await this.getLoans.execute({
        userId: user.id,
        role: user.role,
      });

      res.json(loans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async approve(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido." });
        return;
      }

      const approved = await this.approveLoan.execute(id);
      res.json(approved);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async reject(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido." });
        return;
      }

      const rejected = await this.rejectLoan.execute(id);
      res.json(rejected);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async returnLoan(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido." });
        return;
      }

      const returned = await this.returnEquipment.execute(id);
      res.json(returned);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
