# Verificação da revisão 2

6 de setembro de 2026. Chromium via Ego Browser, com páginas locais. Dimensões emuladas; não equivalem a ensaio em aparelhos físicos.

## Resultados

- Build estático concluído, referências locais válidas; aproximadamente 2,67 MiB incluindo todos os mundos e sons.
- Quatro testes Node passaram: ramos e finais distintos, imutabilidade, escolhas inválidas, integridade do grafo e normalização de rotas.
- Galáxia e três mundos conferidos em 1440×900, 390×844 e 320×740. Altura/largura do documento iguais às do viewport, com rota persistente. As obras laterais da galeria são recortes intencionais; as setas continuam visíveis.
- Cindra: exemplo alternativo, revisão, desmarcar Finanças e guardar somente dois itens; áreas salvas legíveis com movimento pausado.
- CommissionMatch: três obras, títulos, contador e seleção sincronizados.
- Mangue: dois caminhos e dois finais alcançados; mapa acompanha nós e arestas, reinício funcional. Leitura e mapa alternam no retrato móvel e coexistem em paisagem.
- Estados expandidos conferidos também em 320×568 e 667×375. Somente o texto da história pode rolar internamente em paisagem baixa; escolhas e rota permanecem disponíveis.
- Navegação rápida galáxia → Cindra → Mangue → galáxia termina com URL e mundo coerentes, sem conclusão atrasada. Pular e pausar a viagem chegam ao destino correto.
- Durante a viagem, main fica inerte e o foco vai para Pular viagem. A introdução também torna Morfeu inerte. Ativar movimento reduzido durante a chegada encerra a animação, restaura o foco na rota e deixa zero animações em execução.
- Chegada de 4,8 s observada ainda em andamento aos 2 s; travessias configuradas para 2,8 s.
- Áudio: zero contextos/fontes antes da ativação; um contexto e uma fonte iniciada após consentimento, fonte parada e controle desativado ao silenciar.
- Sem JavaScript, três projetos e os dois destinos externos disponíveis continuam acessíveis.
- Nenhum erro de página ou rejeição não tratada nos percursos finais instrumentados.

## Revisão visual e detector

Revisão independente de 12 capturas confirmou estruturas distintas e rota dentro do viewport. Foram corrigidos espaço no título do Mangue, margem do rótulo CommissionMatch móvel e fundo preto de Cindra.

O detector Impeccable executou uma vez nesta revisão em modo degradado, sem dependências do parser HTML. O único alerta foi transição de largura, disparado pela propriedade SVG stroke-width; essa interpolação foi removida. O resultado não certifica contraste ou acessibilidade.

## Limites

Sem benchmark em aparelho físico ou certificação formal de acessibilidade. A auditoria sonora cobre arquivos e reprodução; a escuta artística em diferentes aparelhos permanece avaliação do proprietário. A publicação continua privada. O domínio público e o portal do portfólio seguem independentes.
