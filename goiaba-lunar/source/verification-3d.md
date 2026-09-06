# Conferência da revisão 5

6 de setembro de 2026.

- `npm test`: 14 testes passaram. Cobrem coordenadas/normais/índices, profundidade, animação determinística, superfícies dos planetas, trajetória, câmera, oclusão, mudança de tamanho, retorno, chegada e histórias/rotas.
- O teste de celular projeta os vértices da nave, asas e jatos durante a aproximação, incluindo a posição inferior de Mangue, para detectar cortes além do centro do modelo.
- `npm run build`: bundle estático de 1,73 MiB, com Three.js local e sem CDN.
- Conferência visual em 1440×900, 390×844, 320×568 e 667×375. Ajustado o espaçamento inferior de Mangue na tela pequena.
- Cinco modelos remodelados conferidos no navegador. Mangue recebeu uma correção de volume frontal das copas; cavaleiro usa câmera mais frontal.
- Câmera de voo corrigida após detectar saída da nave do enquadramento. Segundo passe confirmou percurso contínuo, aproximação, nave encoberta pela superfície e revelação do projeto. Correção adicional manteve a nave inteira no celular.
- Viagens completas para Cindra, CommissionMatch e Mangue chegaram ao destino com `inert` removido e foco no título correto. Retorno à galáxia e chegada inicial também conferidos; chegada inicial mantém o mapa interativo.
- Arraste mudou a orientação do planeta sem alterar o hash ou iniciar uma viagem. Sem overflow horizontal no celular conferido.
- Teclado Enter iniciou o voo; Escape encerrou no destino. Na sessão de teste foi necessário ativar emulação de foco para que o navegador entregasse os eventos de teclado.
- Troca de rota durante viagem, botão de pular e pausa chegaram ao último destino solicitado sem deixar a interface bloqueada.
- Perda de contexto WebGL durante a viagem terminou no destino com fallback. A restauração recuperou o 3D.
- Após a navegação, Cindra salvou os itens, CommissionMatch avançou para 2/3 e Mangue percorreu uma escolha da história.
- Nenhum erro de execução apontando para o bundle da aplicação nas interações verificadas. Revisão independente de integração não encontrou falhas relevantes de cancelamento, foco, `inert` ou descarte do voo.

A marca original foi preservada. A versão foi atualizada no preview local; este relatório não registra publicação em produção.
