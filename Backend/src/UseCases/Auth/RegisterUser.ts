import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { User } from "../../Domain/Entities/User";
import bcrypt from "bcryptjs";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  sector: string;
  role: "Administrador" | "Colaborador";
}

export class RegisterUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<User> {
    if (!input.name || !input.email || !input.password || !input.sector || !input.role) {
      throw new Error("Todos os campos são obrigatórios para cadastro.");
    }

    if (input.password.length < 6) {
      throw new Error("A senha deve conter no mínimo 6 caracteres.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new Error("E-mail informado é inválido.");
    }

    // Normalizar e-mail para caixa baixa para evitar duplicados por case-sensitivity
    const normalizedEmail = input.email.toLowerCase().trim();

    const existingUser = await this.userRepository.getByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error("E-mail já cadastrado no sistema.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user: User = {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      sector: input.sector.trim(),
      role: input.role
    };

    return this.userRepository.create(user);
  }
}
