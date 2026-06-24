# Solução Completa: Suporte a CPF/CNPJ para TaxiAplicativo

**Data:** 24 de Junho de 2026  
**Status:** ✅ Implementado  
**Problema:** TaxiAplicativo não possuía campos para armazenar CPF/CNPJ, quebrando o padrão de outras entidades

---

## 🔴 PROBLEMA DIAGNOSTICADO

Diferentemente de outras entidades independentes (GuiaTurismo, RHC, GrupoFolclorico), o modelo **TaxiAplicativo não tinha campos de documento**. Isso causava:

1. **Impossibilidade de salvar CPF/CNPJ** no banco
2. **Inconsistência na interface** com outras entidades
3. **Falta de rastreabilidade** de motoristas e empresas de táxi

### Por que TaxiAplicativo é especial?

Táxi/Aplicativo pode ser:
- **Pessoa Física (Motorista):** CPF (11 dígitos)
- **Pessoa Jurídica (Empresa):** CNPJ (14 dígitos)

Precisa suportar **ambos os tipos** dinamicamente.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. **Adição de Campos ao Modelo (Backend)**

Adicionar ao modelo `TaxiAplicativo` em `src/backend/inventario/models.py`:

```python
class TaxiAplicativo(RegistroInventario):
    class TipoDocumento(models.TextChoices):
        CPF = "cpf", "CPF"
        CNPJ = "cnpj", "CNPJ"
    
    # Campos existentes...
    nome = models.CharField(max_length=255, verbose_name="Nome do taxista")
    empresa = models.CharField(max_length=255, blank=True)
    
    # ✅ NOVOS CAMPOS
    tipo_documento = models.CharField(
        max_length=4,
        choices=TipoDocumento.choices,
        blank=True,
        help_text="Tipo de documento: CPF (pessoa física) ou CNPJ (empresa/associação)",
    )
    documento = models.CharField(
        max_length=14,
        blank=True,
        help_text="CPF (11 dígitos) ou CNPJ (14 dígitos), sem máscara",
    )
```

**Características:**
- ✅ Campo `tipo_documento`: Escolha entre 'cpf' ou 'cnpj'
- ✅ Campo `documento`: Aceita 11 dígitos (CPF) ou 14 (CNPJ)
- ✅ Ambos opcionais: `blank=True` (permite formulário sem preencher)
- ✅ Sem máscara: Armazenado apenas dígitos

### 2. **Migração de Banco de Dados**

Arquivo: `src/backend/inventario/migrations/0013_add_documento_to_taxi_aplicativo.py`

```python
migrations.AddField(
    model_name='taxiaplicativo',
    name='tipo_documento',
    field=models.CharField(blank=True, choices=[...])
),
migrations.AddField(
    model_name='taxiaplicativo',
    name='documento',
    field=models.CharField(blank=True)
),
```

**Status:** ✅ Aplicada com sucesso

### 3. **Atualização do buildPayload (Frontend)**

Em `src/frontend/src/app/pages/Inventario.tsx`:

```typescript
} else if (data.segmento === "Táxi/Aplicativo") {
  payload.nome = data.nomeFantasia || data.razaoSocial;
  payload.empresa = data.razaoSocial || "";
  
  // ✅ NOVO: Mapeia documento automaticamente
  const cpfOrCnpj = documentValue;
  if (cpfOrCnpj) {
    payload.tipo_documento = cpfOrCnpj.length === 11 ? "cpf" : "cnpj";
    payload.documento = cpfOrCnpj;
  }
```

**Lógica:**
- 11 dígitos → `tipo_documento = "cpf"`
- 14 dígitos → `tipo_documento = "cnpj"`
- Ambos salvos como `documento` (sem máscara)

### 4. **Normalização de Dados (Frontend - Listagem)**

A função `normalizeInventarioItem()` **já suportava** TaxiAplicativo:

```typescript
const getDocument = () => {
  if (segmento === "Táxi/Aplicativo") return item.documento || ""; // ✅ Correto
  // ... outros tipos
};

const getNomeFantasia = () => {
  if (segmento === "Táxi/Aplicativo") return item.empresa || item.nome || "";
  // ... outros tipos
};
```

### 5. **Atualização do Header da Tabela**

Mudança visual para consistência:

```typescript
// ANTES
<th>CNPJ</th>

// DEPOIS
<th>CNPJ/CPF</th>
```

---

## 📊 Fluxo Completo de Dados

### Cadastro (Criar)
```
[Usuario digita "12345678901" no campo CNPJ/CPF]
                    ↓
[Frontend: formatCPFOrCNPJ() formata como CPF: 123.456.789-01]
                    ↓
[Frontend: buildPayload() mapeia]
  - Remove máscara: "12345678901"
  - Detecta: length === 11 → "cpf"
  - Cria payload: { tipo_documento: "cpf", documento: "12345678901" }
                    ↓
[Backend: Recebe e salva na tabela taxi_aplicativo]
  - tipo_documento = "cpf"
  - documento = "12345678901"
```

### Visualização (Listar)
```
[Backend: SELECT tipo_documento, documento FROM taxi_aplicativo]
  Retorna: { documento: "12345678901", tipo_documento: "cpf" }
                    ↓
[Frontend: normalizeInventarioItem()]
  - getDocument() retorna: item.documento = "12345678901"
  - Retorna: { cnpj: "12345678901" } (mapeado para campo cnpj)
                    ↓
[Lista: Exibe "João Silva - 123.456.789-01" na coluna CNPJ/CPF]
```

### Edição (Carregar dados)
```
[Usuario clica em editar Táxi/Aplicativo]
                    ↓
[Frontend: openEditModal() carrega detalhes]
  - normalizeFormData() mapeia documento para cnpj
  - Retorna: { cnpj: "12345678901" }
                    ↓
[Formulário exibe no campo CNPJ/CPF: "123.456.789-01"]
```

---

## 🧪 Casos de Uso Testáveis

### Caso 1: Motorista Individual (CPF)
```
Entrada: "12345678901" (11 dígitos)
Esperado:
  - Formatado: 123.456.789-01 (visual)
  - Salvo: tipo_documento="cpf", documento="12345678901"
  - Exibido: "João Silva - 123.456.789-01"
```

### Caso 2: Empresa de Táxi (CNPJ)
```
Entrada: "12345678000199" (14 dígitos)
Esperado:
  - Formatado: 12.345.678/0001-99 (visual)
  - Salvo: tipo_documento="cnpj", documento="12345678000199"
  - Exibido: "Táxi X Ltda - 12.345.678/0001-99"
```

### Caso 3: Táxi sem Documento
```
Entrada: "" (vazio)
Esperado:
  - Salvo: tipo_documento="", documento=""
  - Exibido: "João Silva - " (sem documento)
  - Editável: Campos vazios
```

---

## 🔒 Robustez da Solução

### 1. **Flexibilidade**
- ✅ Aceita CPF ou CNPJ dinamicamente
- ✅ Detecta automaticamente pelo tamanho
- ✅ Suporta ambos os tipos no mesmo campo

### 2. **Compatibilidade**
- ✅ Usa o padrão já existente de `documento` + `tipo_documento` (igual GrupoFolclorico)
- ✅ Normalização já existente funciona sem alterações
- ✅ Integra perfeitamente com formatadores

### 3. **Validação**
```python
# Backend valida comprimento
if tipo_documento == "cpf" and len(documento) != 11:
    raise ValidationError("CPF deve ter 11 dígitos")
if tipo_documento == "cnpj" and len(documento) != 14:
    raise ValidationError("CNPJ deve ter 14 dígitos")
```

### 4. **Dados Consistentes**
- ✅ Sem máscara no banco (facilitada buscas)
- ✅ Formatação apenas na UI (visual)
- ✅ Conversa clara entre frontend/backend

---

## 📝 Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/backend/inventario/models.py` | Adicionados campos `tipo_documento` e `documento` |
| `src/backend/inventario/migrations/0013_...` | Nova migração aplicada ✅ |
| `src/frontend/src/app/pages/Inventario.tsx` | buildPayload atualizado para TaxiAplicativo |
| `src/frontend/src/app/pages/Inventario.tsx` | Header de coluna: "CNPJ" → "CNPJ/CPF" |

---

## ✨ Resultado Esperado

### Antes ❌
```
Táxi/Aplicativo:
  [Lista] João Silva (sem documento visível)
  [Edição] Não há campo para documento
  [Banco] Nenhum registro de CPF/CNPJ
```

### Depois ✅
```
Táxi/Aplicativo (CPF):
  [Lista] João Silva - 123.456.789-01
  [Edição] Nome: João Silva, CNPJ/CPF: 123.456.789-01
  [Banco] tipo_documento="cpf", documento="12345678901"

Táxi/Aplicativo (CNPJ):
  [Lista] Táxi X Ltda - 12.345.678/0001-99
  [Edição] Nome: Táxi X Ltda, CNPJ/CPF: 12.345.678/0001-99
  [Banco] tipo_documento="cnpj", documento="12345678000199"
```

---

## 🎯 Impacto Geral

### Todos os 4 tipos de Independentes Agora Suportados

| Entidade | Documento | Campo BD |Status |
|----------|-----------|----------|-------|
| GuiaTurismo | CPF | `cpf` | ✅ |
| RHC | CPF (proprietário) | `cpf_proprietario` | ✅ |
| GrupoFolclorico | CPF/CNPJ | `documento` | ✅ |
| **TaxiAplicativo** | **CPF/CNPJ** | **`documento`** | ✅ |

---

## 🚀 Próximas Etapas (Opcional)

1. **Validação de Dígitos Verificadores**
   - Implementar Mod 11 para CPF/CNPJ real (biblioteca `validate-docbr`)

2. **Campos Adicionais para Táxi**
   - `numero_alvara`: Número do alvará
   - `numero_registro`: Número de registro da empresa
   - Já existem, mas podem ser vinculados ao tipo_documento

3. **Busca por Documento**
   - Permitir filtrar por CPF/CNPJ na listagem

4. **Relatórios**
   - Separar estatísticas por tipo (CPF vs CNPJ)
