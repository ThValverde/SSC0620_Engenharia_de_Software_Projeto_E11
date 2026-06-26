# ⚙️ Backend - Sistema de Gerenciamento de Dados OTO

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white)
![Django REST Framework](https://img.shields.io/badge/DJANGO-REST-ff1709?style=for-the-badge&logo=django&logoColor=white&color=ff1709&labelColor=gray)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

Este diretório contém a API RESTful do Sistema de Gerenciamento de Dados do Observatório de Turismo de Olímpia (OTO). Desenvolvido em Python com o framework Django, este serviço é responsável por toda a lógica de negócios, persistência de dados, autenticação de usuários e controle rigoroso de permissões (RBAC).

---

## 🛠️ Stack Tecnológica

* **Linguagem:** Python 3.x
* **Framework Web:** Django
* **API Framework:** Django REST Framework (DRF)
* **Autenticação:** JSON Web Token (JWT) utilizando `djangorestframework-simplejwt`
* **Banco de Dados:** SQLite (padrão de desenvolvimento local)

---

## 📁 Estrutura de Diretórios

A arquitetura do backend foi dividida em aplicações modulares (Django Apps) para manter a clareza e separação de responsabilidades:

```text
backend/
├── config/             # Configurações globais do projeto, roteamento base (urls) e WSGI/ASGI
├── historico/          # App responsável por gerenciar logs, histórico de anexos e importações
├── inventario/         # App principal: gestão de estabelecimentos, trade, grupos folclóricos, etc.
├── db.sqlite3          # Banco de dados local da aplicação
├── manage.py           # Utilitário de linha de comando nativo do Django
└── requirements.txt    # Lista de dependências Python necessárias para rodar o projeto
```

---

## 🛠️ Stack Tecnológica

* **Linguagem:** Python 3.x
* **Framework Web:** Django
* **API Framework:** Django REST Framework (DRF)
* **Autenticação:** JSON Web Token (JWT) utilizando `djangorestframework-simplejwt`
* **Banco de Dados:** SQLite (MVP e desenvolvimento local) ➔ *Planejado: PostgreSQL para Produção*

---