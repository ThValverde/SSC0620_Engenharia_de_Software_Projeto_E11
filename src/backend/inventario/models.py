
"""
Inventário Turístico — Observatório de Turismo de Olímpia (OTO)
App Django: `inventario`

Tradução do MER (SSC0620) para o ORM do Django, com os refinamentos
discutidos sobre o modelo original:

 1. SUPERTIPO `RegistroInventario`
    Raiz comum de TODO item do inventário — tanto os Estabelecimentos
    (empresas) quanto as entidades independentes (Guia de Turismo, RHC,
    Grupos Folclóricos, Táxi/Aplicativo). É uma generalização um nível
    ACIMA da que o MER já tinha, e resolve sem FKs polimórficas:
      - Contato, RedeSocial e Endereco compartilhados por todos;
      - Cadastur também para Guia de Turismo (pessoa física);
      - ODS para Estabelecimentos, Guias e RHC com UMA tabela-ponte;
      - Integrações futuras (ISSQN, Pesquisas Mensais) apontam para
        uma única chave estável.
    No banco vira herança multi-tabela (table-per-subclass), o mesmo
    padrão de Generalização/Especialização do MER.

 2. CHAVE SUBSTITUTA (id BIGINT) em tudo. CNPJ é UNIQUE + NULL —
    atrativos públicos não têm CNPJ, e PK não pode ser nula.

 3. REGISTRO CADASTUR DERIVADO (Regra 1.5): propriedade calculada pela
    existência da linha em `Cadastur`; nenhuma coluna booleana
    redundante. A *exigência legal* (Obrigatório/Opcional/N.A.) é
    função do TIPO de entidade — vive como constante de classe
    `CADASTUR_EXIGENCIA` nas filhas, não como coluna por registro.

 4. CATÁLOGO EAV COM ESCOPO: UNIQUE(escopo, nome, categoria) — evita a
    colisão entre, p.ex., "Sinalização Visual PCD" de Meio de
    Hospedagem x Atrativos x Alimentação (seu próprio doc nota que os
    conjuntos diferem).

 5. `ServicoApoio` consolida as 11 categorias de apoio SEM atributos
    próprios (cabeleireiro, clínicas, farmácia, posto, mecânica...).
    Banco, TemploReligioso e ServicoSaude permanecem especializações
    de verdade porque têm campos próprios.

 6. DIVERGÊNCIA CONSCIENTE do doc de regras (seção 4.2): UH total,
    UH PCD e Leitos ficam como COLUNAS de MeioHospedagem, não no EAV.
    Motivo: não são atributos esparsos (todo MH tem) e são a base do
    cruzamento com Taxa de Ocupação / Pesquisas Mensais — coluna direta
    simplifica radicalmente o SQL do boletim. O EAV fica para o que é
    esparso e variável (acessibilidade, comodidades etc.).
"""

from datetime import date

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    RegexValidator,
)
from django.db import models

# =============================================================================
# 0. VALIDADORES DE DOMÍNIO E CHOICES GLOBAIS
# =============================================================================

validar_cnpj = RegexValidator(
    regex=r"^\d{14}$",
    message="CNPJ deve conter exatamente 14 dígitos numéricos, sem máscara.",
)
validar_cpf = RegexValidator(
    regex=r"^\d{11}$",
    message="CPF deve conter exatamente 11 dígitos numéricos, sem máscara.",
)
# Para validar dígitos verificadores (algoritmo mod 11) no formulário ou
# serializer, use a lib `validate-docbr` (CPF().validate(v), CNPJ().validate(v)).

validar_cep = RegexValidator(
    regex=r"^\d{8}$",
    message="CEP deve conter 8 dígitos numéricos, sem hífen.",
)

# Regra 12.4 — padrão Mercosul (ABC1D23) ou padrão anterior (ABC-1234)
validar_placa = RegexValidator(
    regex=r"^([A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})$",
    message="Placa deve seguir o padrão Mercosul (ABC1D23) ou o anterior (ABC-1234).",
)


def validar_ano_habilitacao(valor):
    """Regra 12.4 — INTEGER entre 1950 e o ano corrente."""
    ano_atual = date.today().year
    if not 1950 <= valor <= ano_atual:
        raise ValidationError(
            f"Ano de habilitação deve estar entre 1950 e {ano_atual}."
        )


class ExigenciaCadastur(models.TextChoices):
    """Exigência legal do Cadastur por TIPO de entidade (Regra 1.5 / Seção 2)."""

    OBRIGATORIO = "obrigatorio", "Obrigatório"
    OPCIONAL = "opcional", "Opcional"
    NAO_SE_APLICA = "nao_se_aplica", "Não se aplica"


class EscopoCatalogo(models.TextChoices):
    """Escopo dos catálogos Caracteristica / CaracteristicaValor.

    Somente os segmentos abaixo possuem catálogo EAV (Seções 3, 4, 6, 7,
    8, 10 e 11 do documento de regras).
    """

    ATRATIVOS = "atrativos", "Atrativos, Lazer e Entretenimento"
    MEIO_HOSPEDAGEM = "meio_hospedagem", "Meios de Hospedagem"
    ALIMENTACAO = "alimentacao", "Meios de Alimentação e Bebidas"
    AGENCIAS = "agencias", "Agências e Operadoras de Turismo"
    ESPACOS_EVENTOS = "espacos_eventos", "Espaços para Eventos"
    ORGANIZADORES = "organizadores", "Organizadores e Serviços p/ Eventos"
    ARTESANATO = "artesanato", "Artesanato e Comércio Diferenciado"


# =============================================================================
# 1. SUPERTIPO — RAIZ DO INVENTÁRIO
# =============================================================================


class RegistroInventario(models.Model):
    """Raiz de generalização de todo item do inventário turístico.

    Tudo que possui Contato, Endereco, RedeSocial, Cadastur ou ODS
    referencia ESTA tabela. As filhas diretas são `Estabelecimento`
    (empresas) e as entidades independentes (GuiaTurismo, RHC,
    GrupoFolclorico, TaxiAplicativo).
    """

    class Tipo(models.TextChoices):
        # filhas de Estabelecimento
        MEIO_HOSPEDAGEM = "meio_hospedagem", "Meio de Hospedagem"
        MEIO_ALIMENTACAO_BEBIDA = "meio_alimentacao_bebida", "Alimentação e Bebidas"
        ATRATIVO = "atrativo", "Atrativo, Lazer e Entretenimento"
        ESPACO_EVENTO = "espaco_evento", "Espaço para Eventos"
        AGENCIA_TURISMO = "agencia_turismo", "Agência/Operadora de Turismo"
        ORGANIZADOR_EVENTO = "organizador_evento", "Organizador/Serviço p/ Eventos"
        LOCADORA_TRANSPORTE = "locadora_transporte", "Locadora/Transporte Turístico"
        ARTESANATO = "artesanato", "Artesanato e Comércio Diferenciado"
        BANCO = "banco", "Banco"
        TEMPLO_RELIGIOSO = "templo_religioso", "Templo Religioso"
        SERVICO_SAUDE = "servico_saude", "Serviço de Saúde"
        SERVICO_APOIO = "servico_apoio", "Serviço de Apoio ao Turista"
        # entidades independentes (não são Estabelecimento)
        GUIA_TURISMO = "guia_turismo", "Guia de Turismo"
        RHC = "rhc", "RHC — Registro Habitacional Complementar"
        GRUPO_FOLCLORICO = "grupo_folclorico", "Grupo Folclórico/Parafolclórico"
        TAXI_APLICATIVO = "taxi_aplicativo", "Táxi, Mototáxi e Aplicativo"

    tipo = models.CharField(
        max_length=40,
        choices=Tipo.choices,
        editable=False,
        db_index=True,
        help_text="Discriminador do segmento — preenchido automaticamente pela filha.",
    )
    ativo = models.BooleanField(
        default = True,
        help_text = "Indica se o estabelecimento está ativo ou não no inventário."
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)


    class Meta:
        db_table = "registro_inventario"
        verbose_name = "registro do inventário"
        verbose_name_plural = "registros do inventário"

    def __str__(self):
        return f"[{self.get_tipo_display()}] #{self.pk}"

    def save(self, *args, **kwargs):
        # Cada filha concreta declara TIPO_REGISTRO; preenchido na criação.
        tipo_da_classe = getattr(self, "TIPO_REGISTRO", None)
        if tipo_da_classe and not self.tipo:
            self.tipo = tipo_da_classe
        super().save(*args, **kwargs)

    # ----- Regra 1.5 — Registro Cadastur DERIVADO -----
    @property
    def possui_cadastur(self) -> bool:
        """"Sim" se, e somente se, existir a linha 1:1 em Cadastur."""
        return hasattr(self, "cadastur")

    @property
    def registro_cadastur(self) -> str:
        return "Sim" if self.possui_cadastur else "Não"

    @property
    def coordenadas(self):
        """(latitude, longitude) do Endereco vinculado, se houver."""
        endereco = getattr(self, "endereco", None)
        if endereco and endereco.latitude is not None and endereco.longitude is not None:
            return (endereco.latitude, endereco.longitude)
        return None

    def especializacao(self):
        """Desce da raiz até a instância mais específica (folha)."""
        obj = self
        for acessor in CAMINHO_FOLHA.get(self.tipo, ()):
            try:
                obj = getattr(obj, acessor)
            except (AttributeError, ObjectDoesNotExist):
                break
        return obj


# =============================================================================
# 2. ENTIDADES DE SUPORTE (compartilhadas por toda a raiz)
# =============================================================================


class Endereco(models.Model):
    """1:1 com qualquer registro do inventário. Coordenadas vivem aqui
    (são propriedade do local físico), expostas na raiz via property."""

    registro = models.OneToOneField(
        RegistroInventario, on_delete=models.CASCADE, related_name="endereco"
    )
    cep = models.CharField(max_length=8, blank=True, validators=[validar_cep])
    rua = models.CharField(max_length=255, blank=True)
    numero = models.CharField(max_length=20, blank=True)
    bairro = models.CharField(max_length=120, blank=True)
    regiao = models.CharField(max_length=120, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )

    class Meta:
        db_table = "endereco"
        verbose_name = "endereço"
        verbose_name_plural = "endereços"

    def __str__(self):
        return f"{self.rua}, {self.numero} — {self.bairro}"


class Contato(models.Model):
    """1:N — um registro pode ter vários contatos (recepção, proprietário...).
    O campo `cargo` resolve o "Cargo$(precisa?)" do MER: precisa, e cobre
    inclusive o "Proprietário [1..*]" de Meio de Hospedagem."""

    registro = models.ForeignKey(
        RegistroInventario, on_delete=models.CASCADE, related_name="contatos"
    )
    telefone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    cargo = models.CharField(
        max_length=120, blank=True,
        help_text="Ex.: Proprietário, Gerente, Recepção, Contato para pesquisas.",
    )

    class Meta:
        db_table = "contato"
        verbose_name = "contato"
        verbose_name_plural = "contatos"

    def __str__(self):
        partes = [p for p in (self.telefone, self.email, self.cargo) if p]
        return " / ".join(partes) or f"Contato #{self.pk}"


class RedeSocial(models.Model):
    registro = models.ForeignKey(
        RegistroInventario, on_delete=models.CASCADE, related_name="redes_sociais"
    )
    nome = models.CharField(max_length=60, help_text="Plataforma. Ex.: Instagram.")
    perfil = models.CharField(max_length=255, help_text="@usuario ou URL do perfil.")

    class Meta:
        db_table = "rede_social"
        verbose_name = "rede social"
        verbose_name_plural = "redes sociais"
        constraints = [
            models.UniqueConstraint(
                fields=["registro", "nome", "perfil"],
                name="uq_rede_social_registro_nome_perfil",
            )
        ]

    def __str__(self):
        return f"{self.nome}: {self.perfil}"


class Cadastur(models.Model):
    """Dados do registro Cadastur. Regra 1.5: a EXISTÊNCIA desta linha é a
    fonte da verdade de "Registro Cadastur = Sim" — sem boolean redundante.
    A exigência legal por tipo está em CADASTUR_EXIGENCIA de cada filha."""

    registro = models.OneToOneField(
        RegistroInventario, on_delete=models.CASCADE, related_name="cadastur"
    )
    inscricao = models.BooleanField(
        default=True, help_text="Inscrição ativa no Cadastur."
    )
    numero = models.CharField(max_length=30, blank=True)
    vencimento = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "cadastur"
        verbose_name = "registro Cadastur"
        verbose_name_plural = "registros Cadastur"

    def __str__(self):
        return f"Cadastur {self.numero or 's/ nº'} (vence {self.vencimento or '—'})"


class Pagamento(models.Model):
    """Catálogo estático (Regra 1.3) — N:M com Estabelecimento.
    Popular via data migration com os 5 valores permitidos."""

    class TipoPagamento(models.TextChoices):
        DINHEIRO = "dinheiro", "Dinheiro"
        PIX = "pix", "Pix"
        CARTAO_CREDITO = "cartao_credito", "Cartão de Crédito"
        CARTAO_DEBITO = "cartao_debito", "Cartão de Débito"
        TRANSFERENCIA = "transferencia", "Transferência Bancária"

    tipo = models.CharField(
        max_length=30, choices=TipoPagamento.choices, unique=True
    )

    class Meta:
        db_table = "pagamento"
        verbose_name = "forma de pagamento"
        verbose_name_plural = "formas de pagamento"

    def __str__(self):
        return self.get_tipo_display()


# =============================================================================
# 3. ESTABELECIMENTO — GENERALIZAÇÃO DAS EMPRESAS DO TRADE
# =============================================================================


class Estabelecimento(RegistroInventario):
    """Atributos comuns às empresas do inventário (Seção 2 das regras).

    Herança multi-tabela: a tabela `estabelecimento` tem PK = FK para
    `registro_inventario` (coluna registroinventario_ptr_id), exatamente
    o padrão table-per-subclass do MER. Não instancie diretamente —
    sempre crie pelas filhas.
    """

    nome_fantasia = models.CharField(max_length=255)
    razao_social = models.CharField(max_length=255, blank=True)
    cnpj = models.CharField(
        max_length=14,
        unique=True,
        null=True,
        blank=True,
        validators=[validar_cnpj],
        help_text="UNIQUE e NULO permitido: atrativos públicos não possuem CNPJ.",
    )
    quantidade = models.PositiveIntegerField(
        null=True, blank=True, help_text="Campo de contagem herdado da planilha original."
    )
    cnae = models.CharField(max_length=10, blank=True)
    site = models.URLField(blank=True)
    horario_atendimento = models.CharField(
        max_length=255, blank=True,
        help_text="Horário geral. Templos: horários de missa/culto (Regra 2.3).",
    )
    classificacao = models.CharField(max_length=120, blank=True)

    formas_pagamento = models.ManyToManyField(
        Pagamento, blank=True, related_name="estabelecimentos"
    )
    caracteristicas = models.ManyToManyField(
        "Caracteristica",
        through="EstabelecimentoCaracteristica",
        related_name="estabelecimentos",
        blank=True,
    )
    metricas = models.ManyToManyField(
        "CaracteristicaValor",
        through="Medicao",
        related_name="estabelecimentos",
        blank=True,
    )

    qtde_funcionarios_fixos = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Funcionários Fixos"
    )
    qtde_funcionarios_temporarios = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Funcionários Temporários"
    )

    class Meta:
        db_table = "estabelecimento"
        verbose_name = "estabelecimento"
        verbose_name_plural = "estabelecimentos"
        ordering = ["nome_fantasia"]

    def __str__(self):
        return self.nome_fantasia


class ProdutoServico(models.Model):
    """Produtos/serviços comercializados (usado por Alimentação e
    Artesanato). FK ancorada no PAI para evitar FK polimórfica."""

    estabelecimento = models.ForeignKey(
        Estabelecimento, on_delete=models.CASCADE, related_name="produtos_servicos"
    )
    nome = models.CharField(max_length=255)
    codigo = models.CharField(max_length=60, blank=True)
    detalhes = models.TextField(blank=True)

    class Meta:
        db_table = "produto_servico"
        verbose_name = "produto/serviço"
        verbose_name_plural = "produtos/serviços"

    def __str__(self):
        return self.nome


# =============================================================================
# 4. CATÁLOGO EAV — CARACTERISTICA (categórico) e CARACTERISTICA_VALOR (métrico)
# =============================================================================


class Secao(models.Model):
    escopo = models.CharField(max_length=20, choices=EscopoCatalogo.choices)
    nome = models.CharField(max_length=120)
    com_pergunta = models.BooleanField(default=False) 
    ordem = models.PositiveSmallIntegerField(default=0)
    class Meta:
        db_table = "secao"
        constraints = [models.UniqueConstraint(fields=["escopo", "nome"], name="uq_secao_escopo_nome")]


class Caracteristica(models.Model):
    """Catálogo de características CATEGÓRICAS (Regra 1.1), com escopo.

    nome = agrupador (ex.: "Sanitário PCD"); categoria = opção
    (ex.: "Barra de apoio"). Regra do "Não": toda Caracteristica de
    escopo+nome possui a linha categoria='Não', apontada quando o
    estabelecimento não tem nenhuma opção do grupo.
    `customizada` marca entradas criadas via [Texto Dinâmico Customizado].
    """

    escopo = models.CharField(max_length=20, choices=EscopoCatalogo.choices)
    nome = models.CharField(max_length=120, help_text="Agrupador/escopo do grupo.")
    categoria = models.CharField(max_length=255, help_text="Opção/item do grupo.")
    customizada = models.BooleanField(
        default=False, help_text="Criada dinamicamente ([Texto Dinâmico Customizado])."
    )
    secao = models.ForeignKey(Secao, null=True, blank=True, on_delete=models.PROTECT, related_name="caracteristicas")

    class Meta:
        db_table = "caracteristica"
        verbose_name = "característica"
        verbose_name_plural = "características"
        constraints = [
            models.UniqueConstraint(
                fields=["escopo", "nome", "categoria"],
                name="uq_caracteristica_escopo_nome_categoria",
            )
        ]

    def __str__(self):
        return f"({self.get_escopo_display()}) {self.nome}: {self.categoria}"


class CaracteristicaValor(models.Model):
    """Catálogo de métricas QUANTITATIVAS (Regra 1.2), com escopo.

    O VALOR não fica aqui — fica na ponte `Medicao`, pois é por
    estabelecimento. Aqui mora apenas a definição (escopo, nome,
    categoria), p.ex. ("meio_hospedagem", "Capacidade UH", "Leitos").
    """

    escopo = models.CharField(max_length=20, choices=EscopoCatalogo.choices)
    nome = models.CharField(max_length=120)
    categoria = models.CharField(max_length=255)
    descricao = models.CharField(
        max_length=255, blank=True, help_text="Semântica/exemplo (coluna do doc de regras)."
    )

    class Meta:
        db_table = "caracteristica_valor"
        verbose_name = "métrica (característica-valor)"
        verbose_name_plural = "métricas (característica-valor)"
        constraints = [
            models.UniqueConstraint(
                fields=["escopo", "nome", "categoria"],
                name="uq_caracteristica_valor_escopo_nome_categoria",
            )
        ]

    def __str__(self):
        return f"({self.get_escopo_display()}) {self.nome}: {self.categoria}"


# Compatibilidade escopo do catálogo <-> tipo de registro (validação das pontes)
ESCOPO_TIPO_COMPATIVEL = {
    EscopoCatalogo.ATRATIVOS: RegistroInventario.Tipo.ATRATIVO,
    EscopoCatalogo.MEIO_HOSPEDAGEM: RegistroInventario.Tipo.MEIO_HOSPEDAGEM,
    EscopoCatalogo.ALIMENTACAO: RegistroInventario.Tipo.MEIO_ALIMENTACAO_BEBIDA,
    EscopoCatalogo.AGENCIAS: RegistroInventario.Tipo.AGENCIA_TURISMO,
    EscopoCatalogo.ESPACOS_EVENTOS: RegistroInventario.Tipo.ESPACO_EVENTO,
    EscopoCatalogo.ORGANIZADORES: RegistroInventario.Tipo.ORGANIZADOR_EVENTO,
    EscopoCatalogo.ARTESANATO: RegistroInventario.Tipo.ARTESANATO,
}


class EstabelecimentoCaracteristica(models.Model):
    """Ponte N:M Estabelecimento <-> Caracteristica (assinala a opção)."""

    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE)
    caracteristica = models.ForeignKey(Caracteristica, on_delete=models.PROTECT)

    class Meta:
        db_table = "estabelecimento_caracteristica"
        verbose_name = "característica do estabelecimento"
        verbose_name_plural = "características do estabelecimento"
        constraints = [
            models.UniqueConstraint(
                fields=["estabelecimento", "caracteristica"],
                name="uq_estab_caracteristica",
            )
        ]

    def clean(self):
        if self.estabelecimento_id and self.caracteristica_id:
            esperado = ESCOPO_TIPO_COMPATIVEL.get(self.caracteristica.escopo)
            if esperado and self.estabelecimento.tipo != esperado:
                raise ValidationError(
                    "Característica do escopo "
                    f"'{self.caracteristica.get_escopo_display()}' não se aplica a "
                    f"um registro do tipo '{self.estabelecimento.get_tipo_display()}'."
                )

    def __str__(self):
        return f"{self.estabelecimento} -> {self.caracteristica}"


class Medicao(models.Model):
    """Ponte N:M com atributo: Estabelecimento <-> CaracteristicaValor + valor.

    Implementa a leitura do MER "Caracteristica_Valor" mantendo o valor
    NUMÉRICO (DECIMAL) para os cálculos dos boletins (Regra 1.2).
    """

    estabelecimento = models.ForeignKey(Estabelecimento, on_delete=models.CASCADE)
    metrica = models.ForeignKey(CaracteristicaValor, on_delete=models.PROTECT)
    valor = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "medicao"
        verbose_name = "medição"
        verbose_name_plural = "medições"
        constraints = [
            models.UniqueConstraint(
                fields=["estabelecimento", "metrica"],
                name="uq_medicao_estab_metrica",
            )
        ]

    def clean(self):
        if self.estabelecimento_id and self.metrica_id:
            esperado = ESCOPO_TIPO_COMPATIVEL.get(self.metrica.escopo)
            if esperado and self.estabelecimento.tipo != esperado:
                raise ValidationError(
                    f"Métrica do escopo '{self.metrica.get_escopo_display()}' não se "
                    f"aplica a um registro do tipo '{self.estabelecimento.get_tipo_display()}'."
                )

    def __str__(self):
        return f"{self.estabelecimento} | {self.metrica} = {self.valor}"


# =============================================================================
# 5. INDICADORES ODS (Seção 5) — ancorados na RAIZ (Guia e RHC também têm ODS)
# =============================================================================


class IndicadorODS(models.Model):
    """Catálogo de indicadores ODS (Regra 1.4 / Seção 5.1).

    Uma única tabela de catálogo + uma ponte substituem ODS_quali e
    ODS_quant do MER: `natureza` distingue os dois casos, e a ponte
    `RegistroODS` carrega `valor` apenas quando quantitativo. Eixo e
    ODS ficam normalizados num lugar só.
    """

    class Natureza(models.TextChoices):
        QUALITATIVO = "quali", "Qualitativo (booleano — a linha existir = Sim)"
        QUANTITATIVO = "quant", "Quantitativo (exige valor)"

    eixo = models.PositiveSmallIntegerField(help_text="Eixo do indicador (1 ou 2).")
    ods = models.PositiveSmallIntegerField(help_text="Número do ODS (ex.: 3, 5, 7, 12).")
    descricao = models.CharField(max_length=255)
    natureza = models.CharField(max_length=5, choices=Natureza.choices)

    class Meta:
        db_table = "indicador_ods"
        verbose_name = "indicador ODS"
        verbose_name_plural = "indicadores ODS"
        constraints = [
            models.UniqueConstraint(
                fields=["eixo", "ods", "descricao"], name="uq_indicador_ods"
            )
        ]

    def __str__(self):
        return f"Eixo {self.eixo} — ODS {self.ods}: {self.descricao}"


class RegistroODS(models.Model):
    """Ponte registro do inventário <-> indicador ODS.

    Qualitativo: a existência da linha significa "Sim" (mesmo padrão do
    Cadastur derivado). Quantitativo: `valor` obrigatório (ex.: % de
    mulheres em liderança, 0–100).
    """

    registro = models.ForeignKey(
        RegistroInventario, on_delete=models.CASCADE, related_name="indicadores_ods"
    )
    indicador = models.ForeignKey(
        IndicadorODS, on_delete=models.PROTECT, related_name="registros"
    )
    valor = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    class Meta:
        db_table = "registro_ods"
        verbose_name = "ODS do registro"
        verbose_name_plural = "ODS dos registros"
        constraints = [
            models.UniqueConstraint(
                fields=["registro", "indicador"], name="uq_registro_ods"
            )
        ]

    def clean(self):
        if self.indicador_id:
            quant = self.indicador.natureza == IndicadorODS.Natureza.QUANTITATIVO
            if quant and self.valor is None:
                raise ValidationError("Indicador quantitativo exige valor.")
            if not quant and self.valor is not None:
                raise ValidationError(
                    "Indicador qualitativo não recebe valor — a existência da linha já significa 'Sim'."
                )

    def __str__(self):
        sufixo = f" = {self.valor}" if self.valor is not None else ""
        return f"{self.registro} | {self.indicador}{sufixo}"


# =============================================================================
# 6. ESPECIALIZAÇÕES DE ESTABELECIMENTO (Seções 2–11 e 13)
# =============================================================================


class MeioHospedagem(Estabelecimento):
    """Seção 4. Cadastur obrigatório. `classificacao` herdada = tipo de
    hospedagem. Check-in/checkout têm semântica própria e NÃO usam
    horario_atendimento (Regra 2.3)."""

    TIPO_REGISTRO = RegistroInventario.Tipo.MEIO_HOSPEDAGEM
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OBRIGATORIO

    aceita_pesquisas = models.BooleanField(
        default=False, help_text="Aceita participar das pesquisas mensais (ocupação)."
    )
    telefone_pesquisa = models.CharField(max_length=20, blank=True)
    email_pesquisa = models.EmailField(blank=True)
    data_abertura = models.DateField(null=True, blank=True)
    inventario = models.TextField(blank=True)
    # Divergência consciente do doc 4.2 — ver docstring do módulo (item 6):
    uh_total = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="UHs (total)"
    )
    uh_pcd = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="UHs PCD"
    )
    leitos = models.PositiveIntegerField(null=True, blank=True)
    funcionamento_24h = models.BooleanField(default=False)
    horario_checkin = models.TimeField(null=True, blank=True)
    horario_checkout = models.TimeField(null=True, blank=True)
    reservas = models.CharField(
        max_length=255, blank=True, help_text="Como reservar (canal/observações)."
    )

    class Meta:
        db_table = "meio_hospedagem"
        verbose_name = "meio de hospedagem"
        verbose_name_plural = "meios de hospedagem"


class MeioAlimentacaoBebida(Estabelecimento):
    """Seção 6. Cadastur opcional."""

    TIPO_REGISTRO = RegistroInventario.Tipo.MEIO_ALIMENTACAO_BEBIDA
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OPCIONAL

    inicio_atividade = models.DateField(null=True, blank=True)
    estacionamento = models.BooleanField(default=False)
    especificacao_gastronomia = models.TextField(blank=True)
    observacao = models.TextField(blank=True)
    parque = models.BooleanField(
        default=False, help_text="Flag de especialização: MA de Parques."
    )

    class Meta:
        db_table = "meio_alimentacao_bebida"
        verbose_name = "meio de alimentação e bebidas"
        verbose_name_plural = "meios de alimentação e bebidas"


class AtrativoLazerEntretenimento(Estabelecimento):
    """Seção 3. Cadastur opcional. CNPJ herdado já é NULLABLE — atrativos
    públicos não têm (motivo da chave substituta)."""

    TIPO_REGISTRO = RegistroInventario.Tipo.ATRATIVO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OPCIONAL

    class Local(models.TextChoices):
        PONTO_HISTORICO = "ponto_historico", "Pontos Históricos"
        PUBLICO = "publico", "Atrativos Turísticos Públicos"
        PRIVADO = "privado", "Atrativos Turísticos Privados"

    class TipoAtrativo(models.TextChoices):
        ARQ_HISTORICA = "arq_historica", "Arquitetura histórica"
        ARQ_OFICIAL = "arq_oficial", "Arquitetura oficial"
        AREAS_VERDES = "areas_verdes", "Espaços livres/áreas verdes"
        OUTROS_RECREACAO = "outros_recreacao", "Outros espaços de recreação"
        INSTALACOES_ESPORTIVAS = "instalacoes_esportivas", "Instalações esportivas"
        MANIFESTACOES_FE = "manifestacoes_fe", "Manifestações de fé"
        CENTRO_CULTURAL = "centro_cultural", "Centro cultural"
        ATRATIVO_MONUMENTAL = "atrativo_monumental", "Atrativo monumental"
        INSTALACAO_CULTURAL = "instalacao_cultural", "Instalação cultural"
        OUTROS_EQUIPAMENTOS = "outros_equipamentos", "Outros equipamentos turísticos"
        ESPACOS_DIVERSAO = "espacos_diversao", "Espaços de diversão"
        PARQUE_AQUATICO = "parque_aquatico", "Parque aquático"
        PARQUE_TEMATICO = "parque_tematico", "Parque temático/diversões/lazer/gastronômico"

    local = models.CharField(max_length=20, choices=Local.choices, blank=True)
    tipo_atrativo = models.CharField(
        max_length=30, choices=TipoAtrativo.choices, blank=True
    )
    data_inicio_funcionamento = models.DateField(null=True, blank=True)
    estacionamento = models.BooleanField(default=False)
    informacoes_gerais = models.TextField(blank=True)
    destaque = models.BooleanField(default=False)

    class Meta:
        db_table = "atrativo_lazer_entretenimento"
        verbose_name = "atrativo, lazer e entretenimento"
        verbose_name_plural = "atrativos, lazer e entretenimento"


class EspacoEvento(Estabelecimento):
    """Seção 8. Cadastur opcional."""

    TIPO_REGISTRO = RegistroInventario.Tipo.ESPACO_EVENTO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OPCIONAL

    outras_regras = models.TextField(blank=True)
    descricao_espaco = models.TextField(blank=True)
    observacao = models.TextField(blank=True)

    class Meta:
        db_table = "espaco_evento"
        verbose_name = "espaço para eventos"
        verbose_name_plural = "espaços para eventos"


class AgenciaOperadoraTurismo(Estabelecimento):
    """Seção 7. Cadastur obrigatório."""

    TIPO_REGISTRO = RegistroInventario.Tipo.AGENCIA_TURISMO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OBRIGATORIO

    estacionamento = models.BooleanField(default=False)
    observacao = models.TextField(blank=True)
    destinos_inteligentes = models.BooleanField(default=False)
    inicio_atividade = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "agencia_operadora_turismo"
        verbose_name = "agência/operadora de turismo"
        verbose_name_plural = "agências/operadoras de turismo"


class OrganizadorServicoEvento(Estabelecimento):
    """Seção 10. Cadastur opcional."""

    TIPO_REGISTRO = RegistroInventario.Tipo.ORGANIZADOR_EVENTO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OPCIONAL

    class Atuacao(models.TextChoices):
        ORGANIZADOR = "organizador", "Organizador de Evento"
        SERVICO = "servico", "Serviço para Evento"

    atuacao = models.CharField(max_length=15, choices=Atuacao.choices, blank=True)
    destinos_inteligentes = models.BooleanField(default=False)
    forma_atendimento = models.TextField(blank=True)
    servicos_oferecidos = models.TextField(blank=True)
    observacao = models.TextField(blank=True)

    class Meta:
        db_table = "organizador_servico_evento"
        verbose_name = "organizador/serviço para eventos"
        verbose_name_plural = "organizadores/serviços para eventos"


class LocadoraVeiculoTransporte(Estabelecimento):
    """Seção 9. Cadastur obrigatório."""

    TIPO_REGISTRO = RegistroInventario.Tipo.LOCADORA_TRANSPORTE
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OBRIGATORIO

    class TipoLocadora(models.TextChoices):
        LOCADORA = "locadora", "Locadora"
        TRANSPORTADORA = "transportadora", "Transportadora Turística"

    tipo_locadora = models.CharField(
        max_length=15, choices=TipoLocadora.choices, blank=True
    )
    destinos_inteligentes = models.BooleanField(default=False)
    acessibilidade = models.BooleanField(default=False)

    class Meta:
        db_table = "locadora_veiculo_transporte"
        verbose_name = "locadora/transporte turístico"
        verbose_name_plural = "locadoras/transportes turísticos"


class Artesanato(Estabelecimento):
    """Seção 11. Cadastur opcional. ProdutoServico via FK no pai."""

    TIPO_REGISTRO = RegistroInventario.Tipo.ARTESANATO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OPCIONAL

    destino_inteligente = models.BooleanField(default=False)
    inventario = models.TextField(blank=True)

    class Meta:
        db_table = "artesanato"
        verbose_name = "artesanato e comércio diferenciado"
        verbose_name_plural = "artesanatos e comércios diferenciados"


# ----- Serviços de Apoio (Seção 13) -----


class Banco(Estabelecimento):
    """13.1 — tem atributos próprios, então mantém tabela própria."""

    TIPO_REGISTRO = RegistroInventario.Tipo.BANCO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.NAO_SE_APLICA

    principais_servicos = models.TextField(blank=True)
    caixas_fora_agencia = models.TextField(
        blank=True, verbose_name="Caixas eletrônicos fora da agência"
    )

    class Meta:
        db_table = "banco"
        verbose_name = "banco"
        verbose_name_plural = "bancos"


class TemploReligioso(Estabelecimento):
    """13.10 — horários de missa/culto usam horario_atendimento herdado."""

    TIPO_REGISTRO = RegistroInventario.Tipo.TEMPLO_RELIGIOSO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.NAO_SE_APLICA

    possibilidade_visitacao = models.BooleanField(default=False)
    como_funciona = models.TextField(blank=True)
    data_quermesse_eventos = models.TextField(blank=True)

    class Meta:
        db_table = "templo_religioso"
        verbose_name = "templo religioso"
        verbose_name_plural = "templos religiosos"


class ServicoSaude(Estabelecimento):
    """13.12 — horário de emergência tem semântica própria (Regra 2.3)."""

    TIPO_REGISTRO = RegistroInventario.Tipo.SERVICO_SAUDE
    CADASTUR_EXIGENCIA = ExigenciaCadastur.NAO_SE_APLICA

    principais_servicos = models.TextField(blank=True)
    outras_informacoes = models.TextField(blank=True)
    horarios_emergencia = models.TextField(
        blank=True, verbose_name="Horários de atendimento de emergência"
    )

    class Meta:
        db_table = "servico_saude"
        verbose_name = "serviço de saúde"
        verbose_name_plural = "serviços de saúde"


class ServicoApoio(Estabelecimento):
    """Consolida as 11 categorias de apoio SEM atributos próprios
    (refinamento sobre o MER: evita 11 tabelas vazias — o segmento vira
    o enum `tipo_servico`). `observacao` cobre o campo livre de
    Serviço de Segurança (13.13)."""

    TIPO_REGISTRO = RegistroInventario.Tipo.SERVICO_APOIO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.NAO_SE_APLICA

    class TipoServico(models.TextChoices):
        CABELEIREIRO_BARBEIRO = "cabeleireiro_barbeiro", "Cabeleireiro e Barbeiro"
        CLINICA_ODONTOLOGICA = "clinica_odontologica", "Clínica Odontológica"
        CLINICA_MEDICA = "clinica_medica", "Clínica Médica"
        CLINICA_VETERINARIA = "clinica_veterinaria", "Clínica Veterinária"
        EDUCACAO = "educacao", "Educação"
        FARMACIA = "farmacia", "Farmácia e Drogaria"
        LAVANDERIA = "lavanderia", "Lavanderia"
        POSTO_COMBUSTIVEL = "posto_combustivel", "Posto de Combustível"
        MECANICA = "mecanica", "Serviços Automotivos (Mecânica)"
        SERVICO_SEGURANCA = "servico_seguranca", "Serviço de Segurança"
        SUPERMERCADO = "supermercado", "Supermercado"

    tipo_servico = models.CharField(max_length=30, choices=TipoServico.choices)
    observacao = models.TextField(blank=True)

    class Meta:
        db_table = "servico_apoio"
        verbose_name = "serviço de apoio ao turista"
        verbose_name_plural = "serviços de apoio ao turista"

    def __str__(self):
        return f"{self.nome_fantasia} ({self.get_tipo_servico_display()})"


# =============================================================================
# 7. ENTIDADES INDEPENDENTES (Seção 12) — filhas diretas da RAIZ
# =============================================================================


class GuiaTurismo(RegistroInventario):
    """12.1 — pessoa física. Cadastur OBRIGATÓRIO via supertipo (o motivo
    central de a raiz existir acima de Estabelecimento)."""

    TIPO_REGISTRO = RegistroInventario.Tipo.GUIA_TURISMO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.OBRIGATORIO

    cpf = models.CharField(max_length=11, unique=True, validators=[validar_cpf])
    nome = models.CharField(max_length=255)
    categoria = models.CharField(max_length=120, blank=True)
    classificacao = models.CharField(max_length=120, blank=True)
    quantidade = models.PositiveIntegerField(null=True, blank=True)
    destinos_inteligentes = models.BooleanField(default=False)

    class Meta:
        db_table = "guia_turismo"
        verbose_name = "guia de turismo"
        verbose_name_plural = "guias de turismo"

    def __str__(self):
        return self.nome


class RHC(RegistroInventario):
    """12.2 — Registro Habitacional Complementar (imóveis de temporada)."""

    TIPO_REGISTRO = RegistroInventario.Tipo.RHC
    CADASTUR_EXIGENCIA = ExigenciaCadastur.NAO_SE_APLICA

    class TipoImovel(models.TextChoices):
        APARTAMENTO = "apartamento", "Apartamento"
        CASA = "casa", "Casa"
        CHALE = "chale", "Chalé"
        CONDOMINIO = "condominio_temporada", "Condomínio de temporada"
        OUTROS = "outros", "Outros"

    numeracao_rhc = models.CharField(max_length=30, unique=True)
    tipo_imovel = models.CharField(max_length=25, choices=TipoImovel.choices)
    denominacao_comercial = models.CharField(max_length=255, blank=True)
    nome_proprietario = models.CharField(max_length=255, blank=True)
    cpf_proprietario = models.CharField(
        max_length=11, blank=True, validators=[validar_cpf]
    )
    data_renovacao = models.DateField(null=True, blank=True)
    data_liberacao = models.DateField(null=True, blank=True)
    data_entrada = models.DateField(null=True, blank=True)
    numero_processo = models.CharField(max_length=40, blank=True)
    acessibilidade_pcd = models.BooleanField(default=False)
    quantidade_leitos = models.PositiveIntegerField(null=True, blank=True)
    capacidade_maxima = models.PositiveIntegerField(null=True, blank=True)
    quantidade = models.PositiveIntegerField(null=True, blank=True)
    observacoes = models.TextField(blank=True)

    class Meta:
        db_table = "rhc"
        verbose_name = "RHC"
        verbose_name_plural = "RHCs"

    def __str__(self):
        return f"RHC {self.numeracao_rhc} — {self.denominacao_comercial or self.nome_proprietario}"


class GrupoFolclorico(RegistroInventario):
    """12.3 — grupos culturais. O par (tipo_documento, documento) resolve
    o 'CNPJ_OU_CPF' do MER sem misturar dois domínios numa coluna ambígua."""

    TIPO_REGISTRO = RegistroInventario.Tipo.GRUPO_FOLCLORICO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.NAO_SE_APLICA

    class TipoDocumento(models.TextChoices):
        CPF = "cpf", "CPF"
        CNPJ = "cnpj", "CNPJ"

    nome = models.CharField(max_length=255)
    razao_social = models.CharField(max_length=255, blank=True)
    tipo_documento = models.CharField(max_length=4, choices=TipoDocumento.choices)
    documento = models.CharField(max_length=14)
    classificacao_grupo = models.CharField(max_length=120, blank=True)
    quantidade = models.PositiveIntegerField(null=True, blank=True)
    quantidade_participantes = models.PositiveIntegerField(null=True, blank=True)
    observacao = models.TextField(blank=True)

    class Meta:
        db_table = "grupo_folclorico"
        verbose_name = "grupo folclórico/parafolclórico"
        verbose_name_plural = "grupos folclóricos/parafolclóricos"
        constraints = [
            models.UniqueConstraint(
                fields=["tipo_documento", "documento"],
                name="uq_grupo_folclorico_documento",
            )
        ]

    def clean(self):
        tamanho = {"cpf": 11, "cnpj": 14}.get(self.tipo_documento)
        if tamanho and (not self.documento.isdigit() or len(self.documento) != tamanho):
            raise ValidationError(
                f"{self.get_tipo_documento_display()} deve ter {tamanho} dígitos numéricos."
            )

    def __str__(self):
        return self.nome


class TaxiAplicativo(RegistroInventario):
    """12.4 — táxi, mototáxi e aplicativo (veículo/motorista)."""

    TIPO_REGISTRO = RegistroInventario.Tipo.TAXI_APLICATIVO
    CADASTUR_EXIGENCIA = ExigenciaCadastur.NAO_SE_APLICA

    nome = models.CharField(max_length=255, verbose_name="Nome do taxista")
    empresa = models.CharField(max_length=255, blank=True)
    qtde_pontos = models.PositiveIntegerField(null=True, blank=True)
    qtde_veiculos = models.PositiveIntegerField(null=True, blank=True)
    credencial_alvara = models.CharField(max_length=60, blank=True)
    numero_registro = models.CharField(max_length=60, blank=True)
    placa = models.CharField(max_length=8, blank=True, validators=[validar_placa])
    ano_habilitacao = models.PositiveIntegerField(
        null=True, blank=True, validators=[validar_ano_habilitacao]
    )

    class Meta:
        db_table = "taxi_aplicativo"
        verbose_name = "táxi/mototáxi/aplicativo"
        verbose_name_plural = "táxis/mototáxis/aplicativos"

    def __str__(self):
        return f"{self.nome} ({self.placa or 's/ placa'})"


# =============================================================================
# 8. EVENTO PROGRAMADO E CONTROLE DE ACESSO DO TRADE
# =============================================================================


class EventoProgramado(models.Model):
    """Seção 2.2 — não é registro do inventário (sem Contato/Endereco).
    FK OPCIONAL para o Espaço de Evento onde ocorre."""

    nome = models.CharField(max_length=255)
    quantidade = models.PositiveIntegerField(
        null=True, blank=True, help_text="Público/quantidade estimada (planilha)."
    )
    data_realizacao = models.DateField(null=True, blank=True)
    descricao = models.TextField(blank=True)
    espaco = models.ForeignKey(
        EspacoEvento,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="eventos",
    )

    class Meta:
        db_table = "evento_programado"
        verbose_name = "evento programado"
        verbose_name_plural = "eventos programados"

    def __str__(self):
        return f"{self.nome} ({self.data_realizacao or 'data a definir'})"


class VinculoTrade(models.Model):
    """Requisito 2 (níveis de usuário): liga o usuário do portal do Trade
    aos estabelecimentos que ele pode editar. Administrador/Visualizador
    são Groups do Django (ver README). Um proprietário pode ter mais de
    um negócio — por isso N:M via esta tabela, e não FK no usuário."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vinculos_trade",
    )
    estabelecimento = models.ForeignKey(
        Estabelecimento, on_delete=models.CASCADE, related_name="responsaveis"
    )

    class Meta:
        db_table = "vinculo_trade"
        verbose_name = "vínculo do trade"
        verbose_name_plural = "vínculos do trade"
        constraints = [
            models.UniqueConstraint(
                fields=["usuario", "estabelecimento"], name="uq_vinculo_trade"
            )
        ]

    def __str__(self):
        return f"{self.usuario} -> {self.estabelecimento}"


# =============================================================================
# 9. MAPA DE ESPECIALIZAÇÃO (acessores da herança multi-tabela)
# =============================================================================

_T = RegistroInventario.Tipo
CAMINHO_FOLHA = {
    _T.MEIO_HOSPEDAGEM: ("estabelecimento", "meiohospedagem"),
    _T.MEIO_ALIMENTACAO_BEBIDA: ("estabelecimento", "meioalimentacaobebida"),
    _T.ATRATIVO: ("estabelecimento", "atrativolazerentretenimento"),
    _T.ESPACO_EVENTO: ("estabelecimento", "espacoevento"),
    _T.AGENCIA_TURISMO: ("estabelecimento", "agenciaoperadoraturismo"),
    _T.ORGANIZADOR_EVENTO: ("estabelecimento", "organizadorservicoevento"),
    _T.LOCADORA_TRANSPORTE: ("estabelecimento", "locadoraveiculotransporte"),
    _T.ARTESANATO: ("estabelecimento", "artesanato"),
    _T.BANCO: ("estabelecimento", "banco"),
    _T.TEMPLO_RELIGIOSO: ("estabelecimento", "temploreligioso"),
    _T.SERVICO_SAUDE: ("estabelecimento", "servicosaude"),
    _T.SERVICO_APOIO: ("estabelecimento", "servicoapoio"),
    _T.GUIA_TURISMO: ("guiaturismo",),
    _T.RHC: ("rhc",),
    _T.GRUPO_FOLCLORICO: ("grupofolclorico",),
    _T.TAXI_APLICATIVO: ("taxiaplicativo",),
}