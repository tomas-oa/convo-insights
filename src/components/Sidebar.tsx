import { BarChart3, MessageSquare, Settings, LayoutDashboard, MessageCircle, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
  { name: "Panel de Control", href: "/", icon: LayoutDashboard },
  { name: "Conversaciones", href: "/conversations", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Configuración", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "flex h-full w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          onClose && "fixed inset-y-0 left-0 z-50",
          onClose && !isOpen && "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-sidebar-foreground">Conversatron</h1>
              <p className="text-xs text-muted-foreground">Analytics Dashboard</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden rounded-md p-1 hover:bg-sidebar-accent transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navegación</p>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">v1.0.0</p>
            <p className="mt-1">© 2025 Conversatron</p>
          </div>
        </div>
      </div>
    </>
  );
}