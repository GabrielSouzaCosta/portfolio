# Auditoria de produção — 5 de setembro de 2026

Atualização: os itens 1, 4, 5 e 6 e as observações de canonical/cache foram tratados no código. Os itens 2 e 3 foram preservados a pedido do usuário. Veja a validação em [production-fixes.md](production-fixes.md). Este relatório mantém o diagnóstico da versão publicada anterior.

URL: https://gabriel.goiabalunar.tech/  
Build publicado: `ade65fb` — HTML e 24 arquivos de `dist/assets` conferidos por hash com a produção.

## Resultado

A entrega pela Vercel está bem configurada, mas a experiência inicial ainda precisa de correção para ser considerada muito rápida e estável. A principal falha reproduzida é a troca indevida de cenas durante a inicialização. Também foram confirmados formulário sem envio configurado, destino provisório do estúdio, conteúdo cortado em telas baixas e um link sem nome acessível em telas estreitas.

Esta auditoria acrescenta somente este relatório ao projeto. Os resultados abaixo descrevem o site publicado, antes de correções.

## Performance medida

Lighthouse 13.4.1, Chrome headless local, execuções sequenciais com perfis temporários separados e cache do navegador limpo.

| Métrica | Celular | Desktop |
|---|---:|---:|
| Performance | 64/100 | 48/100 |
| Primeira pintura de conteúdo — FCP | 0,98 s | 2,03 s |
| Maior pintura de conteúdo — LCP | 3,33 s | 2,10 s |
| Bloqueio da thread principal — TBT | 8,5 ms | 0 ms |
| Instabilidade visual — CLS | 1,00006 | 1,00000 |
| Speed Index | 4,83 s | 6,02 s |

Celular: 412 × 823, DPR 1,75, simulação de RTT de 150 ms, 1.638,4 Kbps e CPU 4×. Desktop: 1350 × 940, DPR 1, RTT de 40 ms, 10.240 Kbps e CPU 1×.

São amostras locais de laboratório; não representam dados agregados de visitantes. Houve variação de rede relevante no teste desktop, por isso a diferença entre as notas não prova que desktop seja sempre mais lento. As métricas simuladas do Lighthouse também diferem dos tempos reais dos frames do trace. O endpoint público do PageSpeed Insights respondeu 429, portanto estas notas são do Lighthouse local.

Acessibilidade, boas práticas e SEO automáticos: 100/100 nos dois perfis padrão. A verificação adicional em 320 px encontrou uma falha de acessibilidade que esses perfis não cobrem.

Relatórios completos: [celular](/private/tmp/portfolio-production-audit/lighthouse-mobile-clean.report.html) e [desktop](/private/tmp/portfolio-production-audit/lighthouse-desktop-clean.report.html).

## Problemas confirmados

### 1. Alta prioridade: cenas aparecem fora de ordem no carregamento

Em uma navegação inicial sem interação, o trace mostra o início aos 3,533 s e a seção Contato aos 4,562 s. O salto de layout ocupa a viewport inteira e ocorre imediatamente após `DOMContentLoaded`. O CLS ficou próximo de 1 nos dois testes independentes.

A análise do código indica dois fatores: `js/v2.js:83` adiciona `.enhanced` somente quando o script deferido executa; `css/v2.css:54` altera o posicionamento das cenas e habilita sua transição no mesmo momento. No celular também mudam a altura mínima e o padding do hero, definidos em `css/v2.css:441` e substituídos por `css/v2-viewport.css:4`.

Correção a validar: aplicar a posição inicial sem transição e habilitar as transições após essa posição ter sido pintada; alinhar a geometria inicial do hero à geometria final. Manter o conteúdo disponível durante o carregamento.

[Evidência visual da troca de cenas](/private/tmp/portfolio-production-audit/lighthouse-mobile-transition.png).

### 2. Alta prioridade: formulário não recebe mensagens

`config.contactEndpoint` está vazio em produção (`js/v2.js:4`). Após preencher campos válidos e acionar o botão, a interface informa que o formulário ainda não recebe mensagens. Nenhuma mensagem foi enviada: a ausência do endpoint foi verificada antes do teste.

Impacto: um visitante pode preencher tudo e descobrir apenas no final que esse canal não funciona. É necessário conectar um serviço de envio ou apresentar um canal de contato funcional enquanto ele não estiver disponível.

[Evidência do formulário](/private/tmp/portfolio-production-audit/small-phone-form-error.png).

### 3. Prioridade média: destino provisório no botão do estúdio

Os dois links “Conheça o Goiaba Lunar” apontam para `https://cindra.app/` (`js/v2.js:4`; `index.html:170`). O destino existe e o portal de saída funciona, mas abre o produto Cindra. O próprio código identifica esse endereço como temporário.

Substituir pela página definitiva do estúdio quando estiver disponível, ou ajustar a promessa do link ao destino atual.

### 4. Prioridade média: conteúdo cortado em modo paisagem e telas muito baixas

Em 844 × 390, o nome Goiaba Lunar se sobrepõe à identidade do cabeçalho; a lua e sua legenda ultrapassam a borda inferior. Em 568 × 320 também há sobreposição e corte. Em uma viewport extrema de 320 × 256, parte dos botões do início e do estúdio sai da área visível.

`css/v2-viewport.css:3` impede a rolagem, e a altura fixa dos contêineres internos faz com que o gesto avance para outra seção em vez de revelar o conteúdo cortado. A solução deve permitir rolagem interna quando o conteúdo não couber, além de ajustar o layout em paisagem.

[Evidência em 844 × 390](/private/tmp/portfolio-production-audit/landscape-estudio.png).

### 5. Prioridade média: link ativo sem nome acessível até 370 px

Em 320 × 568, na seção Contato, a árvore de acessibilidade do Chrome apresenta o link ativo como um link de nome vazio. `css/v2-mobile-nav.css:103` usa `display: none` no seu texto, o ícone está marcado como decorativo e o link não tem `aria-label`.

Manter um nome acessível permanente para cada link, mesmo quando seu texto visual estiver oculto.

[Árvore de links acessíveis](/private/tmp/portfolio-production-audit/small-phone-accessibility.json).

### 6. Prioridade média: efeito pixelado reaparece depois de o conteúdo estar nítido

O filmstrip mobile mostra o hero nítido aos 4,23 s, coberto pela entrada pixelada aos 4,94 s e resolvido novamente aos 5,64 s. Isso prolonga a percepção de carregamento mesmo com o conteúdo já disponível.

Sincronizar o efeito com a primeira apresentação, ou omiti-lo quando os recursos ficarem prontos tarde. A correção pode preservar a qualidade das imagens.

[Filmstrip mobile](/private/tmp/portfolio-production-audit/lighthouse-mobile-filmstrip.png).

## Verificações aprovadas

- HTTPS válido, HTTP/2, redirecionamento HTTP → HTTPS e HSTS.
- HTML e todos os 24 assets publicados respondendo 200, com tipo correto e conteúdo idêntico ao build local.
- Gzip e Brotli em HTML, CSS e JavaScript. Esses três recursos transferem cerca de 49–52 KB comprimidos; esse valor não inclui imagens e fontes.
- Cache imutável de um ano nos assets; HTML revalidado por ETag, com resposta 304 sem corpo. Cache HIT no edge da Vercel em São Paulo.
- URLs de página e asset inexistentes retornam 404.
- Navegação pelas quatro seções, Home/End, setas/PageDown, histórico voltar/avançar e swipe vertical funcionaram nos testes. As setas e o swipe foram verificados com movimento reduzido e respeitando o intervalo entre transições.
- Arco lançou uma flecha; ciclope respondeu à interação com movimento reduzido sem bloquear o formulário; portal abriu, cancelou com Escape e navegou ao destino.
- Nenhum erro de JavaScript foi capturado durante as interações observadas. Nenhum recurso falhou nos relatórios Lighthouse.
- Sem transbordamento horizontal nas quatro seções nos seis perfis principais: 1440 × 900, 390 × 844, 320 × 568, 844 × 390, 1280 × 600 e 768 × 1024. As exceções verticais estão descritas acima.

## Observações menores e limites

`/index.html` duplica `/` sem canonical. URLs inexistentes em `/assets/` recebem o cache imutável da regra geral, embora retornem 404. Nenhum arquivo realmente referenciado estava ausente.

O Lighthouse estima espaço para reduzir mais imagens. Como o objetivo é preservar qualidade, a prioridade é corrigir a inicialização e repetir a medição antes de comprimir novamente.

O teste usou Chrome e viewports móveis emuladas; Safari/iOS e aparelhos físicos não foram cobertos. O envio real de mensagens não pôde ser validado porque o backend de contato não está configurado.

Evidências adicionais: [entrega HTTP](/private/tmp/portfolio-production-audit/REPORT.md), [resumo Lighthouse](/private/tmp/portfolio-production-audit/lighthouse-summary.md), [layouts](/private/tmp/portfolio-production-audit/layout-checks.json) e [interações finais](/private/tmp/portfolio-production-audit/interactions-final.json). Os arquivos de evidência estão no diretório temporário desta auditoria.
