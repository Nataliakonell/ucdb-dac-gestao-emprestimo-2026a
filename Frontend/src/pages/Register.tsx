import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, LogIn } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sector, setSector] = useState("TI");
  const [role, setRole] = useState<"Administrador" | "Colaborador">("Colaborador");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !sector || !role) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, sector, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao criar a conta.");
      }

      toast.success("Conta criada com sucesso! Faça login para continuar.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectors = ["TI", "Audiovisual", "Recursos Humanos", "Financeiro", "Administrativo", "Vendas", "Marketing"];

  return (
    <div className="w-full max-w-md animate-fade-in my-8">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md mb-2">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Resource Buddy</h1>
        <p className="text-sm text-muted-foreground text-center">
          Crie seu perfil corporativo de acesso
        </p>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Registrar Conta</CardTitle>
          <CardDescription className="text-center">
            Insira suas informações profissionais para ingressar na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name-input" className="text-sm font-semibold">
                Nome Completo
              </Label>
              <Input
                id="name-input"
                type="text"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full focus-visible:ring-2 focus-visible:ring-primary"
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-input" className="text-sm font-semibold">
                E-mail Corporativo
              </Label>
              <Input
                id="email-input"
                type="email"
                placeholder="joao.silva@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full focus-visible:ring-2 focus-visible:ring-primary"
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-input" className="text-sm font-semibold">
                Senha (mínimo 6 caracteres)
              </Label>
              <Input
                id="password-input"
                type="password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full focus-visible:ring-2 focus-visible:ring-primary"
                aria-required="true"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector-input" className="text-sm font-semibold">
                  Setor
                </Label>
                <select
                  id="sector-input"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-input" className="text-sm font-semibold">
                  Nível de Acesso
                </Label>
                <select
                  id="role-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="Colaborador">Colaborador</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 mt-2 h-11"
              disabled={isSubmitting}
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Criando..." : "Registrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Já possui uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold inline-flex items-center gap-1">
              <LogIn className="h-3.5 w-3.5" /> Fazer Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
