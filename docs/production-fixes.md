# Correções da auditoria — 5 de setembro de 2026

Corrigidos os itens 1, 4, 5 e 6 da auditoria de produção, além das observações de canonical e cache de arquivos inexistentes. O formulário, sua configuração de envio e os dois links para `https://cindra.app` permanecem como estavam, conforme solicitado.

## Mudanças

- As cenas assumem sua posição inicial antes de habilitar as transições. O hero usa a mesma altura mínima e padding antes e depois da inicialização, eliminando a passagem indevida por outras seções.
- A entrada pixelada só pode começar antes da primeira pintura de conteúdo. Imagens ou fontes que terminam de carregar depois disso não cobrem a página já legível. A animação continua disponível ao retornar ao início pela navegação.
- As seções crescem e permitem rolagem interna quando o conteúdo não cabe. A navegação por gesto avança para a próxima seção depois de chegar ao fim do conteúdo. O cabeçalho mobile recebe um fundo sólido durante a rolagem.
- Todos os links do menu têm nomes acessíveis permanentes. Os rótulos da identidade e do link Explore incluem seu texto visível. Espaços entre os trechos da identidade evitam palavras concatenadas no cálculo do nome acessível.
- A página declara `https://gabriel.goiabalunar.tech/` como URL canônica.
- O cache imutável dos assets passa a ser aplicado na fase `hit` da Vercel, após encontrar o arquivo. URLs inexistentes conservam o tratamento padrão de 404. O build verifica a cobertura dos assets e impede regras anteriores que anulariam esse cache.
- Cliques com modificadores nos links internos preservam o comportamento nativo de abrir outra aba/janela.

## Performance: comparação sob condições iguais

Lighthouse 13.4.1, Chrome local, build anterior `ade65fb` versus build corrigido. Execuções sequenciais, perfis limpos e servidores equivalentes com gzip e cache. Um atraso controlado de 400 ms no bundle JavaScript, aplicado nas duas versões, reproduziu o problema de inicialização. São resultados de laboratório local; não devem ser comparados diretamente às notas da auditoria da URL publicada.

| Métrica | Celular antes | Celular depois | Desktop antes | Desktop depois |
|---|---:|---:|---:|---:|
| Performance | 62 | 86 | 75 | 99 |
| FCP | 1,057 s | 1,055 s | 0,289 s | 0,286 s |
| LCP | 4,205 s | 4,203 s | 0,826 s | 0,824 s |
| TBT | 8 ms | 0 ms | 0 ms | 0 ms |
| CLS | 1 | 0,000494 | 1 | 0 |
| Speed Index | 1,218 s | 1,055 s | 0,340 s | 0,286 s |

O grande salto visual foi eliminado. A maior pintura de conteúdo no celular permanece ligada à imagem principal e à transferência simulada; estas correções não reduzem esse tempo de forma relevante. As 18 imagens, fontes e ícone emitidos continuam idênticos byte por byte ao build anterior.

As categorias padrão de acessibilidade, boas práticas e SEO mantiveram 100/100. A última alteração posterior à medição completa acrescenta somente dois espaços ao HTML da identidade para o cálculo do nome acessível; não altera os bundles nem a composição visual.

A verificação pontual posterior de `label-content-name-mismatch` passou, com score 1, nenhum elemento reprovado e nenhum aviso: [resultado](/private/tmp/portfolio-fixes-audit/fixed-accessible-labels.json).

## Validação

- `npm run build`: passou, com 24 arquivos versionados por conteúdo e validação das referências e da política de cache.
- `node --test tests/*.test.cjs`: os dois conjuntos de testes de física e voo passaram.
- `git diff --check`: passou.
- Quatro seções em oito viewports: 1440 × 900, 390 × 844, 320 × 568, 844 × 390, 568 × 320, 320 × 256, 1280 × 600 e 768 × 1024. Nenhum transbordamento horizontal ou conteúdo fora do alcance da rolagem nos elementos verificados.
- Em 320 px, a árvore de acessibilidade identifica corretamente os links Início e Contato.
- Teclado, histórico voltar/avançar, swipe vertical, arco e ciclope funcionaram. A rolagem chega ao fim do estúdio antes de avançar para Contato.
- Abertura direta em `#estudio` posiciona a cena no topo. A transição normal de 0,88 s continua funcionando. Sem JavaScript, as quatro seções ficam no fluxo natural, sem `inert`.
- Nenhum erro de JavaScript capturado nas interações finais.
- Configuração da Vercel validada com o parser oficial `@vercel/routing-utils` e as definições do esquema. A fase `hit` usa o mecanismo de rotas legado ainda suportado pela plataforma; a confirmação HTTP em produção depende da próxima publicação.

O detector Impeccable não apontou achados no fallback disponível, mas informou ausência dos parsers completos; a validação principal foi feita no navegador. Safari/iOS e aparelhos físicos não foram testados.

Evidências temporárias: [layouts](/private/tmp/portfolio-fixes-audit/layout-checks.json), [interações finais](/private/tmp/portfolio-fixes-audit/interactions-final.json), [links acessíveis](/private/tmp/portfolio-fixes-audit/accessibility-links.json) e [cabeçalho durante a rolagem](/private/tmp/portfolio-fixes-audit/landscape-studio-bottom-final.png).

As alterações estão no projeto local e no build `dist/`. Nenhum deployment foi executado nesta correção.
