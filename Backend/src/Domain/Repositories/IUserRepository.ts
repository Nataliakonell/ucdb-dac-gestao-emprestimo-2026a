import { User } from "../Entities/User";

export interface IUserRepository {
  getByEmail(email: string): Promise<User | null>;
  getById(id: number): Promise<User | null>;
  create(user: User): Promise<User>;
  getAll(): Promise<User[]>;
}
