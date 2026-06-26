# 🚀 Sistema de Gerenciamento de Dados - OTO (Observatório de Turismo de Olímpia)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white)

Este repositório contém os artefatos de desenvolvimento do projeto de software desenvolvido para substituir o uso de planilhas na Secretaria de Turismo de Olímpia (OTO), facilitando o monitoramento de indicadores turísticos e a realização de pesquisas.

---

## 📝 Sumário
* [Sobre o Projeto](#sobre-o-projeto)
* [Arquitetura do Sistema](#arquitetura-do-sistema)
* [Controle de Acessos (RBAC)](#controle-de-acessos-rbac)
* [Organização do Repositório](#organização-do-repositório)
* [Como Executar o Projeto](#como-executar-o-projeto)
* [Próximos Passos (Roadmap)](#próximos-passos-roadmap)
* [Equipe Acadêmica](#equipe-acadêmica)

<a id="sobre-o-projeto"></a>
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
<a id="arquitetura-do-sistema"></a>
## 🏗️ Arquitetura do Sistema

O projeto segue uma arquitetura separada em camadas (Client-Server):

* **[Frontend (React / Vite)](./src/frontend/README.md):** Camada de apresentação (Páginas e Componentes), lógica de negócio no client-side (`AuthContext` para RBAC) e integração de API segura.
* **[Backend (Django / DRF)](./src/backend/README.md):** Camada de API RESTful, disponibilizando endpoints protegidos, lógica de banco de dados, validação de tokens JWT (`SimpleJWT`) e permissões nativas de grupos do Django.

<a id="controle-de-acessos-rbac"></a>
## 🔐 Controle de Acessos (RBAC)

O acesso ao sistema obedece a uma hierarquia de 4 níveis principais:

| Nível | Perfil | Permissões de Criação | Acesso Principal |
| :---: | :--- | :--- | :--- |
| **4** | **Superuser** (Admin Django) | Super User Django | Acesso total a todos os módulos |
| **3** | **Secretaria_Admin** (OTO Admin)| `Secretaria_Admin` | Gestão de usuários (Secretaria e Trade), Dashboard, Inventário e Histórico de Anexos |
| **2** | **Secretaria_Staff** (OTO Staff)| `Secretaria_Staff` | Dashboard, Inventário e Histórico de Anexos |
| **1** | **Trade User** | `Trade` | Acesso restrito ao Portal Trade no molde 1-1 |

---

<a id="organização-do-repositório"></a>
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

<a id="como-executar-o-projeto"></a>
## 🚀 Como Executar o Projeto

Para testar a aplicação localmente, é necessário iniciar o Backend (Django) e o Frontend (React) simultaneamente em terminais separados.

### ⚙️ 1. Executando o Backend (API)

Certifique-se de ter o **Python 3.10+** instalado.

Navegue até a pasta do backend:
```bash
cd src/backend
```

Crie e ative um ambiente virtual:
```bash
# No Windows
python -m venv venv
venv\Scripts\activate

# No Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

Instale as dependências:
```bash
pip install -r requirements.txt
```

Aplique as migrações para criar o banco de dados local (SQLite):
```bash
python manage.py migrate
```

Inicie o servidor de desenvolvimento:
```bash
python manage.py runserver
```
📍 *A API estará rodando em: `http://127.0.0.1:8000/`*

---

### 🖥️ 2. Executando o Frontend (Web)

Certifique-se de ter o **Node.js** (versão 18+) instalado.

Abra um novo terminal e navegue até a pasta do frontend:
```bash
cd src/frontend
```

Instale as dependências do projeto (via npm ou pnpm):
```bash
npm install
```

Configure o ambiente:
Crie um arquivo `.env` na pasta `src/frontend` copiando o conteúdo do `.env.example` e certifique-se de que aponte para a API local:
```env
VITE_API_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
```

Inicie o servidor web:
```bash
npm run dev
```
📍 *O sistema estará disponível no navegador, geralmente em: `http://localhost:5173/`*

---

### 🔑 Credenciais de Teste

*(Opcional)* Usuários padrão do ambiente de desenvolvimento (se adicionados no Seed):

* **Admin OTO:** `admin@oto.com` / `senha`
* **Staff OTO:** `staff@oto.com` / `senha`
* **Trade User:** `trade@user.com` / `senha`
---
<a id="próximos-passos-roadmap"></a>
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
<a id="equipe-academica"></a>
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
