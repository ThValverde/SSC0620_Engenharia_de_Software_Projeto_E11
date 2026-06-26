# 🚀 Sistema de Gerenciamento de Dados - OTO (Observatório de Turismo de Olímpia)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white)

Este repositório contém os artefatos de desenvolvimento do projeto de software desenvolvido para substituir o uso de planilhas na Secretaria de Turismo de Olímpia (OTO), facilitando o monitoramento de indicadores turísticos e a realização de pesquisas.

---

## 📝 Sumário
* [Sobre o Projeto](#-sobre-o-projeto)
* [Arquitetura do Sistema](#-arquitetura-do-sistema)
* [Controle de Acessos (RBAC)](#-controle-de-acessos-rbac)
* [Organização do Repositório](#-organização-do-repositório)
* [Como Executar o Projeto](#-como-executar-o-projeto)
* [Próximos Passos (Roadmap)](#-próximos-passos-roadmap)
* [Equipe Acadêmica](#-equipe-acadêmica)

## 📖 Sobre o Projeto

O projeto foi proposto na disciplina de Engenharia de Software (SSC0620) do Instituto de Ciências Matemáticas e de Computação (ICMC-USP). O desenvolvimento seguiu o modelo de desenvolvimento ágil, englobando:

* **Planejamento:** Levantamento de requisitos, escopo, elaboração do plano de projeto inicial, mapas mentais e prototipação.
* **Validação:** Revisão do plano, protótipos e requisitos em conjunto com a equipe da Secretaria de Turismo.
* **Modelagem:** Diagramas de casos de uso, modelagem entidade-relacionamento (MER) e diagramas de sequência.
* **Desenvolvimento:** Implementação do frontend em React/Vite e backend em Django/DRF, integrando autenticação via JWT e controle de acesso baseado em papéis (RBAC).

### ✨ Principais Funcionalidades

O sistema possui "Smart Routing", encaminhando usuários dinamicamente com base em seus perfis após o login:
* **Encaminhamento Inteligente (`SmartRedirectRoute`):** Administradores são levados ao `/dashboard`, enquanto usuários do Trade vão para o `/portal-trade`.
* **Gestão Dinâmica de Usuários:** Hierarquia de permissões em cascata (ex: `Secretaria_Admin` pode criar `Staff` e `Trade`; `Secretaria_Staff` pode criar apenas `Trade`).
* **Autenticação JWT Robusta:** Renovação silenciosa (*auto-refresh*) de tokens expirados via interceptadores do Axios.
* **Controle de Módulos Inativos:** Uso de componentes *MockPage* ("Módulo em desenvolvimento") para telas não MVP.
* **UI/UX Aprimorada:** Uso de `HelpTooltip` para dicas contextuais dinâmicas.

---

## 🏗️ Arquitetura do Sistema

O projeto segue uma arquitetura separada em camadas (Client-Server):

* **[Frontend (React / Vite)](./src/frontend/README.md):** Camada de apresentação (Páginas e Componentes), lógica de negócio no client-side (`AuthContext` para RBAC) e integração de API segura.
* **[Backend (Django / DRF)](./src/backend/README.md):** Camada de API RESTful, disponibilizando endpoints protegidos, lógica de banco de dados, validação de tokens JWT (`SimpleJWT`) e permissões nativas de grupos do Django.

## 🔐 Controle de Acessos (RBAC)

O acesso ao sistema obedece a uma hierarquia de 4 níveis principais:

| Nível | Perfil | Permissões de Criação | Acesso Principal |
| :---: | :--- | :--- | :--- |
| **4** | **Superuser** (Admin Django) | `Secretaria_Admin` | Acesso total a todos os módulos |
| **3** | **Secretaria_Admin** (OTO Admin)| `Secretaria_Staff`, `Trade` | Gestão de usuários, Dashboards, Importação |
| **2** | **Secretaria_Staff** (OTO Staff)| `Trade` | Criação de usuários Trade, Histórico |
| **1** | **Trade User** | *Nenhuma* | Acesso restrito ao Portal Trade |

---

## 🗃️ Organização do Repositório

O projeto adota uma estrutura de monorepo. O detalhamento do código e as instruções de execução estão documentados dentro de cada respectivo serviço:

```text
📦 ssc0620_engenharia_de_software_projeto_e11
 ├── 📂 docs/               # Documentações gerais, diagramas (MER, arquitetura), etc.
 ├── 📂 src/                # Código-fonte principal da aplicação
 │   ├── 📂 backend/        # API RESTful desenvolvida em Django e DRF
 │   └── 📂 frontend/       # Aplicação web (SPA) desenvolvida em React e Vite 
 ├── 📂 tests/              # Testes de integração e coleções de API (ex: Bruno)
 ├── 📄 README.md           # Este arquivo (Visão geral do projeto)
 └── 📄 LICENSE             # Licença do projeto
 ```
🧭 Navegação Detalhada
O detalhamento do código, configuração de ambiente e as instruções de execução estão documentados dentro de cada respectivo diretório:

* 📁 **`/docs`** — Contém todos os artefatos de engenharia de software (diagramas de caso de uso, MER, arquitetura, etc).
* 📁 **`/src/frontend`** 👉 **[Ver documentação do Frontend](./src/frontend/README.md)**
* 📁 **`/src/backend`** 👉 **[Ver documentação do Backend](./src/backend/README.md)**

---

## 🚀 Como Executar o Projeto

Para executar a aplicação localmente, é necessário rodar o Frontend e o Backend simultaneamente em terminais separados.

Consulte os guias específicos para instalação de dependências e configuração de variáveis de ambiente:
1. [Instruções de execução do Backend](./src/backend/README.md)
2. [Instruções de execução do Frontend](./src/frontend/README.md)

*(Opcional) Credenciais de testes padrão do ambiente de desenvolvimento:*
* **Admin OTO:** `admin@oto.com` / `senha`
* **Staff OTO:** `staff@oto.com` / `senha`
* **Trade User:** `trade@user.com` / `senha`

---

## 🎯 Próximos Passos (Roadmap)

### Backend
* Configuração de grupos no painel Django (`Secretaria_Admin`, `Secretaria_Staff`).
* Implementação total da rota `/api/auth/login/` devolvendo a estrutura `{ access, refresh, user }`.
* Garantir integração do decorador `@permission_required` nas views para proteger os endpoints da API.

### 🐳 Infraestrutura e DevOps (Produção)
* **Migração de Banco de Dados:** Substituição do SQLite (utilizado para o MVP e desenvolvimento local) pelo **PostgreSQL** em ambiente de produção, garantindo maior integridade relacional, escalabilidade e suporte a alta concorrência.
* **Conteinerização (Docker):** Criação de arquivos `Dockerfile` e `docker-compose.yml` para orquestrar os serviços do frontend, backend e do banco de dados PostgreSQL.

### Frontend
* Adicionar paginação e filtros à listagem de usuários no Dashboard.
* Implementar fluxo de edição de perfis de usuário.
* Integrar consumo real de dados para os gráficos do Portal Trade.

### Testes
* Testes End-to-End (E2E) para validação do fluxo de login e expiração de JWT.
* Testes unitários para os *Hooks* de verificação de permissões RBAC.

---

## 🎓 Equipe Acadêmica

**Instituto de Ciências Matemáticas e de Computação (ICMC-USP)** **Disciplina:** SSC0620 - Engenharia de Software - Projeto Equipe 11  
**Profa. Dra.:** Simone do Rocio Senger de Souza 

**Alunos Desenvolvedores:**
* Thiago de Castro Valverde (14609241) - *Product Owner / Developer*
* Artur Rossoni Baraldi (16983730) - *Developer*
* Felipe de Oliveira Gomes (14613841) - *Developer*
* Leonardo Silva Cardoso (14588200) - *Developer*
* Leonardo Codeceira Gonçalves Pinto (14588509) - *Developer*


## 🤖 Nota sobre o Uso de Inteligência Artificial

A documentação deste repositório (incluindo estruturação de READMEs, revisão ortográfica, formatação de markdown e refinamento de textos técnicos) foi revisada e elaborada com o auxílio de IA Generativa (*Google Gemini Pro*). 