---
name: Morfeu v04 — estudo compacto
description: Registro visual do asset original de Blender e prévia local, com revisão SHIP e aprovação estética pendente.
colors:
  fur-warm-white: "#FFF9F0"
  fur-ginger: "#CE691F"
  crown-ginger: "#DC7B2A"
  tabby-dark: "#9C491D"
  ear-orange: "#D67525"
  nose-ear-rose: "#EBA392"
  iris-light-olive: "#B9B46A"
  iris-dark-olive: "#777F43"
  eye-pupil: "#191C18"
  mouth-lid-margin: "#765850"
  studio-ground: "#273741"
---

# Design System: Morfeu v04

## Overview

**Creative North Star: "Companheiro ilustrado, compacto e curioso"**

Morfeu aparece como um companheiro ilustrado, compacto e curioso: cabeça larga próxima aos ombros, patas curtas apoiadas, focinho discreto e cauda curva. A pelagem branca e gengibre preserva a identidade da foto; as íris oliva e os reflexos quadrados aproximam a expressão do sprite original. Esta descrição registra o build existente, não garante aprovação estética.

A direção foi autorizada após a rejeição da v03. Sox/Pixar orientou simplificação e expressão; Manchas/CC-SAN, construção facial e poses. São referências de pesquisa: toda a geometria do gato e sua textura ocular foram autoradas localmente em código no Blender. Não houve ImageGen, incorporação de modelos ou pixels de terceiros, nem integração à cena de produção.

**Estado em 6 de setembro de 2026: SHIP no escopo do asset Blender e da prévia local existente.** Três lotes de correção foram concluídos; o terceiro foi explicitamente autorizado pelo proprietário. A raiz da cauda está resolvida. As junções do peito com as patas dianteiras agora são suaves, sem saliências pareadas ou depressões recortadas. Os olhos abertos se integram à face e a piscada fechada não apresenta cunhas proeminentes nos cantos internos ou abas inferiores destacadas. Ambos os pontos foram considerados resolvidos no escopo avaliado.

Uma emenda superior tênue e um perímetro sutil ainda podem ser vistos no close congelado da piscada; são resíduos de acabamento negligenciáveis na escala da prévia, não defeitos materiais para esta entrega nem recursos de estilo. A aprovação estética do proprietário permanece pendente. O parecer SHIP não inclui integração à produção ou validação de locomoção.

**Key Characteristics:**

- Cabeça ampla, pescoço curto e postura sentada compacta.
- Branco quente e gengibre com manchas e listras procedurais.
- Íris oliva, pupilas amplas e dois reflexos quadrados por olho.
- Superfícies suaves, iluminação de estúdio e movimento contido.

As fontes deste registro são `build.py`, `stats.json`, `export-checks.json`, o contrato em `docs/studio/morfeu-v04.md` na raiz do repositório, `PRODUCT.md` e o README de Blender. Foram inspecionados diretamente os renders atuais `previews/morfeu-portrait.png` e `previews/morfeu-blink.png`.

## Colors

O branco quente ocupa peito, patas, focinho e a faixa vertical da face; gengibre saturado forma a coroa, manchas do corpo e cauda. Os valores do frontmatter são entradas sRGB reais do script, convertidas para linear no Blender; não são amostras das imagens iluminadas.

### Primary

- **Fur warm white:** pelagem clara, bigodes e base dos materiais de pelo.
- **Fur ginger / Crown ginger:** manchas do corpo e cauda / base da coroa.
- **Tabby dark:** listras suaves misturadas à pintura por vértice; não decalques.
- **Ear orange:** superfície exterior das orelhas.

### Secondary

- **Nose ear rose:** nariz triangular e superfícies internas das orelhas.
- **Iris light olive / Iris dark olive:** bases misturadas na textura ocular procedural, com variação radial e de borda. A cor visível resulta da mistura, não de um preenchimento único.

### Neutral

- **Eye pupil:** pupila escura na textura ocular.
- **Mouth lid margin:** boca discreta e margem das pálpebras.
- **Studio ground:** piso da cena de render, não token da interface da landing page.

Os reflexos quadrados pertencem à textura original de 256×256; o script escreve seus canais lineares diretamente. Não se atribui a eles um token hexadecimal aproximado. Materiais declarados mas sem uso visual confirmado não entram neste inventário. A nave reaproveitada da v02 conserva seus próprios materiais; não é uma nova paleta criada na v04.

## Layout

Este documento cobre assets 3D, sem escala de tipografia, espaçamento CSS ou componentes de interface. O modo Experience e a estratégia da prévia permanecem no contrato de direção.

O gato senta com as patas dianteiras separadas, peito entre elas, posteriores dobradas e cauda saindo para trás antes de curvar para o lado. O script aplica a mesma transformação compacta à geometria, às posições de morph e ao esqueleto. Nos renders de personagem, a câmera ortográfica usa escala 2,75 e mira em `(0, 0, 1.07)`; as imagens coloridas têm 1000×1000. Retrato, frente, perfil e traseira são saídas distintas. A piscada é registrada de frente no frame 52.

Para o conjunto com nave, o rig recebe escala uniforme 0,52 e posição `(0, 0.22, 0.59)`; a câmera usa escala ortográfica 6,75. A nave é uma dependência autoral anterior de `v02/morfeu-scout-rigged.blend`, não foi reconstruída nesta revisão.

## Elevation & Depth

A profundidade vem de malhas reais com sombreamento suave, materiais Principled BSDF e sombras de contato. Não há pelo de partículas. Corpo, cabeça e pálpebras recebem pintura por vértice com rugosidade 0,83; orelhas externas usam 0,78 e nariz/interior das orelhas, 0,70. A superfície ocular tem rugosidade 0,47, nível especular 0,13 e coat 0,035.

Os renders usam Cycles, 32 amostras, denoise, AgX com Medium High Contrast e exposição −0,2. Três luzes de área produzem chave quente, preenchimento frio e recorte quente. O piso escuro ancora as patas; sua sombra pertence ao estudo de estúdio. O render Blender e a prévia Three.js não constituem promessa de aparência idêntica em produção.

## Shapes

A cabeça funde crânio, mandíbula, ponte nasal, queixo e bochechas em uma superfície larga; o focinho não usa esferas separadas. O tronco nasce de anéis interpolados e se funde às massas das pernas. Remesh, suavização e redução de polígonos produzem o acabamento orgânico atual. Uma suavização local ponderada nas junções do peito e das patas dianteiras (modificador SMOOTH, fator 0,85, 70 iterações) remove os recortes sem alterar patas e silhueta. Remesh voxel é uma técnica de construção, sem adotar a aparência voxel rejeitada.

Orelhas triangulares têm espessura e interior rosa. O nariz é um pequeno triângulo arredondado; boca e bigodes são tubos finos. A cauda é reconstruída ao redor da curva final com orientação transportada entre anéis, raiz enterrada no corpo e ponta clara arredondada. A antiga saliência da raiz foi resolvida.

## Components

### Morfeu

O asset possui 22 objetos de gato e rig de 23 ossos. O corpo usa pesos misturados, normalizados e limitados a quatro influências por vértice; cabeça e peças faciais seguem o osso da cabeça, orelhas têm ossos próprios e a cauda tem cadeia de quatro ossos. Há um único clipe `Morfeu_Idle`, com 73 trilhas e duração exportada de aproximadamente 6,0416665 segundos. Respiração, cabeça, orelhas e cauda recebem movimentos discretos.

### Olhos e piscada

Duas superfícies oculares rasas se acomodam a aberturas esculpidas na cabeça; a textura original contém íris oliva, pupila e reflexos quadrados. A vizinhança orbital é esculpida sobre a mesma curvatura analítica das pálpebras. As lentes ficam recuadas 0,008 unidade em relação à superfície orbital, as pálpebras ficam rente à face e apenas a borda externa se enterra na pele. Quatro superfícies de pálpebra, superior e inferior por olho, possuem morph `Blink` e fecham sobre olhos estáveis. As chaves no Blender ocorrem nos frames 1, 49, 52, 55 e 145, com fechamento no 52. A revisão final considerou resolvida a integração: o fechamento não mostra cunhas proeminentes ou abas inferiores destacadas. A tênue emenda superior e o perímetro sutil do close pausado permanecem registrados como limitação menor, negligenciável na escala da prévia.

### Nave com piloto

O conjunto reutiliza 61 objetos da nave v02 e inclui o mesmo gato animado em escala reduzida. A v04 é estudo de personagem e exportação, sem implementação de voo ou integração ao runtime principal.

| Exportação | Triângulos | Bytes | Ossos | Morphs de pálpebra |
| --- | ---: | ---: | ---: | ---: |
| `morfeu-rigged-v04.glb` | 61.270 | 2.201.424 | 23 | 4 |
| `morfeu-scout-v04.glb` | 76.150 | 2.778.656 | 23 | 4 |

`export-checks.json` registra valores de malha/animação finitos, pesos normalizados, índices de ossos válidos, tempos crescentes e os quatro canais de pálpebra. Os dois exports passaram, cada um com 32.057 vértices ponderados. A revisão visual final conferiu as nove capturas; a conferência de origem encontrou metadados nos dez PNGs da v04, com zero ausências. A integridade do export e o parecer visual SHIP se referem a verificações distintas e não substituem a aprovação estética do proprietário. Caminhada, corrida, IK e poses extremas não foram validados. A prévia foi conferida em capturas desktop e móvel; não houve teste em aparelho físico.

## Do's and Don'ts

### Do:

- Do preservar a identidade branca e laranja da foto e os reflexos quadrados do sprite.
- Do avaliar frente, perfil, retrato e piscada fechada antes de aprovar o personagem.
- Do manter a origem procedural e os renders reais identificados nos arquivos de imagem.
- Do preservar o escopo do parecer SHIP: asset Blender e prévia local, com aprovação estética do proprietário pendente.

### Don't:

- Don't transformar os resíduos sutis da pálpebra no close pausado em escolhas de estilo ou alegar acabamento perfeito.
- Don't apresentar exportação válida como aprovação visual ou de locomoção.
- Don't copiar modelos ou pixels das referências Sox/Pixar e Manchas/CC-SAN.
- Don't integrar estes assets à produção sem a etapa correspondente de avaliação.
