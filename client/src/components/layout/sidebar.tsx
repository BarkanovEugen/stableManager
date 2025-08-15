import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  Rabbit, 
  Calendar, 
  Users, 
  Bus, 
  Gift, 
  CreditCard,
  Shield, 
  BarChart3, 
  LayoutDashboard,
  Menu,
  X,
  LogOut
} from "lucide-react";

const navigationItems = [
  { path: "/dashboard", label: "Дашборд", icon: LayoutDashboard, roles: ["observer", "instructor", "administrator"] },
  { path: "/lessons", label: "Занятия", icon: Calendar, roles: ["observer", "instructor", "administrator"] },
  { path: "/horses", label: "Лошади", icon: Rabbit, roles: ["observer", "instructor", "administrator"] },
  { path: "/clients", label: "Клиенты", icon: Users, roles: ["observer", "instructor", "administrator"] },
  { path: "/instructors", label: "Инструкторы", icon: Bus, roles: ["instructor", "administrator"] },
  { path: "/certificates", label: "Сертификаты", icon: Gift, roles: ["instructor", "administrator"] },
  { path: "/subscriptions", label: "Абонементы", icon: CreditCard, roles: ["instructor", "administrator"] },
  { path: "/users", label: "Пользователи", icon: Shield, roles: ["administrator"] },
  { path: "/statistics", label: "Статистика", icon: BarChart3, roles: ["instructor", "administrator"] },
];

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to landing page after successful logout
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const visibleItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-mobile-menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar"
      >
        <div className="p-6 border-b">
          <div className="flex items-center">
            <Rabbit className="text-primary text-2xl mr-3" />
            <h1 className="text-lg font-semibold" data-testid="sidebar-title">
              CRM Конюшня
            </h1>
          </div>
        </div>
        
        <nav className="mt-6">
          <div className="px-6 mb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              ОСНОВНОЕ
            </div>
          </div>
          
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || 
              (item.path === "/dashboard" && location === "/");
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer",
                    isActive && "bg-gray-100 border-r-3 border-primary"
                  )}
                  onClick={() => setIsOpen(false)}
                  data-testid={`nav-item-${item.path.replace("/", "")}`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="font-medium text-sm" data-testid="user-name">
                {user?.name || "Пользователь"}
              </div>
              <div className="text-xs text-muted-foreground" data-testid="user-role">
                {user?.role === "administrator" && "Администратор"}
                {user?.role === "instructor" && "Инструктор"}
                {user?.role === "observer" && "Наблюдатель"}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-gray-700"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </>
  );
}
