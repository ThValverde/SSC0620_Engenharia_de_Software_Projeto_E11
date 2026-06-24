# Diagnóstico: Entidades não aparecem no Portal Trade

**Data:** 24 de Junho de 2026  
**Status:** 🔴 Identificado  
**Problema:** Superadmin/Admin não conseguem ver entidades ao cadastrar usuários Trade

---

## 🔴 ROOT CAUSE IDENTIFICADA

### Breaking Change: Nova API de Paginação

**Antes** (funcionava):
```typescript
const items = await apiService.listInventory(endpoint);
// Retornava: any[] (array de itens)
// Código: items.forEach((item) => { ... })
```

**Depois** (quebrou):
```typescript
const items = await apiService.listInventory(endpoint, pageSize, page);
// Retorna: { results: [...], count, next, previous }
// Código: items.forEach((item) => { ... }) ❌
// Error: items.forEach is not a function (items é objeto, não array!)
```

### Local do Bug
**Arquivo**: `src/frontend/src/app/pages/PortalTrade.tsx`
**Linha**: 96

```typescript
// ❌ ANTES - Funcionava
const inventoryLists = await Promise.all(
  inventoryEndpoints.map((endpoint) => apiService.listInventory(endpoint))
);

// ❌ AGORA - Quebrou
// inventoryLists = [
//   { results: [...], count, next, previous },  ← é objeto!
//   { results: [...], count, next, previous },
//   ...
// ]

// Linha 102-104: Tenta iterar
inventoryLists.forEach((items) => {  // items = { results, count, ... }
  items.forEach((item) => {  // ❌ items.forEach is not a function!
    options.push({ ... });
  });
});
```

### Por que está silencioso?
O erro é capturado em `catch (error)` (linha 113) que mostra toast genérico "Não foi possível carregar o portal do trade." Sem mensagem específica do erro.

---

## ✅ SOLUÇÃO A IMPLEMENTAR

### 1. Corrigir Chamadas da API
```typescript
// ✅ CORRETO: Extrair .results
const inventoryLists = await Promise.all(
  inventoryEndpoints.map(async (endpoint) => {
    const paginated = await apiService.listInventory(endpoint, 100, 1);
    // Retorna tudo em uma página (100 registros max por endpoint)
    return paginated.results || [];
  })
);
```

### 2. Melhorar UX de Seleção de Entidades

Problema atual: Dropdown gigante com TODAS as entidades
```
▼ Selecionar entidade
  Hotel X — hospedagens
  Hotel Y — hospedagens
  Restaurant A — alimentacao
  Praia B — atrativos
  ... (centenas de itens)
```

**Solução**: Estruturar por categoria

#### Opção A: Abas por Categoria
```
[Hospedagem] [Alimentação] [Atrativos] [Eventos] [Outros]

Hospedagem:
  ☐ Hotel X (ID 1)
  ☐ Hotel Y (ID 2)
  ☐ Pousada Z (ID 3)

Alimentação:
  ☐ Restaurant A (ID 10)
  ☐ Pizzaria B (ID 11)
```

#### Opção B: Tabela com Filtro (RECOMENDADO)
```
Filtro: [Buscar por nome, CNPJ, tipo...]

| #  | Nome | CNPJ | Tipo | Segmento | Ações |
|----|------|------|------|----------|-------|
| 1  | Hotel X | 12.345.678/0001-99 | Estabelecimento | Hospedagem | ✓ Selecionar |
| 2  | Restaurant A | 98.765.432/0001-11 | Estabelecimento | Alimentação | ✓ Selecionar |
| 3  | Praia B | - | Independente | Atrativo | ✓ Selecionar |
```

---

## 🎯 Implementação Proposta

### Fase 1: Fix Imediato
Corrigir `listInventory()` para extrair `.results`

### Fase 2: Melhorar UX
Implementar tabela de seleção por categoria com:
- Busca por nome/CNPJ/CPF
- Filtro por segmento
- Indicador de quantas entidades existem por tipo
- Modal/Dialog para não interferes com fluxo principal

---

## 📊 Estrutura de Dados Esperada

### Backend Retorna
```json
{
  "results": [
    {
      "id": 1,
      "nome_fantasia": "Hotel X",
      "razao_social": "Hotel X Ltda",
      "cnpj": "12.345.678/0001-99",
      "tipo": "Estabelecimento",
      "ativo": true
    },
    ...
  ],
  "count": 150,
  "next": "...",
  "previous": null
}
```

### Frontend Transforma Para
```typescript
{
  id: 1,
  endpoint: "hospedagens",
  label: "Hotel X — hospedagens",
  nome_fantasia: "Hotel X",
  razao_social: "Hotel X Ltda",
  cnpj: "12.345.678/0001-99",
  segmento: "Hospedagem"
}
```

---

## 📋 Verificação de Cobertura

Todos os 16 tipos de entidades devem aparecer:

### Estabelecimentos (12)
- ✓ Hospedagem (hospedagens)
- ✓ Alimentação (alimentacao)
- ✓ Atrativos (atrativos)
- ✓ Espaço de Evento (espacos-eventos)
- ✓ Agência de Viagem (agencias)
- ✓ Organizador de Evento (organizadores-eventos)
- ✓ Transporte Turístico (locadoras-transporte)
- ✓ Artesanato (artesanato)
- ✓ Banco (bancos)
- ✓ Templo Religioso (templos)
- ✓ Serviço de Saúde (saude)
- ✓ Serviço de Apoio (apoio)

### Independentes (4)
- ✓ Guia de Turismo (guias-turismo)
- ✓ RHC (rhc)
- ✓ Grupo Folclórico (grupos-folcloricos)
- ✓ Táxi/Aplicativo (taxi-aplicativo)

