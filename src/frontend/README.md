  # 🖥️ Frontend - Sistema de Gestão OTO

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

Este diretório contém a aplicação Frontend (Interface de Utilizador) do Sistema de Gestão de Dados do Observatório de Turismo de Olímpia (OTO). Trata-se de uma *Single Page Application* (SPA) desenvolvida para garantir uma navegação rápida, segura e adaptada aos diferentes perfis de utilizadores (Trade, Staff e Admin).

---

## 🛠️ Stack Tecnológica

* **Framework Base:** [React 18+](https://react.dev/)
* **Build Tool:** [Vite](https://vitejs.dev/) (para compilação e *Hot Module Replacement* ultrarrápidos)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (garantia de tipagem estática e maior segurança no código)
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com componentes baseados em [shadcn/ui](https://ui.shadcn.com/)
* **Comunicações HTTP:** [Axios](https://axios-http.com/) (configurado com intercetores para gestão de JWT)

---

## 📁 Estrutura de Diretórios

A arquitetura do projeto foi desenhada para manter uma clara separação de responsabilidades. Abaixo está a visão geral da pasta `src/`:

```text
frontend/
├── src/
│   ├── app/
│   │   ├── components/    # Componentes reutilizáveis
│   │   │   ├── ui/        # Componentes base de interface (botões, modais, formulários - shadcn)
│   │   │   └── ...        # Layouts, Sidebar, ProtectedRoute, Modais específicos
│   │   ├── contexts/      # Contextos globais da aplicação (ex: AuthContext.tsx para RBAC)
│   │   ├── pages/         # Ecrãs principais (LoginPage, Dashboard, PortalTrade, Inventario, etc.)
│   │   ├── services/      # Integração com o Backend (api.ts para gestão de tokens e pedidos)
│   │   ├── styles/        # Ficheiros de estilo (index.css, tailwind.css, theme.css)
│   │   └── utils/         # Funções auxiliares e formatadores de dados (formatters.ts)
│   ├── main.tsx           # Ponto de entrada (Entry point) da aplicação React
│   └── routes.tsx         # Configuração central de rotas e navegação
├── .env.example           # Exemplo das variáveis de ambiente necessárias
├── package.json           # Definição de scripts e dependências do projeto
├── vite.config.ts         # Configurações do bundler Vite
└── tailwind.config.* # Configurações de design system e temas

## 🎨 Design e Prototipação

A interface de usuário foi inicialmente prototipada e validada junto à equipe da Secretaria de Turismo (OTO) utilizando o Figma. Alguns componentes da aplicação foram baseados diretamente nos *code bundles* exportados desta etapa.

* 🔗 **[Acessar o Protótipo Original no Figma](https://www.figma.com/design/83WamrBRhpUmdd0KRjHHRf/Ideia-principal)**

---

## 📄 Créditos e Atribuições

Este projeto faz uso de componentes de interface de código aberto e recursos visuais de terceiros. Para consultar os devidos créditos e os detalhes das licenças dos projetos originais (como **shadcn/ui** e fotografias do **Unsplash**), verifique o arquivo [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md).