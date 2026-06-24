import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Label } from '../ui/label';
import { Users, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { HelpTooltip, LabelWithHelp } from '../HelpTooltip';
import { toast } from 'sonner';

type UserType = 'Secretaria_Admin' | 'Secretaria_Staff' | 'Trade';

interface CreateUserFormData {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  userType: UserType;
  establishmentId?: string;
  permissionLevel?: string;
}

export function UserManagementModal() {
  const { canAccessModule, canCreateUser, isSuperuser, isSecretariaAdmin, isSecretariaStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType | ''>('');

  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    userType: 'Trade',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Check if user can access user management
  if (!canAccessModule('users')) {
    return null;
  }

  // Determine which user types can be created
  const getAvailableUserTypes = (): { value: UserType; label: string }[] => {
    const types: { value: UserType; label: string }[] = [];

    if (isSuperuser() && canCreateUser('Secretaria_Admin')) {
      types.push({ value: 'Secretaria_Admin', label: 'Administrador OTO (Secretaria_Admin)' });
    }

    if (isSecretariaAdmin() && canCreateUser('Secretaria_Staff')) {
      types.push({ value: 'Secretaria_Staff', label: 'Usuário OTO (Secretaria_Staff)' });
    }

    if (canCreateUser('Trade')) {
      types.push({ value: 'Trade', label: 'Usuário Trade' });
    }

    return types;
  };

  const handleInputChange = (field: keyof CreateUserFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUserTypeChange = (value: string) => {
    setSelectedUserType(value as UserType);
    setFormData((prev) => ({
      ...prev,
      userType: value as UserType,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData: any = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        groups: [],
      };

      // Add groups based on user type
      if (formData.userType === 'Secretaria_Admin') {
        userData.groups = ['Secretaria_Admin'];
      } else if (formData.userType === 'Secretaria_Staff') {
        userData.groups = ['Secretaria_Staff'];
      }

      // For Trade users, add establishment data
      if (formData.userType === 'Trade' && formData.establishmentId) {
        userData.establishment_id = formData.establishmentId;
        if (formData.permissionLevel) {
          userData.permission_level = formData.permissionLevel;
        }
      }

      await apiService.createUser(userData);

      // Reset form
      setFormData({
        email: '',
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        userType: 'Trade',
      });
      setSelectedUserType('');
      setOpen(false);
      toast.success('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const availableUserTypes = getAvailableUserTypes();

  if (availableUserTypes.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-[#0c2340] hover:bg-[#0c2340]/90"
        >
          <Plus size={16} className="mr-2" />
          Novo Usuário
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={20} />
            Cadastrar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para criar um novo usuário no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-2">
            <LabelWithHelp
              label="Tipo de Usuário"
              tooltip="Selecione o perfil de acesso do novo usuário. O tipo determina quais módulos e funcionalidades estarão disponíveis."
              htmlFor="user-type"
            />
            <Select value={selectedUserType} onValueChange={handleUserTypeChange}>
              <SelectTrigger id="user-type" className="h-10">
                <SelectValue placeholder="Selecione um tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                {availableUserTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Informações Pessoais</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm">
                  Nome
                </Label>
                <Input
                  id="first_name"
                  placeholder="João"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm">
                  Sobrenome
                </Label>
                <Input
                  id="last_name"
                  placeholder="Silva"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">
                Nome de Usuário
              </Label>
              <Input
                id="username"
                placeholder="usuario.silva"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>
          </div>

          {/* Trade-specific fields */}
          {selectedUserType === 'Trade' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                Dados de Estabelecimento
                <HelpTooltip text="Informações necessárias para vincular este usuário Trade a um estabelecimento específico." />
              </h3>

              <div className="space-y-2">
                <Label htmlFor="establishment-id" className="text-sm">
                  ID do Estabelecimento
                </Label>
                <Input
                  id="establishment-id"
                  placeholder="Ex: EST-001"
                  value={formData.establishmentId || ''}
                  onChange={(e) => handleInputChange('establishmentId', e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permission-level" className="text-sm">
                  Nível de Permissão
                </Label>
                <Select value={formData.permissionLevel || ''} onValueChange={(value) => handleInputChange('permissionLevel', value)}>
                  <SelectTrigger id="permission-level" className="h-10">
                    <SelectValue placeholder="Selecione um nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="manager">Gerenciador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedUserType}
              className="bg-[#0c2340] hover:bg-[#0c2340]/90"
            >
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
