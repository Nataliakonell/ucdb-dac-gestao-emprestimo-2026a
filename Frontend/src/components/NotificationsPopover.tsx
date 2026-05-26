import { useState, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRef } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5279/api";

interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Rastrear o último ID de notificação para saber quando chega uma nova
  const lastIdRef = useRef<number | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("resource_buddy_token");
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data: Notification[] = await res.json();
        
        if (data.length > 0) {
          const latestId = Math.max(...data.map(n => n.id));
          
          // Se for a primeira vez carregando, apenas define o lastId
          if (lastIdRef.current === null) {
            lastIdRef.current = latestId;
          } 
          // Se houver um ID maior que o último registrado, é uma notificação NOVA
          else if (latestId > lastIdRef.current) {
            const newNotif = data.find(n => n.id === latestId);
            if (newNotif && !newNotif.read) {
              toast.info("Nova Notificação", {
                description: newNotif.message,
                duration: 5000,
              });
            }
            lastIdRef.current = latestId;
          }
        }
        
        setNotifications(data);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("resource_buddy_token");
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-md">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold text-sm">Notificações</h4>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
            {unreadCount} não lidas
          </span>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Você não tem novas notificações.
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-3 border-b p-4 text-sm transition-colors hover:bg-muted/50 ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex-1 space-y-1">
                  <p className={`leading-snug ${!notification.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(notification.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full shrink-0 self-center"
                    onClick={() => markAsRead(notification.id)}
                    disabled={isLoading}
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
