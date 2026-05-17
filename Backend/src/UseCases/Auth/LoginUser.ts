import { IUserRepository } from "../../Domain/Repositories/IUserRepository";
import { User } from "../../Domain/Entities/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  user: {
    id: number;
    name: string;
    email: string;
    sector: string;
    role: "Administrador" | "Colaborador";
  };
  token: string;
}

export class LoginUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    if (!input.email || !input.password) {
      throw new Error("E-mail e senha são obrigatórios.");
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await this.userRepository.getByEmail(normalizedEmail);
    if (!user) {
      throw new Error("E-mail ou senha incorretos.");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("E-mail ou senha incorretos.");
    }

    const jwtSecret = process.env.JWT_SECRET || "resource-buddy-super-secret-key-98765";
    
    // Assinar token JWT válido por 7 dias
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        sector: user.sector,
        role: user.role
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return {
      user: {
        id: user.id!,
        name: user.name,
        email: user.email,
        sector: user.sector,
        role: user.role
      },
      token
    };
  }
}
