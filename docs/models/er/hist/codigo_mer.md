classDiagram
direction LR
    class Estabelecimento {
	    Nome Fantasia
	    Razão Social
	    CNPJ$
        Quantidade
        CNAE
        Registro Cadastur
	    Site
        Coordenadas geográficas
        Horário de atendimento
        Site
        Classificacao
    }

    class Evento_Programado{
        Nome
        Quantidade
        Data de realização
        Descrição
    }

    class Cadastur{
        Obrigatoriedade [3]
        Inscrição [1]
        Número$
        Vencimento
    }

    Estabelecimento "1" -- "1" Cadastur

    class Contato{
        Cargo$ (precisa?)
        Telefone$
        Email
    }

    class Endereco{
        CEP$
        Rua
        Número$
        Bairro
        Região
        Coordenadas
    }

    Estabelecimento "1" -- "1" Endereco
    


    class Artesanato {
        Destino Inteligente
        Quantidade
        Classificação
        Inventário
    }       



    class Pagamento {
	    Tipo de Pagamento$
    }

    class Produtos_Serviços {
	    Nome
	    Código$
	    Detalhes
    }

    class RedeSocial {
	    Nome$
	    Perfil$
    }

    class Meio_Alimentacao_Bebida{
        Classificação
        Início da atividade
        Estacionamento
        Especificação da gastronomia
        Observação
        Parque

    }

    class Meio_Hospedagem{
            Aceite participar das pesquisas [1]
            Telefone pesquisas
            Email pesquisa
            Tipo
            Data abertura
            Proprietário [1..*]
            Inventário
            UH's
            UH's PCDS
            Leitos
            Funcionamento 24h 
            Horário checkin
            Horário checkout
            Reservas
    }

    class Espaco_Evento{
        Outras regras e informações
        Descrição do espaço
        Observação
    }

    class Organizadores_Servicos_Eventos{
        Destinos Inteligentes
        Forma de atendimento
        Serviços oferecidos
        Observação
        
    }


    class Cabeleireiro_Barbeiro{

        
    }
    
    class Característica{
        Nome [2]
        Categoria
    }

    class Característica_Valor{
        Nome [2]
        Categoria
        Valor
    }

    class Locadora_Veiculos_Transporte{
        Tipo
        Destinos Inteligentes
        Acessibilidade

    }

  

    class Atrativos_Lazer_Entretenimento{
        Local
        Tipo
        Data Início Funcionamento
        Estacionamento
        Informações gerais
        Destaque

    }

    class ODS_quali{
        Eixo
        ODS
    }

    class ODS_quant{
        Eixo
        ODS
        Valor
    }


    class Banco{
        Principais serviços [1..*]
        Caixas eletrônico fora da agência
        Classificação

    }


    class Clínica_Odontológica{

    }

    class Clínica_Médica{

    }

    class Clínica_Veterinária{

    }

    class Agências e Operadoras de Turismo{
        Estacionamento
        Observação
        Destinos Inteligentes
        Classificação
        Início da atividade
    }

    class Guia_Turismo{
        Quantidade
        Destinos Inteligentes
        Nome
        Categoria
        Classificação
    }

    class RHC{
        Quantidade
        Numeração RHC
        Tipo
        Data de renovação
        Denominação comercial
        CPF do proprietário
        Nome do proprietário
        Data de liberação
        Número processo
        Data de entrada
        Acessibilidade PCD
        Quantidade de leitos
        Capacidade máxima
        Observações
    }

    class Grupos_Folcloricos_Parafolcloricos{
        Quantidade
        Classificação do grupo
        Nome
        Razão social
        CNPJ ou CPF
        Quantidade participantes
        Observação
    }

    class Taxi_Aplicativo{
        Quantidade pontos
        Quantidade veículos
        Nome
        Empresa
        Credencial Alvará
        Número registro
        Placa
        Ano habilitação


    }

    class Educaçao{
        
    }


    class Farmácia{

    }

    class Lavanderia{

    }

    class Posto{

    }

    class Templo_Religioso{
        Possibilidade de visitação
        Como funciona
        Data quermesse e eventos

    }

    class Mecânica{

    }

    class Serviço_Saúde{
        Principais serviços
        Outras informações
        Horários atendimento emergência



    }

    class Serviço_Seguranca{

    }

    class Supermercado{

    }


    Estabelecimento <|-- Artesanato
    Estabelecimento <|-- Cabeleireiro_Barbeiro
    Estabelecimento <|-- Banco
    Estabelecimento <|-- Espaco_Evento
    Estabelecimento <|-- Atrativos_Lazer_Entretenimento
    Estabelecimento <|-- Clínica_Odontológica
    Estabelecimento <|-- Clínica_Médica
    Estabelecimento <|-- Clínica_Veterinária
    Estabelecimento <|-- Educaçao
    Estabelecimento <|-- Farmácia
    Estabelecimento <|-- Lavanderia
    Estabelecimento <|-- Posto
    Estabelecimento <|-- Templo_Religioso
    Estabelecimento <|-- Mecânica
    Estabelecimento <|-- Serviço_Saúde
    Estabelecimento <|-- Serviço_Seguranca
    Estabelecimento <|-- Supermercado
    Estabelecimento <|-- Meio_Hospedagem
    Estabelecimento <|-- Organizadores_Servicos_Eventos
   
    


    Estabelecimento "N" -- "N" Contato : comunica por
    Estabelecimento "1" -- "N" Pagamento : aceita
    Artesanato "1" -- "N" `Produtos_Serviços` : vende
    Estabelecimento "1" -- "N" RedeSocial
    Estabelecimento "N" -- "N" Característica
    Estabelecimento "N" -- "N" Característica_Valor
    Estabelecimento "1" -- "N" RedeSocial
    Estabelecimento "1" -- "N" ODS_quali
    Estabelecimento "1" -- "N" ODS_quant
    Meio_Alimentacao_Bebida "1" -- "N" Produtos_Serviços

    Guia_Turismo "N" -- "N" Contato
    Guia_Turismo "1" -- "N" RedeSocial
    Guia_Turismo "1" -- "N" Cadastur
    Guia_Turismo "1" -- "1" ODS_quant

    RHC "1" -- "1" Endereco
    RHC "N" -- "N" Contato
    RHC "1" -- "N" ODS_quant

    Grupos_Folcloricos_Parafolcloricos "1" -- "1" Endereco
    Grupos_Folcloricos_Parafolcloricos "1" -- "N" Contato
    Grupos_Folcloricos_Parafolcloricos "1" -- "N" RedeSocial

    Taxi_Aplicativo "1" -- "1" Endereco
    Taxi_Aplicativo "1" -- "N" Contato


