import { Request, Response } from "express";
import { RegisterUser } from "../../UseCases/Auth/RegisterUser";
import { LoginUser } from "../../UseCases/Auth/LoginUser";
import { IUserRepository } from "../../Domain/Repositories/IUserRepository";

export class AuthController {
  private registerUser: RegisterUser;
  private loginUser: LoginUser;

  constructor(userRepository: IUserRepository) {
    this.registerUser = new RegisterUser(userRepository);
    this.loginUser = new LoginUser(userRepository);
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const newUser = await this.registerUser.execute(req.body);
      // Excluir hash de senha da resposta http por motivos de privacidade/segurança
      const { passwordHash, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.loginUser.execute(req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
