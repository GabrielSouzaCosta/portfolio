# Direção de assets e referências

Planejamento v0.2 · 6 de setembro de 2026. Complementa o [briefing](brief.md). Os estudos de produto são a referência para identidade; esta lista define o que desenhar e preparar depois. A direção atual é predominantemente ilustrada, com profundidade em camadas e áudio pontual/ambiental confirmado.

## Segunda prancha — desenho em primeiro plano

![Segundo estudo: galáxia com acabamento mais ilustrado](/Users/mac/Documents/portfolio/docs/studio/concepts/galaxy-study-v02.png)

**Revisão gerada com ImageGen, ferramenta nativa, em 6 de setembro de 2026**, usando a primeira prancha como referência de edição. Responde ao pedido do usuário: manter a proposta e torná-la **mais ilustrada que realista**. [Prompt integral da revisão](concepts/galaxy-study-v02.prompt.txt).

O traço agora define mais claramente casas, camadas de papel, raízes, Morfeu e nave. Sombras e vegetação se organizam em massas pintadas; o personagem tem olhos e expressão mais legíveis. A profundidade dos mundos permanece, enquanto a pincelada e o contorno ganham presença.

Esta é a referência de discussão mais recente. Ainda será necessário ajustar densidade e enquadramento para a composição real da página, especialmente os espaços de nomes/controles e a escala mobile. Não é uma captura de interface nem um conjunto de assets separados para produção.

## Primeira prancha — histórico da direção

![Estudo inicial da galáxia Goiaba Lunar](/Users/mac/Documents/portfolio/docs/studio/concepts/galaxy-study-v01.png)

**Estudo conceitual gerado com ImageGen, ferramenta nativa, em 6 de setembro de 2026.** Cindra à esquerda, CommissionMatch acima ao centro/direita, Mangue abaixo à direita, Morfeu e a nave no primeiro plano. [Prompt integral](concepts/galaxy-study-v01.prompt.txt).

A prancha explora silhuetas, materiais e relação entre mundos. Não é screenshot de uma interface, arte final aprovada, referência fotográfica do Morfeu nem representação de funcionalidades já implementadas. As arquiteturas e a nave são invenções para este estudo. As pequenas obras pintadas na ambientação do CommissionMatch não representam artistas do produto.

O que levar para o próximo estudo: relevo de papel do CommissionMatch; raízes abertas e água do Mangue; calor habitado do Cindra; cabine que permite reconhecer Morfeu. O que ainda refinar: simplificar detalhes para a escala de celular; dar mais presença às cores próprias de cada produto; estabelecer áreas calmas para nomes e controles; definir a aparência do gato sem tratá-la como retrato fiel. A pequena lua é um marco ambiental inventado, não uma substituição do logo original.

**Feedback recebido depois desta versão:** a proposta agradou, mas o usuário pediu menos realismo e mais ilustração. A segunda prancha aplica esse ajuste sem substituir os três mundos. As duas versões são preservadas para comparação.

## Paletas de trabalho derivadas dos projetos

| Identidade | Base e tinta | Accents de referência | Tipografia atual relevante |
|---|---|---|---|
| Goiaba Lunar | Espaço `#080808`; texto `#f4e9dd` | Rosa `#efabc3`, verde `#a9d7aa`; azul `#334b88` e magenta `#aa468b` do portal | VT323 na assinatura; Instrument Serif editorial; Manrope nos controles |
| Cindra | Creme `#fbf4ea`; tinta `#291c14` | Ember `#cd632d`, sage `#7ea576`, sky `#68a8c7`, plum `#925b8d`, gold `#dbb155` | Sora e Geist; wordmark é asset próprio com lettering serifado |
| CommissionMatch | Pergaminho `#F4F1EA`; tinta `#16130F` | Oliva `#5C6B2A`, oliva suave `#E2E6C9`, papel profundo `#E7E3D0` | Alegreya, Alegreya Sans, IBM Plex Mono; IM Fell English no wordmark |
| Mangue | Papel `#FAF7EE`; tinta `#2B251C`; noite `#171816` | Ação floresta `#235539`, acento diurno `#245439`, acento noturno `#B1CCB6` | Newsreader, Manrope, JetBrains Mono |

Fontes: [Goiaba Lunar](research/goiaba-lunar.md), [Cindra](research/cindra.md), [CommissionMatch](research/commissionmatch.md), [Mangue](research/mangue.md).

**Precisão:** os hex de Cindra acima são tokens nativos existentes no pacote compartilhado; a fonte de verdade web usa OKLCH e está transcrita integralmente no estudo. Não presumir equivalência matemática exata. No Mangue, dourado Spark sinaliza IA; o caminho narrativo deve usar o verde apropriado, sem reutilizar dourado como brilho genérico.

## Assets existentes a preservar

| Material | Fonte existente | Papel no novo estúdio |
|---|---|---|
| Logo Goiaba Lunar | [goiaba-lunar.png](/Users/mac/Documents/portfolio/assets/images/goiaba-lunar.png) | Marca reconhecível; não redesenhar silenciosamente. |
| Morfeu ilustrado | [SVG articulado](/Users/mac/Documents/portfolio/index.html:325) | Base gráfica de cor, silhueta e expressão; evoluir para piloto. |
| Wordmark Cindra | [logo-light-text.png](/Volumes/SSD/Documents/cindra/src/lib/assets/brand/logo-light-text.png) | Nome com lettering fiel; escolher variante conforme o fundo. |
| Habitantes e plantas de Cindra | [companions](/Volumes/SSD/Documents/cindra/packages/shared/src/companions/index.ts:14), [planta](/Volumes/SSD/Documents/cindra/static/projects/plants/ember_stage_06.png) | Citar visualmente o universo já existente; separar Morfeu de Ember e cuidadores. |
| Símbolo CommissionMatch | [logo.svg](/Users/mac/Documents/commission-match/apps/web/src/assets/logo.svg) | Orientação, selo e reconhecimento do ateliê. |
| Gravura CommissionMatch | [featured-artist.webp](/Users/mac/Documents/commission-match/apps/web/src/assets/images/featured-artist.webp) | Referência de material e linguagem; origem/crédito registrados no estudo precisam acompanhar eventual reutilização. |
| Wordmark Mangue | [logo-mangue-full.png](/Users/mac/Documents/pathfork/static/brand/logo-mangue-full.png) | Nome e raízes; há variante noturna. |
| Gravura de Mangue | [landing-hero.png](/Users/mac/Documents/pathfork/static/images/landing-hero.png) | Referência de traço de raízes e vegetação. |

Os arquivos de produto permanecem nos repositórios de origem nesta fase. Para implementação, copiar apenas a seleção final para o estúdio com registro de origem; não depender de caminhos fora do repositório em runtime.

## O que desenhar

| Grupo | Entregável de direção | Separação necessária para movimento |
|---|---|---|
| Galáxia | Prancha panorâmica e composição vertical | Campo distante, poeira/nebulosa em planos, estrelas próximas e zonas livres para UI |
| Hiperespaço | Quadros de aceleração, trânsito e desaceleração | Estrelas/riscos, nave, câmera e estado de chegada; texto fora da imagem |
| Morfeu | Folha de personagem ilustrada, vistas frontal/perfil/3/4 e expressões; olhos e manchas legíveis | Cabeça, olhos/pálpebras, orelhas, cauda e patas com pontos claros de articulação |
| Nave | Vistas 3/4, lateral, frontal e traseira, repouso e voo; contornos desenhados e sombras pintadas | Casco, asas, cabine, vidro, piloto, luzes e propulsão |
| Cindra | Silhueta no mapa e diorama próximo | Terreno/casas, lareira/árvore, vegetação, detalhes de habitantes e interface real em plano separado |
| CommissionMatch | Silhueta de papel e ateliê/galeria próxima | Lâminas, relevo gravado, fachadas, obras selecionadas, molduras e painel de serviço |
| Mangue | Silhueta com raízes expostas e cena de leitura | Água, margens, raízes, copas, percurso selecionado e plano de manuscrito |
| Controles | Navegação do mapa e de cada mundo | Elementos nativos de interface, independentes dos bitmaps |
| Fallbacks | Imagem estável de cada composição | Nome, descrição, status e links continuam como texto acessível |

Cada mundo deve ser reconhecível em três escalas: miniatura no mapa; aproximação; exploração. Antes de detalhar arquitetura e textura, comparar as três silhuetas lado a lado e em tons de cinza. Se parecerem o mesmo planeta, a direção ainda não está resolvida.

## Material de produto a capturar

### Cindra

Preparar um quadro demonstrativo sem dados pessoais: frase cotidiana → interpretação → revisão → itens nas áreas. Capturar uma tela atual, usando a mesma seleção e os mesmos itens em todos os quadros. Complementar com um cuidador e uma planta real se eles ajudarem a compreender o produto.

Rotas candidatas: `/`, `/#demo`, `/app` com áreas expandidas por `?expand=`. Condições e rotas completas estão no [estudo](research/cindra.md). Não usar a imagem social antiga de seis áreas como prova do dashboard atual.

### CommissionMatch

Selecionar obras e um serviço da prévia, com indicação visível de exemplo. Capturar a home atual, a galeria aberta e a estimativa correspondente. Não montar cenas que sugiram artistas reais cadastrados usando perfis fictícios.

Rotas candidatas: `/` e `/#preview`. A presença da seção depende do estado da home. A captura deve conservar o estado Em prévia confirmado pelo usuário; detalhes no [estudo](research/commissionmatch.md).

### Mangue

Preparar uma narrativa curta em português: duas escolhas, consequências perceptíveis e retorno para experimentar outro caminho. O mapa e o leitor devem usar a mesma história. A sugestão do estudo é uma carta encontrada nas raízes; ainda é conteúdo proposto.

Priorizar `/tour` como referência de interação local, pois usa o leitor compartilhado; confirmar antes sua disponibilidade pública. Capturas do diretório de redesign são protótipos separados. Detalhes no [estudo](research/mangue.md).

## Ordem proposta para a próxima rodada visual

1. Usar a segunda prancha, com predomínio da ilustração, para discutir material, densidade, cor e escala.
2. Definir Morfeu/nave e três silhuetas numa folha de direção.
3. Compor o mapa e uma cena próxima do Cindra, em desktop e mobile, com interface legível.
4. Resolver CommissionMatch e Mangue no mesmo universo, cada um com materiais próprios.
5. Produzir os assets separados e as capturas reais escolhidas.

Uma imagem composta de atmosfera não deve virar automaticamente um único fundo com zonas clicáveis. A etapa de produção precisa preservar as camadas e os pontos de interação que dão vida ao mundo.

## Áudio e proveniência

**Áudio confirmado pelo usuário:** efeitos pontuais e ambientes suaves de cada mundo. Motor discreto, lareira, papel, água e respostas curtas compõem a direção proposta. Iniciar por um controle discreto de ativação; oferecer silêncio imediato e manter a navegação funcionando sem som. Música contínua e voz falada não fazem parte do escopo definido.

A pauta, a lista proposta de arquivos e os candidatos locais estão no [plano sonoro](audio.md). Nenhum novo arquivo de som foi produzido, selecionado por audição ou integrado nesta etapa.

Para cada asset produzido ou reutilizado, registrar caminho final, fonte, versão/data, finalidade e, quando gerado, prompt integral e ferramenta. Elementos rejeitados não passam a fazer parte do sistema só por existirem em uma prancha.
