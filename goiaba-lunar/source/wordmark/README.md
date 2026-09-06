# Marca atual — revisão 3

Os arquivos ativos são `../../assets/brand/studio-light.svg`, `studio-dark.svg` e `favicon.svg`. Letras e goiaba orbital foram desenhadas diretamente em caminhos SVG, sem fonte. Os próprios SVGs são as fontes editáveis.

## Registro histórico — revisão 2

O script `build.py` abaixo é histórico e gera a assinatura anterior em Instrument Serif; não deve ser executado sobre a marca atual.

# Goiaba Lunar — assinatura tipográfica v2

Uma assinatura vetorial horizontal com dois ritmos tipográficos: **Goiaba** em romano, **Lunar** em itálico numa linha de base mais baixa. O ponto do i foi substituído por uma pequena semente inclinada; uma órbita aberta passa por baixo das letras e une as palavras. Não usa ícone destacado nem imagem de IA.

## Arquivos de entrega

- `goiaba-lunar-wordmark-light.svg`: versão clara para fundo escuro. Letras creme `#f4e9dd` e rosa `#efabc3`, órbita/semente sage `#a9d7aa`.
- `goiaba-lunar-wordmark-dark.svg`: versão de tinta para fundo claro. Letras `#091016` e ameixa `#73354e`, órbita/semente `#44754f`. Os tons mais profundos preservam a leitura no creme original `#f4e9dd`.
- `proof.png`: prova ampliada, versão em fundo creme e aplicações em tamanho real de 180 × 55 e 140 × 43 pixels.
- `goiaba-lunar-wordmark-light.png` / `goiaba-lunar-wordmark-dark.png`: cópias transparentes 840 × 256, para usos que não aceitam SVG. O site deve preferir SVG.
- `Instrument-Serif-OFL.txt`: licença da fonte de origem.
- `build.py` / `render.cjs`: construção e prova reproduzíveis. A pasta `.tools` contém apenas as dependências temporárias de FontTools.

## Uso no site

O SVG tem `viewBox="0 0 420 128"`, transparência verdadeira e contornos vetoriais. Não exige carregamento de fonte, imagem raster, filtro, script ou recurso externo. Manter a proporção 420:128.

```html
<a class="studio-brand" href="#galaxia"
   aria-label="Goiaba Lunar, voltar à galáxia">
  <img src="assets/brand/goiaba-lunar-wordmark-light.svg"
       width="180" height="55" alt="">
</a>
```

```css
.studio-brand > img {
  width: 180px;
  height: auto;
  display: block;
}
@media (max-width: 700px) {
  .studio-brand > img { width: 140px; }
}
```

Substituir a combinação atual de ícone + texto pela assinatura inteira, incluindo o tratamento existente de tamanho/quebra da marca. Para imagem isolada, usar `alt="Goiaba Lunar"`; no exemplo o link já tem nome acessível. Evitar recortar ou separar órbita, ponto e letras. A versão clara está preparada para o fundo original `#091016`.

## Origem e construção

- Desenho vetorial e composição tipográfica produzidos em 6 de setembro de 2026.
- Fontes existentes no projeto: `/Users/mac/Documents/portfolio/goiaba-lunar/assets/fonts/instrument-serif.woff2` e `instrument-serif-italic.woff2`, Instrument Serif sob SIL Open Font License 1.1.
- Letras convertidas para curvas por FontTools; posicionamento e entreletras ópticos, deslocamento de linha de base, semente e órbita são ajustes desta assinatura.
- Os arquivos entregues são artwork em SVG, não arquivos de fonte modificados. Não houve geração de imagens por IA nem download de nova fonte.
- PNGs renderizados diretamente dos SVGs com Sharp. Verificados visualmente a 180 × 55 e 140 × 43 pixels, além da versão de tinta em superfície creme.

Para reconstruir neste ambiente: `PYTHONPATH=.tools python3 build.py` e `node render.cjs`. Os scripts registram os caminhos locais de origem; ajustar esses caminhos se o pacote for levado a outra máquina.
