from rest_framework import serializers

# Importando os modelos do arquivo models.py da mesma pasta (.)
from .models import (
    Endereco,
    Contato,
    RedeSocial,
    Pagamento,
    Caracteristica,       
    CaracteristicaValor,  
    IndicadorODS,         
    MeioHospedagem,
    MeioAlimentacaoBebida,
    AtrativoLazerEntretenimento,
    EspacoEvento,
    AgenciaOperadoraTurismo,
    OrganizadorServicoEvento,
    LocadoraVeiculoTransporte,
    Artesanato,
    Banco,
    TemploReligioso,
    ServicoSaude,
    ServicoApoio,
    GuiaTurismo,
    RHC,
    GrupoFolclorico,
    TaxiAplicativo
)

# ==========================================
# 1. SERIALIZERS DE SUPORTE (Aninhados)
# ==========================================

class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        exclude = ['registro']

class ContatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contato
        exclude = ['registro']

class RedeSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = RedeSocial
        exclude = ['registro']

# ==========================================
# 2. SERIALIZER PAI (Classe Base)
# ==========================================

class RegistroBaseSerializer(serializers.ModelSerializer):
    """
    Serializer base que lida automaticamente com Endereço e Contatos
    para qualquer filha de RegistroInventario.
    """
    endereco = EnderecoSerializer(required=False, allow_null=True)
    contatos = ContatoSerializer(many=True, required=False)
    redes_sociais = RedeSocialSerializer(many=True, required=False) 


    def create(self, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        contatos_data = validated_data.pop('contatos', [])
        redes_data = validated_data.pop('redes_sociais', []) 
        formas_pagamento_data = validated_data.pop('formas_pagamento', None)

        instancia = super().create(validated_data)

        if endereco_data:
            Endereco.objects.create(registro=instancia, **endereco_data)

        for contato_data in contatos_data:
            Contato.objects.create(registro=instancia, **contato_data)

        for rede_data in redes_data:                                 
            RedeSocial.objects.create(registro=instancia, **rede_data)
            
        if formas_pagamento_data is not None:
            instancia.formas_pagamento.set(formas_pagamento_data)

        return instancia

    def update(self, instance, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        contatos_data = validated_data.pop('contatos', None)
        redes_data = validated_data.pop('redes_sociais', None)
        formas_pagamento_data = validated_data.pop('formas_pagamento', None)

        instancia = super().update(instance, validated_data)

        if endereco_data is not None:
            if hasattr(instancia, 'endereco'):
                for attr, value in endereco_data.items():
                    setattr(instancia.endereco, attr, value)
                instancia.endereco.save()
            else:
                Endereco.objects.create(registro=instancia, **endereco_data)

        if contatos_data is not None:
            instancia.contatos.all().delete()
            for contato_data in contatos_data:
                Contato.objects.create(registro=instancia, **contato_data)

        if redes_data is not None:                                    
            instancia.redes_sociais.all().delete()
            for rede_data in redes_data:
                RedeSocial.objects.create(registro=instancia, **rede_data)
                
        if formas_pagamento_data is not None:
            instancia.formas_pagamento.set(formas_pagamento_data)

        return instancia

# ==========================================
# 3. SERIALIZERS DE CATÁLOGO
# ==========================================

class CaracteristicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caracteristica
        fields = '__all__'

class CaracteristicaValorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaracteristicaValor
        fields = '__all__'

class ODSSerializer(serializers.ModelSerializer):
    class Meta:
        model = IndicadorODS
        fields = '__all__'

class PagamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pagamento
        fields = '__all__'

# ==========================================
# 4. SERIALIZERS PRINCIPAIS (Filhas)
# ==========================================

class MeioHospedagemSerializer(RegistroBaseSerializer):
    class Meta:
        model = MeioHospedagem
        fields = '__all__'
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Limita o visualizador HTML do navegador a exibir APENAS características de hospedagem
        if 'caracteristicas' in self.fields:
            self.fields['caracteristicas'].queryset = Caracteristica.objects.filter(
                escopo=EscopoCatalogo.MEIO_HOSPEDAGEM
            )

class AtrativoSerializer(RegistroBaseSerializer):
    class Meta:
        model = AtrativoLazerEntretenimento
        fields = '__all__'

class MeioAlimentacaoBebidaSerializer(RegistroBaseSerializer):
    class Meta:
        model = MeioAlimentacaoBebida
        fields = '__all__'

class EspacoEventoSerializer(RegistroBaseSerializer):
    class Meta:
        model = EspacoEvento
        fields = '__all__'

class AgenciaOperadoraTurismoSerializer(RegistroBaseSerializer):
    class Meta:
        model = AgenciaOperadoraTurismo
        fields = '__all__'

class OrganizadorServicoEventoSerializer(RegistroBaseSerializer):
    class Meta:
        model = OrganizadorServicoEvento
        fields = '__all__'

class LocadoraVeiculoTransporteSerializer(RegistroBaseSerializer):
    class Meta:
        model = LocadoraVeiculoTransporte
        fields = '__all__'

class ArtesanatoSerializer(RegistroBaseSerializer):
    class Meta:
        model = Artesanato
        fields = '__all__'

class BancoSerializer(RegistroBaseSerializer):
    class Meta:
        model = Banco
        fields = '__all__'

class TemploReligiosoSerializer(RegistroBaseSerializer):
    class Meta:
        model = TemploReligioso
        fields = '__all__'

class ServicoSaudeSerializer(RegistroBaseSerializer):
    class Meta:
        model = ServicoSaude
        fields = '__all__'

class ServicoApoioSerializer(RegistroBaseSerializer):
    class Meta:
        model = ServicoApoio
        fields = '__all__'

class GuiaTurismoSerializer(RegistroBaseSerializer):
    class Meta:
        model = GuiaTurismo
        fields = '__all__'

class RHCSerializer(RegistroBaseSerializer):
    class Meta:
        model = RHC
        fields = '__all__'

class GrupoFolcloricoSerializer(RegistroBaseSerializer):
    class Meta:
        model = GrupoFolclorico
        fields = '__all__'

class TaxiAplicativoSerializer(RegistroBaseSerializer):
    class Meta:
        model = TaxiAplicativo
        fields = '__all__'