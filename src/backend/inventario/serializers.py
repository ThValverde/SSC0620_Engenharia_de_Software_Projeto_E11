from django.contrib.auth.models import User, Group
from rest_framework import serializers

# Importando os modelos do arquivo models.py da mesma pasta (.)
from .models import (
    Endereco,
    Contato,
    RedeSocial,
    Cadastur,
    Pagamento,
    EscopoCatalogo,
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
    RegistroODS,
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


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    groups = serializers.SlugRelatedField(
        many=True,
        slug_field='name',
        queryset=Group.objects.all(),
        required=False,
    )

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'is_staff',
            'is_superuser',
            'groups',
            'password',
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        Group.objects.get_or_create(name='Secretaria_Admin')
        Group.objects.get_or_create(name='Secretaria_Staff')

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if not request.user.is_superuser and data.get('is_superuser'):
                raise serializers.ValidationError({
                    'is_superuser': 'Somente o superuser Django pode criar contas superuser.'
                })
        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        groups = validated_data.pop('groups', [])

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save()
        user.groups.set(groups)
        user.is_staff = user.is_superuser or user.groups.filter(name__in=['Secretaria_Admin', 'Secretaria_Staff']).exists()
        user.save(update_fields=['is_staff'])
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        groups = validated_data.pop('groups', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        instance.is_staff = instance.is_superuser or instance.groups.filter(name__in=['Secretaria_Admin', 'Secretaria_Staff']).exists()
        instance.save(update_fields=['is_staff'])
        return instance


class TradeUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    estabelecimento_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    nivel_permissao = serializers.ChoiceField(
        choices=['admin', 'editor', 'visualizador'],
        required=False,
        default='visualizador',
    )
    last_login = serializers.DateTimeField(read_only=True)
    grupos = serializers.SerializerMethodField()
    estabelecimento = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'last_login',
            'grupos',
            'estabelecimento',
            'estabelecimento_id',
            'nivel_permissao',
            'password',
        )

    def get_grupos(self, obj):
        return list(obj.groups.values_list('name', flat=True))

    def get_estabelecimento(self, obj):
        vinculo = obj.vinculos_trade.select_related('estabelecimento').first()
        if not vinculo:
            return None

        estabelecimento = vinculo.estabelecimento
        return {
            'id': estabelecimento.id,
            'nome_fantasia': getattr(estabelecimento, 'nome_fantasia', '') or '',
            'razao_social': getattr(estabelecimento, 'razao_social', '') or '',
            'cnpj': getattr(estabelecimento, 'cnpj', '') or '',
            'tipo': estabelecimento.tipo,
            'endpoint': {
                'meio_hospedagem': 'hospedagens',
                'meio_alimentacao_bebida': 'alimentacao',
                'atrativo': 'atrativos',
                'espaco_evento': 'espacos-eventos',
                'agencia_turismo': 'agencias',
                'organizador_evento': 'organizadores-eventos',
                'locadora_transporte': 'locadoras-transporte',
                'artesanato': 'artesanato',
                'banco': 'bancos',
                'templo_religioso': 'templos',
                'servico_saude': 'saude',
                'servico_apoio': 'apoio',
            }.get(estabelecimento.tipo, ''),
            'nivel_permissao': vinculo.nivel_permissao,
        }

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if not request.user.is_superuser and data.get('is_superuser'):
                raise serializers.ValidationError({
                    'is_superuser': 'Somente o superuser Django pode criar contas superuser.'
                })
        return data

    def _sync_groups(self, user, groups):
        if user.is_superuser:
            user.groups.clear()
            return

        if groups is None:
            return

        user.groups.set(groups)

    def _normalize_login_identity(self, validated_data):
        email = (validated_data.get('email') or '').strip()
        username = (validated_data.get('username') or '').strip()
        if not email and not username:
            raise serializers.ValidationError({
                'email': 'Informe um email para o usuário trade.'
            })

        validated_data['username'] = email or username

    def create(self, validated_data):
        self._normalize_login_identity(validated_data)
        password = validated_data.pop('password', None)
        estabelecimento_id = validated_data.pop('estabelecimento_id', None)
        nivel_permissao = validated_data.pop('nivel_permissao', 'visualizador')

        if not estabelecimento_id:
            raise serializers.ValidationError({
                'estabelecimento_id': 'É obrigatório vincular este usuário a um estabelecimento.'
            })

        try:
            estabelecimento = Estabelecimento.objects.get(pk=estabelecimento_id)
        except Estabelecimento.DoesNotExist:
            raise serializers.ValidationError({
                'estabelecimento_id': f'Estabelecimento com ID {estabelecimento_id} não existe.'
            })

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.is_staff = False
        user.is_superuser = False
        user.save()

        VinculoTrade.objects.create(
            usuario=user,
            estabelecimento=estabelecimento,
            nivel_permissao=nivel_permissao,
        )
        return user

    def update(self, instance, validated_data):
        self._normalize_login_identity(validated_data)
        password = validated_data.pop('password', None)
        estabelecimento_id = validated_data.pop('estabelecimento_id', None)
        nivel_permissao = validated_data.pop('nivel_permissao', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if estabelecimento_id is not None or nivel_permissao is not None:
            vinculo = instance.vinculos_trade.select_related('estabelecimento').first()
            if not vinculo:
                if not estabelecimento_id:
                    raise serializers.ValidationError({
                        'estabelecimento_id': 'É obrigatório informar um estabelecimento.'
                    })
                try:
                    estabelecimento = Estabelecimento.objects.get(pk=estabelecimento_id)
                except Estabelecimento.DoesNotExist:
                    raise serializers.ValidationError({
                        'estabelecimento_id': f'Estabelecimento com ID {estabelecimento_id} não existe.'
                    })
                VinculoTrade.objects.create(
                    usuario=instance,
                    estabelecimento=estabelecimento,
                    nivel_permissao=nivel_permissao or 'visualizador',
                )
            else:
                if estabelecimento_id is not None:
                    try:
                        vinculo.estabelecimento = Estabelecimento.objects.get(pk=estabelecimento_id)
                    except Estabelecimento.DoesNotExist:
                        raise serializers.ValidationError({
                            'estabelecimento_id': f'Estabelecimento com ID {estabelecimento_id} não existe.'
                        })
                if nivel_permissao is not None:
                    vinculo.nivel_permissao = nivel_permissao
                vinculo.save()

        return instance


class TradePortalEnderecoSerializer(serializers.Serializer):
    cep = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    rua = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    numero = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    bairro = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    regiao = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    latitude = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(required=False, allow_null=True, max_digits=9, decimal_places=6)


class TradePortalContatoSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    telefone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    cargo = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class TradePortalCadasturSerializer(serializers.Serializer):
    ativo = serializers.BooleanField(required=False)
    numero = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vencimento = serializers.DateField(required=False, allow_null=True)


class TradePortalInfraestruturaSerializer(serializers.Serializer):
    uh_total = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    leitos = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    capacidade_maxima = serializers.IntegerField(required=False, allow_null=True, min_value=0)


class TradePortalMaoDeObraSerializer(serializers.Serializer):
    qtde_funcionarios_fixos = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    qtde_funcionarios_temporarios = serializers.IntegerField(required=False, allow_null=True, min_value=0)


class ODSStateField(serializers.Field):
    def get_attribute(self, instance):
        return instance

    def to_representation(self, instance):
        return self.parent._serialize_ods_state(instance)

    def to_internal_value(self, data):
        if data is None:
            return None

        if isinstance(data, dict):
            return self.parent._normalize_legacy_ods_payload(data)

        if not isinstance(data, list):
            raise serializers.ValidationError(
                "A sustentabilidade ODS deve ser informada como uma lista de itens."
            )

        normalized = []
        for item in data:
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    "Cada item de sustentabilidade ODS deve ser um objeto."
                )

            indicador_id = item.get("id")
            try:
                indicador_id = int(indicador_id)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    "Cada item de sustentabilidade ODS precisa de um id numérico."
                )

            if not IndicadorODS.objects.filter(pk=indicador_id).exists():
                raise serializers.ValidationError(
                    f"Indicador ODS com ID {indicador_id} não existe."
                )

            normalized.append({
                "id": indicador_id,
                "ativo": bool(item.get("ativo", False)),
                "valor": item.get("valor", None),
            })

        return normalized


class ODSStateMixin:
    sustentabilidade = ODSStateField(required=False)

    def _ods_queryset(self):
        return IndicadorODS.objects.all().order_by('eixo', 'ods', 'id')

    def _legacy_ods_indicator(self, key):
        cfg = {
            'acessibilidade_pcd': {
                'ods': None,
                'keywords': ('pcd', 'acessibilidade'),
            },
            'mulheres_lideranca': {
                'ods': 5,
                'keywords': ('mulher', 'lider'),
            },
            'gestao_residuos': {
                'ods': 12,
                'keywords': ('residu', 'resíduo', 'residuo'),
            },
            'fontes_renovaveis': {
                'ods': 7,
                'keywords': ('renov', 'energia'),
            },
        }.get(key)
        if not cfg:
            return None

        qs = IndicadorODS.objects.all().order_by('id')
        if cfg['ods'] is not None:
            qs = qs.filter(ods=cfg['ods'])

        for keyword in cfg['keywords']:
            match = qs.filter(descricao__icontains=keyword).first()
            if match:
                return match
        return qs.first()

    def _normalize_legacy_ods_payload(self, data):
        normalized = []
        for key, value in data.items():
            indicator = self._legacy_ods_indicator(key)
            if not indicator:
                continue

            normalized.append({
                "id": indicator.id,
                "ativo": bool(value),
                "valor": 100 if bool(value) and indicator.natureza == IndicadorODS.Natureza.QUANTITATIVO else None,
            })
        return normalized

    def _serialize_ods_state(self, instance):
        existing = {
            registro.indicador_id: registro
            for registro in instance.indicadores_ods.select_related('indicador').all()
        }
        payload = []
        for indicator in self._ods_queryset():
            registro = existing.get(indicator.id)
            payload.append({
                "id": indicator.id,
                "eixo": indicator.eixo,
                "ods": indicator.ods,
                "descricao": indicator.descricao,
                "natureza": indicator.natureza,
                "ativo": registro is not None,
                "valor": registro.valor if registro else None,
            })
        return payload

    def _sync_ods_state(self, instance, sustentabilidade_data):
        if sustentabilidade_data is None:
            return

        existing = {
            registro.indicador_id: registro
            for registro in instance.indicadores_ods.select_related('indicador').all()
        }
        entries = {item["id"]: item for item in sustentabilidade_data}
        for indicator in self._ods_queryset():
            entry = entries.get(indicator.id)
            registro = existing.get(indicator.id)

            if not entry or not entry.get("ativo"):
                if registro:
                    registro.delete()
                continue

            valor = entry.get("valor")
            if indicator.natureza == IndicadorODS.Natureza.QUANTITATIVO:
                if valor in (None, ""):
                    valor = registro.valor if registro and registro.valor is not None else 100
            else:
                valor = None

            RegistroODS.objects.update_or_create(
                registro=instance,
                indicador=indicator,
                defaults={"valor": valor},
            )


class TradePortalMeuEstabelecimentoSerializer(ODSStateMixin, serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    tipo = serializers.CharField(read_only=True)
    tipo_label = serializers.CharField(read_only=True)
    nivel_permissao = serializers.CharField(read_only=True)
    nome_fantasia = serializers.CharField(required=False, allow_blank=True)
    razao_social = serializers.CharField(required=False, allow_blank=True)
    cnpj = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ativo = serializers.BooleanField(required=False)
    cadastur = TradePortalCadasturSerializer(required=False)
    endereco = TradePortalEnderecoSerializer(required=False)
    contatos = TradePortalContatoSerializer(many=True, required=False)
    infraestrutura = TradePortalInfraestruturaSerializer(required=False)
    mao_de_obra = TradePortalMaoDeObraSerializer(required=False)

    def _trade_instance(self, instance):
        return instance.especializacao() if hasattr(instance, 'especializacao') else instance

    def to_representation(self, instance):
        trade = self._trade_instance(instance)
        endereco = getattr(instance, 'endereco', None)
        cadastur = getattr(instance, 'cadastur', None)
        folhas = self._trade_instance(instance)

        infraestrutura = {}
        if instance.tipo == 'meio_hospedagem':
            infraestrutura = {
                'uh_total': getattr(folhas, 'uh_total', None),
                'leitos': getattr(folhas, 'leitos', None),
                'capacidade_maxima': None,
            }
        elif instance.tipo in ('meio_alimentacao_bebida', 'atrativo'):
            infraestrutura = {
                'uh_total': None,
                'leitos': None,
                'capacidade_maxima': getattr(instance, 'quantidade', None),
            }
        else:
            infraestrutura = {
                'uh_total': None,
                'leitos': None,
                'capacidade_maxima': getattr(instance, 'quantidade', None),
            }

        data = {
            'id': instance.id,
            'tipo': instance.tipo,
            'tipo_label': instance.get_tipo_display(),
            'nivel_permissao': self.context.get('nivel_permissao', 'visualizador'),
            'nome_fantasia': getattr(instance, 'nome_fantasia', '') or '',
            'razao_social': getattr(instance, 'razao_social', '') or '',
            'cnpj': getattr(instance, 'cnpj', '') or '',
            'ativo': instance.ativo,
            'cadastur': {
                'ativo': getattr(cadastur, 'inscricao', False) if cadastur else False,
                'numero': getattr(cadastur, 'numero', '') or '',
                'vencimento': getattr(cadastur, 'vencimento', None),
            },
            'endereco': {
                'cep': getattr(endereco, 'cep', '') or '',
                'rua': getattr(endereco, 'rua', '') or '',
                'numero': getattr(endereco, 'numero', '') or '',
                'bairro': getattr(endereco, 'bairro', '') or '',
                'regiao': getattr(endereco, 'regiao', '') or '',
                'latitude': getattr(endereco, 'latitude', None),
                'longitude': getattr(endereco, 'longitude', None),
            } if endereco else {
                'cep': '',
                'rua': '',
                'numero': '',
                'bairro': '',
                'regiao': '',
                'latitude': None,
                'longitude': None,
            },
            'contatos': [
                {
                    'id': contato.id,
                    'telefone': contato.telefone or '',
                    'email': contato.email or '',
                    'cargo': contato.cargo or '',
                }
                for contato in instance.contatos.all().order_by('id')
            ],
            'infraestrutura': infraestrutura,
            'mao_de_obra': {
                'qtde_funcionarios_fixos': getattr(instance, 'qtde_funcionarios_fixos', None),
                'qtde_funcionarios_temporarios': getattr(instance, 'qtde_funcionarios_temporarios', None),
            },
            'sustentabilidade': self._serialize_ods_state(instance),
        }
        return data

    def validate(self, attrs):
        instance = self.instance
        if not instance:
            return attrs

        permission = self.context.get('nivel_permissao', 'visualizador')
        if permission == 'visualizador' and attrs:
            raise serializers.ValidationError({
                'detail': 'Visualizador não pode alterar dados do estabelecimento.'
            })

        if permission == 'editor' and 'ativo' in attrs and attrs['ativo'] != instance.ativo:
            raise serializers.ValidationError({
                'ativo': 'Editor não pode alterar o status do estabelecimento.'
            })

        infraestrutura = attrs.get('infraestrutura') or {}
        tipo = instance.tipo
        if infraestrutura:
            if tipo == 'meio_hospedagem':
                if 'capacidade_maxima' in infraestrutura and infraestrutura.get('capacidade_maxima') is not None:
                    raise serializers.ValidationError({
                        'infraestrutura': 'Meios de Hospedagem não usam capacidade máxima.'
                    })
            elif tipo in ('meio_alimentacao_bebida', 'atrativo'):
                if infraestrutura.get('uh_total') is not None or infraestrutura.get('leitos') is not None:
                    raise serializers.ValidationError({
                        'infraestrutura': 'Essa entidade não possui campos de UHs ou leitos.'
                    })
            elif infraestrutura.get('uh_total') is not None or infraestrutura.get('leitos') is not None:
                raise serializers.ValidationError({
                    'infraestrutura': 'Essa entidade não possui campos de infraestrutura específicos para hospedagem.'
                })

        return attrs

    def update(self, instance, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        contatos_data = validated_data.pop('contatos', None)
        cadastur_data = validated_data.pop('cadastur', None)
        infraestrutura_data = validated_data.pop('infraestrutura', None)
        mao_de_obra_data = validated_data.pop('mao_de_obra', None)
        sustentabilidade_data = validated_data.pop('sustentabilidade', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if endereco_data is not None:
            endereco_defaults = {
                'cep': endereco_data.get('cep', '') or '',
                'rua': endereco_data.get('rua', '') or '',
                'numero': endereco_data.get('numero', '') or '',
                'bairro': endereco_data.get('bairro', '') or '',
                'regiao': endereco_data.get('regiao', '') or '',
                'latitude': endereco_data.get('latitude'),
                'longitude': endereco_data.get('longitude'),
            }
            Endereco.objects.update_or_create(registro=instance, defaults=endereco_defaults)

        if contatos_data is not None:
            instance.contatos.all().delete()
            for contato_data in contatos_data:
                Contato.objects.create(
                    registro=instance,
                    telefone=contato_data.get('telefone', '') or '',
                    email=contato_data.get('email', '') or '',
                    cargo=contato_data.get('cargo', '') or '',
                )

        if cadastur_data is not None:
            Cadastur.objects.update_or_create(
                registro=instance,
                defaults={
                    'inscricao': cadastur_data.get('ativo', False),
                    'numero': cadastur_data.get('numero', '') or '',
                    'vencimento': cadastur_data.get('vencimento'),
                },
            )

        if infraestrutura_data is not None:
            if instance.tipo == 'meio_hospedagem':
                folha = instance.meiohospedagem
                if 'uh_total' in infraestrutura_data:
                    folha.uh_total = infraestrutura_data.get('uh_total')
                if 'leitos' in infraestrutura_data:
                    folha.leitos = infraestrutura_data.get('leitos')
                folha.save()
            elif instance.tipo in ('meio_alimentacao_bebida', 'atrativo'):
                if 'capacidade_maxima' in infraestrutura_data:
                    instance.quantidade = infraestrutura_data.get('capacidade_maxima')
                    instance.save(update_fields=['quantidade'])

        if mao_de_obra_data is not None:
            if 'qtde_funcionarios_fixos' in mao_de_obra_data:
                instance.qtde_funcionarios_fixos = mao_de_obra_data.get('qtde_funcionarios_fixos')
            if 'qtde_funcionarios_temporarios' in mao_de_obra_data:
                instance.qtde_funcionarios_temporarios = mao_de_obra_data.get('qtde_funcionarios_temporarios')
            instance.save(update_fields=['qtde_funcionarios_fixos', 'qtde_funcionarios_temporarios'])

        if sustentabilidade_data is not None:
            self._sync_ods_state(instance, sustentabilidade_data)

        return instance

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

class RegistroBaseSerializer(ODSStateMixin, serializers.ModelSerializer):
    """
    Serializer base que lida automaticamente com Endereço e Contatos
    para qualquer filha de RegistroInventario.
    """
    endereco = EnderecoSerializer(required=False, allow_null=True)
    contatos = ContatoSerializer(many=True, required=False)
    redes_sociais = RedeSocialSerializer(many=True, required=False) 
    sustentabilidade = ODSStateField(required=False)


    def create(self, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        contatos_data = validated_data.pop('contatos', [])
        redes_data = validated_data.pop('redes_sociais', []) 
        formas_pagamento_data = validated_data.pop('formas_pagamento', None)
        sustentabilidade_data = validated_data.pop('sustentabilidade', None)

        instancia = super().create(validated_data)

        if endereco_data:
            Endereco.objects.create(registro=instancia, **endereco_data)

        for contato_data in contatos_data:
            Contato.objects.create(registro=instancia, **contato_data)

        for rede_data in redes_data:                                 
            RedeSocial.objects.create(registro=instancia, **rede_data)
            
        if formas_pagamento_data is not None:
            instancia.formas_pagamento.set(formas_pagamento_data)

        self._sync_ods_state(instancia, sustentabilidade_data)

        return instancia

    def update(self, instance, validated_data):
        endereco_data = validated_data.pop('endereco', None)
        contatos_data = validated_data.pop('contatos', None)
        redes_data = validated_data.pop('redes_sociais', None)
        formas_pagamento_data = validated_data.pop('formas_pagamento', None)
        sustentabilidade_data = validated_data.pop('sustentabilidade', None)

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

        self._sync_ods_state(instancia, sustentabilidade_data)

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