import { ILoanRepository } from "../../Domain/Repositories/ILoanRepository";
import { Loan } from "../../Domain/Entities/Loan";
import { IEquipmentRepository } from "../../Domain/Repositories/IEquipmentRepository";
import { INotificationRepository } from "../../Domain/Repositories/INotificationRepository";

export class RejectLoan {
  constructor(
    private loanRepository: ILoanRepository,
    private equipmentRepository: IEquipmentRepository,
    private notificationRepository: INotificationRepository
  ) {}

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

    const equipment = await this.equipmentRepository.getById(loan.equipmentId);

    // Notificar o colaborador
    await this.notificationRepository.create({
      userId: loan.userId,
      message: `Sua solicitação do equipamento '${equipment?.name || loan.equipmentId}' foi RECUSADA.`,
    });

    return updatedLoan;
  }
}
