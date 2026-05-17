export interface User {
  id?: number;
  name: string;
  email: string;
  passwordHash: string;
  sector: string;
  role: "Administrador" | "Colaborador";
  createdAt?: Date;
}
