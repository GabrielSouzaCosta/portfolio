---
name: Morfeu v03 — asset Blender
description: Gato sentado, informado pela foto do Morfeu e pela expressão do sprite original.
colors:
  fur-white: "#FFF9F0"
  coat-ginger: "#CE691F"
  crown-ginger: "#DC7B2A"
  ginger-markings: "#9C491D"
  ear-ginger: "#D67525"
  nose-ear-pink: "#EBA392"
  mouth-lid-crease: "#765850"
  iris-gold: "color(srgb-linear 0.77 0.72 0.28)"
  iris-olive: "color(srgb-linear 0.49 0.59 0.22)"
  pupil-dark: "color(srgb-linear 0.055 0.052 0.033)"
  eye-catchlight: "color(srgb-linear 1 0.988 0.949)"
---

# Design System: Morfeu v03

## Overview

**Creative North Star: "Morfeu: foto na anatomia, sprite na expressão"**

Morfeu v03 é um asset 3D estilizado, autorado localmente no Blender. A foto do proprietário orienta anatomia e distribuição da pelagem; o sprite original orienta pupilas amplas, íris oliva e reflexos quadrados. A leitura ilustrada e curiosa continua dominante, apoiada por volume real. A pose sentada, o lado oculto e a cauda com ponta branca incluem interpretação, conforme research/anatomy.md.

Este registro vale apenas para source/blender/v03 e seus GLBs. A nave Scout é reutilizada da v02. A revisão final dos seis critérios de anatomia, pelagem e olhos, incluindo a correção da piscada, recebeu disposição de entrega no escopo de asset estilizado. Isso não constitui aprovação estética do proprietário; a integração à cena de produção do Goiaba Lunar permanece pendente.

**Key Characteristics:**

- Corpo majoritariamente branco, com gengibre localizado na cabeça, dorso, lateral e cauda.
- Torso e quatro membros contínuos, cabeça afunilada com focinho integrado e orelhas finas.
- Olhos rasos encaixados, pupilas escuras amplas e reflexos quadrados; quatro pálpebras animadas.
- Pose sentada e movimento discreto; nave Scout herdada sem redesenho nesta revisão.

## Colors

A base branca quente recebe manchas gengibre saturadas, com rosa suave no nariz e dentro das orelhas. Os tokens acima registram valores ativos de `build.py`; a pelagem usa mistura de cores por vértice, e os olhos usam uma textura autoral de 256×256. Os valores oculares em `srgb-linear` são parâmetros do gerador, não amostras de pixels iluminados.

### Primary

- **Gengibre da pelagem:** `coat-ginger` nas manchas do corpo e na cauda; `crown-ginger` na cabeça; `ear-ginger` nas orelhas externas. `ginger-markings` introduz listras discretas misturadas à pelagem.

### Secondary

- **Oliva dourada:** `iris-gold` e `iris-olive` se misturam na íris. Pupilas amplas usam `pupil-dark`; cada olho traz dois reflexos quadrados em `eye-catchlight`.
- **Rosa macio:** `nose-ear-pink` une nariz triangular e interiores das orelhas. `mouth-lid-crease` define a boca e a linha fina das pálpebras fechadas.

### Neutral

- **Branco quente:** `fur-white` domina peito, pescoço, focinho, pernas e parte do corpo; também aparece nos bigodes, faixa facial e ponta da cauda.

**The Reference Rule.** A foto governa anatomia e pelagem; o sprite governa expressão. Partes não estabelecidas pela foto continuam identificadas como interpretação.

## Layout

A composição do asset é um gato sentado com dianteiras sob o peito e traseiras dobradas junto à bacia. No Blender, Z é vertical e a face olha para −Y; a ponta das orelhas fica próxima de 3 unidades. O conjunto com a Scout aplica escala uniforme de 0,44 ao rig e posição `(0, 0.22, 0.59)`.

As vistas de inspeção do gato usam câmera ortográfica com escala 3,8; a nave usa 6,75. A prévia Three.js usa perspectiva de 34° e enquadramento pelos limites do modelo. As capturas em 1280×1000 e 390×844 são evidência de inspeção, não uma especificação de layout da página de produção. Tipografia e controles da prévia ficam fora deste sistema de asset.

## Elevation & Depth

O volume pertence às malhas, com superfícies suaves e sombras de contato. A pelagem é opaca e fosca, sem groom de pelos: rugosidade 0,83 nas superfícies pintadas, 0,78 nas orelhas e 0,70 no nariz/interiores. Os olhos têm curvatura rasa ajustada à face, rugosidade 0,47, nível especular 0,13 e coat 0,035; os reflexos quadrados estão na textura.

As renderizações Blender usam Cycles, 48 amostras, denoising e AgX Medium High Contrast com exposição −0,2. A prévia usa NeutralToneMapping com exposição 1, ambiente RoomEnvironment e luzes de apoio. Essas iluminações produzem aparências distintas: confira a saturação gengibre nos dois meios, sem usar um pixel renderizado como cor do material.

## Shapes

O tronco nasce de um loft de anéis; ombros, quatro membros, patas e transição sacral são fundidos por remesh e suavização. A superfície resultante do torso e membros é contínua. Crânio, mandíbula, bochechas, queixo e focinho formam outra superfície integrada. Cabeça, orelhas, cauda, olhos e pálpebras continuam objetos distintos: o gato inteiro não é uma única malha soldada.

Orelhas finas têm espessura e interior ajustado; a cauda parte da linha mediana da bacia, sai para trás e curva para o lado. Patas têm dedos sugeridos, membros distais estreitos e posteriores flexionados. Olhos permanecem grandes por decisão estilizada, encaixados em aberturas orbitais rasas; o modelo não pretende reproduzir proporções fotográficas exatas.

## Components

### Morfeu e rig

São 24 objetos de gato e 23 ossos: raiz, bacia, tronco, pescoço, cabeça, quatro segmentos de cauda e cadeias bilaterais de orelha, braço/antebraço/pata e coxa/perna/jarrete. O torso e os membros usam pesos misturados com até quatro influências por vértice; a cauda mistura ossos adjacentes. A cabeça e os detalhes acompanham seus ossos atribuídos.

`Morfeu_Idle` combina respiração, pequenos movimentos de cabeça, orelhas e cauda, e piscada em aproximadamente seis segundos a 24 fps. Quatro objetos de pálpebra têm um morph `Blink` cada; fecham no quadro 52, entre estados abertos nos quadros 49 e 55. A amostra de pelagem na pose fechada evita faixas de cor esticadas durante a piscada.

**The Blink Rule.** As pálpebras cobrem a superfície ocular estável. Preserve o fechamento completo e a linha fina da dobra, sem comprimir o olho.

### Scout e entrega

A Scout mantém os 61 objetos importados de `../v02/morfeu-scout-rigged.blend`; casco marfim, estrutura petróleo e acentos ferrugem são herdados. Esse arquivo é dependência da regeneração. O editável desta versão é `morfeu-photo-rigged.blend`; a fonte reproduzível é `build.py`.

| Exportação | Triângulos | Bytes | Animação |
| --- | ---: | ---: | --- |
| `morfeu-rigged-v03.glb` | 61.416 | 2.221.744 | 1 clipe, 73 trilhas, 4 canais de pálpebra |
| `morfeu-scout-v03.glb` | 76.296 | 2.799.220 | 1 clipe, 73 trilhas, 4 canais de pálpebra |

Ambos têm 23 ossos e 32.274 vértices com pesos. `export-checks.json` registra valores finitos, pesos normalizados, índices de ossos válidos, tempos crescentes e quatro canais de morph. O README registra carregamento e inspeção no Three.js 0.180.0, seleção de modelos, vistas, controle do tempo e fechamento das pálpebras. Caminhada, corrida, IK, poses extremas e desempenho em aparelho físico não foram validados. A prévia depende de `node_modules` local; a entrega atual é o asset e seu estudo interativo.

## Do's and Don'ts

### Do:

- Do preservar peito, pescoço, focinho e pernas brancos, com manchas gengibre localizadas.
- Do manter conexões legíveis entre peito, ombros, membros e bacia, e a cauda saindo da região sacral.
- Do conferir frente, perfil, costas, miniatura e fechamento das quatro pálpebras ao alterar geometria ou materiais.
- Do preservar o sprite original e a foto como referências distintas; manter a foto fora dos arquivos distribuíveis.

### Don't:

- Don't voltar à extrusão voxel, à anatomia excessivamente esférica da v02 ou à pelagem laranja pálida rejeitadas pelo proprietário.
- Don't converter olhos em discos empilhados, trocar pupilas amplas por fendas ou perder os reflexos quadrados.
- Don't tratar a revisão técnica como aprovação estética do proprietário, nem afirmar integração em produção ou prontidão para locomoção.
