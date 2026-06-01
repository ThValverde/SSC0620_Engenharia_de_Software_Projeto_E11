```

erDiagram
    IMPORTACAO ||--o{ FLUXO_VEICULOS : contem
    ENTIDADE_INVENTARIO ||--o{ DADO_ISSQN : "arrecada"
    IMPORTACAO ||--o{ DADO_ISSQN : "contem"

    FLUXO_VEICULOS {
        int id_pk
        int importacao_id_fk
        date data_referencia
        int dias_uteis_passeio
        int fds_passeio
        int dias_uteis_comercial
        int fds_comercial
    }
    ENTIDADE_INVENTARIO {
        int id_pk
        string cnpj
        string razao_social
        string segmento
    }
    IMPORTACAO {
        int id_pk
        string nome_arquivo
        date data_importacao
    }
    DADO_ISSQN {
        int id_pk
        int entidade_id_fk
        int importacao_id_fk
        date mes_ano_competencia
        float valor_issqn
        string municipio
```
    }

%%|o : Zero ou Um (Opcional)
%%|| : Exatamente Um
%% { : Zero ou Muitos
%% |{ : Um ou Muitos
