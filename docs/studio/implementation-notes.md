# Implementação do estúdio

Atualizado em 6 de setembro de 2026. A revisão 2 está em `goiaba-lunar/`, após aprovação do briefing v0.2.

## Arquitetura realizada

HTML, CSS e módulos JavaScript sem dependências externas de execução. Planetas são ilustrações independentes com profundidade e movimentos suaves; Canvas 2D cuida somente de estrelas e hiperespaço. A escolha preserva o aspecto desenhado sem carregar um motor 3D.

O site tem servidor, build e testes próprios. O portfólio pessoal e seu processo Vercel continuam independentes. O build do estúdio copia apenas conteúdo publicado e valida referências locais. Assets, sons e fontes são locais; demos não dependem de APIs, contas ou bancos dos produtos.

## Navegação

Rotas compartilháveis `#galaxia`, `#cindra`, `#commissionmatch` e `#mangue`. Histórico, foco após chegada e retorno, interrupção de transições e recuperação de hashes desconhecidos foram implementados. A primeira visita à galáxia oferece chegada de 4,8 segundos pulável. Viagens entre mundos duram 2,8 segundos e também podem ser puladas. A rota de planetas em miniatura fica sempre na base do viewport. Acesso direto e movimento reduzido pulam a chegada.

No desktop, o mapa tem disposição assimétrica. Em telas pequenas, o mapa se redistribui dentro da altura disponível. As experiências usam a área entre cabeçalho e rota. Cindra apresenta uma mesa de organização; CommissionMatch, uma galeria em perspectiva; Mangue, leitura e ramificações. As ilustrações de planetas não se repetem nos produtos. Em paisagem baixa, o texto da história pode rolar internamente.

## Demonstrações e destinos

| Projeto | Implementação | Destino |
|---|---|---|
| Cindra | Dois exemplos preparados, revisão por checkbox, armazenamento local na demo e reinício | `https://cindra.app/` |
| CommissionMatch | Galeria de três gravuras da identidade, com crédito e rótulo de amostra | `https://commissionmatch.art/#preview` |
| Mangue | Cinco cenas conectadas, duas escolhas iniciais, dois finais e mapa do caminho percorrido | Demonstração local |

Cindra e CommissionMatch tiveram as páginas públicas verificadas em 06/09/2026. O endereço de Mangue não respondeu nessa verificação; não foi exposto como destino disponível. O estágio Em desenvolvimento permanece visível.

## Movimento e som

A preferência de movimento do sistema é respeitada; um controle independente permite pausar os ciclos. Navegação e escolhas continuam funcionando sem animação. Estrelas usam resolução limitada e frequência de desenho de aproximadamente 30 Hz; ciclos pausam com aba oculta.

Som começa desligado e só é baixado após uma ação explícita. Há quatro ambientes e seis efeitos, sem música ou voz. Ambientes fazem transição de 0,7 segundo; desativar som interrompe as fontes. Carregamentos antigos não podem reativar uma cena abandonada. Aba oculta silencia a reprodução.

## Limites e manutenção

As interpretações do Cindra são exemplos curados, não inferência de IA em execução. A galeria não inventa artistas ou preços. A história do Mangue é uma demonstração original, sem integração ao editor real. Não foram criados formulários sem destino funcional.

Os arquivos do estúdio podem ser hospedados separadamente ou sob um subdiretório. O portal do portfólio mantém seu destino atual até a definição da URL pública definitiva. A publicação de revisão usa acesso privado.

[Direção visual](../../goiaba-lunar/DESIGN.md) · [Assets e créditos](../../goiaba-lunar/ASSETS.md) · [Verificação](verification.md)
