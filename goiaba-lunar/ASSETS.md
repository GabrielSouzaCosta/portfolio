# Assets e procedência

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

Manrope, Instrument Serif, VT323, Sora, Alegreya e IM Fell English são arquivos locais. Os textos SIL Open Font License acompanham os arquivos em `assets/fonts/`. Newsreader não foi incluída na interface; o wordmark oficial de Mangue permanece em PNG.

## Som — histórico, fora da interface e do build

Dez efeitos e ambientes originais foram sintetizados para o projeto, sem amostras de terceiros, música ou voz. Produção: Python/NumPy e ffmpeg. Arquivos finais MP3 em `assets/audio/`.

`source/audio-manifest.json` descreve as receitas e a integração; `source/audio-audit.json` registra duração, emendas, picos e comportamento mono. `source/generate-audio.py` reproduz os masters e exportações quando suas dependências estão disponíveis. A auditoria de arquivos e reprodução no navegador foi feita; a escuta artística em dispositivos físicos permanece uma avaliação do proprietário.
