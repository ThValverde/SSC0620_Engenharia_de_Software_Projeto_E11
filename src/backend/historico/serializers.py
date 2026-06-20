from rest_framework import serializers
from .models import Pasta, TagSegmento, Relatorio, ArquivoAnexo

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