from django.contrib.auth.models import User, Group
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
    TaxiAplicativo,
    Estabelecimento,
    VinculoTrade,
)

#==========================================
# 0. SERIALIZERS DE AUTENTICAÇÃO E AUTORIZAÇÃO
#==========================================
class CadastroUsuarioHierarquicoSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    tipo_usuario = serializers.ChoiceField(choices=['adm_oto', 'usuario_oto', 'trade'])
    
    # Campos obrigatórios caso o tipo seja 'trade'
    estabelecimento_id = serializers.IntegerField(required=False, allow_null=True)
    nivel_permissao = serializers.CharField(required=False, allow_blank=True, default='Operacional')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este e-mail já está cadastrado no sistema.")
        return value

    def validate(self, data):
        request = self.context.get('request')
        user_logado = request.user
        tipo_a_criar = data['tipo_usuario']

        # 1. Se quem está tentando cadastrar for o Superuser do Django (Via terminal ou painel admin)
        if user_logado.is_superuser:
            # O Superuser tem permissão total para criar qualquer nível
            return data

        # Mapeamento de grupos do usuário logado
        is_adm_oto = user_logado.groups.filter(name='Secretaria_Admin').exists()
        is_user_oto = user_logado.groups.filter(name='Secretaria_Staff').exists()

        # 2. Regra para criar um Administrador do Observatório (Adm OTO)
        if tipo_a_criar == 'adm_oto':
            # APENAS o Admin do Django (Superuser) pode criar um Adm OTO
            if not user_logado.is_superuser:
                raise serializers.ValidationError(
                    {"permissao": "Apenas administradores centrais de TI (Superuser Django) podem criar um Administrador do OTO."}
                )

        # 3. Regra para criar um Usuário do Observatório (Usuário OTO)
        elif tipo_a_criar == 'usuario_oto':
            # APENAS Superuser ou Adm OTO podem criar um Usuário OTO comum
            if not is_adm_oto:
                raise serializers.ValidationError(
                    {"permissao": "Você precisa ser um Administrador do OTO para cadastrar um usuário da secretaria."}
                )

        # 4. Regra para criar um Usuário do Trade (Empresários/Hoteleiros)
        elif tipo_a_criar == 'trade':
            # Tanto o Adm OTO quanto o Usuário OTO podem cadastrar o Trade
            if not is_adm_oto and not is_user_oto:
                raise serializers.ValidationError(
                    {"permissao": "Usuários do Trade não possuem permissão para cadastrar outras contas."}
                )
            
            if not data.get('estabelecimento_id'):
                raise serializers.ValidationError(
                    {"estabelecimento_id": "É obrigatório vincular este usuário a um estabelecimento do Trade Turístico."}
                )

        return data

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        tipo_usuario = validated_data['tipo_usuario']
        
        # Criação do usuário padrão do Django
        user = User.objects.create_user(username=email, email=email, password=password)

        if tipo_usuario == 'adm_oto':
            grupo, _ = Group.objects.get_or_create(name='Secretaria_Admin')
            user.groups.add(grupo)
            
        elif tipo_usuario == 'usuario_oto':
            grupo, _ = Group.objects.get_or_create(name='Secretaria_Staff')
            user.groups.add(grupo)
            
        elif tipo_usuario == 'trade':
            est_id = validated_data['estabelecimento_id']
            nivel = validated_data['nivel_permissao']
            estabelecimento = Estabelecimento.objects.get(pk=est_id)
            
            # Cria o vínculo na tabela intermediária do banco
            VinculoTrade.objects.create(
                usuario=user,
                estabelecimento=estabelecimento,
                nivel_permissao=nivel
            )

        return user

class CustomUserDetailsSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name' 
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_superuser', 'groups', 'first_name', 'last_name')

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


# ==========================================
# 5. SERIALIZER DE CADASTRO DE USUÁRIOS (RBAC)
# ==========================================

class CadastroUsuarioSerializer(serializers.Serializer):
    """
    Serializer para criação de usuários com controle estrito de RBAC.
    Previne escalonamento de privilégios aplicando regras de negócio
    no método validate() e criando os vínculos apropriados no create().
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    tipo_usuario = serializers.ChoiceField(
        choices=['admin_oto', 'usuario_oto', 'trade'],
        help_text='Tipo de usuário: admin_oto (Admin OTO), usuario_oto (Staff OTO), trade (Trade Partner)'
    )
    estabelecimento_id = serializers.IntegerField(required=False, allow_null=True)
    nivel_permissao = serializers.CharField(
        required=False,
        allow_null=True,
        help_text='Nível de permissão para usuários Trade: admin, editor ou visualizador'
    )

    def validate(self, data):
        """
        Aplicar regras RBAC para prevenir escalonamento de privilégios:
        - admin_oto: apenas superuser pode criar
        - usuario_oto: apenas superuser ou Secretaria_Admin pode criar
        - trade: superuser, Secretaria_Admin ou Secretaria_Staff podem criar (obrigatório estabelecimento_id)
        """
        from django.contrib.auth.models import User, Group
        from rest_framework.exceptions import PermissionDenied, ValidationError

        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise PermissionDenied('Usuário não autenticado.')

        current_user = request.user
        tipo_usuario = data.get('tipo_usuario')

        # Regra 1: admin_oto - apenas superuser pode criar
        if tipo_usuario == 'admin_oto':
            if not current_user.is_superuser:
                raise PermissionDenied(
                    'Apenas superuser pode criar usuários do tipo admin_oto.'
                )

        # Regra 2: usuario_oto - apenas superuser ou Secretaria_Admin
        elif tipo_usuario == 'usuario_oto':
            is_admin = current_user.groups.filter(name='Secretaria_Admin').exists()
            if not (current_user.is_superuser or is_admin):
                raise PermissionDenied(
                    'Apenas superuser ou membros de Secretaria_Admin podem criar usuários do tipo usuario_oto.'
                )

        # Regra 3: trade - superuser, Secretaria_Admin ou Secretaria_Staff
        elif tipo_usuario == 'trade':
            is_admin = current_user.groups.filter(name='Secretaria_Admin').exists()
            is_staff = current_user.groups.filter(name='Secretaria_Staff').exists()
            if not (current_user.is_superuser or is_admin or is_staff):
                raise PermissionDenied(
                    'Apenas superuser, Secretaria_Admin ou Secretaria_Staff podem criar usuários do tipo trade.'
                )
            
            # Validar que estabelecimento_id foi fornecido para trade
            if not data.get('estabelecimento_id'):
                raise ValidationError({
                    'estabelecimento_id': 'Este campo é obrigatório para usuários do tipo trade.'
                })

        return data

    def create(self, validated_data):
        """
        Criar usuário e associá-lo aos grupos e vínculos apropriados:
        - admin_oto: adiciona ao grupo Secretaria_Admin, é_staff e is_superuser
        - usuario_oto: adiciona ao grupo Secretaria_Staff, é_staff
        - trade: cria VinculoTrade com o estabelecimento e nível de permissão
        """
        from django.contrib.auth.models import User, Group
        from .models import Estabelecimento, VinculoTrade

        email = validated_data['email']
        password = validated_data['password']
        tipo_usuario = validated_data['tipo_usuario']
        estabelecimento_id = validated_data.get('estabelecimento_id')
        nivel_permissao = validated_data.get('nivel_permissao', 'visualizador')

        # Criar usuário
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        # Garantir que os grupos existem (usar get_or_create)
        admin_oto_group, _ = Group.objects.get_or_create(name='Secretaria_Admin')
        staff_oto_group, _ = Group.objects.get_or_create(name='Secretaria_Staff')

        # Adicionar ao grupo apropriado e configurar permissões de staff
        if tipo_usuario == 'admin_oto':
            user.groups.add(admin_oto_group)
            user.is_staff = True
            user.is_superuser = False
            user.save()

        elif tipo_usuario == 'usuario_oto':
            user.groups.add(staff_oto_group)
            user.is_staff = True
            user.is_superuser = False
            user.save()

        elif tipo_usuario == 'trade':
            # Buscar o estabelecimento
            try:
                estabelecimento = Estabelecimento.objects.get(id=estabelecimento_id)
            except Estabelecimento.DoesNotExist:
                user.delete()  # Desfazer criação do usuário se estabelecimento não existe
                raise serializers.ValidationError({
                    'estabelecimento_id': f'Estabelecimento com ID {estabelecimento_id} não existe.'
                })

            # Criar VinculoTrade
            VinculoTrade.objects.create(
                usuario=user,
                estabelecimento=estabelecimento,
                nivel_permissao=nivel_permissao
            )

        return user