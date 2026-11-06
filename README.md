# Raiz & Cuidado

Dashboard interativa para apresentar o projeto comunitário de educação alimentar e reaproveitamento de alimentos realizado em Guarujá, SP. O painel reúne contexto, atividades, indicadores e materiais educativos em uma interface responsiva inspirada em ferramentas de Business Intelligence.

> **Transparência dos dados:** os resultados exibidos são os informados no relato do projeto. Os cerca de 180 alcançados indiretamente são uma estimativa, e os 70% de redução percebida de desperdício vêm de autoavaliação das famílias — não de pesagem de resíduos. O painel não inventa datas para medições sem data informada.

## Conteúdo

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Indicadores e metodologia](#indicadores-e-metodologia)
- [Tecnologias](#tecnologias)
- [Executar localmente](#executar-localmente)
- [Comandos disponíveis](#comandos-disponíveis)
- [Configurar uma fonte de dados](#configurar-uma-fonte-de-dados)
  - [Supabase: acesso administrativo](#supabase-acesso-administrativo)
  - [API JSON somente para leitura](#api-json-somente-para-leitura)
- [Privacidade e segurança](#privacidade-e-segurança)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Publicação](#publicação)

## Visão geral

O projeto aborda educação alimentar, segurança dos alimentos, aproveitamento integral, compostagem doméstica e comunitária e doação de excedentes. O público descrito no relato inclui famílias atendidas por um centro comunitário, estudantes e voluntários.

O ciclo original tem 11 semanas: diagnóstico, preparação, oficinas, compostagem, doação, multiplicação e avaliação final. A dashboard organiza esses conteúdos e apresenta os resultados relatados sem sugerir que os filtros por etapa distribuam medições que não foram coletadas por etapa.

Os campos de faculdade, curso e datas específicas permanecem identificados como não informados. Podem ser preenchidos na própria interface quando esses dados estiverem disponíveis.

## Funcionalidades

- Visão geral do projeto, alinhamento com os ODS 2 e 12 e perfil do responsável.
- Filtros por etapa do cronograma e por frente: alimentação, reaproveitamento, compostagem e doação.
- Indicadores com contexto da fonte, metas opcionais e histórico baseado somente em medições datadas.
- Gráficos da jornada e do alcance, com detalhes apresentados ao lado do gráfico para não encobrir informações.
- Detalhes expansíveis das oficinas e dos depoimentos adicionados localmente.
- Biblioteca com 12 fichas complementares de receitas, manual HTML para download, infográfico, checklist e incorporação opcional de vídeo.
- Cartão rotativo de dicas ambientais com seleção por pontos; a rotação pausa quando o cartão recebe foco ou o cursor, e respeita a preferência por movimento reduzido.
- Tema claro/escuro, ajuste do tamanho do texto e modo de apresentação.
- Exportação CSV, compartilhamento e impressão do relatório com data de geração e notas metodológicas.
- Integração opcional com Supabase para leitura pública de dados publicados e edição autenticada por administradores.
- Integração opcional com endpoint JSON público para leitura de dados.

### Materiais complementares

As 12 fichas de receitas e o manual disponibilizado para download foram preparados como conteúdo complementar desta dashboard. **Eles não são uma transcrição do manual original** mencionado no relato, que não foi fornecido. O vídeo é opcional e só aparece quando uma URL HTTPS válida do YouTube ou Vimeo é configurada.

### Depoimentos

Não há depoimentos pré-carregados. Os depoimentos inseridos pela interface ficam apenas no armazenamento local do navegador e devem ser publicados somente com consentimento explícito. Eles não são enviados ao Supabase.

## Indicadores e metodologia

| Indicador | Valor informado | Interpretação |
|---|---:|---|
| Participantes diretos | 30 pessoas | Participantes das oficinas. |
| Alcance indireto | Cerca de 180 pessoas | Estimativa associada a materiais, multiplicadores e eventos. |
| Redução percebida de desperdício | 70% | Autoavaliação das famílias participantes; não é uma medição por pesagem. |
| Receitas | 12 | Quantidade informada no relato; as fichas desta dashboard são complementares. |
| Composteiras | 4 | Três domésticas e uma comunitária. |
| Multiplicadores | 6 | Voluntários capacitados para replicar oficinas. |
| Famílias conectadas à doação | 2 | Famílias atendidas pelo fluxo de excedentes. |

As metas são opcionais e representam referências definidas para acompanhamento, não resultados observados. Gráficos de evolução só recebem pontos quando uma medição real com data é registrada. Os números iniciais do relato não geram uma série histórica artificial.

O protocolo de acompanhamento aos 3 e 6 meses apresentado no painel é uma **proposta futura**, não uma coleta realizada. Recomenda repetir o instrumento e o grupo, documentar denominadores e perdas, distinguir autoavaliação de medidas objetivas, minimizar dados pessoais e padronizar o método caso haja pesagem de resíduos.

## Tecnologias

- React 19 e TypeScript
- Vite 8
- Recharts para gráficos
- Lucide React para ícones
- Supabase JS opcional para autenticação e acesso ao backend
- Vitest e Testing Library para testes
- Oxlint para lint

## Executar localmente

Requisitos: Node.js 20.19+ ou 22.12+ e npm.

```bash
npm install
npm run dev
```

O Vite informa no terminal o endereço local do painel, normalmente `http://localhost:5173`.

Para configurar integrações opcionais, copie `.env.example` para `.env.local`, preencha apenas as variáveis necessárias e reinicie o servidor. Sem backend configurado, o painel continua utilizando os dados informados no projeto.

## Comandos disponíveis

```bash
npm run dev      # Servidor local de desenvolvimento
npm test         # Testes automatizados
npm run lint     # Análise estática com Oxlint
npm run build    # Verificação TypeScript e build de produção
npm run preview  # Pré-visualização local do build
```

## Configurar uma fonte de dados

Supabase e API JSON são opções independentes. Quando as credenciais Supabase estão configuradas, o Supabase é usado como fonte preferencial; caso contrário, a dashboard pode consultar a API JSON. Sem nenhuma das duas fontes, permanece no modo baseado nos dados informados.

As variáveis abaixo estão documentadas em `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DASHBOARD_DATA_URL=
VITE_EDUCATIONAL_VIDEO_URL=
```

### Supabase: acesso administrativo

A integração opcional usa Supabase Auth, Postgres, Row Level Security (RLS) e funções RPC. O painel pode ler indicadores e medições publicados; alterações de metas e publicação de medições exigem uma conta previamente autorizada como administradora. Não há cadastro público no painel.

1. Crie um projeto Supabase.
2. No SQL Editor do projeto, execute a migration [`supabase/migrations/202611050001_dashboard_access.sql`](./supabase/migrations/202611050001_dashboard_access.sql).
3. Crie ou convide a conta responsável em **Authentication → Users**.
4. Como proprietário do projeto, autorize o UUID da conta na tabela privada:

   ```sql
   insert into private.dashboard_admins (user_id)
   values ('UUID-DA-CONTA-AUTORIZADA')
   on conflict (user_id) do nothing;
   ```

5. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env.local` e reinicie o servidor.
6. Entre pelo controle de acesso administrativo no painel para publicar medições ou atualizar metas.

A migration inicializa os indicadores relatados, mas não cria medições históricas datadas. Use a data real ao registrar novas medições. O valor de redução percebida permanece identificado como autoavaliação.

As medições gravadas pelo painel incluem somente indicador, valor, meta opcional e data. Notas livres e depoimentos não são enviados ao Supabase.

#### Chaves e permissões

A chave anon/publicável é destinada ao frontend; ela não deve ser tratada como segredo. A proteção dos dados depende da configuração correta de RLS e das permissões no banco. **Nunca** inclua a chave `service_role`, senhas ou outros segredos em variáveis `VITE_`, no código do navegador ou no repositório. Restrinja convites e métodos de autenticação às necessidades do projeto.

A migration ainda precisa ser aplicada e revisada em um projeto Supabase real antes da publicação. A presença do código de integração, por si só, não significa que exista uma instância conectada.

### API JSON somente para leitura

Configure `VITE_DASHBOARD_DATA_URL` com uma URL que responda JSON e permita CORS para a origem do painel. Exemplo:

```json
{
  "updatedAt": "2026-11-05T12:00:00Z",
  "indicators": {
    "directParticipants": 30,
    "indirectReach": 180,
    "wasteReduction": 70
  },
  "targets": {
    "wasteReduction": 75
  },
  "measurements": [
    {
      "id": "reducao-desperdicio-2026-11",
      "indicatorId": "wasteReduction",
      "value": 70,
      "target": 75,
      "date": "2026-11-05",
      "note": "Autoavaliação das famílias"
    }
  ]
}
```

- `updatedAt` é obrigatório e deve conter uma data reconhecida pelo navegador.
- `indicators`, `targets` e `measurements` são opcionais.
- Os IDs devem corresponder aos indicadores conhecidos pelo painel; valores precisam ser números finitos não negativos e as datas precisam ser válidas.
- A atualização ocorre na abertura, manualmente pelo controle do painel e a cada cinco minutos enquanto a página está visível.
- Em caso de erro, os últimos dados válidos são mantidos e a interface informa a falha.

Essa API não fornece autenticação administrativa ou gravação pelo painel. Não coloque tokens ou credenciais na URL ou em variáveis `VITE_`.

## Privacidade e segurança

- Depoimentos são armazenados apenas no navegador atual e podem ser removidos limpando os dados locais do site.
- O projeto não envia depoimentos nem notas livres de medições para o backend Supabase.
- Evite coletar dados pessoais ou dados de saúde desnecessários. Para acompanhamento com pessoas, defina previamente consentimento, finalidade, acesso, retenção e regras institucionais aplicáveis.
- Exporte e compartilhe relatórios apenas após revisar se os dados e o consentimento são adequados para divulgação.
- Os dados enviados por variáveis `VITE_` ficam acessíveis no bundle do frontend; use-as somente para configurações públicas.

## Estrutura do projeto

```text
.
├── public/                 # Ícones e recursos estáticos
├── src/
│   ├── assets/             # Imagens importadas pela aplicação
│   ├── data/project.ts     # Cronograma, indicadores, receitas e conteúdo do projeto
│   ├── services/           # Cliente Supabase, API JSON e configuração do backend
│   ├── test/               # Configuração compartilhada dos testes
│   ├── utils/              # Exportação, formatação e utilitários/testes
│   ├── App.tsx              # Componentes, estado e fluxos da dashboard
│   ├── App.css              # Estilos da dashboard
│   ├── index.css            # Estilos globais
│   └── main.tsx             # Inicialização React
├── supabase/
│   └── migrations/          # Estrutura do banco, RLS e funções administrativas
├── .env.example             # Modelo de configuração local
├── index.html               # Documento de entrada
├── package.json             # Dependências e comandos
└── vite.config.ts           # Vite, divisão de chunks e configuração de testes
```

## Publicação

Gere os arquivos de produção com:

```bash
npm run build
```

Publique o conteúdo da pasta `dist/` em uma hospedagem estática compatível com aplicações de página única. Configure as variáveis públicas necessárias no ambiente de build do provedor. Se usar rotas adicionais no futuro, configure o fallback do host para `index.html`.

Antes de publicar com Supabase, aplique e revise a migration, configure a conta administradora e valide as policies RLS no próprio projeto. Execute também os testes e o lint:

```bash
npm test
npm run lint
npm run build
```
