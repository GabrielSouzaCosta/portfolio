---
name: Morfeu e Scout — estudo local v02
description: Proposta implementada de personagem e nave 3D, aguardando avaliação estética do proprietário.
colors:
  fur-orange: "#ED973F"
  head-orange: "#F1A34B"
  tabby: "#BD622E"
  amber: "#D9A84E"
  rose: "#EBA392"
  terracotta: "#C25C30"
  cockpit: "#243D42"
  windscreen: "#285C67"
  ion: "#81DEEF"
  warm-white: "#FFF4DC"
  hull: "#ECE6D5"
  ivory: "#DDD8C6"
  metal: "#535E60"
  eye-rim: "#493426"
  pupil: "#241C18"
  catchlight: "#FFFDF4"
---

# Morfeu e Scout — estudo local v02

## Overview

Registro de 6 de setembro de 2026, restrito aos assets deste diretório. A proposta traduz o Morfeu branco e laranja do sprite do portfólio em volumes completos e arredondados, acompanhado de um pequeno caça espacial. O desenho continua predominante sobre o realismo, conforme o contexto de `PRODUCT.md`.

O proprietário rejeitou a extrusão voxel do gato e a nave blocada anteriores. Esta implementação aguarda seu julgamento estético; não constitui arte final aprovada. O site principal não foi modificado nesta etapa.

**Key Characteristics:**

- Cabeça ampla, corpo sentado compacto e expressão de olhos âmbar.
- Pelagem com bordas de pixel sobre uma superfície curva.
- Nave marfim com nariz afilado, asas varridas e cockpit aberto.

## Colors

**Primary.** `fur-orange`, `head-orange` e `tabby` definem a pelagem; `amber` concentra a expressão nos olhos. `terracotta` liga as marcações da nave ao gato.

**Secondary.** `rose` aparece no nariz, nas orelhas e em pequenos detalhes faciais. `cockpit` e `windscreen` dão profundidade aos recessos; `ion` identifica núcleos dos motores e instrumentos.

**Neutral.** `warm-white` forma focinho, peito, patas e ponta da cauda. `hull` e `ivory` distinguem casco e painéis, com `metal` nas peças mecânicas. `eye-rim`, `pupil` e `catchlight` sustentam o contraste do rosto. Os valores acima são extraídos de `build.py`; iluminação e AgX alteram sua aparência nos renders.

## Layout

O gato isolado tem pose sentada, membros separados e cauda curva visível também por trás. Na Scout, o mesmo rig é reduzido a 48% e posicionado no cockpit, com o rosto acima do para-brisa. A nave se organiza por simetria lateral, proa longa e dois motores paralelos.

Os três renders inspecionados são `previews/morfeu-portrait.png`, `previews/morfeu-rear.png` e `previews/morfeu-scout.png`. A apresentação usa câmera ortográfica e fundo de estúdio; não define enquadramento responsivo nem composição da página do estúdio.

## Elevation & Depth

Crânio, focinho, torso, patas, orelhas e cauda são malhas com profundidade real. A pelagem é predominantemente fosca; olhos têm acabamento mais liso. Casco e mecânica usam materiais metálicos moderados, bordas suavizadas, encaixes e recessos. Luz principal quente, preenchimento frio, luz de recorte e sombras de contato tornam a curvatura legível. Piso e luzes de apresentação ficam fora dos GLBs.

## Shapes

**Regra do volume contínuo.** Preservar o crânio arredondado, o torso em pera, as patas macias e as orelhas afiladas. O pixel pertence à pintura e aos reflexos quadrados dos olhos; não determina uma extrusão em degraus da silhueta.

A textura da cabeça tem 128 × 64 pixels e amostragem por vizinho mais próximo. As faixas acompanham testa, têmporas e parte posterior. A Scout combina quilha afilada, asas com espessura, duas naceles, aletas traseiras e marcações terracota. Seu cockpit é uma cavidade aberta com piso, assento, laterais e para-brisa baixo.

## Components

**Morfeu.** 42 objetos de malha e esqueleto de 18 ossos. Cabeça, olhos, orelhas, membros e patas têm controles próprios; a cauda combina pesos em uma cadeia de três ossos. A maior parte das demais peças tem influência integral de um osso. Há um clipe idle contido, com respiração, pequenos movimentos de cabeça e cauda e canais de olhos e orelhas; a cena registra 144 quadros a 24 fps.

**Scout.** 61 objetos de nave e o mesmo personagem com rig. `morfeu-rigged-v02.glb` contém o gato; `morfeu-scout-v02.glb` contém o conjunto. A cena editável é `morfeu-scout-rigged.blend`.

**Verificação e limites.** `stats.json` registra as contagens. `export-checks.json` confirma, nos dois GLBs, 18 ossos, um clipe, 19.546 vértices com pesos, posições e animações finitas, pesos normalizados, índices de juntas válidos e tempos crescentes. O rig e o idle foram verificados em Three.js no verificador local separado (`preview.html` / `preview.js`), que não é interface de produção. Não há validação de locomoção completa, caminhada, corrida, IK ou integração ao site.

A revisão independente apontou interseções nas partes internas das orelhas e saliências de listras enterradas nas ancas. As partes rosadas agora acompanham a superfície subdividida das orelhas; as saliências das ancas foram removidas. O parecer “ship” dessa revisão se restringe a essas duas correções, sem representar aprovação estética geral ou do proprietário.

## Do's and Don'ts

- **Do** preservar a leitura do Morfeu pelo branco e laranja, marcações, olhos âmbar e expressão do sprite.
- **Do** conferir frente, perfil e costas ao alterar volumes ou aplicar marcações.
- **Do** manter rosto e orelhas legíveis acima do cockpit.
- **Don't** retornar à extrusão voxel do gato ou à nave blocada rejeitadas.
- **Don't** descrever o idle como um sistema completo de locomoção.
- **Don't** promover este estudo a arte aprovada ou a implementação do site sem a etapa correspondente.
