# Mangue — pesquisa para o universo Goiaba Lunar

**Refinamento posterior da direção:** o usuário gostou da proposta e definiu predomínio da ilustração sobre o realismo, mantendo profundidade e volume. Também confirmou efeitos pontuais e ambientes suaves. A experiência vigente está no [briefing v0.2](../brief.md) e no [plano sonoro](../audio.md); a evidência de produto deste levantamento permanece no escopo declarado.

Levantamento em 6 de setembro de 2026. Fonte: checkout local `/Users/mac/Documents/pathfork`, em modo somente leitura. O usuário identifica Mangue como **em desenvolvimento**. A direção confirmada para o estúdio é mapa livre com rota sugerida por Morfeu, combinação de 3D estilizado e ilustração 2D com profundidade, e foco em levar visitantes a entrar e usar os projetos. Este levantamento confirma implementação presente no código; não confirma disponibilidade pública, estabilidade operacional, catálogo real, receita ou lançamento. Não foram iniciados servidores, executados testes, instaladas dependências nem consultados arquivos de ambiente.

## Síntese do produto

Mangue é um **estúdio e espaço de leitura para ficção interativa**. Autores escrevem cenas, conectam escolhas, acompanham variáveis e condições, testam os caminhos e publicam histórias que leitores percorrem de maneiras diferentes. O público principal são escritores de narrativas ramificadas; leitores e compradores formam o outro lado do produto. A proposta não é apenas organizar ideias: é transformar uma história em uma experiência legível e publicável que se lembra das decisões de quem lê. [PRODUCT.md:9](/Users/mac/Documents/pathfork/PRODUCT.md:9), [PRODUCT.md:12](/Users/mac/Documents/pathfork/PRODUCT.md:12)

A identidade existente oferece uma associação muito direta entre **raízes, ramificações e narrativa**. A arte principal é uma gravura vegetal de mangue com raízes na água, impressa em verde sobre papel creme; a marca combina raízes entrelaçadas e um pequeno brilho verde. As duas imagens foram inspecionadas visualmente nesta pesquisa. O próprio hero diz que o autor escreve a história e deixa os leitores escolherem o caminho. [LandingHero.svelte:12](/Users/mac/Documents/pathfork/src/lib/components/landing/LandingHero.svelte:12), [LandingHero.svelte:64](/Users/mac/Documents/pathfork/src/lib/components/landing/LandingHero.svelte:64)

**Formulação editorial proposta para o estúdio:** “Histórias que crescem a cada escolha.” Complemento curto: “Um estúdio para escrever, testar e compartilhar ficção interativa.” São propostas de copy, não textos aprovados pelo usuário.

## Capacidades encontradas e limites da evidência

| Área | Evidência no código | Como apresentar no estúdio |
| --- | --- | --- |
| Escrita e construção de mundo | Página de escrita importa manuscrito, cenas, variáveis, personagens, locais, documentos de mundo e Spark. Deep links selecionam a cena em `?scene=`. [write/+page.svelte:5](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/write/+page.svelte:5) | Mostrar a relação entre prosa e escolha, com um pequeno trecho editável ou uma captura preparada. |
| Mapa de ramificações | Canvas usa `@xyflow/svelte`, monta arestas, calcula caminhos e permite criar/continuar/reordenar cenas e atualizar posições. [canvas/+page.svelte:2](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/canvas/+page.svelte:2), [canvas/+page.svelte:110](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/canvas/+page.svelte:110) | É a demonstração visual mais distintiva: uma decisão acende um caminho no mapa. |
| Escolhas com memória | Engine compartilhada inicializa estado, avalia condições e aplica efeitos numéricos/booleanos. O leitor usa essas operações ao escolher. [state.ts:23](/Users/mac/Documents/pathfork/shared/src/engine/state.ts:23), [state.ts:52](/Users/mac/Documents/pathfork/shared/src/engine/state.ts:52), [ReaderView.svelte:209](/Users/mac/Documents/pathfork/src/lib/components/reader/ReaderView.svelte:209) | Demonstrar uma primeira escolha que modifica uma segunda cena ou libera outra opção. Não reduzir a experiência a dois botões que só trocam uma imagem. |
| Revisão estrutural | “Story health” tem verificação de integridade, ritmo, ramificação e busca/substituição; mostra cenas e finais alcançáveis. [health/+page.svelte:11](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/health/+page.svelte:11) | Detalhe secundário para quem explora o lado autor: “Veja todos os caminhos antes de publicar.” |
| Leitura pública | Existe `/r/[publicSlug]`: histórias grátis dispensam autenticação; histórias pagas têm controle de compra; contas conectadas podem retomar leitura e visitantes mantêm estado efêmero. [r/+page.server.ts:1](/Users/mac/Documents/pathfork/src/routes/r/[publicSlug]/+page.server.ts:1) | Só apontar para uma história real quando o usuário escolher o título e o link de destino for verificado. |
| Publicação e exportação | Área de publicação consulta precificação, analytics e elegibilidade de pagamento; UI oferece exportações JSON, Twine e HTML. [publish/+page.server.ts:8](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/publish/+page.server.ts:8), [publish/+page.svelte:1341](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/publish/+page.svelte:1341) | Pode descrever o ciclo de criar, testar e publicar como capacidade em construção. Código de cobrança não demonstra vendas ou operação financeira ativa. |
| Spark | Modos de planejamento, escrita, brainstorm e revisão; planejamento e escrita apresentam propostas antes de aplicação. [spark-modes.ts:37](/Users/mac/Documents/pathfork/src/lib/components/ai/spark-modes.ts:37), [spark-modes.ts:57](/Users/mac/Documents/pathfork/src/lib/components/ai/spark-modes.ts:57) | Recurso de apoio ao autor. Não precisa disputar protagonismo com a narrativa. A integração não foi exercitada. |
| Áudio e vozes | Payloads incluem narração, diálogo, pensamento, escolhas condicionais e efeitos sonoros. Áudio de voz é upload do autor/ator de voz; geração TTS foi removida e registros antigos podem continuar reproduzíveis. [payloads.ts:32](/Users/mac/Documents/pathfork/shared/src/types/payloads.ts:32), [payloads.ts:97](/Users/mac/Documents/pathfork/shared/src/types/payloads.ts:97) | É possível propor uma demonstração com som autorizado e opcional. **Não prometer geração de vozes por IA.** |
| Tutorial público | `/tour` cria sandbox de visitante com escrita, canvas e teste; na visão de teste usa o mesmo `ReaderView` do produto, sem ação de salvamento. [tour/+page.server.ts:1](/Users/mac/Documents/pathfork/src/routes/tour/+page.server.ts:1), [TourApp.svelte:16](/Users/mac/Documents/pathfork/src/lib/components/tour/TourApp.svelte:16), [TourApp.svelte:195](/Users/mac/Documents/pathfork/src/lib/components/tour/TourApp.svelte:195) | Melhor referência técnica para uma demonstração verdadeira e descartável dentro do mundo, sem exigir conta. A hospedagem pública ainda precisa ser verificada. |

**Roadmap, conteúdo ilustrativo e recursos que não devem ser anunciados como lançados:**

- Tradução de histórias entre idiomas e troca do idioma de trabalho estão explicitamente ocultas para V1. A tradução da interface é separada. [V1-DEFERRED.md:5](/Users/mac/Documents/pathfork/docs/V1-DEFERRED.md:5)
- Coleções de biblioteca no site foram retiradas da navegação para V1; alguns modelos e APIs permanecem. [V1-DEFERRED.md:26](/Users/mac/Documents/pathfork/docs/V1-DEFERRED.md:26)
- Desktop com Tauri é trabalho futuro. [AGENTS.md:7](/Users/mac/Documents/pathfork/AGENTS.md:7)
- Existe aplicativo Expo/React Native no checkout, mas o marketing mostra “Coming soon to Google Play” quando a URL do app não está configurada. Não foi lida a configuração de ambiente. [README.md:3](/Users/mac/Documents/pathfork/README.md:3), [LandingMobileApp.svelte:12](/Users/mac/Documents/pathfork/src/lib/components/landing/LandingMobileApp.svelte:12)
- A landing atual inclui uma demonstração de leitor incorporada de um **protótipo HTML** e um tour de marketing feito de componentes de demonstração. A tradução brasileira reconhece “arte, música e escolhas de exemplo”. Não usar suas histórias, números e telas ilustrativas como prova de clientes ativos. [ReaderStageDemo.svelte:5](/Users/mac/Documents/pathfork/src/lib/components/landing/mocks/ReaderStageDemo.svelte:5), [LandingStudioTour.svelte:14](/Users/mac/Documents/pathfork/src/lib/components/landing/LandingStudioTour.svelte:14), [pt-BR.json:2466](/Users/mac/Documents/pathfork/messages/pt-BR.json:2466)
- O redesign documentado em `docs/design/editor-redesign` é uma exploração React com dados fictícios, explicitamente separada do editor Svelte. Suas capturas não atestam a UI implementada. [README do redesign:3](/Users/mac/Documents/pathfork/docs/design/editor-redesign/README.md:3)

## Design system atual

### Prioridade das fontes

`src/routes/layout.css` é a fonte de verdade, conforme as instruções do projeto e a atualização de setembro em `design.md`. Há trechos antigos em `PRODUCT.md`, no início de `design.md` e no protótipo de redesign que descrevem IA terracota e noite sépia. O sistema atual usa **dourado para Spark e grafite quente no tema noturno**. O nome legado `--accent-rust` corresponde a verde floresta, não ferrugem. [AGENTS.md:93](/Users/mac/Documents/pathfork/AGENTS.md:93), [design.md:215](/Users/mac/Documents/pathfork/design.md:215), [design.md:250](/Users/mac/Documents/pathfork/design.md:250)

### Paleta principal exata

| Papel / token | Dia | Noite | Aplicação no mundo proposto |
| --- | --- | --- | --- |
| Ambiente / `--bg` | `#EDE9DD` | `#171816` | Papel mineral nas ilhas; fundo profundo de água e sombra na versão noturna. |
| Papel e chrome / `--bg-paper` | `#F5F2E9` | `#1E1F1C` | Superfície de leitura e pequenos painéis. |
| Cartões / `--bg-card` | `#FAF7EE` | `#252622` | Folhas de manuscrito e nós da história. |
| Superfície elevada / `--bg-card-2` | `#F5F2E9` | `#2C2D29` | Escolha ativa ou plano contextual, respeitando contraste local. |
| Texto / `--ink` | `#2B251C` | `#EBE8E0` | Prosa e identificação do projeto. |
| Texto secundário / `--ink-soft` | `#433A2C` | `#D6D3C9` | Texto de apoio. |
| Metadados / `--ink-muted` | `#4A4133` | `#C8C6BB` | Rótulos secundários. |
| Texto mais leve / `--ink-light` | `#504637` | `#BEBCB2` | Detalhes auxiliares. |
| Ação preenchida / `--action` | `#235539` | `#235539` | Botão principal, sempre com o par de texto creme `#FAF7EE`. |
| Acento legível / `--accent-rust` | `#245439` | `#B1CCB6` | Caminho escolhido, foco e realces vegetais. |
| Spark texto / `--spark` | `#59481C` | `#EECC6C` | Somente quando a experiência identifica assistência/geração de IA. |
| Spark decorativo / `--spark-glow` | `#E8C674` | `#F8DE92` | Brilho de IA, separado do texto e do restante da navegação. |
| Borda de controle / `--control-border` | `#80786C` | `#8A8B82` | Contorno de botões/campos quando necessário. |

Valores do dia resolvidos pelas rampas em [layout.css:26](/Users/mac/Documents/pathfork/src/routes/layout.css:26), [layout.css:208](/Users/mac/Documents/pathfork/src/routes/layout.css:208), [layout.css:228](/Users/mac/Documents/pathfork/src/routes/layout.css:228); valores noturnos em [layout.css:327](/Users/mac/Documents/pathfork/src/routes/layout.css:327) e [layout.css:367](/Users/mac/Documents/pathfork/src/routes/layout.css:367).

Divisórias decorativas são misturas de tinta a 12% e 22%, não um hex fixo. A landing atual tem uma exceção local para o papel do hero: `#F4EBDB`. [layout.css:225](/Users/mac/Documents/pathfork/src/routes/layout.css:225), [landing.css:3](/Users/mac/Documents/pathfork/src/lib/components/landing/landing.css:3)

### Cores semânticas de narrativa

| Token | Dia | Noite |
| --- | --- | --- |
| `--accent-rust-soft` | `#773920` | `#EEBA9E` |
| `--accent-sage` | `#3D4F3C` | `#B8CCA6` |
| `--accent-gold` | `#664414` | `#E2C172` |
| `--accent-plum` | `#64404F` | `#DBBEC8` |
| `--accent-sky` | `#394C5E` | `#B5C8D5` |
| `--accent-deep` | `#6B3B2C` | `#E2BDAD` |
| `--accent-moss` | `#3D4F3C` | `#B7CAB5` |
| `--accent-amber` | `#664219` | `#E8C86E` |
| `--accent-slate` | `#434C54` | `#BDC6CC` |
| `--accent-sienna` | `#664312` | `#E2BF96` |
| `--accent-wine` | `#5C3A4D` | `#DCBDC4` |

São cores de significado narrativo/estado, não uma paleta de confete. Fontes: [layout.css:228](/Users/mac/Documents/pathfork/src/routes/layout.css:228), [layout.css:347](/Users/mac/Documents/pathfork/src/routes/layout.css:347). A documentação orienta usar ícone e texto para estados e manter bordas dos contêineres neutras. [design.md:199](/Users/mac/Documents/pathfork/design.md:199)

### Tipografia, forma e material

- **Newsreader** para títulos e voz literária; **Manrope** para interface; **JetBrains Mono** para chaves e leitura técnica do motor. Famílias declaradas em [layout.css:278](/Users/mac/Documents/pathfork/src/routes/layout.css:278).
- Peso mínimo 500, sentence case e sem itálico na UI atual. Escala documentada atual de 12 a 48px antes do conforto/zoom. O hero implementado usa Newsreader 600 com `clamp(42px, 4.15vw, 51px)` e entrelinha 1,08. [design.md:230](/Users/mac/Documents/pathfork/design.md:230), [landing.css:364](/Users/mac/Documents/pathfork/src/lib/components/landing/landing.css:364)
- Raios 4/8/12/16px; nó de canvas de 232px de largura e 14px de padding. Material editorial, bordas finas e pouca sombra. [layout.css:283](/Users/mac/Documents/pathfork/src/routes/layout.css:283)
- Há textura de papel em trama sutil e uma gravura orgânica que pode orientar o traço das ilhas e das raízes. A linguagem é calma, artesanal e literária; evitar transformar Mangue em floresta de fantasia genérica sem manuscrito, escolhas e consequências. [landing.css:53](/Users/mac/Documents/pathfork/src/lib/components/landing/landing.css:53), [design.md:149](/Users/mac/Documents/pathfork/design.md:149)

### Movimento existente

O hero usa revelação de tinta em 1,2s, entradas graduais com pequenas translações, pulso de áudio de 2,8s e deriva da arte durante 24s com escala final 1,025. O tour de marketing muda de vista, pausa ao hover e desliga reprodução automática com movimento reduzido. São evidências de uma expressão **lenta, orgânica e orientada à leitura**, úteis para traduzir a marca dentro do espaço. [landing.css:378](/Users/mac/Documents/pathfork/src/lib/components/landing/landing.css:378), [landing.css:549](/Users/mac/Documents/pathfork/src/lib/components/landing/landing.css:549), [LandingStudioTour.svelte:25](/Users/mac/Documents/pathfork/src/lib/components/landing/LandingStudioTour.svelte:25)

O CSS contém tratamento de `prefers-reduced-motion` que remove deriva, pulsos e revelações mantendo o conteúdo visível. [landing.css:2202](/Users/mac/Documents/pathfork/src/lib/components/landing/landing.css:2202)

Existe ainda **Pebble**, um pequeno broto de material argiloso associado ao Spark, com estados expressivos e uma piscada de 900ms ao toque. Pode aparecer como morador local em um easter egg; Morfeu continua sendo o guia do estúdio. A aparição conjunta é uma proposta criativa. [PebblePresence.svelte:6](/Users/mac/Documents/pathfork/src/lib/components/avatar/PebblePresence.svelte:6), [layout.css:192](/Users/mac/Documents/pathfork/src/routes/layout.css:192)

## Rotas prioritárias para captura ou exploração futura

| Rota | O que evidencia | Condição |
| --- | --- | --- |
| `/tour` | Escrever → ver mapa → testar escolhas no leitor compartilhado. | Melhor alvo inicial; loader não exige login. |
| `/` | Identidade visual, gravura de mangue, marketing, demos e promessas. | Demos de marketing contêm conteúdo de exemplo. |
| `/story/[storyId]/canvas` | Arquitetura ramificada do projeto real. | Precisa de conta e história preparada; evitar dados pessoais. |
| `/story/[storyId]/write?scene=[sceneId]` | Prosa, contexto de mundo, variáveis e escolhas. | Conta e IDs reais de uma história de demonstração. |
| `/story/[storyId]/health` | Integridade, ritmo e caminhos alcançáveis. | Conta e história. |
| `/story/[storyId]/publish` | Ciclo de distribuição e exportação. | Conta e história; não é prioridade para a experiência galáctica. |
| `/r/[publicSlug]` | Leitura publicada com decisões. | Só depois de definir uma história pública grátis apropriada. |
| `/writer`, `/shop`, `/library` | Estante, descoberta e continuidade de leitura. | São referências secundárias; dependem dos dados disponíveis e acesso. |
| `/design-system`, `/design-system/book-covers` | Catálogo local de componentes e capas. | Rota de referência visual, não destino comercial da landing. |

As rotas históricas de timeline, personagens, locais, review, pacing e scene não devem guiar o storyboard sem revisão: algumas redirecionam para canvas, health ou write. Exemplos: [timeline/+page.server.ts:13](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/timeline/+page.server.ts:13), [review/+page.server.ts:6](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/review/+page.server.ts:6), [scene/+page.server.ts:41](/Users/mac/Documents/pathfork/src/routes/(app)/story/[storyId]/scene/[sceneId]/+page.server.ts:41).

## Assets encontrados

| Arquivo / grupo | Utilidade e observação |
| --- | --- |
| [logo-mangue-full.png](/Users/mac/Documents/pathfork/static/brand/logo-mangue-full.png) | Wordmark diurno com símbolo de raízes. Inspecionado. |
| [logo-mangue-full-night.png](/Users/mac/Documents/pathfork/static/brand/logo-mangue-full-night.png) | Wordmark para fundo escuro. É o asset ligado pelo componente de marca noturno. |
| [logo-mangue.png](/Users/mac/Documents/pathfork/static/brand/logo-mangue.png), [logo-mangue-night.png](/Users/mac/Documents/pathfork/static/brand/logo-mangue-night.png) | Símbolos isolados, candidatos a marcador do mundo. |
| [landing-hero.png](/Users/mac/Documents/pathfork/static/images/landing-hero.png) | 1672×941 declarados pelo hero; gravura de mangue verde sobre papel creme. Inspecionada. Principal referência de direção de arte. |
| [hero-branch-night.png](/Users/mac/Documents/pathfork/static/images/hero-branch-night.png), [hero-branch-key.png](/Users/mac/Documents/pathfork/static/images/hero-branch-key.png) | Variações existentes; não inspecionadas nem confirmadas como utilizadas no hero atual. |
| [login-art.png](/Users/mac/Documents/pathfork/static/brand/login-art.png) | Outra arte de marca disponível; não inspecionada. |
| `static/brand/generated/` | Ícones em 192/512/1024px, apple-touch e favicon. Usar o arquivo apropriado à resolução, sem ampliar um favicon. |
| `static/fallback-covers/` | Capas de 11 gêneros e uma genérica; vinculadas em [fallback-covers.ts:1](/Users/mac/Documents/pathfork/src/lib/components/shop/fallback-covers.ts:1). São capas padrão, não provas de livros publicados. |
| `static/sfx/` | Efeitos de portas, natureza, atmosfera, passos, interface etc.; há [ATTRIBUTION.md](/Users/mac/Documents/pathfork/static/sfx/ATTRIBUTION.md). Selecionar o trecho e registrar sua atribuição na fase de produção. |
| [desktop.png](/Users/mac/Documents/pathfork/docs/design/editor-redesign/desktop.png), [night.png](/Users/mac/Documents/pathfork/docs/design/editor-redesign/night.png), [map.png](/Users/mac/Documents/pathfork/docs/design/editor-redesign/map.png) | Capturas do protótipo exploratório do redesign, não comprovação do editor implementado. |

Referência que confirma os wordmarks usados no aplicativo: [BrandWordmark.svelte:25](/Users/mac/Documents/pathfork/src/lib/components/shell/BrandWordmark.svelte:25). Nenhum asset foi copiado ou alterado neste estudo.

## URLs encontradas, não verificadas

- `https://mangue.app` consta como origem pública no código de configuração. É **destino candidato**, não confirmação de lançamento. [config.ts:7](/Users/mac/Documents/pathfork/src/lib/legal/config.ts:7)
- `https://magicpath.ai/files/447151425454219264` e `https://api.magicpath.ai/v1/friendly-stone-6422` constam na documentação do protótipo de redesign. São referências de design e não destinos do produto. [README do redesign:7](/Users/mac/Documents/pathfork/docs/design/editor-redesign/README.md:7)
- O servidor local documentado usa `http://localhost:5180`. Não foi iniciado nesta pesquisa. [README.md:17](/Users/mac/Documents/pathfork/README.md:17)

## Proposta criativa: Mangue, o estuário das histórias

**Esta seção é conceitual; não descreve uma tela já existente.**

De longe, Mangue parece um pequeno mundo de maré suspenso no espaço. A esfera é parcialmente aberta, revelando ilhas claras de papel mineral e um enorme sistema de raízes que atravessa água escura. Sua silhueta se identifica pelas ramificações: não é uma esfera verde com árvores espalhadas. Ramos finos viram linhas de escrita; folhas e pequenas placas de manuscrito marcam cenas. Os canais de água são o grafo da narrativa.

Ao se aproximar, a nave de Morfeu desacelera acima do estuário. Um trecho curto emerge em uma superfície de papel estável: **“Você encontra uma carta presa entre as raízes. Abrir agora ou levá-la até o farol?”** A escolha surge como dois caminhos claramente rotulados. A nave aguarda o visitante; não é necessário controlar sua pilotagem.

O visitante escolhe e um fluxo de luz **verde pálido, não dourado de Spark**, percorre a raiz correspondente. A câmera acompanha apenas o início do deslocamento e estabiliza para a próxima cena. O estado narrativo registra a ação. Abrir a carta revela um código; carregá-la fechada permite entregá-la intacta. Na cena seguinte, isso muda uma opção e um detalhe visível do farol. Há dois finais curtos e a opção “Explorar o outro caminho”.

Depois de uma decisão, um comando discreto **“Ver como essa história foi escrita”** transforma as raízes visíveis em um pequeno mapa editorial, com cartões de cenas e as mesmas conexões percorridas. Uma linha da prosa e o texto de uma escolha podem ser editados em uma sandbox local; “Testar” mostra o efeito imediatamente. É o momento de compreensão: o mundo bonito é também uma expressão do que Mangue permite criar.

### Demonstração proposta, com comportamento real

1. Um fixture original de 4–5 cenas, 2 finais e uma variável booleana (`carta_aberta`) alimenta tanto o mapa quanto o leitor.
2. Cada botão atualiza o estado e resolve seu destino. A opção disponível na segunda cena é calculada pela condição da variável, em vez de apenas trocar decoração.
3. “Ver a escrita” mostra o mesmo grafo. Editar um texto altera o fixture local; voltar a “Ler” usa esse novo texto.
4. “Recomeçar” limpa a sessão e retorna à primeira cena. Sem conta, salvamento remoto ou acesso a histórias privadas.
5. O CTA final deve refletir a fase do produto: “Conhecer o Mangue” ou “Experimentar o estúdio” se `/tour` estiver publicamente disponível; “Acompanhar a criação” se houver um destino real de acompanhamento. Não inventar lista de espera.

O caminho de implementação mais fiel é adaptar o padrão do sandbox existente, que já liga escrita, canvas e `ReaderView`. O tutorial atual é “Tutorial: Your First Branch”, com escolhas reais e flag de estado; serve como referência, mas o pequeno conto do estúdio deve ter texto próprio em português. [TourApp.svelte:16](/Users/mac/Documents/pathfork/src/lib/components/tour/TourApp.svelte:16), [TourApp.svelte:201](/Users/mac/Documents/pathfork/src/lib/components/tour/TourApp.svelte:201), [tutorial-fixture.ts:3](/Users/mac/Documents/pathfork/src/lib/tour/tutorial-fixture.ts:3)

### Direção de arte e movimento para essa proposta

- Usar a gravura do hero como referência de traço: raízes desenhadas, madeira orgânica, papel claro e verde de floresta. O espaço do Goiaba Lunar permanece ao fundo, sem converter a superfície inteira do projeto em neon.
- A vista distante é uma forma planetária singular; a vista próxima é um diorama legível de estuário, folhas de manuscrito e farol. A abertura parcial da esfera permite reconhecer a lógica de escolhas antes de entrar.
- No repouso: água quase imóvel, folhas respirando lentamente e um brilho discreto percorrendo somente o caminho selecionado. Na interação: a escolha recebe feedback imediato; o pequeno deslocamento de câmera termina antes da próxima leitura.
- O texto fica em um plano de leitura estável com contraste próprio. Não acompanha partículas, ondulações ou rotação contínua.
- Com movimento reduzido, raízes e mapa mudam de estado sem viagem de câmera. Todos os caminhos continuam acessíveis por botões e teclado; o mundo não depende de arrastar, hover ou precisão de pilotagem.
- Som é opcional, iniciado por ação explícita. Água, papel e um acorde discreto bastam. A presença audiovisual demonstra a leitura multimídia sem sobrecarregar a cena.
- Pebble pode acenar de um pequeno broto próximo ao painel de autoria. Não precisa participar da primeira explicação; Morfeu mantém a continuidade entre projetos.

## Decisões ainda abertas

1. Qual destino de Mangue deve receber visitantes durante o desenvolvimento: site, `/tour`, página de acompanhamento ou nenhum CTA externo por enquanto?
2. Qual história curta pode representar o produto no estúdio: texto original para Morfeu ou amostra de uma obra real escolhida pelo usuário?
3. A direção híbrida de 3D estilizado com ilustração 2D está confirmada. Falta definir sua proporção no Mangue: recomendação é manter o traço de gravura nas árvores, raízes e detalhes, com volume tátil nas ilhas e água em planos de profundidade.
4. Capturas finais precisam ser feitas depois de definir a versão do editor e uma história demonstrativa. Os PNGs disponíveis no diretório de redesign pertencem a uma exploração separada.

## Riscos de desatualização que afetam o briefing

- **Documentação de design conflita internamente:** priorizar `layout.css` e as atualizações de setembro, sem transplantar o terracota de Spark ou o sépia de trechos antigos.
- **Documentação de responsividade conflita:** `PRODUCT.md` fala em retirar o bloqueio mobile, mas `AGENTS.md` ordena preservar `MobileEditorGate` até 820px. A demonstração do estúdio deve ser desenhada para mobile por conta própria; não anunciar editor web mobile completo a partir dessa pesquisa. [PRODUCT.md:18](/Users/mac/Documents/pathfork/PRODUCT.md:18), [AGENTS.md:75](/Users/mac/Documents/pathfork/AGENTS.md:75)
- **Prototipagem e produto coexistem:** marketing HTML, catálogo visual e exploração MagicPath não são equivalentes às rotas do aplicativo. Identificar cada captura ao produzir os materiais.
- **Marca pública e nome de pasta divergem:** usar Mangue na interface do estúdio; `pathfork` é o caminho técnico legado.
- **Implementação não equivale a lançamento:** manter “Em desenvolvimento” até nova orientação do usuário. Preços, participação em vendas, disponibilidade do app e integrações precisam de validação específica antes de entrar no texto público.
