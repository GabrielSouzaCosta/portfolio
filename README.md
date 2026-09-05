# Gabriel Souza Costa — Portfólio

Meu portfólio como desenvolvedor de software: uma experiência interativa que apresenta meu trabalho, minha visão de produto e o **Goiaba Lunar**, meu estúdio de desenvolvimento.

**[Visite o portfólio →](https://gabriel.goiabalunar.tech/)**

## Sobre o projeto

Construído com HTML, CSS e JavaScript, sem framework de interface. O site combina tipografia editorial, ilustrações e elementos em pixel art em uma navegação por quatro seções: apresentação, essência, estúdio e contato.

- Layout responsivo, com navegação por mouse, toque e teclado.
- Animações e interações próprias, incluindo arco e flecha, ciclope e cursor do estúdio.
- Suporte à preferência de movimento reduzido (`prefers-reduced-motion`).
- Fontes hospedadas localmente e imagens otimizadas em WebP.
- Build de produção com esbuild e publicação na Vercel.

## Executar localmente

Os arquivos de origem funcionam sem instalação de dependências ou etapa de build. Com Python 3 disponível, execute na raiz do repositório:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Abra [localhost:4173](http://127.0.0.1:4173).

## Build e testes

Com Node.js e npm instalados:

```sh
npm ci
npm test
npm run build
```

Os testes verificam a física e o voo da flecha. O build valida referências a arquivos, combina e minifica CSS e JavaScript e gera os arquivos de produção em `dist/`, com nomes baseados no conteúdo para controle de cache.

Para conferir o resultado localmente:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Edite os arquivos de origem; `dist/` é gerado automaticamente e não é versionado.

## Estrutura

```text
.
├── index.html        # Conteúdo e estrutura da página
├── css/              # Estilos, seções e layouts responsivos
├── js/               # Navegação, formulário e interações
├── assets/
│   ├── fonts/        # Fontes locais e suas licenças
│   ├── images/       # Ilustrações, logo e versões otimizadas
│   └── favicon.svg
├── scripts/build.mjs # Build e validações de produção
├── tests/            # Testes da física e do voo da flecha
├── docs/             # Documentação técnica e origem dos assets
└── vercel.json       # Configuração de deploy e cache
```

## Configuração

As opções de integração ficam no início de [`js/v2.js`](js/v2.js):

- **Estúdio (`studioUrl`):** aponta atualmente para `https://cindra.app`. Ao trocar o destino, atualize também os dois links com `data-studio-portal` em `index.html`, usados quando o JavaScript está desabilitado.
- **Contato (`contactEndpoint`):** ainda não está configurado. O formulário informa essa condição e preserva os campos preenchidos. Para habilitar o envio, configure um endpoint HTTPS que aceite `POST` com JSON contendo `name`, `email` e `message`, valide os dados no servidor e só retorne sucesso após o recebimento real da mensagem.

## Publicação

O [`vercel.json`](vercel.json) define `npm run build` como comando de build e `dist/` como diretório de saída. Os assets gerados recebem cache imutável de um ano, enquanto o HTML é revalidado a cada acesso.

## Assets e créditos

As fontes **Instrument Serif**, **Manrope** e **VT323** são distribuídas com suas licenças SIL Open Font License em [`assets/fonts/`](assets/fonts/).

A origem das imagens e os detalhes dos arquivos visuais estão em [`docs/assets.md`](docs/assets.md). As medições de desempenho e os comandos para reproduzi-las estão em [`docs/performance.md`](docs/performance.md).
