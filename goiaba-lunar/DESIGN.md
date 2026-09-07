# Goiaba Lunar — revisão 5: modelos e viagem

6 de setembro de 2026. A revisão reconstrói os cinco modelos com silhuetas e materiais próprios e transforma a navegação em uma viagem tridimensional visível. Fundo e interface continuam ilustrados.

## Marca

O lettering autoral da revisão 3 foi retirado. A marca original do portfólio, o gato sobre uma lua de goiaba em pixel art, voltou ao cabeçalho, à chegada e ao favicon. O nome usa VT323 local. O raster original é preservado; nenhuma nova logo foi gerada.

## Modelos

Three.js renderiza planetas e nave com profundidade, materiais, luz direcional, ambiente e sombras. O cavaleiro é uma ilustração gerada com referências históricas e exibida como imagem transparente:

- Cindra: esfera com correntes atmosféricas em cobre, vinho e luz pêssego; nuvens fluidas e borda iluminada dão profundidade à silhueta contínua.
- CommissionMatch: esfera oliva e marfim, com faixas de nuvens e anéis inclinados de poeira translúcida, separados por uma abertura fina.
- Mangue: esfera petróleo e jade, com correntes sinuosas, véus claros e dispersão de luz verde-água na atmosfera.
- Nave Semente: fuselagem arredondada, asas crescentes, propulsores anulares, cockpit aberto e carga assimétrica. Estrutura petróleo, casco marfim, nervuras e fixadores de cobre. Morfeu branco e laranja tem esclerótica branca, íris circular em âmbar dourado, pupila oval vertical, reflexos da iluminação, sorriso curvo, orelhas articuladas e cauda. O pedido de naturalidade ocular v06 substitui os reflexos quadrados anteriores.
- Cavaleiro (7 de setembro): ilustração monocromática com traço de pena e hachuras, inspirada na armadura gótica alemã de cerca de 1480. Sallet com proteção traseira, bevor separado, placas articuladas e malha nas aberturas. Pose diagonal à deriva, mãos relaxadas e pernas assimétricas, sem capa ou espada. Referências e limites históricos em `../docs/studio/research/knight.md`.

Os planetas são construídos em `js/three/planets.js`; Morfeu e Semente são autorados por `source/blender/v06/build.py` e `ship.py` e carregados por `ship-asset.js`. O cavaleiro usa `assets/drawn/knight-floating.webp`, com transparência, derivado do original em `source/illustration/knight-floating.png`; não participa de WebGL. `scene.js` cuida de câmera, enquadramento, iluminação, renderização e ciclo de vida dos objetos 3D. A câmera ortográfica dá acabamento ilustrado; volume e rotação dos planetas pertencem às malhas.

## Interação e composição

O mapa e os produtos preservam a experiência existente. O fundo galáctico aprovado e as gravuras/marcas dos produtos continuam. O menu “O estúdio” e o som permanecem removidos.

Uma única camada WebGL transparente desenha nos espaços dos links sem capturar eventos. Planetas, cavaleiro e nave mantêm nomes acessíveis e ações HTML nativas. Movimento reduzido, pausa e aba oculta são respeitados. Os SVGs anteriores são fallback se WebGL não estiver disponível ou perder o contexto. A restauração recompõe o ambiente de iluminação.

A navegação inferior compartilha a superfície do produto, sem cápsula de seleção. As miniaturas também são 3D; o destino ativo ganha escala e sua própria tipografia.

O arraste gira os planetas com inércia; cliques e teclado mantêm a navegação. Morfeu acompanha o cursor e a nave prepara os motores ao apontar um destino. O cavaleiro, cerca de 22% menor, pode ser arrastado e lançado com mouse ou toque: acompanha a mão com leve atraso, inclina, ganha impulso ao soltar e rebate suavemente nas bordas. Segurar antes de soltar permite posicioná-lo; setas dão impulsos e Escape restaura o início. Um clique simples continua abrindo o portfólio. A deriva ambiente mantém o ciclo de 18 segundos, e o cabeçalho compacto permanece estático. Pausa, movimento reduzido e aba oculta interrompem a inércia. Morfeu pisca e reage ao carinho.

`flight.js` usa uma câmera em perspectiva e uma trajetória curva entre as posições do mapa. A nave decola, viaja, se aproxima e é encoberta pela superfície do planeta antes da passagem de cor para o projeto. Há rastro dos motores, luz de propulsão e atmosfera. A viagem dura 5,8 s, retorno 4,6 s e chegada inicial 2,4 s; a chegada mantém o mapa interativo. Pausa, Escape e o botão de chegada encerram o percurso com foco no destino.

## Entrega e verificação

Three.js e o código são empacotados localmente em `js/studio.js`; não há CDN ou importação remota; a nave Blender é carregada do GLB local antes da inicialização da cena. O script clássico permite abrir também `index.html` diretamente. O servidor de desenvolvimento recompila o bundle ao editar os módulos.

Validações cobrem geometria dos cinco modelos, animação determinística, câmera e tempos de voo, histórias/rotas, build, desktop e celular. Detalhes da conferência estão em `source/verification-3d.md`.

## Materiais planetários — 7 de setembro de 2026

Os três mundos adotam silhuetas esféricas naturais e texturas atmosféricas fluidas, com caráter mágico e as paletas dos respectivos produtos. A referência de direção é [Metalforge Orbs](https://metalforge.xyz/editor#tool=orbs). A identidade vem da cor, das correntes e da luz; chamas, pinceladas em relevo, árvores e raízes foram retiradas dos planetas.

`js/three/planets.js` combina uma superfície opaca em `ShaderMaterial`, ruído procedural no espaço do objeto, nuvens transparentes em uma camada separada e dispersão atmosférica. A fronteira suave entre dia e noite sustenta o volume; o movimento lento das nuvens acompanha a rotação. CommissionMatch acrescenta anéis de poeira translúcida. `scene.js` mantém a câmera ortográfica e o enquadramento da extensão completa durante a rotação.

O fallback dos três planetas agora usa PNGs transparentes em `assets/drawn/*-planet.png`, renderizados dos mesmos modelos Three.js e referenciados em `index.html`. A revisão Impeccable aprovou os registros de desktop (1440×1000) e celular (390×844), sem defeitos visuais acionáveis. Os 14 testes passaram, incluindo colisão com a superfície opaca no voo e limites de enquadramento; a asserção do relevo literal anterior foi removida. Proveniência e registros em `source/planet-review/README.md`. Não houve publicação nesta etapa.

## Integração do Morfeu e Semente v06

O mapa e as viagens usam `assets/models/morfeu-scout-v06.glb`, autorado em Blender. O carregamento é compartilhado, com cópias independentes do esqueleto, geometria e materiais por cena. O clipe original preserva respiração, piscada e cauda; cabeça e pálpebras recebem reações contidas ao cursor e ao carinho. Rotores giram em sentidos opostos e as aletas respondem à propulsão. A nave procedural anterior continua como reserva caso o GLB não carregue, inclusive ao abrir por `file://`. O pacote de distribuição inclui somente o GLB utilizado, mantendo versões anteriores fora do build.

`eye-lighting.js` cria um ambiente de reflexão próprio para o material ocular de cada cópia. A íris conserva sua textura circular e a cor âmbar; os reflexos dependem da vista e da superfície, sem marcas brancas pintadas. Esse ambiente pertence à integração Three.js e não é incorporado ao GLB.

Na v05, a integração local foi conferida em 1440×1000 e 390×844: mapa, partida, carinho, pausa, chegada por botão e retorno. A revisão v06 retoma os olhos nos mesmos modelos; os registros atuais estão em `source/blender/README.md`. Os testes unitários existentes da nave cobrem o fallback procedural. Não houve publicação remota nesta etapa.

A legenda do cavaleiro usa Grenze Gotisch local em “Gabriel” (18 px no desktop, 16 px no celular) e IM Fell English em “Portfólio” (11/10 px). O texto foi encurtado e a seta reduzida, com tons de marfim e aparência medieval discreta.
