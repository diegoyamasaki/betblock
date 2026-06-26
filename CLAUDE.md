# BetBlock — Extensão Chrome para bloquear propagandas de apostas

Extensão Google Chrome (Manifest V3) que bloqueia automaticamente anúncios, banners e conteúdo afiliado de casas de apostas esportivas.

## Estrutura de arquivos

```
betblock/
├── manifest.json          # Configuração da extensão (MV3)
├── rules.json             # 53 domínios bloqueados via declarativeNetRequest
├── content.js             # Script principal de detecção e ocultação no DOM
├── background.js          # Service worker: contador por aba, badge, storage
├── popup.html/css/js      # Interface do popup (toggle + contadores)
├── icons/                 # Ícones 16/48/128px
├── betblock.zip           # ZIP para upload na Chrome Web Store
├── privacy_policy.html    # Política de privacidade (hospedar no GitHub Pages)
├── store_listing.md       # Textos e checklist para publicação na loja
├── store_promo_440x280.png    # Imagem promocional da listagem
└── store_screenshot_1280x800.png  # Screenshot obrigatório da loja
```

## Como instalar localmente

1. Abrir `chrome://extensions`
2. Ativar **Modo do desenvolvedor** (canto superior direito)
3. Clicar em **Carregar sem compactação**
4. Selecionar esta pasta

Após qualquer alteração nos arquivos: clicar no ícone 🔄 no card da extensão em `chrome://extensions` e recarregar a página (F5).

## Arquitetura de detecção

Duas camadas complementares:

### Camada 1 — Rede (`rules.json` + `declarativeNetRequest`)
Bloqueia requisições HTTP para 53 domínios antes de carregar. Configurado estaticamente no manifest. O toggle do popup usa `chrome.declarativeNetRequest.updateEnabledRulesets()` para ligar/desligar.

### Camada 2 — DOM (`content.js`)
Injeta `document_end`, respeita o setting `enabled` do storage. Funções principais:

| Função | O que faz |
|--------|-----------|
| `checkNode(el)` | Ponto de entrada por elemento: iframe, script, img, link, ad container |
| `scanAdLabels()` | Detecta elementos pequenos com texto "Advertisement", "Publicidade", etc. e sobe ao container pai |
| `scanPromoContent()` | Detecta cards pequenos (< 400 chars) com marca + linguagem promocional |
| `cleanupEmptySections()` | Oculta seção pai quando ≥50% dos filhos diretos foram bloqueados |
| `scanDOM()` | Orquestra todas as varreduras; logga contagens no console |
| `init()` | Chama `scanDOM()` + inicia `MutationObserver` para conteúdo dinâmico |

### Regexes centrais

```js
// Marcas específicas — NÃO usar palavras genéricas como "apostas" ou "bet"
BET_BRAND_REGEX  // betano, bet365, superbet, kto, brazino, bet7k, neo7x, etc.

// Linguagem promocional multi-palavra (evita falsos positivos)
PROMO_REGEX      // "código de bônus", "use SUPERTRV", "bônus de boas-vindas"

// CTAs afiliadas
CTA_REGEX        // "Visite a/o", "Acesse", "Jogue em", "Aposte em" + marca

// Containers de anúncios
AD_LABEL_REGEX   // Texto exato: "Advertisement", "Publicidade", "Anúncio", etc.

// Conteúdo editorial de apostas
BET_CONTENT_REGEX  // "plataformas legalizadas", "casas de apostas", "palpites de futebol"
                   // — só ativa quando href também contém /apostas
```

### Lógica de detecção por tipo de elemento

**IMG:** verifica `isBetDomain(src)` → `BET_BRAND_REGEX` no pathname da URL → `BET_BRAND_REGEX` no alt. Pega imagens de CDNs (ex: `neo7x.com/uploads/betano-banner.gif`).

**A (links):** verifica domínio externo, pathname, texto do link contra `BET_BRAND_REGEX` + `PROMO_REGEX` + `CTA_REGEX` + `BET_CONTENT_REGEX`. Pega links afiliados internos (ex: `trivela.com.br/apostas/casas/superbet/codigo/`).

**IFRAME/SCRIPT:** verifica domínio da src contra `BET_DOMAINS`.

**Ad containers** (class `banner`, `sponsor`, `promo`, `ins.adsbygoogle`, `[data-ad-slot]`): verifica texto interno e links filhos.

### Marcado no DOM

Elementos ocultados recebem:
- `data-betblock-done="1"` — impede reprocessamento
- `data-betblock-reason="..."` — motivo (útil para debug)
- `style="display: none !important"`

## Como adicionar novo domínio/marca

Quando um novo site de apostas ou rede de anúncios não está sendo bloqueado:

1. **`content.js` — `BET_DOMAINS`**: adicionar o domínio (ex: `'novabet.com'`)
2. **`content.js` — `BET_BRAND_REGEX`**: adicionar a marca (ex: `|novabet`)
3. **`rules.json`**: adicionar nova regra com ID sequencial (último ID: 53):
```json
{ "id": 54, "priority": 1, "action": { "type": "block" }, "condition": { "urlFilter": "||novabet.com^", "resourceTypes": ["script","image","xmlhttprequest","sub_frame","media","stylesheet"] } }
```
4. Recriar o ZIP: `python3 -c "import zipfile,os; ..."` (ver script em store_listing.md)

## Debug no console do browser

Com a extensão carregada, abrir DevTools (F12) e filtrar por `[BetBlock]`:

```
[BetBlock] content script ativo: true
[BetBlock] varrendo: {iframes: 0, imgs: 51, links: 103, adContainers: 0}
[BetBlock] ocultado: LI — Código de bônus Superbet 2026... <li>...</li>
[BetBlock] elementos ocultados: 4
```

Se `content script ativo: false` → o toggle do popup está desligado. Abrir popup e ligar.

Se `elementos ocultados: 0` mas há bet ads visíveis → inspecionar o elemento (botão direito → Inspecionar), copiar o HTML e analisar qual padrão não está sendo coberto.

## Casos resolvidos e padrões aprendidos

| Site | Problema | Solução |
|------|----------|---------|
| trivela.com.br | Links internos (`/apostas/casas/superbet/`) não detectados | Checar pathname + texto do link |
| trivela.com.br | Seção "forcinha para apostar" com título visível mesmo após bloquear cards | `cleanupEmptySections()` |
| trivela.com.br | "187 plataformas legalizadas" sem marca específica | `BET_CONTENT_REGEX` + `/apostas` no pathname |
| neo7x.com | Ad server BR, nome no path da imagem (`bet-da-sorte-728x90.gif`) | Checar `BET_BRAND_REGEX` no pathname do `img.src` |
| Genérico | `alt="Advertisement"` em imagem de aposta | `AD_LABEL_REGEX` no alt + marca no pathname |
| Qualquer site | Conteúdo de apostas carregado via JS após DOMContentLoaded | `MutationObserver` no `document.documentElement` |

## Falsos positivos — o que NÃO fazer

- **Não adicionar** `apostas` ou `bet` como alternativas em `BET_BRAND_REGEX` — são genéricos demais e bloqueiam notícias esportivas legítimas
- **Não reduzir** o limite de 400 chars em `scanPromoContent` sem testar — pode voltar a bloquear artigos editoriais
- **Não remover** o `isBetContent` que requer `pathname.includes('/apostas')` — o `BET_CONTENT_REGEX` sozinho causa falsos positivos em texto jornalístico

## Publicação na Chrome Web Store

Ver `store_listing.md` para checklist completo. Resumo:
1. ✅ Repositório: https://github.com/diegoyamasaki/betblock
2. ✅ Política de privacidade: https://diegoyamasaki.github.io/betblock/privacy_policy.html
3. Conta de dev em `chrome.google.com/webstore/devconsole` (U$5 único)
4. Upload do `betblock.zip`
5. Revisão leva 1–3 dias úteis

## Comunicação background ↔ content ↔ popup

```
content.js  →  background.js : { type: 'AD_BLOCKED' }
popup.js    →  background.js : { type: 'GET_PAGE_COUNT', tabId }
background.js → popup.js     : { count: N }
popup.js    →  chrome.storage.local : { enabled, totalBlocked }
```
