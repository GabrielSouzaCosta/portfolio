# Morfeu — modelos de Blender

A prévia atual é a **v04**, revisão compacta e ilustrada. O proprietário rejeitou a v03 por ainda parecer estranha e esclareceu que a anatomia não precisa ser realista. A direção foi pesquisada e autorizada; o resultado continua sujeito à avaliação estética do proprietário.

## Arquivos atuais

- Prévia interativa: `preview.html`, servida por HTTP na raiz de `goiaba-lunar`.
- Editável: `v04/morfeu-stylized-rigged.blend`.
- Geração: `v04/build.py`, executado com Blender 5.2.1. Usa a nave de `v02/morfeu-scout-rigged.blend` como dependência.
- Gato: `../../assets/models/morfeu-rigged-v04.glb`.
- Nave e piloto: `../../assets/models/morfeu-scout-v04.glb`.
- Direção e referências: `../../../docs/studio/morfeu-v04.md` (na raiz do repositório).

## Proporções e identidade

A v04 encurta o tronco e as pernas, aproxima a cabeça dos ombros, amplia bochechas e dá volume às patas. Um estudo inicial em material cinza revelou saliências nos ombros e achatamento da cauda; essas partes foram corrigidas antes dos renders coloridos. O script aplica a mesma transformação à geometria de repouso, às pálpebras e ao esqueleto. A cauda é reconstruída em torno da curva final, com orientação transportada entre os anéis e raiz enterrada no corpo. As coxas foram recolhidas e arredondadas verticalmente; a união interna das patas com o peito recebe suavização localizada com pesos graduais. A vizinhança de cada órbita e as pálpebras compartilham a mesma curvatura; os olhos ficam recuados, e apenas as bordas externas das pálpebras são enterradas sob a pele. A margem superior cobre parte da íris em repouso.

A pelagem branca e gengibre segue a identidade da foto. Íris oliva mais escuras, abertura ocular menor e reflexos quadrados seguem a direção de expressão do sprite. Sox/Pixar e Manchas/CC-SAN foram referências de simplificação e construção facial; nenhum modelo ou pixel de terceiros foi incorporado aos assets.

## Movimento e verificação

Ambos os GLBs têm 23 ossos, quatro canais de pálpebras e um clipe `Morfeu_Idle` de aproximadamente seis segundos com 73 trilhas. Inclui respiração e movimentos contidos de cabeça, orelhas, cauda e piscada. Caminhada, corrida, IK e poses extremas não foram validados.

- `morfeu-rigged-v04.glb`: 61,270 triângulos, 2,201,424 bytes.
- `morfeu-scout-v04.glb`: 76,150 triângulos, 2,778,656 bytes.

`v04/verify_glb.py` verifica posições e animações finitas, pesos normalizados, índices de ossos válidos, tempos crescentes e quatro canais de morph. Resultados em `v04/export-checks.json`. A prévia carregou gato e conjunto no Three.js; foram confirmados movimento da cabeça e fechamento das quatro pálpebras. Capturas em 1280×1000 e 390×844. Não houve teste em aparelho físico.

A revisão visual final marcou **SHIP** no escopo do asset Blender e da prévia local. Após três lotes de correção — o terceiro autorizado pelo proprietário — as junções internas das patas e a integração das pálpebras foram consideradas resolvidas nessa escala. Uma linha discreta permanece no close da piscada pausada, sem ser considerada um defeito material para a prévia. Este parecer não substitui a aprovação estética do proprietário nem valida integração à produção ou locomoção.

Esta etapa entrega assets e estudo interativo. A v04 foi integrada à cena principal local: mapa e viagens usam o GLB da nave com piloto. A publicação remota não faz parte desta etapa. A prévia depende de `node_modules` local. Versões v01–v03 permanecem como histórico rejeitado, sem representar direção atual.

## Origem das imagens

- `morfeu-reference.svg`: sprite preexistente em `index.html`; o PNG correspondente é sua rasterização local.
- Foto do Morfeu: fornecida pelo proprietário e inspecionada localmente, sem incorporação aos arquivos distribuíveis.
- `v04/morfeu-eyes.png`: textura procedural original de 256×256, produzida por `build.py`.
- `v04/previews/morfeu-*.png`: renders reais do Blender, 1000×1000, Cycles com 32 amostras.
- `v04/previews/browser-*.png`: capturas reais da prévia local.

Todos os PNGs da v04 carregam metadados de origem. Não foram usados serviços de geração de imagem.
