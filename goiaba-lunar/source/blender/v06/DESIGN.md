---
name: Morfeu v06 — naturalidade ocular
description: Registro da correção dos olhos no personagem e na nave Semente existentes.
colors:
  iris-amber-light: "#F0C27B"
  iris-amber-mid: "#CB944F"
  iris-soft-rim: "#96754B"
  pupil: "#131916"
  sclera-white: "#FFFFFF"
  sclera-shadow: "#EEEEEE"
  lid-margin: "#604C3C"
---

# Design System: Morfeu v06

## Overview

Registro do código em 7 de setembro de 2026. A v06 refina os olhos do Morfeu compacto existente. O proprietário descreveu o olhar anterior como artificial e “meio do mal”, atribuindo a segunda impressão à cor. A direção é laranja dourado/âmbar mais claro, contorno castanho suave e expressão acolhedora.

Corpo, distribuição da pelagem, sorriso e nave Semente preservam a v05. A foto fornecida pelo proprietário orienta a identidade branca e laranja; o sprite orienta a expressão. A solicitação ocular atual substitui a antiga exigência de reflexos quadrados. O documento v05 é histórico.

A esclerótica passou a branca a pedido do proprietário, com sombra neutra discreta nos cantos.

**Key Characteristics:**
- Íris circular em âmbar dourado e pupila oval vertical moderada.
- Reflexos sobre uma superfície ocular curva, integrados às pálpebras.
- Personagem compacto e nave original preservados.

Fontes: [build.py](build.py), [ship.py](ship.py), [PRODUCT.md](../../../../PRODUCT.md), [brief v06](../../../../docs/studio/morfeu-v06.md), [README](../README.md), [prévia](../preview.js) e [iluminação ocular](../../../js/three/eye-lighting.js).

Este registro descreve a implementação; não estabelece aprovação estética do proprietário, revisão visual final, validação em dispositivos físicos ou publicação.

## Colors

As cores do frontmatter são entradas sRGB reais da textura e da margem palpebral em `build.py`. O script converte essas entradas para espaço linear e as mistura; iluminação e transformação de cor determinam o resultado visível.

Âmbar claro e médio formam a íris com variação radial discreta. Castanho suaviza sua borda; a pupila permanece escura. A esclerótica é branca, conforme o ajuste posterior solicitado pelo proprietário; apenas uma sombra neutra discreta acompanha os cantos. A margem castanha da pálpebra superior também define a emenda da piscada.

O branco e gengibre da pelagem e o marfim, petróleo e cobre da nave mantêm suas atribuições existentes.

## Elevation & Depth

A superfície ocular ocupa uma abertura rasa na órbita. Sua córnea tem curvatura real nos dois eixos; o centro fica atrás das pálpebras fechadas e a periferia recua na órbita. Pele e pálpebras compartilham uma superfície analítica que suaviza a união com o rosto.

O material `Morfeu | moist amber eyes` usa a textura como cor, rugosidade de 0,16, camada de cobertura de 0,12 e IOR de 1,38. A textura contém cor e sombra suave de oclusão, sem marcas brancas pintadas. No Blender, pequenas luzes de área produzem os reflexos.

Na prévia e no site, `eye-lighting.js` cria um ambiente de reflexão procedural e o atribui ao material ocular de cada cópia. Esse ambiente pertence à integração Three.js e não é incorporado ao GLB; outro visualizador precisa fornecer iluminação própria. A prévia usa Neutral Tone Mapping; os renders Blender usam AgX, portanto não constituem uma correspondência de cor idêntica.

## Shapes

A íris é circular nas coordenadas finais da cabeça. A abertura em amêndoa e as pálpebras recortam o círculo; não esticam o desenho da íris. A pupila é uma oval vertical moderada.

Quatro malhas de pálpebras, superiores e inferiores, têm morph `Blink`. Elas cobrem olhos estáveis; a superior se sobrepõe ligeiramente à inferior no fechamento. A pelagem das pálpebras é amostrada na pose fechada para evitar faixas de cor esticadas.

O rig existente tem 23 ossos. O clipe `Morfeu_Idle`, de cerca de seis segundos a 24 fps, reúne respiração, movimentos contidos de cabeça, orelhas e cauda, e piscada. As cadeias de membros não constituem uma entrega de locomoção completa; caminhada, corrida, IK e poses extremas não foram validados.

Semente mantém casco arredondado, asas crescentes, dois propulsores anulares, cockpit aberto, carga e antena assimétricas. Rotores e aletas conservam nós próprios; peças estáticas são agrupadas por material e pai. Esses mecanismos são separados do clipe de repouso do gato.

`morfeu-eyes.png` é uma textura procedural original de 512×512, gerada e empacotada por `build.py`. A foto de referência não é incorporada ao asset. Os arquivos `previews/eyes-*.png`, `morfeu-*.png` e `scout-*.png` são renders Blender; o script configura Cycles, 1000×1000 e 32 amostras no modo final. Capturas `browser-*.png` e `site-*.png` registram a prévia e o site reais. Não houve geração de imagens por serviço externo nesta revisão.

## Do's and Don'ts

### Do:
- **Do** manter a identidade laranja em âmbar dourado claro e contorno castanho suave.
- **Do** preservar o corpo, a pelagem, o sorriso e a nave existentes ao refinar os olhos.
- **Do** avaliar frente, três quartos e fechamento das pálpebras no Blender e na prévia real.

### Don't:
- **Don't** pintar reflexos quadrados ou deformar a íris circular para preencher a abertura ocular.
- **Don't** tratar o ambiente de reflexão Three.js como parte exportada do GLB.
- **Don't** usar o parecer visual v05 como aprovação da correção ocular v06.
