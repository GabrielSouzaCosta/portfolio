# Gabriel Souza Costa — portfólio

A versão final está em `v2.html`. Site estático em HTML, CSS e JavaScript, sem dependências de build.

## Executar localmente

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Acesse [o portfólio](http://127.0.0.1:4173/v2.html).

## Estrutura

```text
portfolio/
├── v2.html          # Página final
├── css/             # Estilos gerais, responsivos e das seções
├── js/              # Navegação, formulário e animações
├── assets/
│   ├── favicon.svg
│   └── images/      # Gravura, logo e gato do estúdio
├── docs/
│   └── assets.md    # Origem das imagens
├── tests/           # Testes de física e voo
└── README.md
```

Os arquivos mantêm seus nomes dentro de `css/` e `js/`. Os módulos `essence*` cuidam do arco e da flecha; `contact*`, do ciclope; `morfeu-cursor*`, do cursor do estúdio; e `studio-portal.js`, da transição para o estúdio.

## Destinos e formulário

A configuração está no início de `js/v2.js`. `studioUrl` aponta temporariamente para `https://cindra.app`; ao alterá-lo, atualize também os dois links `data-studio-portal` em `v2.html`, usados sem JavaScript.

`contactEndpoint` ainda está vazio. Para receber mensagens, configure um endpoint HTTPS que aceite POST JSON com `name`, `email` e `message`. O servidor deve validar os campos; uma resposta de sucesso deve indicar recebimento real. Até a configuração, o formulário informa que o canal ainda não recebe mensagens e preserva os campos preenchidos.

As fontes Instrument Serif, Manrope e VT323 são carregadas do Google Fonts, com alternativas no CSS. A página respeita `prefers-reduced-motion`.

## Verificar

Com Node.js disponível:

```sh
node --test tests/*.test.cjs
```
