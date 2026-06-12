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


# ==========================================
# FRONTEND - OPÇÃO A: REACT NATIVE (Expo)
# (Abra um novo terminal)
# ==========================================
sudo dnf install nodejs npm -y
cd src/
npx create-expo-app frontend

cd frontend

npx expo install react-dom react-native-web @expo/metro-runtime # para React Native Web
npx expo start -w


# ==========================================
# FRONTEND - OPÇÃO B: REACT (Vite)
# (Abra um novo terminal)
# ==========================================
sudo dnf install nodejs npm -y
cd src/
npm create vite@latest frontend-web -- --template react # rodar apenas uma vez (criação)

# CORREÇÃO: Entrar na pasta do projeto ANTES de dar npm install
cd frontend-web

npm install
npm run dev
