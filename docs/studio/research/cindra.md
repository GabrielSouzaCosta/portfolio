# Cindra — estudo para o estúdio Goiaba Lunar

Pesquisa local em 06/09/2026. Repositório: `/Volumes/SSD/Documents/cindra`.

**Refinamento posterior da direção:** o usuário gostou da proposta e definiu predomínio da ilustração sobre o realismo, mantendo profundidade e volume. Também confirmou efeitos pontuais e ambientes suaves. A experiência vigente está no [briefing v0.2](../brief.md) e no [plano sonoro](../audio.md); a evidência de produto deste levantamento permanece no escopo declarado.

Este documento separa **evidência de implementação**, **confirmação do autor**, **interpretação de posicionamento** e **proposta criativa**. A inspeção foi somente leitura, sem instalação, execução do app, acesso a banco, arquivos de ambiente ou serviços externos. URLs abaixo foram encontradas no código; não foram verificadas online. As referências apontam para o checkout local desta data.

**Confirmações do usuário em 06/09/2026:** Cindra pode ser usado; o objetivo do site é levar visitantes a entrar e usar os projetos. A exploração será por mapa livre com uma rota sugerida por Morfeu, e a linguagem visual combinará 3D estilizado com ilustração 2D em profundidade.

## 1. O que o produto é

**Fato:** Cindra se apresenta como um dashboard pessoal que reúne oito áreas da vida e recebe pensamentos em linguagem natural para organizá-los. A copy atual diz “Toda a sua vida, em uma página” e cita reuniões, dinheiro, metas e compras. Fonte: [traduções atuais](/Volumes/SSD/Documents/cindra/src/lib/i18n/translations/pt-BR.json:1162).

**Fato:** o dashboard efetivamente contém Agenda, Tarefas, Objetivos, Finanças, Aprendizado, Meu Espaço, Projetos e Compras. Essas oito áreas aparecem tanto no registro da interface quanto no carregamento de dados: [áreas](/Volumes/SSD/Documents/cindra/src/lib/constants/areas.ts:68), [dados do dashboard](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:27).

**Interpretação:** o público mais coerente para a apresentação é a pessoa que quer cuidar da vida cotidiana com menos esforço de organização: alguém equilibrando tarefas, estudo, dinheiro e projetos pessoais. A característica distintiva é o encontro de utilidade diária, acolhimento e descoberta. Não há evidência suficiente nesta leitura para eleger um nicho demográfico, afirmar número de usuários ou prometer efeito clínico/terapêutico.

**Formulação sugerida para o estúdio:** “Um lugar tranquilo para organizar a vida — e descobrir pequenas maravilhas pelo caminho.” É proposta de copy, não citação nem slogan confirmado.

## 2. O que realmente existe no código

| Capacidade | Evidência local | Potencial para a apresentação |
| --- | --- | --- |
| Brain dump com IA e conversa com Ember | API autentica a sessão e escolhe entre modos de interpretação e conversa: [endpoint](/Volumes/SSD/Documents/cindra/src/routes/api/ai/brain-dump/+server.ts:70). O salvamento é uma etapa própria: [mutação](/Volumes/SSD/Documents/cindra/src/lib/components/dashboard/mutations/brain-dump.ts:18). | Melhor demonstração da proposta: uma frase vira informações organizadas. |
| Agenda semanal | Carrega ocorrências da semana: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:105). | Um compromisso toma seu lugar no tempo. |
| Tarefas, subtarefas e hábitos | Filtragem, hierarquia de tarefas e hábitos do dia: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:61). | Marcar uma pequena ação, receber reação discreta de Pip. |
| Objetivos com contagens e progresso | Carrega objetivos e seus estados: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:121). | Mostrar um próximo passo concreto. |
| Finanças pessoais | Movimentações, receitas/despesas do mês e orçamento: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:129). | Uma despesa se organiza, sem sugerir aconselhamento financeiro. |
| Aprendizado | Itens, tarefas de estudo, sessões, tempo acumulado e sessão ativa: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:176). A interface tem tarefas, sessões e notas: [LearningExpanded](/Volumes/SSD/Documents/cindra/src/lib/components/dashboard/LearningExpanded.svelte:62). | Mote acende uma pequena luz ao iniciar o foco. |
| Meu Espaço | Links, notas e cor personalizada: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:279). | Um pequeno canto habitável, com objetos pessoais fictícios. |
| Projetos | Resumos e estados de projetos: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:319). Há representação por planta: [ProjectPlantBed](/Volumes/SSD/Documents/cindra/src/lib/components/projects/ProjectPlantBed.svelte:1). | A metáfora de cultivar já pertence ao produto. |
| Compras | Lista ordenada e contagens: [preview](/Volumes/SSD/Documents/cindra/src/lib/server/dashboard-preview.ts:329). | Kernel guarda o que precisa ser lembrado. |
| Coleção de cartas | Catálogo Série I com total de 30, facções, raridades e fragmentos de mundo: [catálogo compartilhado](/Volumes/SSD/Documents/cindra/packages/shared/src/cindra/catalog.ts:25). A página trabalha cartas, pacotes e coleção: [rota](/Volumes/SSD/Documents/cindra/src/routes/app/collection/+page.svelte:22). | Descoberta opcional de uma criatura, conectada ao hábito de cuidar do dashboard. |
| Progresso de colecionador | XP, níveis e pacotes: [lógica](/Volumes/SSD/Documents/cindra/packages/shared/src/cindra/xp.ts:36). | Justifica o mundo crescer com o uso, sem transformar toda a apresentação em jogo. |
| Ritual diário | Interface reúne agenda, tarefas, hábitos, aprendizado e finanças: [ritual](/Volumes/SSD/Documents/cindra/src/routes/app/ritual/+page.svelte:15). | Alternativa de narrativa: fechar o dia com calma. |
| Quadros acessíveis/compartilhamento | Loader resolve quadro ativo e lista quadros acessíveis: [rota principal](/Volumes/SSD/Documents/cindra/src/routes/app/+page.server.ts:44). | Feature secundária; não precisa competir com a primeira compreensão. |

**Limite importante:** o coletor de humor está desativado por feature flag. Não apresentar como funcionalidade ativa apenas porque existem componentes, traduções e consultas condicionais: [flag](/Volumes/SSD/Documents/cindra/src/lib/constants/features.ts:1).

**Precisão da planta:** a implementação atual determina seis estágios pela **quantidade de itens** (0; 1–2; 3–5; 6–9; 10–14; 15+) e sempre usa a série `ember`, ignorando a cor recebida. Não afirmar que ela cresce por tarefas concluídas, dias de uso ou tempo estudado: [plant-bed](/Volumes/SSD/Documents/cindra/src/lib/projects/plant-bed.ts:1).

## 3. Estágio: o que se pode e não se pode concluir

O checkout contém aplicação web autenticada, persistência por áreas, integração de IA, coleção, assinatura, onboarding, help center e aplicativo mobile no monorepo. Isso sustenta classificá-lo como **produto implementado, com infraestrutura de operação**, em vez de apenas conceito visual.

A landing atual afirma disponibilidade no Android e inclui CTA da Google Play: [copy](/Volumes/SSD/Documents/cindra/src/lib/i18n/translations/pt-BR.json:1210), [componente](/Volumes/SSD/Documents/cindra/src/lib/components/landing-test/MobileAppSection.svelte:45). A presença desses textos e links não confirma sozinha a publicação atual, versão disponível, estabilidade, tráfego ou número de clientes.

Há copy de sete dias de uso grátis, assinatura e preço em tradução: [pricing](/Volumes/SSD/Documents/cindra/src/lib/i18n/translations/pt-BR.json:1184). O preço não é necessário à história do estúdio e deve ser confirmado no produto antes de qualquer divulgação. Não usar versão `1.0.0` do pacote como data ou prova de lançamento.

**Status para o planejamento: disponível para uso, conforme confirmação do usuário em 06/09/2026.** Isso é confirmação do autor, não verificação online feita nesta pesquisa. O CTA pode ser planejado como “Entrar no Cindra”; o destino público específico e a disponibilidade por plataforma ainda precisam ser conferidos antes da publicação.

## 4. Design system: fonte de verdade e personalidade

O registro mais seguro para tokens web é [src/app.css](/Volumes/SSD/Documents/cindra/src/app.css:24). `design.md` é útil para intenção, mas contém pontos desatualizados; detalhes estão na seção 8.

### Paleta exata

Valores CSS abaixo foram copiados do código, não estimados visualmente. O hexadecimal é o valor já existente no pacote compartilhado para mobile, que documenta a web como fonte de verdade; não representa uma conversão adicional feita neste estudo: [tokens nativos](/Volumes/SSD/Documents/cindra/packages/shared/src/theme/tokens.ts:1).

| Papel | Token web | Claro — valor exato | Escuro — valor exato | Hex existente no tema nativo claro |
| --- | --- | --- | --- | --- |
| Fundo de papel | `--paper` | `oklch(97% 0.015 75)` | `oklch(19% 0.015 50)` | `#fbf4ea` |
| Fundo secundário | `--paper-deep` | `oklch(94% 0.02 70)` | `oklch(16% 0.018 50)` | `#f4e9dd` |
| Superfície de cartão | `--card` | `oklch(99% 0.008 80)` | `oklch(23% 0.02 55)` | `#fffbf6` |
| Cartão aquecido | `--card-warm` | `oklch(96% 0.025 70)` | `oklch(26% 0.03 50)` | `#fdefe0` |
| Texto principal | `--ink` | `oklch(24% 0.025 55)` | `oklch(94% 0.01 75)` | `#291c14` |
| Texto secundário | `--ink-soft` | `oklch(45% 0.03 55)` | `oklch(75% 0.02 70)` | `#635146` |
| Texto tênue | `--ink-faint` | `oklch(65% 0.025 60)` | `oklch(55% 0.02 65)` | `#9b8c80` |
| Contorno | `--line` | `oklch(88% 0.015 70)` | `oklch(32% 0.02 55)` | `#ded6cd` |
| Marca / Tarefas | `--ember` | `oklch(62% 0.15 45)` | `oklch(72% 0.14 50)` | `#cd632d` |
| Finanças / Compras no dashboard | `--sage` | `oklch(68% 0.08 140)` | `oklch(72% 0.08 140)` | `#7ea576` |
| Objetivos / Projetos no dashboard | `--sky` | `oklch(70% 0.08 230)` | `oklch(75% 0.08 230)` | `#68a8c7` |
| Agenda / Meu Espaço no dashboard | `--plum` | `oklch(55% 0.1 330)` | `oklch(72% 0.1 330)` | `#925b8d` |
| Aprendizado | `--gold` | `oklch(78% 0.12 85)` | `oklch(82% 0.12 85)` | `#dbb155` |
| Meu Espaço na landing | `--lilac` | `oklch(62% 0.1 300)` | `oklch(72% 0.09 300)` | `#8f78ba` |
| Projetos na landing | `--slate` | `oklch(58% 0.06 250)` | `oklch(72% 0.05 250)` | `#5f7d9d` |
| Compras na landing | `--clay` | `oklch(62% 0.1 40)` | `oklch(72% 0.09 40)` | `#b97057` |

Fontes: [paleta clara](/Volumes/SSD/Documents/cindra/src/app.css:25), [paleta escura](/Volumes/SSD/Documents/cindra/src/app.css:96), [mapeamento do dashboard](/Volumes/SSD/Documents/cindra/src/lib/constants/areas.ts:73). A diferenciação das três últimas áreas na landing é intencional e está comentada no código: [LANDING_COLORS](/Volumes/SSD/Documents/cindra/src/lib/components/landing-test/AreasSection.svelte:55).

Os pares de acento suave também estão implementados: por exemplo `--ember-soft` é `oklch(88% 0.08 55)` no claro e `oklch(32% 0.08 50)` no escuro; `--sage-soft` é `oklch(92% 0.04 140)` / `oklch(30% 0.04 140)`. São bons materiais para luz e atmosfera, preservando o acento forte para pontos de atenção.

**Leitura visual:** calor de papel creme, tinta marrom muito escura, terracota como assinatura e cores botânicas/minerais suaves. O dark atual continua quente: os fundos têm hue 50/55, apesar de o documento antigo usar a expressão “dark slate”. Uma cena de Cindra não deve se tornar uma interface neon azul.

### Tipografia, forma e textura

- **UI:** Sora para títulos/display, Geist para corpo e controles, sistema monoespaçado para metadados. A variável histórica se chama `--serif`, mas seu valor é **Sora, sans-serif**, não uma fonte serifada. Fontes locais WOFF2, carregamento `swap`: [fontes e aliases](/Volumes/SSD/Documents/cindra/src/app.css:1), [tokens tipográficos](/Volumes/SSD/Documents/cindra/src/app.css:60).
- **Logotipo:** o arquivo inspecionado visualmente traz lettering serifado de alto contraste e uma estrela terracota sobre o `i`. É arte própria da marca; não reconstruir o wordmark digitando “Cindra” em Sora. As variantes light têm tinta escura para fundo claro, e dark têm tinta creme para fundo escuro: [CindraLogo](/Volumes/SSD/Documents/cindra/src/lib/components/CindraLogo.svelte:3).
- **Forma:** raios web 10, 16, 22 e 28px; sombras suaves em tons quentes: [tokens](/Volumes/SSD/Documents/cindra/src/app.css:65). Na landing os CTAs são pílulas, e o primário usa tinta/papel, não obrigatoriamente fundo terracota: [botões](/Volumes/SSD/Documents/cindra/src/lib/styles/landing.css:48).
- **Textura:** ruído pontilhado de 3×3px, sem interceptar o ponteiro: [papel](/Volumes/SSD/Documents/cindra/src/app.css:159). A landing acrescenta sua camada sutil: [estilos](/Volumes/SSD/Documents/cindra/src/lib/styles/landing.css:14).
- **Composição:** bento configurável, não grade fixa obrigatória de seis áreas. Oito visíveis formam 3 + 3 + 2, com última linha repartida por igual; os cartões mantêm altura e a grade pode rolar: [layout atual](/Volumes/SSD/Documents/cindra/src/lib/components/dashboard/AppDashboard.svelte:139).

### Movimento observado no código

- Troca de tema: 400ms, `ease` — [body](/Volumes/SSD/Documents/cindra/src/app.css:150).
- Morph de áreas: duração-base 600ms e easing `cubic-bezier(0.34, 1.56, 0.64, 1)` — [tokens de morph](/Volumes/SSD/Documents/cindra/src/app.css:232).
- Hero: fade e deslocamento de 8px em 800ms, com redução de movimento — [HeroSection](/Volumes/SSD/Documents/cindra/src/lib/components/landing-test/HeroSection.svelte:49).
- Revelação ao scroll: 24px em 700ms, `cubic-bezier(0.22, 1, 0.36, 1)` — [landing.css](/Volumes/SSD/Documents/cindra/src/lib/styles/landing.css:162).
- Companions: flutuação discreta de 2px em 3,4s, inclinação de estudo em 4s e comemoração em 900ms; animações dependem de `prefers-reduced-motion: no-preference` — [PixelSprite](/Volumes/SSD/Documents/cindra/src/lib/companions/PixelSprite.svelte:118).
- Plantas: aura de 9s e brilho de 3s no estágio máximo; escala/lift no hover — [ProjectPlantBed](/Volumes/SSD/Documents/cindra/src/lib/components/projects/ProjectPlantBed.svelte:29).

**Direção derivada:** vida pequena e constante, com reações claras às ações. A aproximação cósmica do estúdio pode ser grandiosa; quando o visitante entra em Cindra, a câmera e o ritmo devem se aquietar.

## 5. Personagens e assets reaproveitáveis

### Companions atuais

Ember é a chama central/global. Cada área tem um cuidador fixo: Agenda → Thistle; Tarefas → Pip; Objetivos → Bramble; Finanças → Fern; Aprendizado → Mote; Meu Espaço → Wisp; Projetos → Loom; Compras → Kernel. Fonte: [mapeamento e personalidades](/Volumes/SSD/Documents/cindra/packages/shared/src/companions/index.ts:337).

As personalidades já incluem imagens úteis para o planeta: lareira constante (Ember), pedra musgosa paciente (Pip), lanterna de estudo (Mote), caminhos longos (Bramble), fios e tempo (Loom), pequenos grãos lembrados (Kernel). Fonte: [definições](/Volumes/SSD/Documents/cindra/packages/shared/src/companions/index.ts:14), [personalidades](/Volumes/SSD/Documents/cindra/packages/shared/src/companions/index.ts:352).

Morfeu deve conduzir a viagem do estúdio; Ember pode receber a nave em Cindra. Isso preserva os dois papéis e permite que o produto apresente seus próprios habitantes.

### Inventário priorizado

| Asset | Caminho absoluto | Uso / cuidado |
| --- | --- | --- |
| Wordmark para fundo claro | [logo-light-text.png](/Volumes/SSD/Documents/cindra/src/lib/assets/brand/logo-light-text.png) | Inspecionado visualmente. Preservar lettering e estrela. |
| Wordmark para fundo escuro | [logo-dark-text.png](/Volumes/SSD/Documents/cindra/src/lib/assets/brand/logo-dark-text.png) | Variante referenciada pelo componente atual; preparar sobre o cenário real. |
| Logos completos | [logo-light.png](/Volumes/SSD/Documents/cindra/src/lib/assets/brand/logo-light.png), [logo-dark.png](/Volumes/SSD/Documents/cindra/src/lib/assets/brand/logo-dark.png) | Disponíveis e conectados ao componente, ainda requerem curadoria do recorte. |
| Companions em código | [definições compartilhadas](/Volumes/SSD/Documents/cindra/packages/shared/src/companions/index.ts:14), [renderizador](/Volumes/SSD/Documents/cindra/src/lib/companions/PixelSprite.svelte:24) | Maioria gerada como SVG de células; reutilizar aparência em vez de redesenhar todos. |
| Loom e Kernel PNG | [Loom-sprite.png](/Volumes/SSD/Documents/cindra/src/lib/companions/sprites/Loom-sprite.png), [Kernel-sprite.png](/Volumes/SSD/Documents/cindra/src/lib/companions/sprites/Kernel-sprite.png) | São exceções PNG no renderizador atual. |
| Ember para push | [ember.png](/Volumes/SSD/Documents/cindra/static/companions/push/ember.png) | Candidato para estudo; a versão principal do sprite está em código. |
| Planta ember, estágio final | [ember_stage_06.png](/Volumes/SSD/Documents/cindra/static/projects/plants/ember_stage_06.png) | Inspecionada visualmente: árvore em pixel art com brasa no tronco. Há estágios 01–06 na mesma pasta. |
| Mosslet Archivist | [17-mosslet-archivist.png](/Volumes/SSD/Documents/cindra/static/cindra/characters/17-mosslet-archivist.png) | Inspecionado visualmente: criatura musgosa em biblioteca mágica; arte pixelada detalhada, vertical. |
| Cartas já escolhidas pela landing | [CardsTeaser](/Volumes/SSD/Documents/cindra/src/lib/components/landing-test/CardsTeaser.svelte:9) | Nimb, Snackdragon, Yzzl e Drizzlemane; seleção existente pode orientar uma primeira curadoria. |
| Manifesto de todas as cartas | [art.ts](/Volumes/SSD/Documents/cindra/packages/shared/src/cindra/art.ts:9) | Mapeia IDs reais a `/static/cindra/characters/`; evita escolher arquivos antigos/duplicados pelo nome. |
| Imagem social atual | [og-image.jpg](/Volumes/SSD/Documents/cindra/static/og-image.jpg) | Inspecionada visualmente. Mostra estética creme, companions e dashboard; contém uma composição/tela de seis áreas e texto de marketing antigo. Referência de atmosfera, não captura comprovadamente atual. |
| Screenshot usado no Android | [mobile-app.jpeg](/Volumes/SSD/Documents/cindra/static/mobile-app.jpeg) | Referenciado na landing em 770×1600; conteúdo ainda não avaliado visualmente neste estudo: [uso](/Volumes/SSD/Documents/cindra/src/lib/components/landing-test/MobileAppSection.svelte:75). |
| Capturas históricas de finanças | [finance-exp.png](</Volumes/SSD/Documents/cindra/GitHub Finance and Learning Redesign/screenshots/finance-exp.png>) | Existem, mas têm origem em pasta de redesign; não tratá-las como estado atual sem comparação. |
| Fontes locais | [sora-latin.woff2](/Volumes/SSD/Documents/cindra/static/fonts/sora-latin.woff2), [geist-latin.woff2](/Volumes/SSD/Documents/cindra/static/fonts/geist-latin.woff2) | Arquivos referenciados pelo CSS; usar a versão efetivamente adotada. |
| Sons existentes | [flip-card.mp3](/Volumes/SSD/Documents/cindra/src/lib/assets/audio/flip-card.mp3), [cinder-bg.mp3](/Volumes/SSD/Documents/cindra/src/lib/assets/audio/cinder-bg.mp3) | A página de coleção importa ambos: [rota](/Volumes/SSD/Documents/cindra/src/routes/app/collection/+page.svelte:18). Não foram ouvidos; curar depois e ativar som por gesto. |

Para imagens públicas do estúdio, preparar um quadro demonstrativo com conteúdo fictício curado. Não reaproveitar uma captura com dados de uma conta real nem presumir que todo material antigo é adequado para publicação.

## 6. Rotas e cenas a capturar na próxima etapa

| Destino local | Melhor finalidade | Condição |
| --- | --- | --- |
| `/` | Marca atual, sequência de apresentação e paleta | Importa componentes de `landing-test`, apesar do nome da pasta: [rota](/Volumes/SSD/Documents/cindra/src/routes/+page.svelte:1). |
| `/#demo` | Mensagem “Digite qualquer coisa. Nós organizamos.” | A demonstração atual é uma apresentação com dados de exemplo, não um parser aberto: [HowItWorksSection](/Volumes/SSD/Documents/cindra/src/lib/components/landing-test/HowItWorksSection.svelte:10). |
| `/onboarding` | Recepção e relação com Ember | Usar para estudar narrativa; não criar conta durante esta pesquisa. |
| `/app` | Captura real dos oito cantos e brain dump | Exige autenticação; sem sessão redireciona para onboarding: [loader](/Volumes/SSD/Documents/cindra/src/routes/app/+page.server.ts:13). |
| `/app?expand=learning` | Sessão de foco, tarefas e notas de aprendizado | `expand` é lido pela rota atual: [page](/Volumes/SSD/Documents/cindra/src/routes/app/+page.svelte:10). Não presumir `/app/learning`. |
| `/app?expand=finance` | Organização financeira com visual mais rico | Mesma expansão por query; renderização em [AppDashboard](/Volumes/SSD/Documents/cindra/src/lib/components/dashboard/AppDashboard.svelte:1274). |
| `/app?expand=projects` | Projetos e representação de cultivo | Renderização em [AppDashboard](/Volumes/SSD/Documents/cindra/src/lib/components/dashboard/AppDashboard.svelte:1358). |
| `/app/collection` | Descoberta de cartas, lore e pacotes | Página autenticada existente; boa segunda camada de encanto. |
| `/app/ritual` | Síntese calma do dia | Página existente; caminho alternativo de demonstração. |

As cenas precisam ser capturadas em sessão de demonstração, com um estado escolhido para contar uma história curta. Este estudo não confirma o comportamento no navegador nem a paridade web/mobile.

### URLs encontradas, não verificadas

- [cindra.app](https://cindra.app): origem de fallback em [SEO](/Volumes/SSD/Documents/cindra/src/lib/seo/index.ts:47). `PUBLIC_URL` pode substituí-la em execução; nenhum arquivo de ambiente foi acessado.
- [Google Play — Cindra](https://play.google.com/store/apps/details?id=app.cindra): constante em [android-app-offer](/Volumes/SSD/Documents/cindra/src/lib/mobile/android-app-offer.ts:1), também usada no componente público.

Antes de transformar URLs em CTAs definitivos, verificar o destino público e confirmar qual versão o autor quer destacar.

## 7. Proposta criativa — o mundo de Cindra

**Esta seção é uma hipótese de direção de arte, não uma feature existente nem uma decisão aprovada.**

### “O pequeno mundo da lareira”

Da galáxia, Cindra aparece como um pequeno planeta-terráreo habitado: uma crosta de pedra e solo, um anel de nuvens creme e um vale iluminado por uma árvore com brasa no tronco. A silhueta tem uma copa acolhedora e construções baixas; pequenos pontos plum, sage, sky e gold marcam lugares com funções diferentes. A luz dominante é terracota, como uma janela acesa à noite.

Na aproximação, percebemos um santuário: uma mesa de estudo com Mote, um caminho de marcos guardado por Bramble, cadernos e pequenos jardins. Ember espera na clareira central. Os oito ambientes não precisam ser oito cartões sobrepostos na tela; podem existir como regiões de uma mesma cena, com três apresentados primeiro e os demais descobertos por curiosidade.

**Por que pertence a Cindra:** lareira, cuidados pequenos, áreas da vida, companions, planta de projeto e criaturas colecionáveis já estão no produto. O terreno conta o que a ferramenta faz: cada coisa encontra um canto; pequenas ações são cuidadas; o mundo ganha significado com a pessoa. Não usar floresta genérica como única identidade — o diferencial é a clareira doméstica organizada, com objetos cotidianos e habitantes funcionais.

**Linguagem de arte:** seguindo a mistura escolhida pelo usuário, propor um volume de planeta em 3D estilizado, com formas orgânicas legíveis e materiais de papel/pintura discretos; habitantes, vegetação e pequenos ambientes como ilustração 2D em camadas, preservando os companions em pixel art. O encontro entre volume e sprites deve ser resolvido nos estudos visuais, com iluminação e composição compartilhadas.

**Entrada de Morfeu:** desacelera, inclina a nave e pousa perto da luz central. Uma curta troca de gestos com Ember apresenta o anfitrião. Morfeu continua acessível para retornar à galáxia, sem narrar cada clique.

### Interação principal — sentir a organização acontecer

1. O visitante escolhe um de três exemplos de pensamento, por exemplo “Consulta amanhã às 14h, R$ 47 no almoço, começar a desenhar”.
2. Ember lê; três fragmentos claros se separam da frase.
3. O visitante revisa e aciona “Organizar exemplo”. Os fragmentos viajam até Agenda, Finanças e Aprendizado; os objetos correspondentes aparecem nos lugares corretos e os cuidadores respondem.
4. Um recorte legível da interface real mostra o resultado com os tokens do produto. O visitante entende o valor sem precisar ler uma explicação longa.
5. CTA “Entrar no Cindra” leva ao destino confirmado; “Explorar mais um canto” continua no mundo. A visita a este planeta é livre, podendo ser sugerida por Morfeu sem bloquear outros destinos do mapa.

**Vínculo factual:** esse encadeamento demonstra a função existente de brain dump e salvamento após revisão. A landing atual já usa o mesmo tipo de exemplo, mas de forma estática. A cena do estúdio seria uma demonstração interativa nova, com dados fictícios e saída preparada, claramente apresentada como exemplo; não deve fingir que uma resposta pré-programada é IA ao vivo. Uma integração real com parser exigiria etapa própria, já que o endpoint atual requer sessão.

### Descoberta opcional — um fragmento de mundo

Um brilho numa estante permite virar uma carta existente e ler um único fragmento de lore. O visitante pode ampliar a arte; não precisa abrir um pacote para acessar informações sobre o app. O ganho é descobrir que cuidar da vida também revela personagens. A carta é uma amostra da coleção, sem anunciar prêmio salvo ou XP real no estúdio.

**Não atribuir causalidade falsa à árvore:** se uma interação de exemplo adicionar itens a um projeto, a planta pode refletir os limiares atuais de quantidade de itens; não crescer por completar uma tarefa, pois essa não é a regra encontrada.

### Atmosfera e controle

Brasa pulsa lentamente, folhas reagem de leve, pequenos personagens piscam e uma fita de papel indica que há algo para explorar. Movimento mais forte deve acompanhar uma ação escolhida, com saída clara. Em redução de movimento, trocar a viagem pela mudança de enquadramento e revelar o mesmo conteúdo. No mobile, oferecer foco em um canto por vez e alvos confortáveis; manter CTA e retorno acessíveis sem pilotagem precisa.

**Texto necessário no mundo:** nome, uma frase que identifica o dashboard, estado confirmado e CTA. Features e lore aparecem junto ao objeto que as demonstra. A descrição não deve fazer o visitante concluir que Cindra é apenas um jogo de coleção.

## 8. Discrepâncias e riscos de desatualização

1. **Companions antigos no design.md:** a seção fala em sete criaturas escolhidas e desbloqueadas ao longo de dias, incluindo phoenix/kitsune etc. O código atual usa Ember + oito cuidadores fixos. Priorizar [mapeamento atual](/Volumes/SSD/Documents/cindra/packages/shared/src/companions/index.ts:337) sobre [documento antigo](/Volumes/SSD/Documents/cindra/design.md:359).
2. **Rotas e grade do documento:** há menções a `/app/[area]` e 3×2 fixo. A aplicação atual expande por `?expand=` e organiza oito áreas dinamicamente: [rota](/Volumes/SSD/Documents/cindra/src/routes/app/+page.svelte:10), [bento](/Volumes/SSD/Documents/cindra/src/lib/components/dashboard/AppDashboard.svelte:142).
3. **Pasta `landing-test` é usada pela produção local:** a rota importa essa pasta. Componentes em `src/lib/components/landing/` podem ser anteriores; não escolhê-los só porque o nome parece definitivo: [imports](/Volumes/SSD/Documents/cindra/src/routes/+page.svelte:5).
4. **Arte documentada versus assets:** o guia antigo pede painterly/soft brushwork: [style guide](/Volumes/SSD/Documents/cindra/docs/cindra/art/style-guide.md:10). As amostras visuais inspecionadas de Mosslet, planta e companions têm pixel art. A direção de exportação precisa tomar os assets presentes como referência.
5. **Lore antigo versus catálogo atual:** o README de fantasia lista personagens/facções com distribuição antiga. O catálogo e manifesto compartilhados são melhores fontes para personagens realmente selecionáveis: [catálogo](/Volumes/SSD/Documents/cindra/packages/shared/src/cindra/catalog.ts:46), [manifesto](/Volumes/SSD/Documents/cindra/packages/shared/src/cindra/art.ts:9).
6. **Humor:** há código e copy, mas a flag está desligada. Não promover como estado atual: [flag](/Volumes/SSD/Documents/cindra/src/lib/constants/features.ts:1).
7. **Plantas coloridas no disco não implicam uso:** existem séries plum/sky/moss/clay, mas a função ativa sempre retorna ember e cresce por contagem de itens: [regra](/Volumes/SSD/Documents/cindra/src/lib/projects/plant-bed.ts:1).
8. **Screenshots e promo antigos:** a OG mostra seis áreas; a collage atual da landing inclui exemplos em inglês fixos no código. Não reutilizar isso como captura integral atual em PT-BR: [HeroCollage](/Volumes/SSD/Documents/cindra/src/lib/components/landing-test/HeroCollage.svelte:20).
9. **Versão pública, preços e Android:** textos e links existentes não comprovam situação atual. Verificação pública e confirmação do autor são necessárias antes da publicação de informações comerciais.

## 9. Próximas decisões específicas de Cindra

- Conferir URL principal e disponibilidade por plataforma para os CTAs; o autor já confirmou que Cindra pode ser usado.
- Escolher a ênfase: recomendação deste estudo é organização com Ember primeiro, coleção como descoberta.
- Selecionar uma carta representativa e preparar um quadro fictício que dê boas capturas de Agenda, Finanças e Aprendizado.
- Refinar em estudos visuais a relação entre o volume 3D estilizado do planeta, os habitantes em pixel art e a ilustração 2D com profundidade escolhida pelo usuário.
- Capturar a UI atual em desktop/mobile e claro/escuro antes de produzir a cena definitiva.

Nenhuma modificação foi feita no repositório Cindra. Este arquivo é documentação de pesquisa e proposta.
