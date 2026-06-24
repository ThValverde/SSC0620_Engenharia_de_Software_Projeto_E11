import { NavLink, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  MapPin,
  LogOut,
  ChevronRight,
  UploadCloud,
  Store,
  Database,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface NavItem {
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  to: string;
  requiresRole?: string[];
}

const baseNavItems: NavItem[] = [
  {
    label: "Dashboard Inicial",
    sublabel: "Visão Geral",
    icon: LayoutDashboard,
    to: "/dashboard",
    requiresRole: ["Secretaria_Admin", "Secretaria_Staff"],
  },
  {
    label: "Inventário Turístico",
    sublabel: "Entidades",
    icon: Building2,
    to: "/inventario",
    requiresRole: ["Secretaria_Admin", "Secretaria_Staff"],
  },
  {
    label: "Gestão de Usuários",
    sublabel: "Controle de Acesso",
    icon: Users,
    to: "/users",
    requiresRole: ["Secretaria_Admin", "Secretaria_Staff"],
  },
  {
    label: "Central de Importação",
    sublabel: "Upload de Dados",
    icon: UploadCloud,
    to: "/importacao",
    requiresRole: ["Secretaria_Admin", "Secretaria_Staff"],
  },
  {
    label: "Cruzamento de Dados",
    sublabel: "Consultas",
    icon: Database,
    to: "/cruzamento",
    requiresRole: ["Secretaria_Admin", "Secretaria_Staff"],
  },
  {
    label: "Histórico e Anexos",
    sublabel: "Documentos",
    icon: FolderOpen,
    to: "/historico",
    requiresRole: ["Secretaria_Admin", "Secretaria_Staff"],
  },
  {
    label: "Portal do Trade",
    sublabel: "Autoatendimento",
    icon: Store,
    to: "/portal-trade",
    requiresRole: ["Secretaria_Admin", "trade"],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessModule, user, isTradeUser, logout, isSuperuser, isSecretariaAdmin, isSecretariaStaff } = useAuth();

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const filteredNavItems = baseNavItems.filter((item) => {
    if (item.to === "/users") {
      return canAccessModule("users");
    }

    if (item.to === "/portal-trade") {
      if (isSecretariaStaff()) {return false;}
      return true;
    }

    if (!item.requiresRole) return true;
    return item.requiresRole.some((role) => {
      if (role === "Secretaria_Admin" || role === "Secretaria_Staff") {
        return !isTradeUser();
      }
      return false;
    });
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRole = isSuperuser() 
    ? "Admin Django" 
    : isSecretariaAdmin() 
      ? "Admin OTO" 
      : isTradeUser() 
        ? "Usuário Trade" 
        : "Staff OTO";

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0c2340] text-white min-h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1a6fbf] rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[11px] leading-snug opacity-80">
              Observatório de Turismo
            </p>
            <p className="text-white text-[13px] font-semibold leading-tight">
              Olímpia — SP
            </p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1a6fbf] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.username?.substring(0, 2).toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username || "Usuário"}
            </p>
            <p className="text-white/50 text-xs truncate">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-3 mb-3">
          Menu Principal
        </p>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const to = item.to === "/portal-trade" ? (isTradeUser() ? "/trade-portal" : "/portal-trade") : item.to;
          const active = isActive(to);
          const label = item.to === "/portal-trade" ? (isTradeUser() ? "Meu Portal" : "Portal do Trade") : item.label;
          const sublabel = item.to === "/portal-trade" ? (isTradeUser() ? "Autoatendimento" : "Gestão do Trade") : item.sublabel;
          return (
            <NavLink
              key={item.to}
              to={to}
              end={to === "/"}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative ${
                active
                  ? "bg-[#1a6fbf] text-white shadow-sm"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#38bdf8] rounded-r-full" />
              )}
              <Icon size={18} className={active ? "text-white" : "text-white/60 group-hover:text-white/90"} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-tight ${active ? "font-semibold" : "font-medium"}`}>
                  {label}
                </p>
                <p className={`text-[11px] ${active ? "text-white/70" : "text-white/40"}`}>
                  {sublabel}
                </p>
              </div>
              {active && <ChevronRight size={14} className="text-white/60 flex-shrink-0" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-white/50 hover:text-white/80 hover:bg-white/8 transition-all text-sm"
        >
          <LogOut size={16} />
          <span>Sair do Sistema</span>
        </button>
        <p className="text-white/20 text-[10px] text-center mt-3">
          v1.0.0 · Olímpia Turismo © 2025
        </p>
      </div>
    </aside>
  );
}