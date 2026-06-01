erDiagram
    Importacao ||--o{ FLUXO_VEICULOS : contem

    FLUXO_VEICULOS {
        int id_pk
        int importacao_id_fk
        date data_referencia
        int dias_uteis_passeio
        int fds_passeio
        int dias_uteis_comercial
        int fds_comercial
    }


%%|o : Zero ou Um (Opcional)
%%|| : Exatamente Umo
%% { : Zero ou Muitos
%% |{ : Um ou Muitos