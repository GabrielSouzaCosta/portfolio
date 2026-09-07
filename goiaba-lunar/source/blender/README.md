# Morfeu — modelos de Blender

A prévia e o site local usam a **v06**. A revisão corrige a naturalidade dos olhos: âmbar dourado mais claro, íris circular, pupila oval vertical moderada e reflexos produzidos pela iluminação. O pedido atual substitui os quadrados pintados da v05. A forma compacta do gato, o sorriso e a nave original **Semente** continuam da versão anterior.

## Arquivos atuais

- Prévia interativa: `preview.html`, servida por HTTP na raiz de `goiaba-lunar`. O botão **Rosto** enquadra os olhos; a barra de tempo permite conferir a piscada.
- Editável: `v06/morfeu-stylized-rigged.blend`.
- Geração: `v06/build.py` e `v06/ship.py`, executados com Blender 5.2.1.
- Gato: `../../assets/models/morfeu-rigged-v06.glb`.
- Nave e piloto: `../../assets/models/morfeu-scout-v06.glb`.
- Direção: `../../../docs/studio/morfeu-v06.md` (na raiz do repositório).
- Exportação: `v06/verify_glb.py` e `v06/export-checks.json`.

## Olhos e expressão

A íris é circular nas coordenadas finais da cabeça e recortada pela abertura das pálpebras. Sua textura procedural de 512×512 contém variação radial discreta, borda castanha suave e esclerótica branca com sombra neutra discreta nos cantos. Não contém reflexos pintados. A cor mantém a identidade laranja solicitada pelo proprietário, com menos vermelho para suavizar o olhar.

A superfície óptica fica recuada na órbita. Pele e pálpebras usam a mesma curvatura; a união considera o formato de amêndoa da abertura. Quatro morph targets fecham as pálpebras sem deformar os olhos. A cor da pelagem é amostrada na pose fechada para evitar faixas verticais esticadas. A borda inferior da pálpebra superior define a emenda da piscada.

No Blender, fontes pequenas e reais de luz iluminam os reflexos. Na prévia e no site, `js/three/eye-lighting.js` atribui um ambiente de reflexão independente ao material ocular de cada cópia do personagem. Esse ambiente pertence ao Three.js e não é incorporado ao GLB; outro visualizador precisa fornecer iluminação própria.

## Identidade preservada

A cabeça próxima dos ombros, as bochechas largas, o focinho discreto, as patas curtas e a cauda elevada mantêm a silhueta compacta v04. Branco e gengibre seguem a foto fornecida pelo proprietário. Os cantos do sorriso continuam elevados como na v05. Sox/Pixar e Manchas/CC-SAN foram referências anteriores de simplificação; nenhum modelo ou pixel dessas obras foi incorporado.

Semente mantém fuselagem arredondada, asas crescentes, dois propulsores anulares, cockpit aberto, carga e antena assimétricas. Marfim, petróleo e cobre organizam as peças. Rotores e aletas têm nós próprios; peças estáticas são agrupadas por material e pai. `ship.py` conserva a geometria v05.

## Movimento e verificação

Cada GLB contém 23 ossos, quatro canais de pálpebras e um clipe `Morfeu_Idle` de aproximadamente seis segundos com 73 trilhas. O clipe inclui respiração, cabeça, orelhas, cauda e piscada. Caminhada, corrida, IK e poses extremas não foram validados.

| Arquivo | Triângulos | Bytes |
|---|---:|---:|
| `morfeu-rigged-v06.glb` | 67.926 | 2.578.768 |
| `morfeu-scout-v06.glb` | 160.222 | 5.206.216 |

A verificação binária passou para posições e animações finitas, pesos normalizados, índices de ossos válidos, tempos crescentes e os quatro canais de morph. Os 14 testes existentes passaram na revisão v06; eles cobrem o comportamento existente e o modelo procedural de reserva. A animação e a aparência do GLB são verificadas separadamente na prévia real.

A conferência final da prévia usou 1280×1000 e 390×844; a do site, 1440×1000 e 390×844. Os quatro morphs fecham em `52/24` segundos e o documento móvel mede 390 px. O site carregou os 5.206.216 bytes do GLB final. O build passou com 62 entradas e aproximadamente 6,90 MiB. Detalhes em `v06/verification.json`.

Antes do ajuste posterior de esclerótica branca, a revisão visual independente terminou com **SHIP**: órbita, íris/cor, pupila, reflexos, piscada e documentação foram consideradas resolvidas, sem regressões materiais nessas seis correções oculares. O parecer tem esse escopo e não substitui a avaliação estética do proprietário.

O mapa e as viagens carregam o conjunto v06. Cada cena tem recursos independentes e preserva o fallback procedural se o arquivo não carregar. O build inclui somente o GLB atual da nave. A publicação remota não faz parte desta etapa; a prévia de modelos depende de `node_modules` local. Versões anteriores são histórico e seus pareceres visuais não substituem a avaliação da v06.

## Origem das imagens

- `morfeu-reference.svg`: sprite preexistente em `index.html`; o PNG é sua rasterização local.
- Foto de Morfeu: fornecida pelo proprietário e inspecionada localmente, sem incorporação aos arquivos distribuíveis.
- `v06/morfeu-eyes.png`: textura procedural original produzida por `build.py`.
- `v06/previews/eyes-*.png`, `morfeu-*.png` e `scout-*.png`: renders reais do Blender, 1000×1000, Cycles com 32 amostras.
- `v06/previews/browser-*.png` e `site-*.png`: capturas reais da prévia e do site local, com origem registrada nos metadados.

Não foram usados serviços de geração de imagem nesta revisão.

Os 18 PNGs da v06 têm metadados de origem; a varredura final não encontrou registros ausentes. O ajuste posterior de esclerótica branca foi conferido na prévia desktop e celular e integrado ao site local, com recursos `sclera-white-1`.
