# Assets e procedência

## Galáxia — a primeira tela (setembro de 2026)

A tela inicial ganhou profundidade e passou a mostrar cada mundo antes da viagem. Nenhuma imagem desta seção foi feita com gerador de imagens.

- **Goiaba lunar** (`assets/drawn/goiaba-moon.png`): a marca em pixel art de verdade: a lua-goiaba crescente com Juquinha, o gato frajola, dormindo no chifre de cima. Desenhada em código por `source/pixel/goiaba_moon.py` numa grade de 104x96, com 8 quadros de respiração e brilhos, exibida só em escalas inteiras. A marca `assets/brand/goiaba-lunar.webp` é a referência de desenho; seus pixels não seguem uma grade, por isso a lua foi redesenhada em vez de recortada. Juquinha segue a foto do proprietário: pelagem e máscara pretas, focinho, peito e patas brancos, nariz rosa.
- Na galáxia, a barra de rota inferior não aparece: ela repetia os planetas. Ela volta dentro dos mundos.
- **Prévia dos mundos**: ao passar o cursor, ao focar pelo teclado ou, no celular, em rodízio automático, cada planeta assume por um instante a linguagem do seu mundo, em shader (`js/three/planets.js`). Cindra vira pixel art em grade de tela com pontilhado; CommissionMatch vira globo gravado a tinta; Mangue é diferente: a galáxia inteira vira página. A partir de Mangue, a tela passa a papel em preto e branco (sépia) e tudo para; a rota de Morfeu até Mangue é escrita à mão, “Era uma vez...”, de modo que as letras são o caminho; conforme a pena avança, a cor volta, a capitular ganha rubrica e ouro, folhas brotam nos traços, os mundos voltam a girar e uma trilha de luz passa a percorrer as palavras. O próprio planeta vira manuscrito: continentes feitos de linhas escritas, mar pautado, litoral em tinta vermelha. O véu é um `backdrop-filter` que inverte a luminosidade mantendo o matiz (`hero.css`); a escrita é `js/ink.js`, que procura um trecho livre de planetas e rótulos (no celular, a escrita toma o lugar da fala de Morfeu). Com movimento pausado a página já aparece escrita e colorida. Ember, Pip e Thistle (`assets/drawn/cindra/`) espiam por trás do horizonte; a rosa dos ventos de CommissionMatch é SVG desenhado em código e o cavaleiro é `assets/drawn/cm-knight-piece.webp`.
- **Rota de Morfeu** (`js/hero.js`): a nave vira para o mundo escolhido e traça um curso pontilhado até ele; a mensagem do Morfeu acompanha.
- Profundidade com o ponteiro, cometas raros em `js/stars.js` e uma pequena lua orbitando o “ó” de “órbita”. Tudo para quando o movimento está pausado ou reduzido; a prévia aparece sem animação.

## Morfeu v07 (setembro de 2026)

`assets/models/morfeu-scout-v07.glb` substitui a v06 no site. Fonte em `source/blender/v07/build.py`. Mudanças: crânio mais liso, bochechas rosadas como no sprite, tufos de pelo nas bochechas e cachecol cor de goiaba. As pontas soltas do cachecol tremulam em tempo real conforme o empuxo (`js/three/ship-asset.js`). O piloto ficou um pouco maior no cockpit. Olhos, proporções e a nave Semente são os da v06.

## Cindra — O Vale dos Cantinhos (setembro de 2026)

O mundo de Cindra virou um vale em pixel art onde Morfeu passeia, desenhado primeiro em `Goiaba-lunar.pen` (Pencil) e depois implementado. Tudo divide a mesma grade de 704x384 pixels e é ampliado sem suavização.

- `assets/art/cindra-valley.png`: vale gerado pela geração de imagens do Pencil (sem personagens nem texto), reduzido para a grade de 704x384 e para uma paleta limitada.
- `assets/drawn/cindra/ember.png`, `thistle.png`, `pip.png`, `mote.png`, `bramble.png`, `loom.png`, `fern.png`, `kernel.png`, `wisp.png`: os sprites oficiais dos cuidadores do Cindra (`design-assets/mobile/` do repositório do Cindra), na grade original de 16x16 com contorno de 1 pixel.
- `assets/drawn/cindra/glimmercap.png`, `snackdragon.png`, `nimb.png`, `oramis.png`, `luthier.png`, `drizzlemane.png`: personagens recortados das artes das cartas reais da Série 1 do Cindra (`static/cindra/characters/`), com fundo removido pelo Pencil e reduzidos para a grade.
- `assets/drawn/cindra/morfeu.png` e `morfeu-walk.png`: o sprite original de Morfeu do portfólio (`../index.html`), rasterizado e reduzido à metade, com os olhos retocados à mão.
- `assets/drawn/cindra/ship.png`: nave de Morfeu pousada, gerada no Pencil a partir da nave de `morfeu-ship.svg` e reduzida para a grade.

As falas dos cuidadores e os textos das cartas são as traduções pt-BR do próprio Cindra. As notas curtas sobre cada área foram escritas para o portfólio.

## CommissionMatch — O Mapa dos Traços (setembro de 2026)

O mundo de CommissionMatch virou um mapa medieval em xilogravura, desenhado primeiro em `Goiaba-lunar.pen` (Pencil) e depois implementado.

- `assets/art/cm-map.webp`: mapa gerado pela geração de imagens do Pencil (tinta preta sobre pergaminho, sem texto) e convertido para WebP. Os cartuchos vazios do próprio mapa recebem os nomes das terras, a bolsa e a legenda dos dragões.
- `assets/drawn/cm-knight-piece.webp`: cavaleiro a cavalo como peça de tabuleiro, gerado no Pencil, com fundo removido pelo Pencil e recortado.
- `assets/drawn/morfeu-ship-ink.webp`: versão em tons de tinta de `morfeu-ship.svg`, rasterizada e dessaturada.
- `assets/brand/commissionmatch-ink.png`: a rosa dos ventos da marca CommissionMatch, recolorida em tinta.

Preços, câmbio e terras do mapa são exemplos ilustrativos, sinalizados na interface. As gravuras `commission-*.webp` abaixo deixaram de aparecer na interface.

## Mangue — O Manguezal das Histórias (setembro de 2026)

O mundo de Mangue virou um manuscrito aberto sobre uma mesa escura. A página da esquerda conta a história; a da direita é um mangue cujas raízes são os caminhos já lidos. Virar a página mostra a mesma história como o autor vê, e o visitante pode plantar uma raiz própria. A paleta e as fontes seguem o design do próprio Mangue (tinta `#2B251C`, verde `#235539`, rubrica), com a referência de herbário do arquivo de design do Mangue.

- `assets/art/mangue-manuscript.webp`: livro aberto gerado pela geração de imagens do Pencil (página esquerda pautada e vazia, árvore sem raízes e faixa de água à direita, sem texto), recortado para 1170x695. Fonte em `design/mangue-manuscript-source.png`. As raízes, nós e propágulos são SVG e HTML desenhados por cima, nas coordenadas dessa grade.
- `assets/drawn/morfeu-margin.webp`: Morfeu como marginália em tinta e aquarela, gerado no Pencil, recortado e reduzido. Fonte em `design/morfeu-margin-source.png`. Fica sobre o pergaminho com `mix-blend-mode: multiply`, sem remoção de fundo.
- `assets/drawn/morfeu-ship-ink.webp` e `assets/brand/mangue-night.png` são reaproveitados; a marca é escurecida em CSS.

A história de exemplo “A carta entre as raízes” (quatro cenas, cinco finais, um deles lacrado pela marca “carta”) foi escrita para o portfólio. A raiz do visitante fica só no navegador dele (`localStorage`).

## Modelos atuais — revisão 5

Os cinco elementos foram reconstruídos em `js/three/planets.js` e `js/three/characters.js`: terreno em terraços, pinceladas extrudadas, arquipélagos com árvores, armadura articulada e nave com casco/painéis/turbinas. Materiais, luz e sombras são calculados em tempo real. Superfícies estáticas dos personagens são agrupadas por material. Não houve geração de imagens, download de modelos 3D ou uso de texturas externas. A atmosfera e o rastro de voo usam shaders autorais em `js/three/flight.js`.

A marca original `assets/brand/goiaba-lunar.webp` voltou ao cabeçalho, chegada e favicon. O lettering da revisão 3 saiu da interface. A referência do Morfeu continua sendo o sprite original do portfólio; agora o gato também tem geometria real.

Three.js 0.180.0 é distribuído no bundle local sob MIT; licença preservada em `assets/licenses/three-MIT.txt`. O ambiente de iluminação é construído proceduralmente pelo RoomEnvironment do Three.js. VT323, já licenciada no projeto, acompanha a marca original.

O único raster gerado no cenário continua sendo o fundo galáctico previamente existente. SVGs da revisão 3 são fallback de compatibilidade caso WebGL esteja indisponível.

## Desenhos anteriores — revisão 3

`assets/drawn/cindra.svg`, `commissionmatch.svg`, `mangue.svg` e `knight.svg` são desenhos vetoriais autorais, feitos em código nesta revisão. `morfeu-ship.svg` combina uma nave nova com a cabeça do sprite original de Morfeu de `../index.html`. Não houve geração de imagens. Os arquivos SVG são as fontes editáveis.

`assets/brand/studio-light.svg`, `studio-dark.svg` e `favicon.svg` agora usam uma goiaba orbital e lettering autoral em caminhos SVG, sem fonte. O script antigo em `source/wordmark/build.py` é histórico e não reconstrói a marca atual.

O fundo `assets/art/galaxy-background.webp` permanece. Os quatro rasters antigos de personagens/planetas e o áudio foram desligados da interface e excluídos do build; ficam no checkout apenas como histórico.

## Ilustrações anteriores — histórico

As cinco ilustrações foram produzidas com a ferramenta nativa de geração de imagens, usando a segunda prancha aprovada como referência de estilo e assunto. Os prompts completos e as saídas de origem estão em `source/art-generation.json`.

Arquivos finais: `assets/art/cindra.webp`, `commissionmatch.webp`, `mangue.webp`, `morfeu.webp` e `galaxy-background.webp`.

Cindra e Morfeu tiveram falha técnica na transparência gerada. Os arquivos com xadrez foram descartados. Uma edição nativa posterior produziu fundo preto; o site usa composição screen; a miniatura de Cindra também recebe máscara de luminância em CSS. CommissionMatch e Mangue preservam alpha verdadeiro. As exportações de produção apenas reduzem dimensão/compressão via cwebp, sem alterar o desenho. `source/production-assets.json` registra cada arquivo final e seu hash.

Na revisão 2, as três ilustrações dos planetas foram removidas dos mundos dos produtos, permanecendo somente no mapa e na rota. Nenhuma nova imagem raster foi gerada.

## Marcas e gravuras

As marcas originais Goiaba Lunar, Cindra, CommissionMatch, Mangue e o sprite Ember vieram dos repositórios do proprietário. A assinatura anterior foi construída a partir de Instrument Serif; sua receita histórica está em `source/wordmark/`. A marca atual está descrita na revisão 3 acima. O símbolo claro de CommissionMatch mantém o traçado original com adaptação de preenchimento para o fundo escuro. Os caminhos de origem estão em `source/product-assets.json`.

As gravuras `commission-fantasy.webp`, `commission-character.webp` e `commission-nature.webp` são cópias de `featured-artist-640.webp`, `knight.webp` e `eagle.webp` do projeto CommissionMatch. Crédito visível preservado: **Designed by rawpixel.com / Freepik**, com link para https://www.freepik.com/. São referências da identidade visual, sem nomes de artistas ou preços inventados. O checkout original documenta a atribuição, mas não contém a licença individual de aquisição.

## Fontes

Manrope, Instrument Serif, VT323, Sora, Alegreya e IM Fell English são arquivos locais. A letra manuscrita de Mangue é EMS Allure (SIL Open Font License; traço único de Sheldon B. Michaels a partir de Allura, de Rob Leuschke; conversão SVG de Windell H. Oskay, via o pacote `hersheytext`): só os glifos da frase estão em `js/ink-glyphs.js`, com o crédito no cabeçalho. Os textos SIL Open Font License acompanham os arquivos em `assets/fonts/`. Newsreader não foi incluída na interface; o wordmark oficial de Mangue permanece em PNG.

## Som — histórico, fora da interface e do build

Dez efeitos e ambientes originais foram sintetizados para o projeto, sem amostras de terceiros, música ou voz. Produção: Python/NumPy e ffmpeg. Arquivos finais MP3 em `assets/audio/`.

`source/audio-manifest.json` descreve as receitas e a integração; `source/audio-audit.json` registra duração, emendas, picos e comportamento mono. `source/generate-audio.py` reproduz os masters e exportações quando suas dependências estão disponíveis. A auditoria de arquivos e reprodução no navegador foi feita; a escuta artística em dispositivos físicos permanece uma avaliação do proprietário.
