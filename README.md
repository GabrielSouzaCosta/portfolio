# Gabriel Souza Costa — portfólio

A versão final está em `index.html`. Site estático em HTML, CSS e JavaScript. Os arquivos de origem funcionam sem build; a publicação na Vercel usa um build leve com esbuild para minificação e cache.

## Executar localmente

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Acesse [o portfólio](http://127.0.0.1:4173/index.html).

## Produção na Vercel

```sh
npm ci
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

O `vercel.json` configura automaticamente o comando de build e a pasta `dist/`. CSS e JavaScript são combinados e minificados; os assets têm nomes baseados no conteúdo e cache de um ano. O HTML é revalidado para receber novas versões. Edite os arquivos de origem, nunca `dist/`. Não é necessário mudar manualmente versões de arquivos para invalidar o cache.

## Estrutura

```text
portfolio/
├── index.html          # Página final
├── css/             # Estilos gerais, responsivos e das seções
├── js/              # Navegação, formulário e animações
├── assets/
│   ├── favicon.svg
│   └── images/      # Gravura, logo e gato do estúdio
├── scripts/build.mjs # Build de produção e validação de referências
├── vercel.json      # Publicação e política de cache
├── docs/
│   └── assets.md    # Origem das imagens
├── tests/           # Testes de física e voo
└── README.md
```

Os arquivos mantêm seus nomes dentro de `css/` e `js/`. Os módulos `essence*` cuidam do arco e da flecha; `contact*`, do ciclope; `morfeu-cursor*`, do cursor do estúdio; e `studio-portal.js`, da transição para o estúdio.

## Destinos e formulário

A configuração está no início de `js/v2.js`. `studioUrl` aponta temporariamente para `https://cindra.app`; ao alterá-lo, atualize também os dois links `data-studio-portal` em `index.html`, usados sem JavaScript.

`contactEndpoint` ainda está vazio. Para receber mensagens, configure um endpoint HTTPS que aceite POST JSON com `name`, `email` e `message`. O servidor deve validar os campos; uma resposta de sucesso deve indicar recebimento real. Até a configuração, o formulário informa que o canal ainda não recebe mensagens e preserva os campos preenchidos.

As fontes Instrument Serif, Manrope e VT323 são servidas localmente em WOFF2, com as licenças em `assets/fonts/`. A página respeita `prefers-reduced-motion`.

As imagens exibidas usam WebP: gravura na resolução original, logo sem perda de pixels e gato com variantes para telas de alta densidade. Os PNGs originais continuam em `assets/images/`. A gravura e as fontes da primeira tela têm prioridade de carregamento; as imagens do estúdio usam carregamento adiado. Veja as medições e os comandos de reprodução em [docs/performance.md](docs/performance.md).

## Verificar

Com Node.js disponível:

```sh
node --test tests/*.test.cjs
```
