import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { Loan } from "../../Domain/Entities/Loan";

export class RejectLoan {
  constructor(private loanRepository: ILoanRepository) {}

  async execute(loanId: number): Promise<Loan> {
    const loan = await this.loanRepository.getById(loanId);
    if (!loan) {
      throw new Error("Solicitação de empréstimo não encontrada.");
    }

    if (loan.status !== "pendente") {
      throw new Error(`Este empréstimo não pode ser recusado pois está com status: ${loan.status}`);
    }

    const updatedLoan = await this.loanRepository.update(loanId, {
      status: "recusado",
    });

    if (!updatedLoan) {
      throw new Error("Erro ao recusar empréstimo.");
    }

    return updatedLoan;
  }
}
