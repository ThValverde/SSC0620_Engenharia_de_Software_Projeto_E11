Com base em todas as nossas discussões, na análise de requisitos e nas transcrições das entrevistas com o Observatório de Turismo de Olímpia, elaborei um **prompt mestre** detalhado. 

Esse texto foi otimizado com vocabulário de UI/UX (Interface de Usuário e Experiência do Usuário) para que você possa copiar e colar diretamente em ferramentas de IA generativa de design (como o *Figma AI*, *v0.dev*, *Galileo AI* ou plugins de conversão de texto para código no Figma). Ele traduz o "cenário perfeito" desejado pelo cliente e as regras de negócio em componentes visuais claros.

Aqui está o prompt que você deve utilizar na ferramenta:

***

### 📋 Copie e cole o texto abaixo no seu gerador de UI (Figma/AI)

**Contexto do Sistema:**
Atue como um UI/UX Designer Sênior. Crie o design de uma aplicação web responsiva (estilo Dashboard SaaS) para o "Observatório de Turismo de Olímpia". O sistema tem foco na centralização de dados e cruzamento de informações gerenciais. O design deve ser limpo, profissional, transmitindo confiança e estabilidade, utilizando uma paleta de cores corporativa (tons de azul marinho, cinza claro e branco, com botões de ação em cores de destaque como azul vibrante ou verde). O layout principal deve conter uma barra de navegação lateral (Sidebar) e uma área principal de conteúdo.

**Menu de Navegação Lateral (Sidebar):**
A barra lateral deve conter o perfil do usuário logado (ex: "Administrador") e os seguintes itens de navegação:
1. Dashboard Inicial (Visão Geral)
2. Inventário Turístico (Base de Dados)
3. Relatórios e Cruzamentos (Filtros de Busca)
4. Histórico e Anexos (Uploads)

**Tela 1: Inventário Turístico (Gestão da Base SQL Principal):**
Esta é a tela de gerenciamento do *trade* turístico.
*   **Cabeçalho da Tela:** Título "Inventário Turístico" e um botão primário de destaque "+ Novo Estabelecimento".
*   **Área de Conteúdo (Data Grid/Tabela):** Uma tabela robusta exibindo os estabelecimentos cadastrados. Colunas da tabela: Razão Social, Nome Fantasia, Segmento (ex: Hospedagem, Atrativo, Alimentação), Status (Ativo/Inativo) e Ações (Ícones de Editar e Excluir).
*   **Modal de Cadastro (Janela Sobreposta):** Ao clicar em "+ Novo Estabelecimento", deve abrir um formulário modal inteligente. O formulário deve ter uma seção de "Dados Comuns" (CNPJ, Endereço, Contato). Abaixo, deve haver um *Dropdown* de "Segmento". O design deve indicar que os campos são dinâmicos: se o usuário selecionar "Meio de Hospedagem", devem aparecer campos adicionais específicos (Quantidade de Leitos, Quantidade de UHs); se selecionar "Serviço de Saúde", esses campos de leitos não devem aparecer.

**Tela 2: Relatórios e Cruzamentos (O "Cenário Perfeito"):**
Esta tela resolve a lentidão na geração de relatórios, automatizando buscas e permitindo a limpeza de dados discrepantes. O layout deve ser dividido em duas partes: um painel de filtros (esquerda ou topo) e a tabela de resultados (direita ou centro).
*   **Painel de Filtros Pré-Estabelecidos:**
    *   *Filtro Temporal:* Dropdowns para selecionar o Mês/Ano ou Feriado específico.
    *   *Filtro de Cenário (Radio Buttons):* Opções para selecionar "Pesquisa de Expectativa" (futuro) ou "Pesquisa Consolidada" (passado).
    *   *Filtro de Segmentos (Checkboxes):* Múltipla escolha (Hotéis, Pousadas, Parques, Bares, etc.).
    *   *Filtro Módulo ODS / Estrutura (Checkboxes):* Opções de sustentabilidade e infraestrutura (ex: "Acessibilidade PCD", "Selo Verde").
    *   *Botão de Ação:* Botão "Gerar Cruzamento de Dados".
*   **Área de Resultados (Tabela Dinâmica):** Uma tabela exibindo os dados brutos filtrados resultantes da busca. 
*   **Ação de Apara de Arestas (Limpeza de Dados):** Na última coluna dessa tabela de resultados, cada linha deve ter um ícone de um "olho cortado" ou uma "lixeira", indicando a ação de ocultar/ignorar aquela linha da contagem final (para remover dados absurdos preenchidos nas pesquisas).
*   **Ações Globais da Tabela (Barra superior da tabela):** Botão "Exportar para Planilha (.XLSX/.CSV)" e Botão "Salvar Busca/Gerar Gráfico".

**Tela 3: Histórico e Anexos (Gestão de Documentos):**
Esta tela servirá para salvar os resultados das buscas personalizadas e permitir o upload de relatórios gerados externamente.
*   **Layout:** Uma visualização em formato de grade de cartões (Cards) ou lista de pastas.
*   **Conteúdo do Cartão:** Cada cartão representa uma busca salva (Ex: "Fluxo de Turistas - Carnaval 2025"). O cartão exibe a data da geração e um resumo dos filtros aplicados.
*   **Área de Upload:** Dentro de cada cartão, deve haver uma área de *Drag and Drop* (Arraste e Solte) tracejada com o texto: "Anexe aqui a visualização final ou gráficos gerados (PDF, PNG, JPG)".

***

### Justificativas baseadas na nossa modelagem e na visão do cliente:
*   **Modal Condicional no Inventário:** Reflete a explicação exata do cliente de que dados cadastrais e de endereço são "comuns entre todas", mas a "quantidade de UHs e quantidade de leitos, só o meio de hospedagem possui". Mantém a estabilidade do SQL.
*   **Filtros "Expectativa x Consolidado":** Adicionado para cobrir a dinamicidade citada de que as pesquisas rodam duas vezes para o mesmo feriado (o planejamento futuro e a realidade passada).
*   **O ícone de "Olho Cortado / Lixeira" (Apara de Arestas):** Uma solução visual elegante de UI para resolver a dor relatada do turista que alega gastar apenas R$ 100 por dia num resort. Em vez de o usuário criar fórmulas complexas, ele clica no ícone e exclui a linha discrepante antes de apertar o botão de exportar.
*   **Botão Exportar (.XLSX):** Garante a entrega do requisito e respeita a preferência atual da Secretaria de ter os dados disponíveis para formatação posterior, sanando o tempo gasto de "catar milho" coluna por coluna.
*   **Aba de Histórico e Uploads:** Protege o escopo da disciplina. A equipe não precisará construir um gerador de gráficos interativo do zero (o que é arriscado). O sistema cruza os dados e a Secretaria anexa o PDF/PNG lá dentro, mantendo tudo centralizado.