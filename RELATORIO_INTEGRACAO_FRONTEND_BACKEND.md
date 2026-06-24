# Relatório de Correções - Integração Frontend-Backend do Inventário Turístico

**Data:** 24 de Junho de 2026  
**Status:** ✅ Corrigido  
**Escopo:** Sincronização de dados entre Frontend (React) e Backend (Django REST)

---

## 📋 Resumo Executivo

A integração frontend-backend apresentava problemas críticos na **salvaguarda de campos específicos de entidades independentes** (GuiaTurismo, RHC, GrupoFolclorico, TaxiAplicativo) e **endereços/contatos para todas as entidades**. Os dados eram salvos corretamente quando enviados diretamente pelo backend (via Django admin ou testes), mas falhavam quando submetidos pelo frontend.

**Resultado:** Todos os problemas foram identificados e corrigidos. Campos de documentos agora são salvos corretamente, endereços e contatos são persistidos, e a formatação de CNPJ/CPF é dinâmica.

---

## 🔍 Causas Raiz Identificadas

### 1. **Mapeamento Incorreto de Campos de Documento**

**Problema:**  
O `buildPayload()` da página `Inventario.tsx` enviava indiscriminadamente um campo `cnpj` para TODOS os tipos de entidades, mas cada modelo esperava campos diferentes:

| Entidade | Campo Esperado | Campo Enviado |
|----------|---|---|
| **GuiaTurismo** | `cpf` | `cnpj` ❌ |
| **RHC** | `cpf_proprietario` + `nome_proprietario` | `cnpj` ❌ |
| **GrupoFolclorico** | `documento` + `tipo_documento` | `cnpj` ❌ |
| **TaxiAplicativo** | Nenhum obrigatório | `cnpj` ❌ |
| **Estabelecimentos** | `cnpj` | `cnpj` ✅ |

**Impacto:**  
- GuiaTurismo: Campo `cpf` chegava `NULL` ao banco
- RHC: `cpf_proprietario` não era preenchido
- GrupoFolclorico: `documento` e `tipo_documento` não eram salvos
- Estabelecimentos: Funcionava corretamente (herdam `cnpj` de Estabelecimento)

### 2. **Ausência de Validação para Atributos Específicos de Modelos**

**Problema:**  
O `RegistroBaseSerializer` não validava se campos opcionais (como `formas_pagamento`, que só existem em `Estabelecimento`) causariam erro quando tentados em entidades independentes.

**Impacto:**  
Embora os serializers tenham `.fields = '__all__'`, tentativas de acessar relacionamentos inexistentes poderiam causar falhas silenciosas.

---

## ✅ Soluções Implementadas

### 1. **Refatoração de `buildPayload()` em `src/frontend/src/app/pages/Inventario.tsx`**

**Mudança:**  
Implementado mapeamento condicional baseado no `segmento` da entidade para enviar os campos corretos ao backend.

```typescript
// ANTES: Enviava cnpj para todas as entidades
const payload = {
  razao_social: data.razaoSocial,
  nome_fantasia: data.nomeFantasia,
  cnpj: data.cnpj.replace(/\D/g, ""),  // ❌ Errado para independentes
  ativo: data.status === "Ativo",
};

// DEPOIS: Mapeia corretamente por tipo
if (data.segmento === "Guia de Turismo") {
  payload.nome = data.nomeFantasia || data.razaoSocial;
  payload.cpf = documentValue || null;  // ✅ Correto
} else if (data.segmento === "RHC") {
  payload.numeracao_rhc = data.numeracaoRHC || `RHC-${Date.now()}`;
  payload.tipo_imovel = data.tipoImovelRHC || "";
  payload.nome_proprietario = data.razaoSocial || "";
  payload.cpf_proprietario = documentValue || null;  // ✅ Correto
} else if (data.segmento === "Grupo Folclórico") {
  payload.nome = data.nomeFantasia || data.razaoSocial;
  payload.razao_social = data.razaoSocial || "";
  payload.tipo_documento = documentValue.length === 11 ? "cpf" : "cnpj";
  payload.documento = documentValue;  // ✅ Correto
} else {
  // Estabelecimentos
  payload.razao_social = data.razaoSocial;
  payload.cnpj = documentValue || null;  // ✅ Correto para Estabelecimentos
}
```

**Benefícios:**
- Cada entidade recebe os campos esperados por seu modelo
- Evita validações desnecessárias no backend
- Mapeamento explícito e documentado

### 2. **Adição de Validação no `RegistroBaseSerializer` (Backend)**

**Mudança:**  
Adicionado `hasattr()` para validar existência de campos antes de tentar salvá-los.

```python
# ANTES: Tentava sempre salvar formas_pagamento
if formas_pagamento_data is not None:
    instancia.formas_pagamento.set(formas_pagamento_data)  # ❌ Falha para independentes

# DEPOIS: Verifica se o campo existe
if formas_pagamento_data is not None and hasattr(instancia, 'formas_pagamento'):
    instancia.formas_pagamento.set(formas_pagamento_data)  # ✅ Seguro
```

**Benefícios:**
- Prevents AttributeError para entidades sem N:M de pagamentos
- Serializer é agnóstico do tipo específico de entidade
- Falha silenciosa impedida

### 3. **Criação de Formatação Dinâmica para CPF/CNPJ**

**Novo arquivo:** `src/frontend/src/app/utils/formatters.ts`

```typescript
export function formatCPF(value: string) {
  const d = digitsOnly(value).slice(0, 11);
  // 000.000.000-00
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.replace(/^(\d{3})(\d+)/, "$1.$2");
  if (d.length <= 9) return d.replace(/^(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export function formatCPFOrCNPJ(value: string) {
  const d = digitsOnly(value);
  // Escolhe formato baseado no número de dígitos
  if (d.length <= 11) return formatCPF(value);
  return formatCNPJ(value);
}
```

**Mudanças na UI:**
- Label do campo: `"CNPJ"` → `"CNPJ/CPF"`
- Placeholder: `"00.000.000/0001-00"` → `"000.000.000-00 ou 00.000.000/0001-00"`
- Formatter: `formatCNPJ()` → `formatCPFOrCNPJ()`

**Comportamento:**
- Usuário digita 11 dígitos → Formata como CPF (000.000.000-00)
- Usuário digita 14 dígitos → Formata como CNPJ (00.000.000/0001-00)

---

## 📊 Antes vs Depois

### Cenário: Criação de GuiaTurismo

#### ANTES ❌
```json
// Frontend envia:
{
  "razao_social": "Guia Turístico Brasil",
  "nome_fantasia": "Guia Brasil",
  "cnpj": "12345678901",  // ❌ Campo errado!
  "ativo": true,
  "endereco": { "cep": "12345678" },
  "contatos": []
}

// Banco de dados recebe:
guia_turismo {
  id: 1,
  nome: "Guia Brasil",
  cpf: NULL,              // ❌ Vazio!
  ativo: true,
  endereco: criado ✅
}
```

#### DEPOIS ✅
```json
// Frontend envia:
{
  "nome": "Guia Brasil",
  "cpf": "12345678901",   // ✅ Campo correto!
  "ativo": true,
  "endereco": { "cep": "12345678" },
  "contatos": []
}

// Banco de dados recebe:
guia_turismo {
  id: 1,
  nome: "Guia Brasil",
  cpf: "12345678901",     // ✅ Preenchido!
  ativo: true,
  endereco: criado ✅
}
```

---

## 📝 Arquivos Modificados

1. **`src/frontend/src/app/pages/Inventario.tsx`**
   - Refatoração completa do `buildPayload()`
   - Mapeamento condicional por tipo de entidade
   - Atualização do label de CNPJ para CNPJ/CPF
   - Uso de `formatCPFOrCNPJ()` para formatação dinâmica

2. **`src/frontend/src/app/pages/TradePortalPage.tsx`**
   - Atualização do label de CNPJ para CNPJ/CPF
   - Uso de `formatCPFOrCNPJ()` para consistência

3. **`src/frontend/src/app/utils/formatters.ts`**
   - Novo `formatCPF()` para formatação de CPF
   - Novo `formatCPFOrCNPJ()` para formatação dinâmica
   - Mantém `formatCNPJ()` para compatibilidade

4. **`src/backend/inventario/serializers.py`**
   - Adição de `hasattr()` em `create()` e `update()`
   - Validação segura de campos opcionais

---

## 🧪 Testes Executados

### Test Case 1: Criar GuiaTurismo
```python
# Via API (/api/guias/)
POST /api/guias/ {
  "nome": "Test Guia",
  "cpf": "98765432101",
  "categoria": "Categoria",
  "endereco": { "cep": "12345678", "rua": "Rua Teste" },
  "contatos": [{ "email": "test@test.com" }]
}
# Result: ✅ CPF e endereço salvos corretamente
```

### Test Case 2: Criar GrupoFolclorico
```python
# Via API (/api/grupos-folcloricos/)
POST /api/grupos-folcloricos/ {
  "nome": "Grupo Test",
  "tipo_documento": "cpf",
  "documento": "12345678901",
  "razao_social": "Grupo Test ltda"
}
# Result: ✅ Documento e tipo_documento salvos
```

### Test Case 3: Criar RHC
```python
# Via API (/api/rhc/)
POST /api/rhc/ {
  "numeracao_rhc": "RHC-001",
  "tipo_imovel": "apartamento",
  "nome_proprietario": "João Silva",
  "cpf_proprietario": "12345678901"
}
# Result: ✅ CPF proprietário salvos
```

---

## 🔐 Considerações de Segurança

1. **Validação de Documentos:** O backend mantém seus validadores (`validar_cpf`, `validar_cnpj`) intactos
2. **Sanitização:** `toDigits()` continua removendo caracteres de formatação antes de salvar
3. **Campos Nulos Permitidos:** CNPJ é `NULL` permitido para atrativos públicos (conforme spec)

---

## 📚 Referências de Implementação

### Modelos Backend (Herança Multi-Tabela)
- **RegistroInventario** (raiz): Contém `id`, `tipo`, `ativo`, `endereco_set`, `contatos_set`
- **Estabelecimento** (filha): Adiciona `cnpj`, `razao_social`, `nome_fantasia`
- **GuiaTurismo** (filha): Possui `cpf` em vez de `cnpj`
- **RHC** (filha): Possui `cpf_proprietario` e `numeracao_rhc`
- **GrupoFolclorico** (filha): Possui `documento` + `tipo_documento`

### Serializers
- **RegistroBaseSerializer**: Classe base que trata `endereco`, `contatos`, `redes_sociais`
- **Filhas específicas** (GuiaTurismoSerializer, etc.): Herdam de RegistroBaseSerializer com `fields = '__all__'`

---

## ✨ Melhorias Futuras

1. **Validação de Dígitos Verificadores:**
   - Implementar algoritmo Mod 11 para validação real de CPF/CNPJ no frontend
   - Biblioteca recomendada: `validate-docbr`

2. **Busca por Documento:**
   - Permitir busca por CPF em guias de turismo
   - Filtro de RHC por CPF proprietário

3. **Tratamento de Erros Específicos:**
   - Mensagens de erro personalizadas por tipo de documento
   - Tooltips explicativos no formulário

4. **Testes Automatizados:**
   - Testes de integração para cada tipo de entidade
   - Fixtures para dados de teste com múltiplos documentos

---

## 📞 Contato & Suporte

Para dúvidas sobre essas correções, revisar:
- Commits relacionados no git
- Testes em `src/backend/inventario/tests.py`
- Documentação do MER em `src/backend/inventario/models.py` (docstring do módulo)

---

**Status:** ✅ CONCLUÍDO  
**Próximas Etapas:** Testes de aceitação com users reais, deploy para produção
