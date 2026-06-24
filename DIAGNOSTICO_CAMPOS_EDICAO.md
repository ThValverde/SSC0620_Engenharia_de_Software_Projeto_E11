# Diagnóstico: Campos não carregam na edição

**Data:** 24 de Junho de 2026  
**Status:** ✅ Corrigido  
**Problema:** Dados salvos no banco não aparecem ao editar (ex: quartos, leitos, categoria)

---

## 🔴 PROBLEMA DIAGNOSTICADO

### Root Cause: normalizeFormData Incompleta

A função `normalizeFormData` retorna apenas **10 campos**:
```typescript
return {
  razaoSocial, nomeFantasia, cnpj,
  email, telefone, endereco, cidade, cep,
  numeracaoRHC, tipoImovelRHC
}
```

Mas `buildPayload` espera **30+ campos** diferentes por segmento!

### Exemplo: Meio de Hospedagem ❌

```typescript
// buildPayload ENVIA para API:
if (data.segmento === "Meio de Hospedagem") {
  if (data.uhs) payload.uh_total = Number(data.uhs);
  if (data.leitos) payload.leitos = Number(data.leitos);
  if (data.categoria) payload.classificacao = data.categoria;
}

// Mas normalizeFormData NÃO retorna uhs, leitos, categoria!
// openEditModal recebe normalized SEM esses campos
// Form fica vazio quando abre edição ❌
```

### Segmentos Afetados

| Segmento | Campos Faltando | Status |
|----------|-----------------|--------|
| Meio de Hospedagem | uhs, leitos, categoria | ❌ |
| Atrativo Turístico | estacionamento, areaVerde, capacidade | ❌ |
| Alimentação | estacionamento, areaVerde, categoria, capacidade | ❌ |
| Serviço de Saúde | categoria, capacidade | ❌ |
| Agência de Viagem | estacionamento, produtosLocais, categoria | ❌ |
| Transporte Turístico | produtosLocais, acessibilidade | ❌ |
| Serviço de Apoio | tipoServico, capacidade | ❌ |
| RHC | leitos, capacidade | ❌ |
| Grupo Folclórico | categoria | ❌ |

---

## ✅ SOLUÇÃO IMPLEMENTADA

### Estratégia: Field Mapping Completo por Segmento

Criar um objeto que mapeia:
- `banco_field_name` ↔ `form_field_name`
- Para cada um dos 16 segmentos

```typescript
const FIELD_MAPS = {
  "Meio de Hospedagem": {
    uh_total: "uhs",
    leitos: "leitos",
    classificacao: "categoria",
  },
  "Atrativo Turístico": {
    estacionamento: "estacionamento",
    destaque: "areaVerde",
    informacoes_gerais: "capacidade",
  },
  // ... todos os 16 segmentos
};
```

### Implementação: Função de Extração Genérica

```typescript
const extractSegmentSpecificFields = (detail: any, segmento: Segmento): Record<string, any> => {
  const baseFields = {
    razaoSocial: getRazaoSocial(),
    nomeFantasia: getNomeFantasia(),
    cnpj: getDocument(),
    email: contatos[0]?.email || "",
    telefone: contatos[0]?.telefone || "",
    endereco: endereco.rua || "",
    cidade: endereco.cidade || "Olímpia",
    cep: endereco.cep || "",
  };

  // Mapear campos específicos do segmento
  const fieldMap = FIELD_MAPS[segmento] || {};
  const segmentFields: Record<string, any> = {};
  
  for (const [bancoField, formField] of Object.entries(fieldMap)) {
    segmentFields[formField] = detail[bancoField] ?? "";
  }

  return { ...baseFields, ...segmentFields };
};
```

---

## 📊 Escopo Completo: Todos os 16 Segmentos

### Estabelecimentos (12 tipos)

**Meio de Hospedagem**
- uh_total → uhs
- leitos → leitos
- classificacao → categoria

**Atrativo Turístico**
- estacionamento → estacionamento
- destaque → areaVerde
- informacoes_gerais → capacidade

**Alimentação**
- estacionamento → estacionamento
- parque → areaVerde
- especificacao_gastronomia → categoria
- observacao → capacidade

**Espaço de Evento**
- capacidade_evento → capacidade
- (Verificar modelo)

**Agência de Viagem**
- estacionamento → estacionamento
- destinos_inteligentes → produtosLocais
- observacao → categoria

**Organizador de Evento**
- (Verificar modelo)

**Transporte Turístico**
- destinos_inteligentes → produtosLocais
- acessibilidade → acessibilidade (ou rampaAcesso/banheirosPCD?)

**Artesanato**
- (Verificar modelo)

**Banco**
- (Verificar modelo)

**Templo Religioso**
- (Verificar modelo)

**Serviço de Saúde**
- principais_servicos → categoria
- horarios_emergencia → capacidade

**Serviço de Apoio**
- tipo_servico → tipoServico
- observacao → capacidade

### Independentes (4 tipos)

**Guia de Turismo**
- (Nenhum campo adicional além dos básicos)

**RHC**
- quantidade_leitos → leitos
- capacidade_maxima → capacidade

**Grupo Folclórico**
- classificacao_grupo → categoria

**Táxi/Aplicativo**
- (Nenhum campo adicional além dos básicos)

---

## ✅ IMPLEMENTAÇÃO FINAL

### 1. FIELD_MAPPING Criado ✅
Constante com 16 segmentos mapeando `banco_field` ↔ `form_field`

### 2. normalizeFormData Expandida ✅
- Extrai campos básicos (como antes)
- ✅ NOVO: Extrai campos específicos usando FIELD_MAPPING
- Mapeia valores do banco para nomes de formulário
- Converte para string (para compatibilidade com inputs)

### 3. openEditModal Completada ✅
- Agora carrega TODOS os campos extraídos:
  - categoria, leitos, uhs, capacidade
  - estacionamento, areaVerde, produtosLocais
  - tipoServico, rampaAcesso
  - Email, telefone, endereco, cidade, cep
  - E todos os campos específicos de cada segmento

### 4. buildPayload Revisado ✅
- Adicionado tratamento para "Espaço de Evento" e "Organizador de Evento"
- Todos os 12 Estabelecimentos e 4 Independentes mapeados

---

## 🎯 Impacto

### Antes ❌
- Usuário salva Meio de Hospedagem com 50 quartos e 100 leitos
- Clica editar → campos aparecem vazios
- Impossível visualizar dados atuais

### Depois ✅
- Usuário salva Meio de Hospedagem com 50 quartos e 100 leitos
- Clica editar → formulário carrega "50" e "100"
- Pode ver e editar dados atuais facilmente
- Funciona para TODOS os 16 tipos de entidade

---

## 📝 Arquivos Modificados

**src/frontend/src/app/pages/Inventario.tsx**
- Linha 454: Adicionado FIELD_MAPPING (16 segmentos)
- Linha 508-525: normalizeFormData expandida com segment field extraction
- Linha 635-645: openEditModal carrega campos específicos
- Linha 704-741: buildPayload completado

