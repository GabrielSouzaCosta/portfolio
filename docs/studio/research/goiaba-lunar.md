# Goiaba Lunar — identidade existente

Estudo de 6 de setembro de 2026. Fontes: código e assets do portfólio pessoal. Este documento descreve a identidade existente; as ampliações para a nova landing page ficam no [briefing](../brief.md).

## O que já está estabelecido

Goiaba Lunar é o estúdio de desenvolvimento de Gabriel Souza Costa. O portfólio apresenta o estúdio como o lugar onde seus projetos ganham espaço para contar suas histórias. A frase “Feito de ideias fora de órbita” já associa a marca a imaginação e espaço.

A cena atual usa fundo escuro, estrelas, uma lua de goiaba em pixel art, órbitas delicadas, rosa e verde claros. A composição é uma apresentação com texto à esquerda e lua à direita; ela funciona como portal para a futura experiência, não como modelo obrigatório da nova página.

Fontes: [conteúdo da cena](/Users/mac/Documents/portfolio/index.html:178), [estilo final do estúdio](/Users/mac/Documents/portfolio/css/v2-studio.css:1), [estrelas e órbitas](/Users/mac/Documents/portfolio/css/v2.css:87).

## Paleta extraída do código

Os valores abaixo são literais existentes. Não são uma amostragem aproximada da imagem do logo. A ordem dos estilos importa: `v2-studio.css` substitui o antigo fundo verde de `v2.css`.

| Papel | Valor | Fonte |
|---|---|---|
| Fundo final do estúdio | `#080808`, `#181818`, `#050505` | [v2-studio.css:8](/Users/mac/Documents/portfolio/css/v2-studio.css:8) |
| Texto claro da cena | `#f4e9dd` | [v2.css:87](/Users/mac/Documents/portfolio/css/v2.css:87) |
| Rosa principal compartilhado | `#efabc3` | [v2.css:3](/Users/mac/Documents/portfolio/css/v2.css:3) |
| Verde do destaque “universo” | `#a9d7aa` | [v2-studio.css:69](/Users/mac/Documents/portfolio/css/v2-studio.css:69) |
| Verde claro do wordmark | `#cfdeb7` | [v2.css:108](/Users/mac/Documents/portfolio/css/v2.css:108) |
| Rosa do wordmark | `#edafc7` | [v2.css:109](/Users/mac/Documents/portfolio/css/v2.css:109) |
| Azul do portal | `#334b88` | [v2-studio.css:47](/Users/mac/Documents/portfolio/css/v2-studio.css:47) |
| Magenta do portal | `#aa468b` | [v2-studio.css:49](/Users/mac/Documents/portfolio/css/v2-studio.css:49) |
| Papel do portfólio | `#eee7d8` | [v2.css:2](/Users/mac/Documents/portfolio/css/v2.css:2) |
| Tinta e verde do portfólio | `#29352c`, `#28543c`, `#092c25` | [v2.css:2](/Users/mac/Documents/portfolio/css/v2.css:2) |

Rosa e verde claros são os accents de continuidade mais diretos. Azul e magenta já conectam visualmente a partida e a chegada; sua presença em nebulosas é uma possibilidade, não uma decisão confirmada. A nova galáxia deve preservar áreas de escuridão: os mundos precisam continuar sendo os pontos mais legíveis e interessantes.

## Tipografia e forma

| Uso existente | Família / caráter | Fonte |
|---|---|---|
| Títulos editoriais | Instrument Serif, peso regular | [v2.css:3](/Users/mac/Documents/portfolio/css/v2.css:3) |
| Texto e controles gerais | Manrope | [v2.css:8](/Users/mac/Documents/portfolio/css/v2.css:8) |
| Assinatura do estúdio, destaque e CTA | VT323; ritmo de pixel/terminal | [v2-studio.css:68](/Users/mac/Documents/portfolio/css/v2-studio.css:68) |
| Arte principal da marca | Pixel art, goiaba em crescente, gato sobre a lua | [goiaba-lunar.png](/Users/mac/Documents/portfolio/assets/images/goiaba-lunar.png) |

As fontes já estão hospedadas localmente com licenças. Para a nova página, preservar o reconhecimento da marca e a legibilidade dos controles; tipografias de cada produto podem entrar em seu próprio mundo sem carregar todos os arquivos na chegada.

## Os gatos são assets diferentes

1. **Logo:** o gato preto e branco sobre a lua de goiaba é parte da marca existente.
2. **Gato do botão:** `tabby-v2` é um gato marrom/cinza dormindo. O manifesto registra geração de imagem e o prompt original.
3. **Morfeu:** o sprite SVG articulado é branco/creme e laranja; é a referência existente compatível com a descrição do usuário. Ele não deve ser confundido com os outros dois.

Morfeu já possui cabeça, corpo, patas, cauda, orelhas, olhos, caminhada, carinho e sono. O novo Morfeu piloto pode evoluir essa personalidade. A cor real dos olhos e as manchas precisas do gato real ainda não foram confirmadas por fotografia; o desenho atual é uma referência gráfica, não prova fotográfica.

Paleta do sprite: creme `#fff4dc`, laranja `#ed973f`/`#f1a34b`, listras `#bd622e`, contorno `#493426`, rosa `#e9a091`. Fontes: [sprite](/Users/mac/Documents/portfolio/index.html:325), [estados e movimento](/Users/mac/Documents/portfolio/css/morfeu-cursor.css:20), [lógica](/Users/mac/Documents/portfolio/js/morfeu-cursor.js:1), [origem dos assets](/Users/mac/Documents/portfolio/docs/assets.md:1).

## Movimento existente e continuidade

A lua flutua em ciclo de 10 s; a órbita gira em 55 s; o gato respira e reage a movimento, carinho e inatividade. Há tratamento para movimento reduzido. O portal amplia a região azul/rosa da lua antes da navegação.

Para o estúdio, a continuidade proposta é: o portal existente sugere a partida; o hiperespaço sugere o trânsito; a galáxia sugere a chegada. A nova entrada precisa também funcionar para quem acessa o estúdio diretamente.

Fontes: [ciclos da cena](/Users/mac/Documents/portfolio/css/v2.css:140), [portal](/Users/mac/Documents/portfolio/js/studio-portal.js:45), [preferências de movimento](/Users/mac/Documents/portfolio/css/morfeu-cursor.css:77).

## Integração futura identificada

- `goiaba-lunar/` estava vazio no início do estudo. Ainda não havia landing page do estúdio nesse diretório.
- Os dois links do portal no HTML e `config.studioUrl` ainda apontam para Cindra. Alterar os três destinos juntos quando a URL do estúdio estiver definida.
- O build atual lê apenas o `index.html` da raiz e gera um único HTML. Criar uma pasta adicional não publica automaticamente uma segunda página.
- O build aceita um conjunto restrito de assets e scripts clássicos. Modelos 3D, módulos e outras mídias exigiriam uma decisão explícita de arquitetura na etapa de implementação.
- O formulário de contato atual tem endpoint vazio. A futura página não deve herdar uma promessa de envio funcionando sem integração verificada.

Fontes: [destino configurado](/Users/mac/Documents/portfolio/js/v2.js:4), [links de fallback](/Users/mac/Documents/portfolio/index.html:181), [entrada do build](/Users/mac/Documents/portfolio/scripts/build.mjs:14), [assets permitidos](/Users/mac/Documents/portfolio/scripts/build.mjs:51), [scripts](/Users/mac/Documents/portfolio/scripts/build.mjs:89), [saída HTML](/Users/mac/Documents/portfolio/scripts/build.mjs:122).

## Limite desta verificação

O logo original foi inspecionado visualmente. Uma captura local da cena de 5 de setembro foi usada como referência histórica e cruzada com os estilos atuais; não representa uma nova execução de QA. Não foram feitas alterações no portfólio, nem verificação do site publicado ou da URL de destino.
