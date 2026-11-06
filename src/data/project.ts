export type AreaId = 'alimentacao' | 'reaproveitamento' | 'compostagem' | 'doacao'

export type ProjectPhase = {
  id: string
  name: string
  weeks: string
  duration: number
  color: string
  areas: AreaId[]
  description: string
}

export type IndicatorDefinition = {
  id: string
  name: string
  unit: string
  reportedValue: number
  displayValue: string
  areas: AreaId[]
  source: string
}

export type Measurement = {
  id: string
  indicatorId: string
  value: number
  target?: number
  date: string
  note?: string
}

export const projectProfile = {
  institution: 'Instituição de ensino não informada',
  course: 'Curso não informado',
  period: 'Ciclo de 11 semanas · datas não informadas',
  location: 'Centro comunitário local · Guarujá, SP',
}

export const areas: { id: AreaId; label: string; color: string }[] = [
  { id: 'alimentacao', label: 'Educação alimentar', color: '#4d9475' },
  { id: 'reaproveitamento', label: 'Reaproveitamento', color: '#d3a542' },
  { id: 'compostagem', label: 'Compostagem', color: '#7fa55a' },
  { id: 'doacao', label: 'Doação', color: '#5e90a1' },
]

export const phases: ProjectPhase[] = [
  {
    id: 'diagnostico',
    name: 'Diagnóstico local',
    weeks: 'Semanas 1–2',
    duration: 2,
    color: '#83a98d',
    areas: ['alimentacao', 'reaproveitamento'],
    description:
      'Escuta das famílias e conversa com a coordenação para mapear hábitos, desafios alimentares e temas prioritários.',
  },
  {
    id: 'preparacao',
    name: 'Preparação',
    weeks: 'Semanas 3–4',
    duration: 2,
    color: '#e8b94f',
    areas: ['alimentacao', 'reaproveitamento', 'compostagem'],
    description:
      'Criação dos materiais educativos e planejamento das atividades práticas com a realidade local em mente.',
  },
  {
    id: 'oficinas',
    name: 'Oficinas práticas',
    weeks: 'Semanas 5–7',
    duration: 3,
    color: '#4d9475',
    areas: ['alimentacao', 'reaproveitamento'],
    description:
      'Quatro oficinas: duas de educação alimentar e duas de reaproveitamento culinário e compostagem.',
  },
  {
    id: 'compostagem',
    name: 'Compostagem',
    weeks: 'Semana 8',
    duration: 1,
    color: '#94b55e',
    areas: ['compostagem'],
    description:
      'Montagem das composteiras domésticas e comunitária, seguida do plantio na horta do centro.',
  },
  {
    id: 'doacao',
    name: 'Doação',
    weeks: 'Semana 9',
    duration: 1,
    color: '#e7a954',
    areas: ['doacao'],
    description:
      'Organização do fluxo de doação de excedentes e conexão com o banco de alimentos local.',
  },
  {
    id: 'multiplicacao',
    name: 'Multiplicação',
    weeks: 'Semana 10',
    duration: 1,
    color: '#4e9a9d',
    areas: ['alimentacao', 'reaproveitamento', 'compostagem', 'doacao'],
    description:
      'Capacitação de seis voluntários para dar continuidade às oficinas e compartilhar o aprendizado.',
  },
  {
    id: 'avaliacao',
    name: 'Avaliação final',
    weeks: 'Semana 11',
    duration: 1,
    color: '#637fa7',
    areas: ['alimentacao', 'reaproveitamento', 'compostagem', 'doacao'],
    description:
      'Coleta de feedback, avaliação dos resultados e elaboração do relatório de encerramento.',
  },
]

export const indicatorDefinitions: IndicatorDefinition[] = [
  {
    id: 'directParticipants',
    name: 'Participantes diretos',
    unit: 'pessoas',
    reportedValue: 30,
    displayValue: '30',
    areas: ['alimentacao', 'reaproveitamento', 'compostagem', 'doacao'],
    source: 'Contagem informada para participantes das oficinas.',
  },
  {
    id: 'indirectReach',
    name: 'Alcance indireto',
    unit: 'pessoas',
    reportedValue: 180,
    displayValue: '~180',
    areas: ['alimentacao', 'reaproveitamento', 'compostagem', 'doacao'],
    source: 'Estimativa de alcance por materiais, multiplicadores e eventos comunitários.',
  },
  {
    id: 'wasteReduction',
    name: 'Famílias com redução percebida de desperdício',
    unit: '%',
    reportedValue: 70,
    displayValue: '70%',
    areas: ['reaproveitamento'],
    source: 'Autoavaliação relatada pelas famílias participantes; não corresponde à pesagem de resíduos.',
  },
  {
    id: 'recipes',
    name: 'Receitas no manual',
    unit: 'receitas',
    reportedValue: 12,
    displayValue: '12',
    areas: ['reaproveitamento', 'alimentacao'],
    source: 'Manual prático informado no relatório do projeto.',
  },
  {
    id: 'composters',
    name: 'Composteiras implantadas',
    unit: 'unidades',
    reportedValue: 4,
    displayValue: '4',
    areas: ['compostagem'],
    source: 'Três estruturas domésticas e uma composteira comunitária.',
  },
  {
    id: 'multipliers',
    name: 'Multiplicadores capacitados',
    unit: 'pessoas',
    reportedValue: 6,
    displayValue: '6',
    areas: ['alimentacao', 'reaproveitamento', 'compostagem', 'doacao'],
    source: 'Voluntários capacitados para replicar as oficinas.',
  },
  {
    id: 'donationFamilies',
    name: 'Famílias conectadas à doação',
    unit: 'famílias',
    reportedValue: 2,
    displayValue: '2',
    areas: ['doacao'],
    source: 'Famílias em situação de vulnerabilidade atendidas pelo fluxo de excedentes.',
  },
]

export const workshopDetails = [
  {
    id: 'alimentacao',
    title: 'Educação alimentar',
    count: '2 oficinas',
    areas: ['alimentacao'] as AreaId[],
    description:
      'Atividades de educação alimentar e nutricional, segurança dos alimentos e leitura de rótulos.',
    approach: 'Demonstração prática, diálogo com as famílias e linguagem adaptada ao contexto comunitário.',
  },
  {
    id: 'reaproveitamento',
    title: 'Reaproveitamento culinário',
    count: '2 oficinas',
    areas: ['reaproveitamento'] as AreaId[],
    description:
      'Preparações com aproveitamento integral de hortaliças, cascas, talos e sobras.',
    approach: 'Preparo coletivo de receitas e orientações de manipulação segura dos alimentos.',
  },
  {
    id: 'compostagem',
    title: 'Compostagem e horta',
    count: 'Implantação',
    areas: ['compostagem'] as AreaId[],
    description:
      'Montagem de três composteiras domésticas e uma estrutura comunitária na horta do centro.',
    approach: 'Orientação sobre separação de resíduos orgânicos e uso do composto na horta.',
  },
  {
    id: 'doacao',
    title: 'Logística de doação',
    count: 'Rede de apoio',
    areas: ['doacao'] as AreaId[],
    description:
      'Conexão de excedentes alimentares com duas famílias em situação de vulnerabilidade.',
    approach: 'Organização do fluxo de doação e articulação com o banco de alimentos local.',
  },
]

export const recipeResources = [
  {
    id: 'caldo-tal-os',
    title: 'Caldo nutritivo de talos',
    category: 'Aproveitamento integral',
    time: '35 min',
    ingredients: [
      'Talos limpos de couve, brócolis ou salsinha',
      '1 cebola e 1 dente de alho',
      '4 xícaras de água',
      '1 batata ou outro legume disponível',
      'Azeite e temperos a gosto',
    ],
    steps: [
      'Higienize os vegetais e descarte partes estragadas.',
      'Refogue cebola, alho e talos picados em um fio de azeite.',
      'Acrescente água e a batata em cubos; cozinhe até amaciar.',
      'Sirva em pedaços ou bata com cuidado até obter a textura desejada.',
    ],
    safety: 'Refrigere prontamente em recipiente limpo e fechado. Siga as orientações sanitárias locais de conservação e descarte se houver sinais de alteração.',
  },
  {
    id: 'farofa-folhas',
    title: 'Farofa de folhas e talos',
    category: 'Aproveitamento integral',
    time: '20 min',
    ingredients: [
      'Folhas e talos higienizados e picados',
      '1 cebola pequena',
      '1 xícara de farinha de mandioca',
      '1 colher de sopa de óleo ou azeite',
      'Sal e ervas a gosto',
    ],
    steps: [
      'Higienize as folhas e os talos e pique em pedaços pequenos.',
      'Refogue a cebola e os talos até ficarem macios.',
      'Junte as folhas e mexa até murcharem.',
      'Acrescente a farinha aos poucos, misture e ajuste os temperos.',
    ],
    safety: 'Use folhas próprias para consumo e higienizadas conforme orientação local.',
  },
  {
    id: 'arroz-legumes',
    title: 'Arroz colorido de legumes',
    category: 'Refeição completa',
    time: '25 min',
    ingredients: [
      '2 xícaras de arroz cozido e refrigerado corretamente',
      '1 xícara de legumes cozidos que sobraram',
      '1/2 cebola picada',
      'Ervas frescas ou secas',
      'Um fio de óleo ou azeite',
    ],
    steps: [
      'Verifique se as sobras foram refrigeradas prontamente e estão em boas condições.',
      'Refogue a cebola e acrescente os legumes picados.',
      'Adicione o arroz e misture até aquecer por completo.',
      'Finalize com ervas e sirva imediatamente.',
    ],
    safety: 'Reaqueça completamente; não reaproveite alimentos que ficaram muito tempo fora de refrigeração.',
  },
  {
    id: 'chips-cascas',
    title: 'Cascas assadas crocantes',
    category: 'Aproveitamento integral',
    time: '30 min',
    ingredients: [
      'Cascas firmes de batata ou cenoura, bem higienizadas',
      '1 colher de chá de azeite',
      'Ervas secas e especiarias a gosto',
    ],
    steps: [
      'Lave e higienize bem os vegetais antes de descascar.',
      'Seque as cascas e misture com um pouco de azeite e temperos.',
      'Distribua em uma assadeira sem sobrepor.',
      'Asse em forno preaquecido até dourarem, observando para não queimar.',
    ],
    safety: 'Use apenas cascas de vegetais próprios para consumo e descarte as partes danificadas.',
  },
  {
    id: 'refogado-folhas-beterraba',
    title: 'Refogado de folhas de beterraba',
    category: 'Folhas próprias para consumo',
    time: '20 min',
    ingredients: ['Folhas frescas de beterraba', '1/2 cebola picada', '1 dente de alho', 'Um fio de óleo ou azeite', 'Sal e ervas a gosto'],
    steps: ['Selecione folhas íntegras e lave em água corrente.', 'Pique as folhas e os talos tenros.', 'Refogue cebola e alho até ficarem macios.', 'Junte as folhas e cozinhe até murcharem; sirva como acompanhamento.'],
    safety: 'Use apenas folhas identificadas como próprias para consumo, sem deterioração e higienizadas antes do preparo.',
  },
  {
    id: 'bolinho-abobora',
    title: 'Bolinho assado de abóbora',
    category: 'Aproveitamento de preparo',
    time: '35 min',
    ingredients: ['1 xícara de abóbora cozida e amassada', '1 ovo', '3/4 de xícara de farinha de aveia ou trigo', 'Ervas picadas', 'Fermento químico e temperos a gosto'],
    steps: ['Misture a abóbora amassada, o ovo, as ervas e os temperos.', 'Acrescente a farinha aos poucos até obter uma massa moldável.', 'Incorpore uma pequena quantidade de fermento.', 'Modele porções e asse em forno preaquecido até firmarem e dourarem.'],
    safety: 'Confirme alergias e restrições aos ingredientes; mantenha a preparação refrigerada quando não for servida.',
  },
  {
    id: 'pasta-feijao',
    title: 'Pasta temperada de feijão',
    category: 'Reaproveitamento de leguminosas',
    time: '15 min',
    ingredients: ['1 xícara de feijão cozido e bem conservado', '1 colher de sopa de azeite', 'Suco de limão', 'Alho ou ervas a gosto', 'Água potável para ajustar a textura'],
    steps: ['Confira se o feijão foi conservado sob refrigeração e está próprio para consumo.', 'Amasse ou processe o feijão com azeite, limão e temperos.', 'Acrescente água potável aos poucos até atingir a consistência desejada.', 'Sirva com vegetais higienizados ou pão.'],
    safety: 'Não use feijão que ficou por tempo prolongado fora de refrigeração ou apresenta alteração de cheiro, cor ou textura.',
  },
  {
    id: 'salada-talos-cenoura',
    title: 'Salada crocante de talos',
    category: 'Aproveitamento integral',
    time: '15 min',
    ingredients: ['Talos tenros de salsinha ou couve', '1 cenoura', 'Suco de limão', 'Azeite', 'Ervas e temperos a gosto'],
    steps: ['Lave e higienize os ingredientes conforme orientação sanitária.', 'Pique os talos em lâminas finas e rale a cenoura.', 'Misture os ingredientes e tempere próximo da hora de servir.', 'Mantenha refrigerada até o consumo.'],
    safety: 'Use somente talos frescos e próprios para consumo; mantenha a salada refrigerada e evite deixá-la exposta ao calor.',
  },
  {
    id: 'pure-cascas-batata',
    title: 'Purê rústico de batata',
    category: 'Aproveitamento integral',
    time: '30 min',
    ingredients: ['Batatas íntegras e bem lavadas', 'Leite ou bebida vegetal', 'Um fio de azeite ou pequena porção de manteiga', 'Sal e temperos a gosto'],
    steps: ['Lave e escove as batatas; retire pontos verdes, brotos e partes danificadas.', 'Cozinhe as batatas até ficarem macias.', 'Amasse com a casca, se estiver íntegra e bem higienizada.', 'Misture o leite ou bebida vegetal aos poucos e tempere.'],
    safety: 'Descarte batatas verdes, muito brotadas ou deterioradas. Verifique alergias e restrições a leite e derivados.',
  },
  {
    id: 'omelete-legumes',
    title: 'Omelete de legumes',
    category: 'Refeição prática',
    time: '20 min',
    ingredients: ['2 ovos', '1/2 xícara de legumes cozidos e bem conservados', 'Ervas frescas', 'Um fio de óleo', 'Sal e temperos a gosto'],
    steps: ['Bata os ovos em recipiente limpo.', 'Acrescente os legumes e as ervas.', 'Despeje em frigideira aquecida com pouco óleo.', 'Cozinhe até que os ovos estejam completamente firmes.'],
    safety: 'Cozinhe completamente os ovos. Reaproveite legumes somente se tiverem sido refrigerados prontamente e permanecerem próprios para consumo.',
  },
  {
    id: 'creme-legumes',
    title: 'Creme de legumes da estação',
    category: 'Refeição completa',
    time: '40 min',
    ingredients: ['2 xícaras de legumes próprios para consumo', '1/2 cebola', 'Água potável suficiente para o cozimento', 'Ervas e temperos a gosto', 'Um fio de azeite'],
    steps: ['Lave e corte os legumes, removendo partes danificadas.', 'Refogue a cebola e acrescente os legumes e água potável.', 'Cozinhe até os ingredientes ficarem macios.', 'Amasse ou bata cuidadosamente e ajuste os temperos.'],
    safety: 'Sirva quente. Refrigere rapidamente as sobras em recipiente limpo e fechado e siga as orientações locais de conservação.',
  },
  {
    id: 'farofa-legumes',
    title: 'Farofa colorida de legumes',
    category: 'Acompanhamento',
    time: '25 min',
    ingredients: ['1 xícara de farinha de mandioca', '1/2 cenoura ralada', 'Talos tenros picados', '1/2 cebola', 'Óleo ou azeite e temperos a gosto'],
    steps: ['Lave, higienize e pique os vegetais.', 'Refogue cebola, cenoura e talos até ficarem macios.', 'Adicione a farinha gradualmente, mexendo para envolver.', 'Ajuste os temperos e sirva.'],
    safety: 'Selecione apenas partes vegetais próprias para consumo, íntegras e higienizadas.',
  },
]

export const methodologyNotes = [
  {
    title: 'Alcance indireto',
    description:
      'As cerca de 180 pessoas representam uma estimativa alcançada por materiais distribuídos, multiplicadores e eventos. O total aproximado de 210 combina esse alcance estimado com 30 participantes diretos.',
  },
  {
    title: 'Redução percebida de desperdício',
    description:
      'Os 70% vêm de autoavaliação das famílias participantes. O projeto não informa pesagem dos resíduos nem medição longitudinal independente.',
  },
  {
    title: 'Coleta e acompanhamento',
    description:
      'O diagnóstico reuniu entrevistas com a coordenação e um breve questionário com famílias. Houve coleta de feedback final; o acompanhamento relatado não mede mudanças por seis meses.',
  },
  {
    title: 'Origem dos números',
    description:
      'Os valores iniciais desta página foram transcritos do relato do projeto fornecido. As metas não foram definidas no material; podem ser registradas pelo responsável e identificadas como metas internas.',
  },
  {
    title: 'Protocolo sugerido de acompanhamento (não realizado)',
    description:
      'Para uma avaliação futura, registrar uma linha de base antes de novas ações e repetir a mesma coleta aos 3 e 6 meses. Convidar o mesmo grupo de famílias, usar códigos aleatórios sem nomes, registrar participantes convidados/respondentes e perdas de seguimento. Aplicar o mesmo questionário curto sobre práticas de reaproveitamento e manter a autoavaliação separada de medidas objetivas. Se houver pesagem de resíduos, combinar previamente a definição de resíduo comestível evitável, o período de registro e o procedimento de pesagem; usar a mesma balança e rotina em cada rodada. Informar método, denominador, data e dados ausentes. Não coletar diagnóstico de saúde ou outros dados pessoais desnecessários; divulgar somente resultados agregados, com consentimento e aprovação institucional quando aplicáveis.',
  },
]
