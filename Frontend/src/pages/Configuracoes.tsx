import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Accessibility, Moon, Type, Bell } from "lucide-react";

export default function Configuracoes() {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState("normal");
  const [notifications, setNotifications] = useState(true);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize a aparência e acessibilidade do sistema</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Moon className="h-4 w-4" /> Aparência
            </CardTitle>
            <CardDescription>Alterne entre os modos claro e escuro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Modo escuro</Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Type className="h-4 w-4" /> Tipografia
            </CardTitle>
            <CardDescription>Ajuste o tamanho da fonte para melhor legibilidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label>Tamanho da fonte</Label>
              <Select value={fontSize} onValueChange={(v) => { setFontSize(v); document.documentElement.style.fontSize = v === "grande" ? "18px" : v === "muito-grande" ? "20px" : "16px"; }}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                  <SelectItem value="muito-grande">Muito Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notificações
            </CardTitle>
            <CardDescription>Gerencie alertas e avisos do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif">Receber notificações</Label>
              <Switch id="notif" checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Accessibility className="h-4 w-4" /> Acessibilidade
            </CardTitle>
            <CardDescription>Recursos de acessibilidade do SmartResource+</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Navegação completa por teclado</p>
            <p>✓ Compatível com leitores de tela</p>
            <p>✓ Textos alternativos em ícones e imagens</p>
            <p>✓ Alto contraste no modo escuro</p>
            <p>✓ Ajuste de tamanho da fonte</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
