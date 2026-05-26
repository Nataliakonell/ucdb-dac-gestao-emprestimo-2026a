import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, LogIn, UserPlus } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao fazer login.");
      }

      login(data.token, data.user);
      toast.success(`Bem-vindo de volta, ${data.user.name}!`);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md mb-2">
          <ShieldCheck className="h-7 w-7" />
        </div>
      </div>

      <Card className="border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais corporativas para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-input" className="text-sm font-semibold">
                E-mail Corporativo
              </Label>
              <Input
                id="email-input"
                type="email"
                placeholder="nome.sobrenome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full focus-visible:ring-2 focus-visible:ring-primary"
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password-input" className="text-sm font-semibold">
                  Senha
                </Label>
              </div>
              <Input
                id="password-input"
                type="password"
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full focus-visible:ring-2 focus-visible:ring-primary"
                aria-required="true"
              />
            </div>
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 mt-2 h-11"
              disabled={isSubmitting}
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Autenticando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Primeiro acesso?</span>
            </div>
          </div>
          <Button variant="outline" asChild className="w-full h-11">
            <Link to="/register" className="flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" />
              Criar Conta Corporativa
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
