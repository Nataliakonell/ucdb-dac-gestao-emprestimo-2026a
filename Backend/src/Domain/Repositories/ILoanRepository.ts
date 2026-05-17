import { Loan } from "../Entities/Loan";

export interface ILoanRepository {
  create(loan: Loan): Promise<Loan>;
  getById(id: number): Promise<Loan | null>;
  getAll(): Promise<Loan[]>;
  getByUserId(userId: number): Promise<Loan[]>;
  update(id: number, loan: Partial<Loan>): Promise<Loan | null>;
}
