export interface Equipment {
  id?: string | number;
  name: string;
  category?: string;
  status: "disponivel" | "em_uso" | "manutencao";
  sector?: string;
  description: string;
  serialNumber: string;
  image?: string;
}

export interface Loan {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  sector: string;
  requestDate: string;
  approvalDate?: string;
  returnDate?: string;
  expectedReturn: string;
  status: "pendente" | "aprovado" | "rejeitado" | "devolvido" | "atrasado";
}

export interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export const equipments: Equipment[] = [];

export const loans: Loan[] = [];

export const notifications: Notification[] = [];

export const sectorData = [
  { sector: "TI", loans: 12 },
  { sector: "Marketing", loans: 8 },
  { sector: "RH", loans: 5 },
  { sector: "Treinamento", loans: 10 },
  { sector: "Vendas", loans: 7 },
  { sector: "Administrativo", loans: 4 },
  { sector: "Atendimento", loans: 3 },
  { sector: "Eventos", loans: 6 },
];

export const monthlyData = [
  { month: "Jan", emprestimos: 18, devolucoes: 15, atrasos: 2 },
  { month: "Fev", emprestimos: 22, devolucoes: 20, atrasos: 3 },
  { month: "Mar", emprestimos: 25, devolucoes: 22, atrasos: 1 },
  { month: "Abr", emprestimos: 12, devolucoes: 10, atrasos: 2 },
];

export const topEquipments = [
  { name: "Projetor Epson", uses: 28 },
  { name: "Notebook Dell", uses: 24 },
  { name: "Câmera Canon", uses: 18 },
  { name: "Tablet Samsung", uses: 15 },
  { name: "Monitor LG", uses: 12 },
];
