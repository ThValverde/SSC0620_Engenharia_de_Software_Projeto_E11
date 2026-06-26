# ==========================================
# DEPENDÊNCIAS GERAIS (Rode em qualquer lugar)
# ==========================================
sudo dnf update -y
sudo dnf install python3 python3-pip -y

# ==========================================
# BACKEND (Django)
# ==========================================
# criar ambiente virtual no diretório do backend - para isolamento
cd src/backend
python3 -m venv venv
source venv/bin/activate

# ==========================================
# CASO A: criação de projeto do zero
# ==========================================
# com o ambiente virtual iniciado
pip install django djangorestframework
# Instalando também os pacotes extras
pip install dj-rest-auth dj-database-url whitenoise
# ==========================================
# CASO B: projeto já criado e com requirements.txt
# ==========================================
# com o ambiente virtual iniciado
pip install -r requirements.txt

# GERAR/ATUALIZAR ARQUIVO DE DEPENDÊNCIAS
# Rode este comando sempre que instalar um novo pacote via pip
pip freeze > requirements.txt


# para rodar o servidor django (ambos os cenários)
python manage.py runserver
# para atualizacoes
python manage.py makemigrations
python manage.py migrate

# ==========================================
# FRONTEND - OPÇÃO A: REACT NATIVE (Expo)
# (Abra um novo terminal)
# ==========================================
# Garanta que o Node.js está instalado (Rode em qualquer cenário)
sudo dnf install nodejs npm -y

# --- CENÁRIO 1: CRIANDO O PROJETO DO ZERO ---
# Use APENAS se a pasta 'frontend' ainda não existir
cd src/
npx create-expo-app frontend
cd frontend
npx expo install react-dom react-native-web @expo/metro-runtime # Dependências para Web

# --- CENÁRIO 2: O PROJETO JÁ EXISTE ---
# Use se você clonou o repositório e a pasta 'frontend' já está lá
cd src/frontend
npm install

# --- PARA RODAR O SERVIDOR (Ambos os cenários) ---
npx expo start -w


# ==========================================
# FRONTEND - OPÇÃO B: REACT (Vite)
# (Abra um novo terminal)
# ==========================================
# Garanta que o Node.js está instalado (Rode em qualquer cenário)
sudo dnf install nodejs npm -y

# --- CENÁRIO 1: CRIANDO O PROJETO DO ZERO ---
# Use APENAS se a pasta 'frontend-web' ainda não existir
cd src/
npm create vite@latest frontend-web -- --template react
cd frontend-web
npm install

# --- CENÁRIO 2: O PROJETO JÁ EXISTE ---
# Use se você clonou o repositório e a pasta 'frontend-web' já está lá
cd src/frontend-web
npm install

# --- PARA RODAR O SERVIDOR (Ambos os cenários) ---
npm run dev