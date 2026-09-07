# Revisão dos planetas — 7 de setembro de 2026

Cindra, CommissionMatch e Mangue passam a ter silhuetas esféricas, correntes atmosféricas fluidas e paletas dos produtos: cobre/vinho, oliva/marfim e petróleo/jade, respectivamente. A referência de direção é [Metalforge Orbs](https://metalforge.xyz/editor#tool=orbs).

## Implementação

`../../js/three/planets.js` cria uma superfície opaca com ruído procedural no espaço do objeto, uma camada independente de nuvens transparentes e uma atmosfera com dispersão de luz. CommissionMatch tem anéis inclinados de poeira translúcida. Os materiais usam `ShaderMaterial`; a textura se move lentamente e as nuvens giram sobre a superfície. `../../js/three/scene.js` mantém a projeção ortográfica e o enquadramento durante a rotação.

## Proveniência dos fallbacks

Os arquivos `../../assets/drawn/cindra-planet.png`, `../../assets/drawn/commissionmatch-planet.png` e `../../assets/drawn/mangue-planet.png` foram renderizados em WebGL no navegador a partir de `createPlanet`, com Three.js 0.180.0. São renders dos modelos locais, sem imagens de banco ou geração por IA, e são usados pelas referências de imagem em `../../index.html`.

Parâmetros da captura: 600×600 px, fundo transparente com alfa, ACES Filmic com exposição 0,98, câmera em `(0, 1.1, 7)` apontada para a origem e meia extensão ortográfica `framingRadius * 1.08`. Rotação Y de 0,5 rad; rotação Z de 0,06 rad para Mangue e −0,08 rad para os demais; estado `animate(4, 0)`.

## Validação

- [Desktop, 1440×1000](desktop.png) e [celular, 390×844](mobile.png): revisão Impeccable com veredito **ship**, sem defeitos visuais acionáveis.
- 14 testes passaram. Foram mantidos os testes de colisão do voo com a superfície opaca e de limites de enquadramento; foi removida a asserção obsoleta que exigia relevo literal.
- Não houve publicação nesta etapa.
