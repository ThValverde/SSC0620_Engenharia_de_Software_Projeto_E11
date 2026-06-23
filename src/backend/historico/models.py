from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import User

class Pasta(models.Model):
    """
    Agrupador macro para organizar as buscas e relatórios.
    """
    nome = models.CharField(max_length=120, unique=True, help_text="Ex: Planejamento 2026")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pasta"
        verbose_name = "pasta"
        verbose_name_plural = "pastas"
        ordering = ['-criado_em']

    def __str__(self):
        return self.nome


class TagSegmento(models.Model):
    """
    As pílulas azuis para categorizar o relatório (Hotéis, Restaurantes, etc).
    Pode ser populado inicialmente via painel admin para manter o padrão.
    """
    nome = models.CharField(max_length=60, unique=True)

    class Meta:
        db_table = "tag_segmento"
        verbose_name = "tag de segmento"
        verbose_name_plural = "tags de segmento"

    def __str__(self):
        return self.nome


class Relatorio(models.Model):
    """
    Representa o "Cartão" na interface. Uma Busca Salva ou Relatório Gerencial
    que agrupa arquivos físicos e tags.
    """
    pasta = models.ForeignKey(
        Pasta, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="relatorios"
    )
    titulo = models.CharField(max_length=255, help_text="Ex: Projeção Carnaval 2026")
    quantidade_registros = models.PositiveIntegerField(
        null=True, 
        blank=True, 
        help_text="Opcional. Preenchido se vier do cruzamento de dados."
    )
    
    tags = models.ManyToManyField(TagSegmento, blank=True, related_name="relatorios")
    
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "relatorio"
        verbose_name = "relatório / busca salva"
        verbose_name_plural = "relatórios / buscas salvas"
        ordering = ['-criado_em']

    def __str__(self):
        return self.titulo


def diretorio_upload_arquivos(instance, filename):
    """
    Função auxiliar do Django para organizar as pastas no disco/nuvem.
    Salva o arquivo dentro de: uploads/relatorios/id_do_relatorio/nome_do_arquivo.ext
    """
    return f"uploads/relatorios/{instance.relatorio.id}/{filename}"


class ArquivoAnexo(models.Model):
    """
    O arquivo físico em si (PDF, Excel, PNG). Fica atrelado ao Cartão (Relatório).
    """
    relatorio = models.ForeignKey(
        Relatorio, 
        on_delete=models.CASCADE, 
        related_name="arquivos"
    )
    
    arquivo = models.FileField(upload_to=diretorio_upload_arquivos)
    
    nome_original = models.CharField(max_length=255, help_text="Nome real do arquivo enviado")
    tamanho_kb = models.FloatField(validators=[MinValueValidator(0.0)])
    enviado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "arquivo_anexo"
        verbose_name = "arquivo anexo"
        verbose_name_plural = "arquivos anexos"

    def __str__(self):
        return self.nome_original


def diretorio_upload_importacao(instance, filename):
    return f"uploads/importacoes/{instance.fonte}/{filename}"


class HistoricoImportacao(models.Model):
    class Status(models.TextChoices):
        PROCESSADO = "processado", "Processado"
        FALHOU = "falhou", "Falhou"

    arquivo = models.FileField(upload_to=diretorio_upload_importacao)
    nome = models.CharField(max_length=255)
    fonte = models.CharField(max_length=120)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROCESSADO)
    autor = models.ForeignKey(User, on_delete=models.PROTECT, related_name="historico_importacoes")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "historico_importacao"
        verbose_name = "histórico de importação"
        verbose_name_plural = "históricos de importação"
        ordering = ["-criado_em", "-id"]

    def __str__(self):
        return self.nome