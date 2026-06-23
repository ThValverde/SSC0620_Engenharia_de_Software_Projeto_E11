import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Pencil, Plus, Search, Trash2, UserCog, UserRoundCheck, Shield } from "lucide-react";

type UserGroup = "Secretaria_Admin" | "Secretaria_Staff";
type UserRole = "superuser" | UserGroup;

type ManagedUser = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
};

type UserFormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  is_active: boolean;
  is_superuser: boolean;
  groups: UserGroup[];
};

const emptyForm: UserFormState = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  is_active: true,
  is_superuser: false,
  groups: [],
};

function getRole(user: ManagedUser): UserRole {
  if (user.is_superuser) return "superuser";
  if (user.groups.includes("Secretaria_Admin")) return "Secretaria_Admin";
  if (user.groups.includes("Secretaria_Staff")) return "Secretaria_Staff";
  return "Secretaria_Staff";
}

function roleLabel(role: UserRole) {
  switch (role) {
    case "superuser":
      return "Superuser Django";
    case "Secretaria_Admin":
      return "Administrador OTO";
    case "Secretaria_Staff":
      return "Staff OTO";
  }
}

function roleBadgeClass(role: UserRole) {
  switch (role) {
    case "superuser":
      return "bg-slate-900 text-white";
    case "Secretaria_Admin":
      return "bg-blue-100 text-blue-700";
    case "Secretaria_Staff":
      return "bg-violet-100 text-violet-700";
  }
}

export function UsersPage() {
  const { user, isSuperuser, isSecretariaAdmin, canAccessModule } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<UserFormState>(emptyForm);

  const canManageUsers = canAccessModule("users");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.listUsers();
        setUsers(data as ManagedUser[]);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar os usuários.");
        toast.error("Falha ao carregar usuários.");
      } finally {
        setLoading(false);
      }
    };

    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  const currentUserId = user?.id;

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: ManagedUser) => {
    setEditingUser(item);
    setForm({
      username: item.username,
      email: item.email,
      first_name: item.first_name || "",
      last_name: item.last_name || "",
      password: "",
      is_active: item.is_active,
      is_superuser: item.is_superuser,
      groups: item.groups.filter((group): group is UserGroup => group === "Secretaria_Admin" || group === "Secretaria_Staff"),
    });
    setDialogOpen(true);
  };

  const buildPayload = () => {
    const payload: Record<string, unknown> = {
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      is_active: form.is_active,
      is_superuser: form.is_superuser,
      groups: form.is_superuser ? [] : form.groups,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    return payload;
  };

  const handleSave = async () => {
    if (!form.username || !form.email) {
      toast.error("Preencha pelo menos usuário e email.");
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();

      if (editingUser) {
        const saved = await apiService.updateUser(editingUser.id, payload);
        const normalized = saved as ManagedUser;
        setUsers((prev) => prev.map((item) => (item.id === editingUser.id ? normalized : item)));
      } else {
        const saved = await apiService.createUser(payload);
        setUsers((prev) => [saved as ManagedUser, ...prev]);
      }

      setDialogOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiService.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const role = getRole(item);
      const haystack = [
        item.username,
        item.email,
        item.first_name || "",
        item.last_name || "",
        roleLabel(role),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.is_active) ||
        (statusFilter === "inactive" && !item.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
          <h1 className="text-[#0c2340]">Gestão de Usuários</h1>
          <p className="text-[#64748b] text-sm mt-2">
            Esta área é restrita ao super-admin Django e ao administrador OTO.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-[#1a6fbf]" />
            <h1 className="text-[#0c2340]">Gestão de Usuários</h1>
          </div>
          <p className="text-[#64748b] text-sm">
            Controle de usuários do sistema, visível apenas para super-admin Django e administrador OTO.
          </p>
        </div>

        <Button onClick={openCreate} className="bg-[#1a6fbf] hover:bg-[#1560a8]">
          <Plus size={16} className="mr-2" />
          Novo usuário
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
          <p className="text-xs text-[#64748b]">Total de usuários</p>
          <p className="text-2xl font-bold text-[#0c2340]">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
          <p className="text-xs text-[#64748b]">Ativos</p>
          <p className="text-2xl font-bold text-emerald-600">{users.filter((u) => u.is_active).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4">
          <p className="text-xs text-[#64748b]">Superusers</p>
          <p className="text-2xl font-bold text-slate-900">{users.filter((u) => u.is_superuser).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-3">
          <div className="relative col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email ou usuário"
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            className="h-10 rounded-md border border-[#e2e8f0] bg-white px-3 text-sm"
          >
            <option value="all">Todos os papéis</option>
            <option value="superuser">Superuser Django</option>
            <option value="Secretaria_Admin">Administrador OTO</option>
            <option value="Secretaria_Staff">Staff OTO</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="h-10 rounded-md border border-[#e2e8f0] bg-white px-3 text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Usuário</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Nome</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Papel</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-[#64748b]">Status</th>
              <th className="text-center px-4 py-3 text-xs uppercase text-[#64748b]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredUsers.map((item) => {
              const role = getRole(item);
              const isSelf = item.id === currentUserId;
              return (
                <tr key={item.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0c2340]">{item.username}</div>
                    <div className="text-xs text-[#94a3b8]">{item.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#334155]">
                    {`${item.first_name || ""} ${item.last_name || ""}`.trim() || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={roleBadgeClass(role)}>{roleLabel(role)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-md text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1a6fbf]"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        disabled={isSelf}
                        className="p-1.5 rounded-md text-[#64748b] hover:bg-red-50 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isSelf ? "Não é possível excluir o próprio usuário" : "Excluir"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#94a3b8]">
                  Nenhum usuário encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#94a3b8]">
                  Carregando usuários...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog size={18} />
              {editingUser ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? "Atualize os dados do usuário." : "Cadastre um novo usuário no sistema."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input id="first_name" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input id="last_name" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="password">{editingUser ? "Nova senha (opcional)" : "Senha"}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Papel</Label>
              <select
                id="role"
                value={form.is_superuser ? "superuser" : form.groups[0] || "Secretaria_Staff"}
                onChange={(e) => {
                  const value = e.target.value as UserRole;
                  setForm((prev) => ({
                    ...prev,
                    is_superuser: value === "superuser",
                    groups: value === "Secretaria_Admin" ? ["Secretaria_Admin"] : value === "Secretaria_Staff" ? ["Secretaria_Staff"] : [],
                  }));
                }}
                className="h-10 w-full rounded-md border border-[#e2e8f0] bg-white px-3 text-sm"
              >
                {isSuperuser() && <option value="superuser">Superuser Django</option>}
                <option value="Secretaria_Admin">Administrador OTO</option>
                <option value="Secretaria_Staff">Staff OTO</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-7">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4 accent-[#1a6fbf]"
              />
              <Label htmlFor="is_active">Usuário ativo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
