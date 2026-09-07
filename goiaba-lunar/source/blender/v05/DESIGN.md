---
name: Morfeu e Semente v05
description: Regras visuais dos assets autorais de Blender, com integração local e revisão de acabamento SHIP.
colors:
  fur-warm-white: "#FFF9F0"
  fur-ginger: "#CE691F"
  crown-ginger: "#DC7B2A"
  tabby-dark: "#9C491D"
  ear-orange: "#D67525"
  nose-ear-rose: "#EBA392"
  iris-amber: "#FFAF43"
  iris-orange: "#CF651A"
  iris-edge: "#9A3C11"
  iris-rim: "#71321A"
  eye-pupil: "#191C18"
  mouth-lid-margin: "#765850"
  ship-ceramic-ivory: "#E6DEBF"
  ship-panel-edge: "#BFB597"
  ship-petrol-frame: "#193B40"
  ship-recess: "#102329"
  ship-titanium: "#738383"
  ship-copper: "#C66B3A"
  ship-coral: "#BB563E"
  ship-rubber: "#192021"
  ship-saddle: "#724831"
  ship-windscreen: "#417C83"
  ship-ion: "#79DFDC"
  ship-status-amber: "#FFBA5B"
  ship-markings: "#F9EED1"
  studio-ground: "#273741"
---

# Design System: Morfeu e Semente v05

## Overview

**Creative North Star: "Capitão caloroso de uma pequena nave exploradora artesanal"**

Morfeu conserva o corpo compacto da v04: cabeça larga próxima aos ombros, patas curtas, bochechas amplas e focinho discreto. A v05 corrige a identidade dos olhos para laranja e acrescenta um sorriso sutil, com cantos elevados e visíveis em três quartos. A pelagem branca e gengibre segue a foto do proprietário; os reflexos quadrados preservam a expressão do sprite do portfólio.

Semente é uma nave original construída integralmente em `ship.py`. Fuselagem em forma de semente, asas crescentes e dois propulsores anulares formam uma silhueta legível pequena. O cockpit aberto mantém o piloto visível; marfim, petróleo e cobre distinguem carenagem, estrutura e mecanismos. Carga lateral e antena introduzem assimetria moderada. Geometria, pintura por vértice e textura ocular foram autoradas localmente, sem modelos ou pixels de terceiros e sem geração de imagem.

**Key Characteristics:**

- Corpo compacto v04, pelagem branca e gengibre, íris laranja e reflexos quadrados.
- Sorriso curvo discreto, pálpebras integradas e animação contida.
- Casco contínuo, asas crescentes, cockpit aberto e propulsores anulares.
- Detalhes de montagem e manutenção em cobre, com carga e antena assimétricas.
- Leitura da silhueta no mapa e descoberta dos mecanismos na prévia em três quartos.

Registro pós-build em 7 de setembro de 2026. A revisão independente de acabamento terminou em **SHIP, sem correções materiais**, no escopo do personagem, da nave e da presença de ambos no site e na prévia locais. Olhos laranja, carisma, continuidade do corpo v04, identidade da nave e enquadramento desktop/celular atenderam ao contrato. Esse parecer não substitui a aprovação estética do proprietário.

Este arquivo rege os modelos v05. A direção da superfície permanece em `docs/studio/morfeu-v05.md`, na raiz do repositório; o sistema do site permanece em `goiaba-lunar/DESIGN.md`. A documentação deriva de `PRODUCT.md`, desse contrato, do DESIGN do site, do README de Blender, de `build.py`, `ship.py`, `stats.json`, `export-checks.json`, `../preview.html`, `../preview.js` e `js/three/ship-asset.js`. Não cria uma biblioteca de interface, uma nova anatomia ou uma nova direção visual para a landing page.

## Colors

Branco quente e gengibre identificam o gato; marfim, petróleo e cobre organizam a nave. Os valores do frontmatter são as entradas sRGB efetivamente usadas pelos scripts, convertidas para linear no Blender. São cores de material ou de mistura procedural, não amostras dos pixels sob iluminação.

### Primary

- **Fur warm white:** peito, patas, focinho, faixa clara da face, bigodes e ponta da cauda.
- **Fur ginger / Crown ginger / Tabby dark / Ear orange:** manchas do corpo e cauda, coroa, listras suaves e orelhas externas. As manchas e listras pertencem à pintura por vértice.
- **Iris amber / Iris orange:** mistura laranja com variação radial na textura ocular. **Iris edge / Iris rim** aprofundam a borda sem desviar para verde ou oliva.
- **Ship ceramic ivory / Ship petrol frame / Ship copper:** carenagem clara, estrutura escura e mecanismos ou faixas de cobre. A carenagem dos motores mistura marfim e petróleo sobre uma superfície contínua.

### Secondary

- **Nose ear rose:** nariz e interior das orelhas.
- **Ship coral:** identificação nas asas e caixa de serviço lateral.
- **Ship ion:** garganta e núcleo dos propulsores, algumas teclas e o farol de posição esquerdo.
- **Ship status amber:** luzes de navegação, comandos, antena e farol de posição direito.

### Neutral

- **Eye pupil / Mouth lid margin:** pupila escura, sorriso fino e margem das pálpebras.
- **Ship panel edge / Ship titanium:** bordas quentes, fixadores, grelhas, aros e arco de proteção.
- **Ship recess / Ship rubber / Ship saddle:** cockpit e cavidades, juntas e empunhaduras, assento.
- **Ship windscreen / Ship markings:** anteparo baixo petróleo e inscrições claras de identificação.
- **Studio ground:** piso do render Blender, restrito à apresentação de estúdio.

Os dois reflexos quadrados de cada olho são escritos diretamente na textura original de 256×256 em canais lineares; não recebem um hexadecimal aproximado. Declarações antigas de materiais sem uso visível não entram no inventário.

**The Orange Identity Rule.** Preservar a leitura laranja das íris em material e em render. O oliva documentado na v04 foi substituído pela correção explícita do proprietário.

## Layout

O gato senta com as patas dianteiras separadas, peito entre elas, posteriores dobradas e cauda que sai para trás e curva para o lado. A mesma transformação compacta é aplicada à malha, às posições dos morphs e ao esqueleto. No conjunto, o piloto recebe escala uniforme 0,58 e posição Blender `(0, 0.10, 0.40)`; a nave aponta para −Y. O anteparo e o painel ficam abaixo do rosto.

Os renders do gato usam câmera ortográfica, escala 2,75 e alvo `(0, 0, 1.07)`. O conjunto usa escala 5,35 e três vistas: três quartos, traseira e topo. As oito imagens Blender têm 1000×1000; a piscada fechada é o frame 52. Esses enquadramentos são evidência de inspeção, não substitutos para a câmera do site.

Na prévia, a câmera em perspectiva de 34° usa a dimensão máxima do modelo para enquadrá-lo; a distância é compensada pela proporção da janela. Há seleção de gato ou conjunto, vistas de frente/três quartos/costas, arraste orbital, pausa, controle de tempo e links de download. Em até 600 px, o canvas tem altura de 55svh e mínimo de 320 px, os controles quebram linha e a miniatura de referência é ocultada. Esses fatos descrevem a ferramenta existente; não estabelecem tokens globais de UI.

As capturas da prévia desktop têm 2560×2000 pixels para janela CSS de 1280×1000 em DPR 2; a móvel tem 390×844 pixels. As capturas do site desktop e do voo têm 1440×1000; a do site móvel tem 780×1688 pixels para janela CSS de 390×844 em DPR 2. A largura do documento móvel foi conferida em 390 px. No mapa desktop e móvel, asas, dois motores e piloto permanecem reconhecíveis dentro do espaço existente de Morfeu.

## Elevation & Depth

A profundidade vem de malhas reais, sombreamento suave e materiais Principled BSDF. A pelagem é uma superfície contínua com pintura por vértice, sem pelo de partículas. Corpo, cabeça e pálpebras usam rugosidade 0,83; orelhas externas, 0,78; nariz e interior das orelhas, 0,70. Os olhos usam rugosidade 0,47, nível especular 0,13 e coat 0,035, conservando os reflexos quadrados como parte da textura.

Na nave, a carenagem marfim usa rugosidade/metallic de 0,39/0,28; a estrutura petróleo e o cobre, 0,36/0,66 e 0,37/0,66. O metal dos mecanismos usa 0,30/0,83. As carenagens contínuas dos motores usam 0,39/0,38. Cavidades, borracha e assento têm acabamento mais fosco, separando vazio, vedação e apoio do piloto. Ion e âmbar têm emissão autorada de 2 e 1,5; o runtime do site varia a intensidade do material ion conforme a propulsão.

Os renders reais usam Blender 5.2.1, Cycles com 32 amostras, denoise, AgX Medium High Contrast e exposição −0,2. Três luzes de área combinam chave quente, preenchimento frio e recorte quente; sombras de contato ancoram o conjunto no piso. A prévia Three.js usa NeutralToneMapping, exposição 1, ambiente de sala e sombras VSM. Diferenças de iluminação e sombra entre Blender, prévia e site são condições reais desses renderizadores.

**The Mechanical Depth Rule.** Dar função visível aos detalhes: grelha ventila, aro contém o propulsor, mangueira liga o motor, fixador prende a carenagem. Preservar a superfície contínua sob faixas e mecanismos.

## Shapes

A cabeça funde crânio, mandíbula, ponte nasal, queixo e bochechas em uma superfície larga; o focinho permanece integrado. O corpo une tronco e membros com suavização localizada nas transições entre peito e patas. Remesh voxel é técnica de construção da superfície lisa, sem adotar a aparência voxel rejeitada. A cauda conserva a raiz enterrada e a orientação transportada entre seus anéis. A v05 mantém essa construção compacta da v04.

O nariz é um triângulo pequeno e arredondado. A boca é feita de tubos finos com dois cantos elevados; quatro bigodes claros acompanham as bochechas. Órbitas, superfícies oculares e pálpebras compartilham a mesma curvatura, com o olho recuado e a margem superior parcialmente sobre a íris em repouso. O close da piscada ainda permite perceber uma emenda e um perímetro tênues; a revisão final os considerou sem impacto material nesta escala. Não são uma escolha estilística a acentuar.

Semente tem proa romba alongada, asas curvas avançando ao redor dela e dois motores com entradas circulares e exaustões anulares. Chapas com bordas suavizadas cobrem uma estrutura petróleo; faixas de cobre acompanham a curvatura do casco. O cockpit reúne soleiras, junta, assento, comandos, console, anteparo baixo e arco traseiro. Caixa de serviço, antena, escotilha, inscrições `SEMENTE` e `01`, crescente com sementes em relevo e patins inferiores completam a construção. O crescente e as inscrições são geometria autoral, sem decalques de terceiros.

## Components

### Morfeu e expressão

`stats.json` registra 22 objetos de gato e rig com 23 ossos. O corpo tem pesos misturados, normalizados e limitados a quatro influências por vértice. Cabeça, orelhas e cadeia de quatro ossos da cauda conservam seus controles. Ambos os GLBs incluem um clipe `Morfeu_Idle` com 73 trilhas e duração de aproximadamente 6,0416665 segundos, cobrindo respiração, cabeça, orelhas, cauda e piscada.

Quatro superfícies de pálpebra, superior e inferior de cada olho, possuem morph `Blink` e fecham sobre olhos estáveis. Os frames de chave são 1, 49, 52, 55 e 145, com fechamento no 52. A textura procedural original fornece a íris laranja, a pupila ampliada e os dois reflexos quadrados por olho. A forma do sorriso é estática; não há rig facial completo documentado.

### Semente e mecanismos

`ship.py` constrói a nave original sem importar a nave v02. Peças estáticas são agrupadas por material e pai; `stats.json` registra 25 objetos de nave, incluindo os grupos de mecanismos. `EngineRotor_L`, `EngineRotor_R`, `VectorFin_L` e `VectorFin_R` permanecem nós independentes.

Na prévia e no site, os rotores usam ângulos opostos calculados pelo tempo, com velocidade de 1,8 rad/s. No site, a propulsão varia a inclinação das aletas e a emissão ion; essa animação é aplicada no navegador e não constitui um clipe exportado da nave. Os ventiladores de entrada são estáticos; os rotores animados ficam nas exaustões.

### Integração local

`js/three/ship-asset.js` carrega `assets/models/morfeu-scout-v05.glb` uma vez e cria cópias independentes de esqueleto, geometria, materiais e texturas para mapa e viagens. O clipe preserva o movimento autorado; cabeça e pálpebras recebem reações contidas ao cursor e ao carinho. O carinho pode fechar as pálpebras até 0,75, preservando o maior valor quando a piscada do clipe fecha mais. A nave procedural anterior é reserva para falha de carregamento, inclusive por `file://`; a prévia de modelos é servida por HTTP e depende de `node_modules` local.

### Evidência e limites

| Exportação | Triângulos | Bytes | Ossos | Vértices ponderados | Canais de pálpebra |
| --- | ---: | ---: | ---: | ---: | ---: |
| `morfeu-rigged-v05.glb` | 61.302 | 2.206.420 | 23 | 32.073 | 4 |
| `morfeu-scout-v05.glb` | 153.598 | 4.827.216 | 23 | 32.073 | 4 |

`export-checks.json` confirma valores finitos de malha e animação, pesos normalizados, índices de ossos válidos, tempos crescentes e os quatro canais de morph. A prévia carregou ambos os GLBs; mudança de pose da cabeça, fechamento das quatro pálpebras e ângulos dos dois rotores foram conferidos no navegador. No site local foram verificados mapa, partida, carinho, pausa, voo para Cindra, chegada por botão e retorno à galáxia. Os 14 testes existentes e o build passaram; os testes existentes da nave cobrem a reserva procedural, e a animação GLB teve verificação separada no navegador. O pacote atual tem aproximadamente 6,39 MiB e inclui somente o GLB v05 de nave utilizado.

Foram inspecionadas diretamente para este registro as capturas finais `morfeu-portrait.png`, `morfeu-blink.png`, `morfeu-scout.png`, `scout-top.png`, `scout-rear.png`, `browser-ship.png`, `site-desktop.png` e `site-mobile.png`, todas em `previews/`. Os 16 PNGs da v05 têm metadados de origem: oito renders Blender, sete capturas reais de navegador e uma textura ocular procedural; a conferência encontrou zero ausências. O detector mecânico terminou com `degraded: []` em modo regex; isso não é uma medição de contraste computado.

O parecer SHIP se limita ao acabamento e à integração local observados. Caminhada, corrida, IK e poses extremas não foram validados. Não houve ensaio em aparelho físico, garantia de desempenho ou publicação remota nesta etapa.

## Do's and Don'ts

### Do:

- Do preservar o corpo compacto v04, a pelagem branca e gengibre e os reflexos quadrados do sprite.
- Do manter as íris laranja e o sorriso discreto legíveis em três quartos.
- Do manter piloto visível, casco contínuo, asas crescentes e dois propulsores anulares como identidade de Semente.
- Do associar o detalhe mecânico à montagem, manutenção ou propulsão e conservar os nós animados dos rotores e aletas.
- Do avaliar o modelo tanto nos renders próximos quanto na escala real do mapa desktop e móvel.
- Do manter metadados de origem nos assets e distinguir revisão SHIP de aprovação estética do proprietário.

### Don't:

- Don't restaurar as íris verdes ou oliva das versões anteriores.
- Don't redesenhar a anatomia compacta ou transformar o sorriso sutil em focinho separado e exagerado.
- Don't copiar caças reconhecíveis, modelos ou pixels das referências externas.
- Don't acentuar os resíduos sutis da pálpebra como uma característica de estilo.
- Don't apresentar exportação válida, testes do fallback ou capturas emuladas como validação de locomoção, desempenho físico ou aprovação estética.
- Don't estender estes tokens de materiais 3D à identidade, tipografia ou biblioteca de componentes de todo o site.
