# Assets da versão final

- `../assets/favicon.svg`: identidade do site.
- `../assets/images/tabby-v2.png`: gato sobre o botão do estúdio, gerado com ImageGen e fundo transparente.
- `../assets/images/hero.png`: gravura original, usada no início e nas texturas.
- `../assets/images/goiaba-lunar.png`: logo original do estúdio.

## Arquivos servidos

- `../assets/images/hero.webp`: gravura em WebP, qualidade 92 e resolução original de 1672 × 941. Os traços foram comparados visualmente; a compressão altera pixels, sem diferença perceptível na revisão do site.
- `../assets/images/tabby-v2-330.webp` e `tabby-v2-440.webp`: versões do gato dimensionadas para alta densidade, com transparência e redimensionamento por vizinho mais próximo para manter a estética pixel art. A codificação WebP é sem perdas após o redimensionamento.
- `../assets/images/goiaba-lunar.webp`: logo em WebP sem perdas, com pixels RGBA idênticos ao PNG.
- `../assets/images/volvella-plate.webp`: a volvela da Essência, 2048 × 2048 com alfa fora da roda. Origem: imagem GPT gerada a partir da prancha do início, depois uma edição sem o ponteiro pintado. A elipse foi corrigida para um círculo e houve um leve unsharp. As quatro rodas são recortadas em tempo real por raio (0,394 · 0,514 · 0,892 · 0,985 da meia largura).
- `../assets/images/volvella-maps.webp`: mapa de luz da volvela, 1024 × 1024, WebP sem perdas. R e G guardam a normal (x, y) derivada da luminância, B a máscara de ouro e A os brilhos das estrelas sobre o lápis.
- `../assets/images/volvella-pointer.webp`: o ponteiro com flor-de-lis, gerado à parte sobre fundo branco e recortado com alfa. O pivô fica em (109, 1392) px.
- `../assets/fonts/`: arquivos WOFF2 originais do Google Fonts, suas licenças SIL OFL e um manifesto `SOURCES.json` com as URLs de origem. Mesmas famílias, pesos e caracteres, incluindo acentos em português.

Os PNGs originais são preservados como fontes de edição; não são baixados pela página. Os comandos de reprodução estão em [performance.md](performance.md).

O ciclope e o cursor Morfeu estão desenhados em SVG inline no `../index.html`.

## Prompt de tabby-v2.png

Use case: stylized-concept. Single charming small brown-gray tabby cat sleeping curled up with head on front paws, side view, cozy expression and closed eyes, clearly visible dark striped fur and curled tail. High craft retro 16-bit pixel art sprite, warm brown taupe gray and cream colors, sharp crisp pixel edges, restrained palette and recognizable silhouette at small size. Genuine transparent background. Cat isolated, whole cat fully visible centered with generous transparent margins, no objects, no lettering, no floor, no border. Website mascot that will sleep next to a button, horizontal composition.
