import React from 'react';
import { AlertCircle, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface MockPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  message?: string;
  showComingSoon?: boolean;
}

export function MockPage({
  title,
  description = 'Esta página ainda está em desenvolvimento.',
  icon = <AlertCircle className="w-16 h-16 text-yellow-500" />,
  message = 'Módulo em desenvolvimento: Futura implementação',
  showComingSoon = true,
}: MockPageProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-[#f0f4f8]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{icon}</div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description && <CardDescription className="text-base mt-2">{description}</CardDescription>}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">{message}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {showComingSoon
                    ? 'Esta funcionalidade será disponibilizada em breve. Fique atento às atualizações!'
                    : 'Por favor, utilize os módulos disponíveis no menu principal.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <p>✓ Versão MVP: Recursos essenciais em operação</p>
            <p>✓ Novas funcionalidades planejadas</p>
            <p>✓ Em construção com foco em qualidade</p>
          </div>

          <Button disabled className="w-full">
            Indisponível nesta versão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
