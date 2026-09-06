# Goiaba Lunar

Landing page do estúdio: uma galáxia ilustrada com três projetos, explorada livremente com Morfeu. Revisão 5, de 6 de setembro de 2026: cinco modelos reconstruídos, planetas que giram por arraste e viagens de nave em Three.js, com aproximação e entrada na atmosfera. A marca original em pixel art é preservada.

## Executar

```sh
cd goiaba-lunar
npm install
npm run dev
```

Abra `http://127.0.0.1:4178/`. Three.js e esbuild são dependências locais, fixadas no lockfile. `STUDIO_PORT` permite escolher outra porta.

```sh
npm test
npm run build
```

A saída estática fica em `dist/`. Todos os caminhos de assets são relativos, permitindo hospedar em domínio próprio ou subdiretório. O site possui configuração própria de Sites em `.openai/hosting.json`; o portfólio pessoal e seu build permanecem independentes.

## Explorar

- `#galaxia`: três planetas interativos, nave do Morfeu e rota persistente com destinos em miniatura.
- `#cindra`: escolher um pensamento de exemplo, revisar sugestões e guardar somente os itens selecionados. Ação externa para o produto disponível.
- `#commissionmatch`: três gravuras de referência, com atribuição, e acesso à prévia pública.
- `#mangue`: história original com dois caminhos, dois finais e mapa que acompanha as cenas visitadas. Produto em desenvolvimento; demonstração local.

A chegada da nave dura 2,4 s e deixa o mapa disponível para exploração. Viagens aos planetas duram 5,8 s; o retorno, 4,6 s. A nave segue um percurso 3D enquanto a câmera se aproxima da superfície, e a interface do projeto aparece após a entrada. “Chegar ao destino” e Escape pulam a viagem. Arrastar gira o planeta; clicar ou pressionar Enter inicia a rota. Cavaleiro e Morfeu acompanham o cursor, com aceno, piscadas e reação ao carinho.

A rota inferior permanece acessível entre mundos. Movimento pode ser pausado e respeita a preferência do sistema. Navegação suporta teclado, acesso direto, histórico, interrupção de viagens e recuperação de hash desconhecido. Sem JavaScript, os três projetos e destinos disponíveis continuam acessíveis.

## Estrutura

- `index.html`, `styles.css`, `drawn.css`: conteúdo semântico e composição responsiva.
- `js/main.js`: rotas, foco, viagem, preferências e Morfeu.
- `js/three/`: malhas, materiais, iluminação, interação e renderização; `flight.js` contém trajetória, câmera, atmosfera e rastro da nave.
- `js/studio.js`: bundle clássico gerado, sem CDN; permite abrir também o HTML diretamente.
- `scripts/bundle.mjs`: empacotamento para build e recompilação no servidor de desenvolvimento.
- `js/stars.js`: estrelas e hiperespaço em Canvas 2D.
- `js/audio.js` e `assets/audio/`: arquivos históricos, excluídos da interface e do build.
- `js/demos.js`, `js/story.js`: demonstrações e grafo da narrativa.
- `assets/drawn/`: desenhos SVG anteriores, usados como fallback sem WebGL.
- `assets/`: fundo, marcas, gravuras dos produtos e fontes licenciadas.
- `source/`: procedência, prompts, hashes e receita dos sons; não é copiado ao build público.
- `tests/`: histórias/rotas, integridade geométrica, animação dos cinco modelos e câmera/tempos da viagem.

[Direção realizada](DESIGN.md) · [Créditos e assets](ASSETS.md) · [Relatório de verificação](../docs/studio/verification.md) · [Briefing](../docs/studio/brief.md)
