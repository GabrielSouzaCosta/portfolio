# Assets da versão final

- `../assets/favicon.svg`: identidade do site.
- `../assets/images/tabby-v2.png`: gato sobre o botão do estúdio, gerado com ImageGen e fundo transparente.
- `../assets/images/hero.png`: gravura original, usada no início e nas texturas.
- `../assets/images/goiaba-lunar.png`: logo original do estúdio.

## Arquivos servidos

- `../assets/images/hero-plate.webp`: prancha do início, 1536 × 1024, lida pelo shader de `js/hero-scene.js` e usada como fundo CSS enquanto o WebGL não está pronto.
- `../assets/images/hero-plate-1152.webp`: a mesma prancha em 1152 × 768 (Lanczos, WebP qualidade 90, a mesma da original), servida a telas de até 440 px de largura. Nelas o canvas nunca mostra a prancha com mais de ~1150 px de dispositivo; um celular girado para paisagem troca para a prancha completa.
- `../assets/images/hero-sketch-phone.webp`: o quadro em que a abertura começa (o esboço a tinta, com a lente em repouso), 490 × 512, WebP qualidade 50. Cobre as colunas 520–1500 da prancha, as que o canvas de um celular alcança, e é pintado como fundo CSS em telas de até 440 px enquanto a prancha baixa. Gerado por `../scripts/hero-sketch-frame.html` com o shader do site.
- `../assets/images/paper-grain.webp`: textura de papel do Estúdio e do Contato. É o canto superior esquerdo (232 × 941) de `hero.png`, a única parte da gravura que essas texturas mostravam; WebP qualidade 92. O `background-size` foi recalculado (`calc(950% * 232 / 1672)` e equivalentes) para manter exatamente a mesma escala.
- `../assets/images/tabby-v2-330.webp` e `tabby-v2-440.webp`: versões do gato dimensionadas para alta densidade, com transparência e redimensionamento por vizinho mais próximo para manter a estética pixel art. A codificação WebP é sem perdas após o redimensionamento.
- `../assets/images/goiaba-lunar.webp`: logo em WebP sem perdas, com pixels RGBA idênticos ao PNG.
- `../assets/images/volvella-plate.webp`: a volvela da Essência, 2048 × 2048 com alfa fora da roda. Origem: imagem GPT gerada a partir da prancha do início, depois uma edição sem o ponteiro pintado. A elipse foi corrigida para um círculo e houve um leve unsharp. As quatro rodas são recortadas em tempo real por raio (0,394 · 0,514 · 0,892 · 0,985 da meia largura).
- `../assets/images/volvella-plate-1024.webp`: a volvela em 1024 × 1024 (Lanczos, WebP qualidade 90 com alfa sem perdas), usada quando a roda tem até ~975 px de dispositivo de diâmetro: celulares e telas 1x. Rodas maiores recebem a de 2048.
- `../assets/images/volvella-maps.webp`: mapa de luz da volvela, 1024 × 1024, WebP sem perdas. R e G guardam a normal (x, y) derivada da luminância, B a máscara de ouro e A os brilhos das estrelas sobre o lápis.
- `../assets/images/volvella-pointer.webp`: o ponteiro com flor-de-lis, gerado à parte sobre fundo branco e recortado com alfa. O pivô fica em (109, 1392) px.
- `../assets/fonts/`: arquivos WOFF2 originais do Google Fonts, suas licenças SIL OFL e um manifesto `SOURCES.json` com as URLs de origem. Mesmas famílias, pesos e caracteres, incluindo acentos em português.

Os PNGs originais são preservados como fontes de edição; não são baixados pela página. `hero.webp` também não é mais servido: as texturas de papel usam o recorte `paper-grain.webp`. Os comandos de reprodução estão em [performance.md](performance.md).

O ciclope e o cursor Morfeu estão desenhados em SVG inline no `../index.html`.

## Prompt de tabby-v2.png

Use case: stylized-concept. Single charming small brown-gray tabby cat sleeping curled up with head on front paws, side view, cozy expression and closed eyes, clearly visible dark striped fur and curled tail. High craft retro 16-bit pixel art sprite, warm brown taupe gray and cream colors, sharp crisp pixel edges, restrained palette and recognizable silhouette at small size. Genuine transparent background. Cat isolated, whole cat fully visible centered with generous transparent margins, no objects, no lettering, no floor, no border. Website mascot that will sleep next to a button, horizontal composition.
