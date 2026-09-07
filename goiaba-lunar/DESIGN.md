# Goiaba Lunar — revisão 5: modelos e viagem

6 de setembro de 2026. A revisão reconstrói os cinco modelos com silhuetas e materiais próprios e transforma a navegação em uma viagem tridimensional visível. Fundo e interface continuam ilustrados.

## Marca

O lettering autoral da revisão 3 foi retirado. A marca original do portfólio, o gato sobre uma lua de goiaba em pixel art, voltou ao cabeçalho, à chegada e ao favicon. O nome usa VT323 local. O raster original é preservado; nenhuma nova logo foi gerada.

## Modelos

Three.js renderiza malhas com profundidade, materiais, luz direcional, ambiente e sombras. Tudo foi modelado em código, sem imagens geradas ou modelos externos:

- Cindra: placas terracota em terraços, vales ameixa, caldeira com chama animada e pequena lua orbital.
- CommissionMatch: esfera oliva, pinceladas marfim com espessura e pontas, anéis inclinados gravados e lua coral.
- Mangue: oceano verde, arquipélagos e delta elevados, canais de maré, raízes espessas e bosques com copas volumosas.
- Nave: estrutura petróleo, casco com painéis marfim, turbinas, bocais e jatos. Morfeu branco e laranja tem olhos âmbar, orelhas articuladas e cauda.
- Cavaleiro: proporções esguias, aço escuro, bacinete com viseira projetada, placas sobrepostas, espada e capa verde com verso bordô e dobras móveis.

As fontes dos modelos são `js/three/planets.js` e `characters.js`. `scene.js` cuida de câmera, enquadramento, iluminação, renderização e ciclo de vida. A câmera ortográfica dá acabamento ilustrado; volume e rotação pertencem às malhas. A rotação é em torno do eixo do planeta, não uma imagem girando no plano.

## Interação e composição

O mapa e os produtos preservam a experiência existente. O fundo galáctico aprovado e as gravuras/marcas dos produtos continuam. O menu “O estúdio” e o som permanecem removidos.

Uma única camada WebGL transparente desenha nos espaços dos links sem capturar eventos. Planetas, cavaleiro e nave mantêm nomes acessíveis e ações HTML nativas. Movimento reduzido, pausa e aba oculta são respeitados. Os SVGs anteriores são fallback se WebGL não estiver disponível ou perder o contexto. A restauração recompõe o ambiente de iluminação.

A navegação inferior compartilha a superfície do produto, sem cápsula de seleção. As miniaturas também são 3D; o destino ativo ganha escala e sua própria tipografia.

O arraste gira os planetas com inércia; cliques e teclado mantêm a navegação. Morfeu e cavaleiro acompanham o cursor; a nave prepara os motores ao apontar um destino. O cavaleiro acena e sua capa acompanha o movimento. Morfeu pisca e reage ao carinho.

`flight.js` usa uma câmera em perspectiva e uma trajetória curva entre as posições do mapa. A nave decola, viaja, se aproxima e é encoberta pela superfície do planeta antes da passagem de cor para o projeto. Há rastro dos motores, luz de propulsão e atmosfera. A viagem dura 5,8 s, retorno 4,6 s e chegada inicial 2,4 s; a chegada mantém o mapa interativo. Pausa, Escape e o botão de chegada encerram o percurso com foco no destino.

## Entrega e verificação

Three.js e o código são empacotados localmente em `js/studio.js`; não há CDN ou importação remota; a nave Blender é carregada do GLB local antes da inicialização da cena. O script clássico permite abrir também `index.html` diretamente. O servidor de desenvolvimento recompila o bundle ao editar os módulos.

Validações cobrem geometria dos cinco modelos, animação determinística, câmera e tempos de voo, histórias/rotas, build, desktop e celular. Detalhes da conferência estão em `source/verification-3d.md`.

## Integração do Morfeu v04

O mapa e as viagens usam `assets/models/morfeu-scout-v04.glb`, autorado em Blender. O carregamento é compartilhado, com cópias independentes do esqueleto, geometria e materiais por cena. O clipe original preserva respiração, piscada e cauda; cabeça e pálpebras recebem reações contidas ao cursor e ao carinho. A nave procedural anterior continua como reserva caso o GLB não carregue, inclusive ao abrir por `file://`. O pacote de distribuição inclui somente o GLB utilizado, mantendo versões rejeitadas fora do build.

Integração local conferida em 1440×1000 e 390×844: mapa, partida, carinho, pausa, chegada por botão e retorno. Os 14 testes existentes e o build passaram; testes unitários existentes da nave continuam cobrindo o fallback procedural. Não houve publicação remota nesta etapa.
