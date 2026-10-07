# Performance

## Primeira pintura no celular (outubro de 2026)

No celular, o maior elemento da primeira tela (LCP) era a prancha do início: 368 KB que, na rede simulada do Lighthouse (1,6 Mbps), levam quase dois segundos sozinhos. Recodificar não resolve: a gravura é densa demais (AVIF economiza cerca de 20% com fidelidade parecida; recortar a área visível, cerca de 5%).

A abertura já começa como um esboço a tinta que depois se inunda de cor. Telas de até 440 px agora pintam esse primeiro quadro como uma imagem pequena, `hero-sketch-phone.webp` (62 KB), e só então baixam a prancha, que deixa de disputar banda com ele. O script posiciona a imagem exatamente onde o canvas vai desenhar o mesmo quadro, e o canvas entra por cima em 0,5 s; a inundação de cor espera o que faltar do compasso de 0,9 s, contado desde que o esboço apareceu. Sem WebGL2, sem JavaScript ou se o shader falhar, o celular mostra a prancha colorida como antes. Telas maiores não mudaram.

### Medição

Lighthouse 13.5, só desempenho, contra o build servido localmente por HTTP/2 com Brotli e os cabeçalhos de cache da Vercel. O perfil de celular é o padrão do Lighthouse (rede e CPU simuladas). Não são dados de campo, e a nota varia dois ou três pontos entre execuções.

| Celular | Antes (`5827da0`) | Depois |
| --- | ---: | ---: |
| Nota | 93, 93 | 100, 100, 99 |
| Maior conteúdo — LCP | 3,2 s | 1,7–1,9 s |
| Primeiro conteúdo — FCP | 1,0 s | 1,0–1,2 s |
| Bloqueio da thread principal — TBT | 0 ms | 0–47 ms |
| Mudanças de layout — CLS | 0,004 | 0–0,010 |

No site publicado, antes da mudança, o celular marcou 87, 90 e 92 (LCP de 3,0 a 3,8 s). No desktop a nota ficou entre 96 e 100 antes e depois: ali o maior elemento é o texto, e a variação vem de quais arquivos terminam antes dele na medição local.

Testado e descartado: adiar as imagens do Estúdio, a textura de papel e a VT323, que o Lighthouse baixa junto com o início, não mudou a nota (99–100 com e sem elas).

### Verificação

- Captura do celular só com o esboço (prancha retida) comparada à do canvas congelado no mesmo quadro (`?mode=4&at=0`): mesmo registro; a diferença é apenas a nitidez do traço.
- Caminhos alternativos em 412 × 823: sem WebGL, sem JavaScript, movimento reduzido, prancha que falha ao baixar, celular girado durante e depois do esboço. Nenhum erro de JavaScript; desktop em 1440 × 900 sem mudança.

### Reproduzir a imagem

`scripts/hero-sketch-frame.html` desenha o quadro com o próprio shader do site (mundo 4, lente em repouso, sem o grão por quadro) nas colunas 520–1500 da prancha, as únicas que o canvas de um celular alcança. Sirva a raiz do repositório, abra a página, salve o PNG (735 × 768) e, com Pillow:

```python
from PIL import Image
frame = Image.open('hero-sketch-phone.png').convert('RGB')
frame.resize((490, 512), Image.LANCZOS).save('assets/images/hero-sketch-phone.webp', quality=50, method=6)
```

Se o shader, a prancha ou o enquadramento do celular em `js/hero-scene.js` mudarem, gere a imagem de novo: `SKETCH` no script e `FRAMES` na página precisam descrever as mesmas colunas.

## Rodada de outubro de 2026

O site estava pesado para baixar e para animar. Esta rodada reduz o que a primeira visita baixa, tira trabalho da thread principal e deixa os shaders mais baratos, sem mudar o que se vê.

### Medição local

Chromium headless (Playwright 1.56) com WebGL por SwiftShader, servidor local com Brotli e os mesmos cabeçalhos de cache da Vercel, cache vazio. O build anterior (`345c281`) e o novo foram medidos na mesma máquina, nos mesmos perfis. Valores de uma execução; não são dados de campo nem nota Lighthouse.

| Métrica | Desktop antes | Desktop depois | Celular antes | Celular depois |
| --- | ---: | ---: | ---: | ---: |
| Transferido até o `load` | 2.195 KiB | 797 KiB | 2.133 KiB | 500 KiB |
| Evento `load` | 2,60 s | 0,79 s | 12,41 s | 2,83 s |
| Primeiro conteúdo — FCP | 0,72 s | 0,74 s | 1,54 s | 1,04 s |
| Maior conteúdo — LCP | 0,72 s | 0,74 s | 9,54 s | 2,85 s |
| Bloqueio da thread principal — TBT aprox. | 1.483 ms | 379 ms | 1.429 ms | 1.196 ms |

Desktop: 1440 × 900, DPR 2, 20 Mbps, 40 ms, CPU 1×. Celular: 390 × 844, DPR 3, 1,6 Mbps, 150 ms, CPU 4×. O TBT inclui esperas pela GPU emulada em software, que compila shaders só quando consultada e não oferece compilação paralela; em GPUs reais essas esperas são bem menores. O restante do TBT no celular é a preparação da Essência, que agora acontece depois do `load`, em tempo ocioso.

Custo de um quadro do shader do início, 640 × 400 no SwiftShader: 395–507 ms antes, 158–227 ms depois, nos seis mundos e durante as frentes de transição.

### O que mudou

- **Texturas de papel.** O Estúdio e o Contato baixavam a gravura inteira (`hero.webp`, 442 KB) para mostrar só o canto superior esquerdo, ampliado. Agora usam esse recorte, `paper-grain.webp` (29 KB), com `background-size` recalculado para a mesma escala.
- **Essência adiada.** Os quatro programas WebGL e as texturas da volvela (até ~1 MB) eram preparados na abertura da página, disputando banda com a prancha do início e segurando o `load`. Agora começam depois que o início assenta (2,5 s após o `load`, em tempo ocioso) ou assim que o visitante vai para a Essência. Rodas de até ~975 px de dispositivo usam a volvela de 1024 px (380 KB em vez de 885 KB); uma janela que cresce troca pela de 2048 px.
- **Sem travar a thread principal.** As texturas são decodificadas fora dela (`createImageBitmap` a partir do arquivo; enviar o `<img>` decodificava de novo, de forma síncrona). As extensões são consultadas antes de compilar, e o resultado da compilação só é lido quando as texturas chegam, por `KHR_parallel_shader_compile` quando disponível: qualquer consulta antes disso esperava a GPU terminar. O limite de anisotropia, lido a cada textura, travava ~0,6 s por textura no SwiftShader. A Essência deixou o MSAA, que não alterava a imagem (as bordas já são suavizadas no shader) e custava memória e banda a cada quadro.
- **Shader do início.** Mesmo resultado pixel a pixel: diferença 0 nos seis mundos, em três frentes de transição e em dois níveis de mip. As amostras da prancha pulam o ramo do pergaminho quando caem dentro dela, e os seis mundos são inlinados uma vez em vez de quatro, o que encurta a compilação.
- **Prancha para celulares.** Telas de até 440 px recebem `hero-plate-1152.webp` (368 KB em vez de 609 KB). O canvas delas nunca mostra a prancha com mais de ~1150 px, e um celular girado para paisagem troca pela prancha completa. (O preload e o fundo CSS dessas telas passaram depois a ser o esboço da abertura; ver a seção acima.)
- **CSS embutido no HTML.** São ~14 KB comprimidos; a primeira pintura não espera uma segunda requisição bloqueante que disputava banda com a prancha.
- **Ritmo dos quadros** (`js/gl-pace.js`). Os dois canvases desenham no máximo ~90 vezes por segundo: em 120 Hz, um quadro sim, outro não; 60 e 90 Hz ficam iguais. Se a GPU não acompanha (quadros irregulares abaixo de ~43 fps, ou qualquer ritmo abaixo de ~25 fps), a resolução desce em passos de 0,85, nunca abaixo de um pixel por pixel CSS. Um limite estável de 30 fps (economia de energia) não reduz nada.
- **Céu do Estúdio.** O `ResizeObserver` dimensiona o canvas no primeiro quadro; antes, um dimensionamento extra na abertura forçava mais um layout síncrono da página.

### Verificação

- Shader do início: banco de testes que renderiza o shader antigo e o novo com a prancha real e compara os pixels lidos da GPU.
- Capturas por seção, antes e depois, em desktop e celular, com tempo congelado (`?at=`, `?e-at=`) e movimento reduzido no Estúdio e no Contato.
- `npm run build` valida referências, sintaxe e conteúdo; nenhum erro de JavaScript no carregamento nem ao navegar pelas seções.

### Reproduzir as imagens

Com Pillow:

```python
from PIL import Image
hero = Image.open('assets/images/hero.png').convert('RGB')
hero.crop((0, 0, 232, 941)).save('assets/images/paper-grain.webp', quality=92, method=6)
plate = Image.open('assets/images/hero-plate.webp').convert('RGB')
plate.resize((1152, 768), Image.LANCZOS).save('assets/images/hero-plate-1152.webp', quality=90, method=6)
volvella = Image.open('assets/images/volvella-plate.webp')
volvella.resize((1024, 1024), Image.LANCZOS).save('assets/images/volvella-plate-1024.webp', quality=90, alpha_quality=100, method=6)
```

## Rodada de setembro de 2026

Otimização verificada em 5 de setembro de 2026. Conteúdo, layout, tipografia, efeitos e interações preservados. Os PNGs originais continuam disponíveis para edição.

### Medição local

Comparação entre uma cópia anterior às alterações e o build `dist/`, no Chromium do ego-browser: viewport de 390 × 844, DPR 3, CPU limitada em 4×, download de 1,6 Mbps, upload de 0,8 Mbps e latência configurada em 150 ms. Cache desabilitado e limpo. Servidor Python local, sem compressão HTTP. Uma execução de cada versão; não são dados de usuários reais nem uma nota Lighthouse.

| Métrica | Antes | Build otimizado |
| --- | ---: | ---: |
| Conteúdo principal visível — LCP | 24,96 s | 4,76 s |
| Payload observado, incluindo HTML | 4,57 MB | 0,82 MB |
| Imagens baixadas | 4,34 MB | 0,57 MB |
| Requisições observadas | 20 | 11 |
| Primeiro conteúdo — FCP | 1,19 s | 1,76 s |
| Mudanças de layout — CLS | 0,0018 | 0 |

O ganho principal medido é de 81% no LCP e 82% no payload. O primeiro paint não melhorou nesta execução: as fontes locais e a gravura prioritária participam da disputa inicial de banda. As fontes externas do original não apareceram como downloads WOFF2 separados no Resource Timing do ambiente, o que limita especialmente essa comparação de FCP e requisições. Os valores brutos observados estão em [performance.json](performance.json).

O LCP ainda fica acima de 2,5 s nessa simulação severa, sem compressão HTTP. Após publicar, medir novamente o domínio real com Lighthouse/PageSpeed e dados de campo; não extrapolar estes números para todos os dispositivos. INP não foi medido nesta rodada.

### Entrega na Vercel

`npm run build` combina os estilos na ordem original e minifica o JavaScript como scripts clássicos, preservando os módulos globais da física. O build valida referências, integridade do conteúdo HTML e sintaxe. Resultado: 1 CSS de 71.675 bytes e 1 JS de 52.429 bytes. O build não inclui os PNGs originais, testes ou arquivos de desenvolvimento.

Os nomes dos assets contêm um hash do conteúdo. `vercel.json` permite cache de um ano para esses arquivos; qualquer edição muda a URL automaticamente. O HTML é revalidado para descobrir a versão atual. A política segue a [documentação de cache da Vercel](https://vercel.com/docs/caching/cache-control-headers).

A Vercel negocia Brotli/gzip para HTML, CSS, JavaScript e SVG quando o navegador os aceita, conforme a [documentação de compressão](https://vercel.com/docs/how-vercel-cdn-works/compression). Não foram criados arquivos `.br` nem cabeçalhos `Content-Encoding` artificiais. A configuração está pronta; esta tarefa não publicou um deployment nem verificou headers de um domínio de produção.

### Imagens e fontes

| Imagem | Original | Arquivo usado |
| --- | ---: | ---: |
| Gravura | 2.813.906 bytes | 451.904 bytes |
| Gato | 1.449.204 bytes | 54.516 / 87.012 bytes |
| Logo | 76.154 bytes | 62.794 bytes |

A gravura mantém 1672 × 941 pixels, com WebP qualidade 92. Foram comparados detalhes ampliados e as capturas do site; não houve diferença visual perceptível na revisão. Essa conversão é com perdas. O logo foi verificado byte a byte após decodificar RGBA e é idêntico. O gato usa variantes de 330 e 440 pixels, adequadas ao tamanho de exibição e telas de alta densidade, com codificação sem perdas após redimensionamento. Os traços em pixel art e a transparência foram preservados.

Reproduzir com cwebp e ImageMagick instalados:

```sh
cwebp -q 92 -m 6 -sharp_yuv assets/images/hero.png -o assets/images/hero.webp
cwebp -lossless -m 6 -exact assets/images/goiaba-lunar.png -o assets/images/goiaba-lunar.webp
magick assets/images/tabby-v2.png -filter point -resize 330x /tmp/portfolio-tabby-330.png
cwebp -lossless -m 6 -exact /tmp/portfolio-tabby-330.png -o assets/images/tabby-v2-330.webp
magick assets/images/tabby-v2.png -filter point -resize 440x /tmp/portfolio-tabby-440.png
cwebp -lossless -m 6 -exact /tmp/portfolio-tabby-440.png -o assets/images/tabby-v2-440.webp
```

Instrument Serif, Manrope e VT323 são os WOFF2 originais do Google Fonts, servidos localmente. Pesos, itálico, subconjuntos Unicode e licenças foram preservados. As três fontes da primeira tela têm preload e a gravura tem prioridade alta. Imagens do estúdio usam `loading="lazy"`, `decoding="async"` e prioridade baixa; o navegador decide quão cedo antecipá-las.

### Trabalho durante as interações

- O canvas de estrelas só agenda frames enquanto o Estúdio está ativo e a página está visível. Em harness determinístico: 60 → 0 callbacks por segundo simulado fora da seção, com os mesmos comandos de desenho quando visível.
- A colisão das flechas mede as palavras uma vez por frame, antes de alterar estilos. Em cenário de seis flechas e passo de 50 ms: 2.121 → 61 leituras de retângulos, mantendo trajetórias, cortes e anúncios idênticos.
- O portal só registra seus bloqueadores de gestos enquanto a transição está aberta. Escape remove o overlay, restaura foco e estado `inert` e libera os listeners.

### Verificação

- `npm test`: testes de física e voo aprovados.
- `npm run build`: referências, sintaxe, conteúdo e hashes validados; dois builds produziram arquivos idênticos.
- Navegador: comparação visual desktop/mobile; quatro seções sem overflow horizontal no celular; arco pelo teclado, ciclope e cancelamento do portal verificados. Nenhum erro JavaScript observado no build.
- O detector Impeccable executou em modo reduzido por falta de parsers opcionais. Seus avisos sobre Instrument Serif não motivaram alteração da identidade tipográfica; ele não substitui a verificação visual.
