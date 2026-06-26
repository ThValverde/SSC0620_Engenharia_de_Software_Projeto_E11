```mermaid
erDiagram
  Pasta ||--o{ Relatorio : "contém (opcional)"
  Relatorio ||--o{ ArquivoAnexo : "armazena arquivos"
  Relatorio }o--o{ TagSegmento : "classificado por"

  Pasta {
      int id PK
      string nome "Ex: Planejamento 2026"
      datetime data_criacao
  }

  Relatorio {
      int id PK
      int pasta_id FK "nullable (Sem Pasta)"
      string titulo
      int quantidade_registros "nullable"
      datetime data_criacao "Para filtro: Mais recentes"
      datetime data_modificacao "Para filtro: Última Modificação"
  }

  TagSegmento {
      int id PK
      string nome "Ex: Hotéis, Restaurantes"
  }

  ArquivoAnexo {
      int id PK
      int relatorio_id FK
      string nome_original "Ex: expectativa_natal.xlsx"
      string arquivo_url "Caminho no disco ou S3"
      float tamanho_kb
      datetime data_upload
  }