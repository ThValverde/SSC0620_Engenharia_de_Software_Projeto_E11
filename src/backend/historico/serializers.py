from rest_framework import serializers
from .models import Pasta, TagSegmento, Relatorio, ArquivoAnexo, HistoricoImportacao

class PastaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pasta
        fields = '__all__'

class TagSegmentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagSegmento
        fields = '__all__'

class ArquivoAnexoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArquivoAnexo
        fields = '__all__'
        read_only_fields = ['tamanho_kb', 'nome_original', 'enviado_em']

    def create(self, validated_data):
        arquivo = validated_data.get('arquivo')
        if arquivo:
            validated_data['nome_original'] = arquivo.name
            validated_data['tamanho_kb'] = round(arquivo.size / 1024, 2)
            
        return super().create(validated_data)

class RelatorioSerializer(serializers.ModelSerializer):
    arquivos = ArquivoAnexoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Relatorio
        fields = '__all__'


class HistoricoImportacaoSerializer(serializers.ModelSerializer):
    autor_nome = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    importado_em = serializers.DateTimeField(source="criado_em", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = HistoricoImportacao
        fields = (
            "id",
            "arquivo",
            "nome",
            "fonte",
            "status",
            "status_label",
            "autor_nome",
            "importado_em",
            "download_url",
        )
        read_only_fields = ("autor_nome", "importado_em", "download_url", "status_label")

    def get_autor_nome(self, obj):
        if obj.autor.email:
            return obj.autor.email
        return obj.autor.username

    def get_download_url(self, obj):
        request = self.context.get("request")
        if not obj.arquivo:
            return None
        url = obj.arquivo.url
        return request.build_absolute_uri(url) if request else url

    def create(self, validated_data):
        request = self.context.get("request")
        arquivo = validated_data.get("arquivo")
        if arquivo and not validated_data.get("nome"):
            validated_data["nome"] = arquivo.name
        if request and request.user and request.user.is_authenticated:
            validated_data["autor"] = request.user
        return super().create(validated_data)