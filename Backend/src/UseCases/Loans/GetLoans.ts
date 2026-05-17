import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { Loan } from "../../Domain/Entities/Loan";

export interface GetLoansInput {
  userId: number;
  role: "Administrador" | "Colaborador";
}

export class GetLoans {
  constructor(private loanRepository: ILoanRepository) {}

  async execute(input: GetLoansInput): Promise<Loan[]> {
    if (input.role === "Administrador") {
      return this.loanRepository.getAll();
    }
    return this.loanRepository.getByUserId(input.userId);
  }
}
