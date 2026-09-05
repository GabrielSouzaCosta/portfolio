# Performance

Otimização verificada em 5 de setembro de 2026. Conteúdo, layout, tipografia, efeitos e interações preservados. Os PNGs originais continuam disponíveis para edição.

## Medição local

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

## Entrega na Vercel

`npm run build` combina os estilos na ordem original e minifica o JavaScript como scripts clássicos, preservando os módulos globais da física. O build valida referências, integridade do conteúdo HTML e sintaxe. Resultado: 1 CSS de 71.675 bytes e 1 JS de 52.429 bytes. O build não inclui os PNGs originais, testes ou arquivos de desenvolvimento.

Os nomes dos assets contêm um hash do conteúdo. `vercel.json` permite cache de um ano para esses arquivos; qualquer edição muda a URL automaticamente. O HTML é revalidado para descobrir a versão atual. A política segue a [documentação de cache da Vercel](https://vercel.com/docs/caching/cache-control-headers).

A Vercel negocia Brotli/gzip para HTML, CSS, JavaScript e SVG quando o navegador os aceita, conforme a [documentação de compressão](https://vercel.com/docs/how-vercel-cdn-works/compression). Não foram criados arquivos `.br` nem cabeçalhos `Content-Encoding` artificiais. A configuração está pronta; esta tarefa não publicou um deployment nem verificou headers de um domínio de produção.

## Imagens e fontes

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

## Trabalho durante as interações

- O canvas de estrelas só agenda frames enquanto o Estúdio está ativo e a página está visível. Em harness determinístico: 60 → 0 callbacks por segundo simulado fora da seção, com os mesmos comandos de desenho quando visível.
- A colisão das flechas mede as palavras uma vez por frame, antes de alterar estilos. Em cenário de seis flechas e passo de 50 ms: 2.121 → 61 leituras de retângulos, mantendo trajetórias, cortes e anúncios idênticos.
- O portal só registra seus bloqueadores de gestos enquanto a transição está aberta. Escape remove o overlay, restaura foco e estado `inert` e libera os listeners.

## Verificação

- `npm test`: testes de física e voo aprovados.
- `npm run build`: referências, sintaxe, conteúdo e hashes validados; dois builds produziram arquivos idênticos.
- Navegador: comparação visual desktop/mobile; quatro seções sem overflow horizontal no celular; arco pelo teclado, ciclope e cancelamento do portal verificados. Nenhum erro JavaScript observado no build.
- O detector Impeccable executou em modo reduzido por falta de parsers opcionais. Seus avisos sobre Instrument Serif não motivaram alteração da identidade tipográfica; ele não substitui a verificação visual.
