# CommissionMatch — pesquisa para o estúdio Goiaba Lunar

**Refinamento posterior da direção:** o usuário gostou da proposta e definiu predomínio da ilustração sobre o realismo, mantendo profundidade e volume. Também confirmou efeitos pontuais e ambientes suaves. A experiência vigente está no [briefing v0.2](../brief.md) e no [plano sonoro](../audio.md); a evidência de produto deste levantamento permanece no escopo declarado.

Leitura local em 6 de setembro de 2026. Escopo: código, documentação e assets em `/Users/mac/Documents/commission-match`, sem executar aplicação, instalar dependências, consultar produção ou alterar o projeto. Não foram encontrados arquivos `AGENTS.md` no projeto ou nos diretórios ancestrais consultados. Este documento registra evidência e proposta criativa separadamente. Atualização durante a pesquisa: o usuário confirmou em 06/09/2026 que **CommissionMatch ainda está em prévia**.

## Síntese para a direção do estúdio

CommissionMatch conecta quem quer encomendar arte a artistas com estilo e estimativas de preço compatíveis. A experiência atual combina **pergaminho, verde oliva, gravuras e tipografia de inspiração antiga** com uma descoberta pragmática: descrever a peça, informar onde se vive e o orçamento, explorar serviços e obras, chegar ao contato do artista.

O mundo do estúdio deve tornar visível esse encontro entre pessoas, arte e orçamento. Seu material próprio é o papel gravado, seu gesto é encontrar um ateliê, e sua transformação é a compatibilidade aparecer antes da primeira conversa. Essa interpretação se apoia na proposta de produto e na implementação visual; não é uma identidade adicional já aprovada.

**Status confirmado pelo usuário em 06/09/2026: em prévia.** O código distingue site acessível de marketplace operando, com um limiar de artistas para ativação. A narrativa do estúdio deve apresentar a prévia e convidar a visitá-la, sem afirmar marketplace ativo.

## Produto e público — fatos encontrados

- **Cliente:** pessoa que quer comissionar arte e deseja comparar opções dentro do próprio orçamento. **Artista:** profissional freelance que publica serviços, exemplos de trabalho e estimativas, buscando contatos compatíveis. Fonte: [PRODUCT.md](/Users/mac/Documents/commission-match/PRODUCT.md:11).
- **Proposta central:** conhecer estimativas antes de negociar. A home usa “Find your artist. Know the price.” e pede ideia e orçamento. Fonte: [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:58).
- **Arte feita por pessoas:** a home declara “human-made work only”; os termos proíbem publicar arte gerada por IA como própria. Isso é posicionamento/política do produto, não prova de fiscalização perfeita de todo conteúdo. Fontes: [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:75), [terms.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/terms.astro:41).
- **Contato direto:** o produto apresenta canais externos do artista. Negociação, escopo, pagamento e direitos são acordados entre as partes; não se deve ilustrar checkout ou pagamento interno como uma capacidade atual. Fontes: [terms.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/terms.astro:22), [Marketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Marketplace.svelte:657).
- **Idioma da interface examinada:** inglês, com país/moeda contextualizados; há documentação e peças antigas em português. Fonte: [Base.astro](/Users/mac/Documents/commission-match/apps/web/src/layouts/Base.astro:49).

### Capacidades efetivamente representadas no código

| Capacidade | Evidência e limite |
|---|---|
| Busca por texto/categoria e orçamento máximo | Filtra nome, especialidade, descrição e tags; compara orçamento com menor preço de serviço, ou média quando necessário. Não há evidência de recomendação semântica avançada nessa busca. [Marketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Marketplace.svelte:167). |
| Preços na moeda do visitante | País informado significa **onde o cliente vive** e dirige a moeda de exibição. No fluxo atual, não restringe artistas ao país escolhido. [context.svelte.ts](/Users/mac/Documents/commission-match/apps/web/src/lib/context.svelte.ts:13), [Marketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Marketplace.svelte:125). |
| Ordenação por preço | Opções crescente e decrescente usam média; o filtro de orçamento usa outra base, o menor preço de serviço quando disponível. [Marketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Marketplace.svelte:167). |
| Serviços e galerias de exemplo | Cards abrem serviços, suas faixas de preço, imagens e contatos; também há rota pública de perfil. [Marketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Marketplace.svelte:329), [[slug].astro](/Users/mac/Documents/commission-match/apps/web/src/pages/artists/[slug].astro:18). |
| Cadastro do artista | Interface com etapas de política, perfil, trabalho/preços, links e disponibilidade; API recebe perfil, links, comissões e publicação. [Onboarding.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/onboarding/Onboarding.svelte:60), [onboarding.ts](/Users/mac/Documents/commission-match/apps/api/src/routes/onboarding.ts:78). |
| Gestão do ateliê | Dashboard para perfil, contatos, serviços, trabalhos, disponibilidade e indicadores de visitas/cliques. A presença dos indicadores não permite afirmar volume de uso. [Dashboard.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/onboarding/Dashboard.svelte:3), [Dashboard.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/onboarding/Dashboard.svelte:693). |
| Preview durante formação de oferta | Exemplos determinísticos, abertura de cards e galerias. O preview atual é explicitamente uma grade sem busca/filtros editáveis; os contatos são simulados e não levam a artistas. [PreviewMarketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/PreviewMarketplace.svelte:3), [PreviewMarketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/PreviewMarketplace.svelte:184). |

O site tem código além de um protótipo estático: renderização Astro, componentes Svelte, API e fluxos de cadastro/gestão. Isso comprova implementação local, não testes aprovados, lançamento, disponibilidade externa, receita ou usuários ativos. Stack declarada no [package.json web](/Users/mac/Documents/commission-match/apps/web/package.json:1).

## Estágio e divergências que afetam a apresentação

1. **README antigo:** ainda diz que a próxima etapa é implementar o MVP. Isso está atrás da quantidade de implementação atual. Não usar seu status como etiqueta pública. Fonte: [README.md](/Users/mac/Documents/commission-match/README.md:5).
2. **Operação condicionada:** `/api/artists/stats` retorna `isLive: liveCount >= 5`. A home e o marketplace consultam isso; falha da API também leva ao estado de formação de oferta. Fontes: [artists.ts](/Users/mac/Documents/commission-match/apps/api/src/routes/artists.ts:25), [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:24), [marketplace.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/marketplace.astro:19).
3. **Estado anterior ao limiar:** a home informa que ainda convida artistas e que o marketplace não está operando. A rota de resultados mostra “Opening soon” e direciona ao preview/cadastro. Fontes: [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:79), [marketplace.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/marketplace.astro:54).
4. **Exemplos não são tração:** o card principal é declarado fictício e rotulado “Example profile. Not a real artist.” Os nomes, preços e países da animação não são clientes/artistas reais nem cotações verificadas. Fonte: [FeaturedCard.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/FeaturedCard.svelte:3).
5. **Número do preview diverge:** comentários falam em 12 exemplos e a rota bloqueada anuncia 11; a lista visível ainda passa por corte de orçamento e limite de página. Evitar fixar número na landing do estúdio. Fontes: [PreviewMarketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/PreviewMarketplace.svelte:15), [marketplace.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/marketplace.astro:63).

Redação para documentação: **“Marketplace de comissões artísticas, com descoberta por estilo e orçamento. Em prévia.”** O estado de prévia foi confirmado pelo usuário em 06/09/2026; o estado da API não foi consultado. CTA recomendado: **“Visitar a prévia”**.

## Design system extraído da implementação

### Paleta atual

Tokens principais em [global.css](/Users/mac/Documents/commission-match/apps/web/src/styles/global.css:95); mapeamento semântico em [global.css](/Users/mac/Documents/commission-match/apps/web/src/styles/global.css:137).

| Token/uso | Valor | Papel no mundo proposto |
|---|---|---|
| `olive` / `primary` / foco | `#5C6B2A` | Tinta de marca, ações, preços e sinais de correspondência. |
| `olive-soft` / `secondary` / `accent` | `#E2E6C9` | Papel tingido de oliva e seleção suave. |
| `olive-fg` | `#3F4B1A` | Interação mais profunda e texto sobre seleção. |
| `parchment` / fundo | `#F4F1EA` | Material dominante: papel quente. |
| `parchment-deep` / `muted` | `#E7E3D0` | Camadas de papel e superfícies secundárias. |
| `line` / borda | `#D3CFAE` | Divisórias e linhas delicadas. |
| `ink` / texto | `#16130F` | Gravura, tipografia e contorno. |
| `ink-soft` | `#4E4A43` | Texto secundário. |
| `ink-faint` | `#8A8478` | Metadados discretos; não pressupor AA em qualquer tamanho/superfície. |
| `card` / `popover` | `#FBFAF6` | Papel mais claro dos controles e cards. |
| `input` | `#C9C4A4` | Borda de campo um pouco mais forte. |
| `destructive` | `#A33B2A` | Feedback destrutivo em tijolo; não é segunda cor decorativa de marca. |
| Fundo específico de preview/marketplace | `#F7F4EE` | Variação quente de seção. Fonte: [Marketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Marketplace.svelte:361). |
| Preenchimento do símbolo SVG | `#4A4636` | Marca em tom de tinta oliva escura. Fonte: [logo.svg](/Users/mac/Documents/commission-match/apps/web/src/assets/logo.svg:1). |

### Tipografia atual e conflito documental

**O CSS é a referência operacional mais recente encontrada:** Alegreya para display, Alegreya Sans para corpo, IBM Plex Mono para metadados e IM Fell English para wordmark. O comentário do próprio CSS relaciona essa escolha ao briefing medieval/xilogravura. Fontes: [global.css](/Users/mac/Documents/commission-match/apps/web/src/styles/global.css:113), [Navbar.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Navbar.svelte:73).

`DESIGN.md` e `PRODUCT.md` ainda registram Unbounded/Figtree e uma direção geométrica anterior. A paleta coincide; a tipografia e parte da descrição visual não. Não transportar Unbounded/Figtree para o planeta presumindo que o documento está atualizado. Fontes conflitantes: [DESIGN.md](/Users/mac/Documents/commission-match/DESIGN.md:14), [PRODUCT.md](/Users/mac/Documents/commission-match/PRODUCT.md:48).

- Títulos grandes em Alegreya regular, trechos em itálico; H1 atual de 2,25–4,375 rem conforme breakpoint, entrelinha próxima de 1.02. [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:68).
- Corpo global Alegreya Sans com peso mínimo 500. [global.css](/Users/mac/Documents/commission-match/apps/web/src/styles/global.css:295).
- Metadados e valores em mono, normalmente 10,5–14 px nos cards. [PreviewMarketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/PreviewMarketplace.svelte:127).
- Fontes locais em `/Users/mac/Documents/commission-match/apps/web/src/assets/fonts/`: Alegreya regular/itálica, Alegreya Sans 400/500, IBM Plex Mono 400/500 e IM Fell English regular/itálica. Declarações `@font-face`: [global.css](/Users/mac/Documents/commission-match/apps/web/src/styles/global.css:1).

### Forma, composição e movimento

Fatos observados no código:

- Estrutura com raio de 2 px; componentes semânticos geram raios de 4–8 px. Não descrever toda interface como chips em pílula: há tags retangulares no preview atual. [global.css](/Users/mac/Documents/commission-match/apps/web/src/styles/global.css:122), [global.css](/Users/mac/Documents/commission-match/apps/web/src/styles/global.css:191), [PreviewMarketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/PreviewMarketplace.svelte:153).
- Páginas atuais usam em vários pontos container de 1240 px, embora token/documentação ainda mencionem 1120 px. Hero em duas colunas no desktop; card de gravura ao lado da mensagem. [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:63), [Base.astro](/Users/mac/Documents/commission-match/apps/web/src/layouts/Base.astro:66).
- Materiais: papel claro, tinta escura, hachuras diagonais nos fundos de galeria, bordas finas e obra em destaque. [PreviewMarketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/PreviewMarketplace.svelte:118).
- Navegação sticky com pergaminho translúcido. Botão do artista usa sombra sólida deslocada e movimento de pressão 2/4 px. [Navbar.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Navbar.svelte:59), [Navbar.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/Navbar.svelte:109).
- Exemplo principal alterna país e preços a cada 2200 ms, com deslocamentos verticais curtos em 340–380 ms e `cubicOut`; interrompe essa alternância com movimento reduzido. [FeaturedCard.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/FeaturedCard.svelte:30), [FeaturedCard.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/FeaturedCard.svelte:75).
- O briefing se escreve com ritmo de máquina: 32 ms por caractere + variação de até 28 ms, pausas de pontuação de 150 ms e entrelinhas de 340 ms; respeita movimento reduzido na escrita. [HeroTypewriter.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/HeroTypewriter.svelte:12).
- Card de preview abre galeria com seleção de serviço e imagem; no mobile vira painel de tela inteira. [PreviewMarketplace.svelte](/Users/mac/Documents/commission-match/apps/web/src/components/PreviewMarketplace.svelte:164).

## Assets úteis e estado da evidência visual

| Asset local | Uso possível / cautela |
|---|---|
| [Símbolo SVG](/Users/mac/Documents/commission-match/apps/web/src/assets/logo.svg) e [versão pública](/Users/mac/Documents/commission-match/apps/web/public/logo.svg) | Símbolo pontiagudo de pena/rosa dos ventos; excelente para selo cartográfico do planeta. A descrição formal é interpretação visual, não nomenclatura oficial. |
| [Gravura principal](/Users/mac/Documents/commission-match/apps/web/src/assets/images/featured-artist.webp) e [variante 640](/Users/mac/Documents/commission-match/apps/web/src/assets/images/featured-artist-640.webp) | Inspecionada visualmente: figura alada sobre dragão em gravura monocromática. É a imagem usada na home, não um trabalho de artista real cadastrado. Confirmar origem/licença antes de reutilizar fora do contexto atual. |
| [Knight](/Users/mac/Documents/commission-match/apps/web/src/assets/images/knight.webp), [Archer](/Users/mac/Documents/commission-match/apps/web/src/assets/images/archer.webp), [Eagle](/Users/mac/Documents/commission-match/apps/web/src/assets/images/eagle.webp), [Crown](/Users/mac/Documents/commission-match/apps/web/src/assets/images/crown.webp) | Inventário de ilustrações locais coerentes com a direção; não foram todas abertas individualmente. Há recortes PNG em `public` e `public/uploads`. |
| [Auth art](/Users/mac/Documents/commission-match/apps/web/src/assets/images/auth-art.webp) | Asset local potencial para demonstrar entrada do artista; não inspecionado visualmente nesta rodada. |
| [OG image](/Users/mac/Documents/commission-match/apps/web/public/og-image.png) | Inspecionada: 1200×630, nome/tagline/domínio sobre pergaminho. Não é screenshot da aplicação e usa sans, divergindo da tipografia atual. Serve para reconhecimento, não para reconstruir o sistema. |
| [Post v2](/Users/mac/Documents/commission-match/post-v2.png) e [Post v1](/Users/mac/Documents/commission-match/post-v1.png) | `post-v2` foi inspecionado: peça 1080×1350 em português, tipografia geométrica e cards abstratos de fase anterior. Referência histórica; não apresentar como captura atual. `post-v1` somente inventariado. |
| [Dados do preview](/Users/mac/Documents/commission-match/apps/web/src/lib/preview-data.ts:1) | Declaram obras de domínio público do Wikimedia. São links externos e dados de exemplo. Essa declaração local não substitui verificação de proveniência por imagem. |

O footer credita ilustrações a rawpixel.com / Freepik, evidência de que existem atribuições a preservar e revisar antes de reaproveitar assets: [Base.astro](/Users/mac/Documents/commission-match/apps/web/src/layouts/Base.astro:98). A landing do estúdio não deve chamar a gravura de “obra de um usuário” nem transformar artistas fictícios em prova social.

Não foi encontrada nesta seleção uma captura recente de página inteira que pudesse ser validada como estado atual. Os arquivos `.playwright-mcp` inventariados eram registros textuais de página, não imagens da interface; não foram usados como verdade visual. Antes de compor telas na nova landing, capturar home, resultados e galeria no estado aprovado pelo proprietário.

## Rotas que melhor demonstram o projeto

| Rota | Valor para a apresentação |
|---|---|
| `/` | Proposta central, identidade, gravura, países/preços animados e convite ao artista. Destino principal recomendado para visitar a prévia, conforme status confirmado pelo usuário. |
| `/#preview` | Demonstração visual da galeria durante a formação de oferta; rotular como exemplo. A seção só existe no estado anterior ao limiar. [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:118). |
| `/marketplace` | Busca, orçamento, moeda contextual, resultados e galeria; pode responder “Opening soon”. Não prometer uma experiência funcional pública sem verificar o estado. |
| `/artists/[slug]` | Perfil, serviços, obras, estimativas e contatos. Escolher um perfil real aprovado; não inventar slug. [[slug].astro](/Users/mac/Documents/commission-match/apps/web/src/pages/artists/[slug].astro:14). |
| `/onboarding` | Fluxo “Set up your studio”: forte material para explicar a experiência do artista, com dados demonstrativos. [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/onboarding/index.astro:6). |
| `/profile` | Gestão de perfil e serviços; adequado a captura guiada com conta demonstrativa, sem expor informações de conta. [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/profile/index.astro:6). |

### URLs encontradas, não verificadas pela rede

- `https://commissionmatch.art/` e `https://commissionmatch.art/logo.svg` aparecem no JSON-LD da home. [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:36).
- `https://commissionmatch.art/marketplace?q={search_term_string}&submitted=1` aparece como destino de busca no mesmo JSON-LD. [index.astro](/Users/mac/Documents/commission-match/apps/web/src/pages/index.astro:49).
- URLs `https://upload.wikimedia.org/...` são usadas pelo conjunto de demonstração; não tratadas aqui como disponibilidade ou licença confirmadas. [preview-data.ts](/Users/mac/Documents/commission-match/apps/web/src/lib/preview-data.ts:39).

## Proposta criativa — o planeta dos ateliês gravados

**Conceito proposto, ainda não aprovado:** um pequeno mundo construído como uma gravura que ganhou volume. A esfera é feita de lâminas de papel sobrepostas; suas costas e montanhas são hachuras em relevo. No equador, ateliês de papel abrem pequenas janelas onde obras diferentes aparecem com sua cor original. A identidade oliva/pergaminho sustenta o mundo; a diversidade cromática vem da arte exposta, como acontece no produto. O acabamento segue a preferência confirmada pelo usuário: **3D estilizado misturado com ilustração 2D com profundidade**; lâminas, hachuras e obras são os elementos 2D dentro do volume espacial.

À distância, reconhecemos o contorno de papel, a pena/rosa dos ventos como farol e uma faixa orbital estreita semelhante a uma régua de gravador. Ao aproximar, o papel revela fibras e linhas de impressão, sem parecer um planeta rochoso apenas pintado de verde. Morfeu estaciona a nave junto a um pequeno cais que se desdobra de uma folha: um gesto curto de boas-vindas, deixando as obras conduzirem a visita. O planeta pode ser acessado livremente no mapa ou integrar a rota sugerida por Morfeu, conforme preferência confirmada pelo usuário.

**Composição sugerida:** mapa e ateliês no lado amplo da cena; um fragmento real e legível da interface do produto emerge de uma lâmina de papel, em perspectiva leve que se resolve para plano frontal quando recebe foco. O visitante pode entrar direto nesse fragmento por um botão claro. O texto cabe em uma frase: “Encontre o artista para a sua ideia — e para o seu orçamento.” É redação proposta, não cópia aprovada.

### Interação que demonstra o produto

1. Um pedido demonstrativo aparece: retrato de personagem, visitante no Brasil, orçamento de R$ 250. Esses parâmetros já têm base no [demo-brief.ts](/Users/mac/Documents/commission-match/apps/web/src/lib/demo-brief.ts:11).
2. O visitante ajusta um controle simples de orçamento. Ateliês com pelo menos um serviço compatível se aproximam visualmente e ganham sinal oliva; os demais se afastam levemente, mantendo a experiência respeitosa com diferentes preços. A regra usa o menor preço de serviço, coerente com o filtro atual, sem alegar um match exato com qualquer obra exibida.
3. Selecionar um ateliê abre uma galeria frontal: tipo de serviço, estimativa/faixa e obras. A cena desacelera enquanto a pessoa observa. O papel de fundo permanece discreto para que a arte tenha protagonismo.
4. Trocar o país demonstra o preço em outra moeda; apresentar isso como **conversão de exibição**, sem sugerir mudança do valor cobrado pelo artista conforme nacionalidade. Em demonstração local, sinalizar câmbio ilustrativo, pois [preview-api.ts](/Users/mac/Documents/commission-match/apps/web/src/lib/preview-api.ts:12) usa taxas fixas.
5. CTA externo **“Visitar a prévia”** leva à home de CommissionMatch. A seção demonstra possibilidades com exemplos explícitos, de acordo com o estado de prévia confirmado pelo usuário. Futuramente, “Encontrar meu artista” só deve substituir esse convite quando o fluxo público estiver disponível.

O orçamento editável seria uma nova demonstração construída para o estúdio a partir da regra real do marketplace. **Não é uma capacidade editável do preview atual da home**, que tem parâmetros fixos. Essa distinção deve continuar clara na implementação.

### Movimento proposto

- Rotação lenta com relevo de papel, pequenas folhas suspensas e variação de iluminação nas hachuras; sem movimento contínuo sobre a área onde se lê preço ou se observa uma obra.
- Ao mudar orçamento, pequenos deslocamentos coordenados dos ateliês, com resultado percebido imediatamente e animação resolvida em aproximadamente 300–450 ms.
- Entrada na galeria por desdobramento de papel; ao terminar, perspectiva frontal, dimensões estáveis e controles comuns.
- Movimento reduzido: mundo estático bonito, revelação por opacidade curta e mesma interação funcional. Mobile: planeta como introdução compacta e galeria confortável logo abaixo, sem exigir arrastar uma órbita para encontrar o projeto.

### O que falta decidir para materializar este mundo

- Quais obras e perfis podem aparecer, com autorização/proveniência e crédito apropriados.
- Se a identidade operacional de gravura/Alegreya é a direção definitiva, já que a documentação antiga ainda descreve outro sistema.
- Capturas atuais de home, resultados e galeria, com dados de demonstração claramente identificados quando não houver artistas públicos aprovados.
- Quão literal será o recorte de papel dentro do acabamento já confirmado de 3D estilizado + ilustração 2D com profundidade.
