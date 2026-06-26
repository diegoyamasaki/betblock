(function () {
  'use strict';

  const BET_DOMAINS = new Set([
    'betano.com', 'betano.com.br', 'bet365.com', 'sportingbet.com', 'pixbet.com',
    'esportedasorte.com', 'superbet.com', 'betnacional.com', 'novibet.com', 'novibet.com.br',
    'betfair.com', 'betmotion.com', 'betsson.com', 'bodog.com', 'f12.bet',
    'estrela.bet', 'vaidebet.com', 'galera.bet', 'h2.bet', 'jonbet.com',
    'apostaganha.com', 'realsport.com.br', 'williamhill.com', 'betway.com',
    '1xbet.com', 'pinnacle.com', 'betpix365.com', 'brazino777.com', 'brazino.com', 'betboo.com',
    'mrbet.com', 'rivalo.com', 'betsul.com', 'dafabet.com', 'spin.bet',
    'stakes.com', 'bangbet.com', 'betcris.com', 'unibet.com', 'bwin.com',
    'melbet.com', 'parimatch.com', 'leonbet.com', 'betmaster.com', 'sorte.online',
    'kwai.bet', 'betfire.com', 'betdasorte.com', 'betdasorte.com.br',
    'betmgm.com', 'stake.com', 'vaidebet.bet.br', 'bet7k.com', 'neo7x.com',
  ]);

  // Nomes de marcas para detectar em imagens/textos de containers de anúncios
  // Marcas específicas de apostas (sem palavras genéricas como "apostas" ou "bet")
  const BET_BRAND_REGEX = /\b(betano|bet365|sportingbet|pixbet|esporte\s*da\s*sorte|bet\s*da\s*sorte|betdasorte|superbet|betnacional|novibet|betfair|betmotion|betsson|bodog|vaidebet|vai\s+de\s+bet|galera\.?bet|betsul|rivalo|betway|unibet|bwin|parimatch|melbet|leonbet|1xbet|williamhill|brazino|kto|betmgm|betpix\s*365|betpix365|stake\.com|esportes\s+da\s+sorte|bet7k|neo7x)\b/i;

  // Padrões promocionais fortes (multi-palavra ou códigos)
  const PROMO_REGEX = /\b(c[oó]digo\s+(de\s+)?(b[oô]nus|indica[çc][aã]o|promocional|cupom)|cupom\s+de\s+(b[oô]nus|cadastro)|b[oô]nus\s+de\s+boas.vindas|use\s+[A-Z]{4,}\b|freebet|free\s*bet|aposta\s+gr[aá]tis)/i;

  // Chamadas para ação afiliadas ("Visite a Betano", "Acesse o Superbet"...)
  const CTA_REGEX = /\b(visite\s+[ao]?|acesse\s+[ao]?|jogue\s+(em|no|na)|aposte\s+(em|no|na)|cadastre.se\s+(em|no|na)|registre.se\s+(em|no|na)|conhe[çc]a\s+[ao]?)\s+/i;

  // Labels que indicam container de anúncio (geralmente bet em sites BR)
  const AD_LABEL_REGEX = /^\s*(advertisement|publicidade|an[uú]ncio|patrocinado|conte[uú]do\s+patrocinado|sponsored|propaganda)\s*$/i;

  // Conteúdo editorial sobre apostas (listas, plataformas, notícias de bet)
  const BET_CONTENT_REGEX = /\b(plataformas?\s+legalizad|casas?\s+de\s+apostas?|sites?\s+de\s+apostas?|apostas?\s+online|apostas?\s+esportivas?|melhores?\s+bets?|melhores?\s+casa|onde\s+apostar|como\s+apostar|palpites?\s+de\s+futebol|odds?\s+de|bônus\s+sem\s+dep[oó]sito)\b/i;

  // Seletores CSS de containers de anúncios comuns
  const AD_CONTAINER_SELECTORS = [
    '[class*="banner"]', '[class*="Banner"]',
    '[class*="-ad-"]', '[class*="_ad_"]', '[class*="__ad"]',
    '[id*="banner"]', '[id*="Banner"]',
    '[class*="sponsor"]', '[class*="Sponsor"]',
    '[id*="sponsor"]',
    '[class*="promo"]', '[class*="Promo"]',
    '[id*="promo"]',
    'ins.adsbygoogle',
    '[data-ad-slot]',
    '[data-ad-client]',
  ].join(',');

  function getHostname(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  }

  function isBetDomain(url) {
    const host = getHostname(url);
    if (!host) return false;
    if (BET_DOMAINS.has(host)) return true;
    // Checa subdomínios (ex: ads.betano.com)
    for (const domain of BET_DOMAINS) {
      if (host.endsWith('.' + domain)) return true;
    }
    return false;
  }

  function hideElement(el, reason) {
    if (!el || el.dataset.betblockDone) return;
    el.dataset.betblockDone = '1';
    el.dataset.betblockReason = reason || '';
    el.style.setProperty('display', 'none', 'important');
    console.log('[BetBlock] ocultado:', el.tagName, '—', reason, el);
    chrome.runtime.sendMessage({ type: 'AD_BLOCKED' }).catch(() => {});
  }

  function cleanupEmptySections() {
    // Se uma seção tem 2+ filhos bloqueados e a maioria dos filhos diretos está bloqueada,
    // oculta a seção inteira (incluindo título e descrição que sobrariam soltos).
    document.querySelectorAll('section, div, aside').forEach(el => {
      if (el.dataset.betblockDone) return;
      if (el === document.body || el === document.documentElement) return;
      const children = Array.from(el.children);
      if (children.length < 3) return;
      const blocked = children.filter(c => c.dataset?.betblockDone === '1').length;
      if (blocked >= 2 && blocked / children.length >= 0.5) {
        hideElement(el, `seção com ${blocked}/${children.length} filhos bloqueados`);
      }
    });
  }

  function findAdAncestor(el) {
    let node = el.parentElement;
    let depth = 0;
    while (node && depth < 5) {
      if (node.matches?.(AD_CONTAINER_SELECTORS)) return node;
      node = node.parentElement;
      depth++;
    }
    return null;
  }

  function checkNode(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.dataset?.betblockDone || el.dataset?.betblockPlaceholder) return;

    const tag = el.tagName?.toUpperCase();

    // Iframes de domínios de apostas
    if (tag === 'IFRAME' && el.src && isBetDomain(el.src)) {
      hideElement(el, el.src);
      return;
    }

    // Scripts de domínios de apostas (marca o container)
    if (tag === 'SCRIPT' && el.src && isBetDomain(el.src)) {
      const container = findAdAncestor(el);
      if (container) hideElement(container, el.src);
      return;
    }

    // Imagens de domínios de apostas OU com marca no caminho/alt
    if (tag === 'IMG' && el.src) {
      let srcPath = '';
      try { srcPath = new URL(el.src).pathname; } catch {}
      const alt = el.alt || '';
      if (isBetDomain(el.src) || BET_BRAND_REGEX.test(srcPath) || BET_BRAND_REGEX.test(alt)
          || (AD_LABEL_REGEX.test(alt) && BET_BRAND_REGEX.test(srcPath))) {
        const target = el.closest('a, figure, [class*="banner"], [class*="ad"], div') || el;
        hideElement(target, `img: ${el.src.slice(0, 80)}`);
        return;
      }
    }

    // Links de aposta: domínio externo, caminho/texto com marca + promo, ou CTA afiliada
    if (tag === 'A' && el.href) {
      let pathname = '';
      try { pathname = new URL(el.href).pathname; } catch {}
      const linkText = el.textContent || '';
      const hasBrand = isBetDomain(el.href) || BET_BRAND_REGEX.test(pathname) || BET_BRAND_REGEX.test(linkText);
      const hasPromo = PROMO_REGEX.test(linkText);
      const hasCTA = CTA_REGEX.test(linkText) && BET_BRAND_REGEX.test(linkText);

      const isBetContent = BET_CONTENT_REGEX.test(linkText) && pathname.includes('/apostas');
      if (hasCTA || isBetContent || (hasBrand && (isBetDomain(el.href) || hasPromo))) {
        const container = findAdAncestor(el) || el.closest('div, section, aside, li, figure') || el;
        if (container !== document.body && container !== document.documentElement) {
          hideElement(container, linkText.slice(0, 60) || el.href);
        }
        return;
      }
    }

    // Containers de anúncios com texto/alt referenciando marcas de apostas
    if (el.matches?.(AD_CONTAINER_SELECTORS)) {
      const text = el.innerText || el.textContent || '';
      const altText = Array.from(el.querySelectorAll('img'))
        .map(img => img.alt || '')
        .join(' ');
      if (BET_BRAND_REGEX.test(text) || BET_BRAND_REGEX.test(altText)) {
        hideElement(el, 'conteúdo de aposta detectado');
        return;
      }
      // Verifica links internos ao container
      for (const link of el.querySelectorAll('a[href]')) {
        if (isBetDomain(link.href)) {
          hideElement(el, link.href);
          return;
        }
      }
    }
  }

  function scanAdLabels() {
    // Procura elementos pequenos cujo único texto é um label de anúncio
    document.querySelectorAll('span, p, div, header, small, label, h4, h5, h6').forEach(el => {
      if (el.dataset.betblockDone) return;
      const text = (el.textContent || '').trim();
      if (text.length === 0 || text.length > 30) return;
      if (!AD_LABEL_REGEX.test(text)) return;

      // Sobe ao container do anúncio (que envolve label + criativo)
      let container = el.parentElement;
      let hops = 0;
      while (container && hops < 4) {
        // Para no primeiro container que tenha mais que só o label
        const childText = (container.textContent || '').trim();
        if (childText.length > text.length + 5 || container.querySelector('iframe, img, ins')) {
          break;
        }
        container = container.parentElement;
        hops++;
      }
      if (container && container !== document.body && container !== document.documentElement) {
        hideElement(container, 'container marcado como "' + text + '"');
      }
    });
  }

  function scanPromoContent() {
    // Só checa cards/blocos pequenos — não artigos editoriais inteiros
    document.querySelectorAll('div, aside, li, figure').forEach(el => {
      if (el.dataset.betblockDone) return;
      if (el === document.body || el === document.documentElement) return;
      const text = el.textContent || '';
      // Cards de promo costumam ter < 300 caracteres
      if (text.length === 0 || text.length > 400) return;
      if (BET_BRAND_REGEX.test(text) && PROMO_REGEX.test(text)) {
        hideElement(el, 'card promocional de aposta');
      }
    });
  }

  function scanDOM() {
    const iframes = document.querySelectorAll('iframe[src]');
    const imgs = document.querySelectorAll('img[src]');
    const links = document.querySelectorAll('a[href]');
    const adContainers = document.querySelectorAll(AD_CONTAINER_SELECTORS);
    console.log('[BetBlock] varrendo:', {
      iframes: iframes.length,
      imgs: imgs.length,
      links: links.length,
      adContainers: adContainers.length,
    });
    const before = document.querySelectorAll('[data-betblock-done]').length;
    iframes.forEach(checkNode);
    imgs.forEach(checkNode);
    links.forEach(checkNode);
    adContainers.forEach(checkNode);
    scanAdLabels();
    scanPromoContent();
    cleanupEmptySections();
    const after = document.querySelectorAll('[data-betblock-done]').length;
    console.log('[BetBlock] elementos ocultados:', after - before);
  }

  function init() {
    scanDOM();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          checkNode(node);
          node.querySelectorAll('iframe[src], img[src], a[href]').forEach(checkNode);
          if (node.matches?.(AD_CONTAINER_SELECTORS)) checkNode(node);
          node.querySelectorAll(AD_CONTAINER_SELECTORS).forEach(checkNode);
          // Checa cards promocionais em nós adicionados dinamicamente
          if (['DIV','ASIDE','LI','FIGURE'].includes(node.tagName)) {
            const text = node.textContent || '';
            if (text.length > 0 && text.length <= 400
                && BET_BRAND_REGEX.test(text) && PROMO_REGEX.test(text)) {
              hideElement(node, 'card promocional de aposta (dinâmico)');
            }
            // Re-roda scan de labels dentro do novo subtree
            node.querySelectorAll?.('span, p, div, small, label').forEach(child => {
              const t = (child.textContent || '').trim();
              if (t.length > 0 && t.length <= 30 && AD_LABEL_REGEX.test(t)) {
                let container = child.parentElement;
                let hops = 0;
                while (container && hops < 4) {
                  const ct = (container.textContent || '').trim();
                  if (ct.length > t.length + 5 || container.querySelector('iframe, img, ins')) break;
                  container = container.parentElement;
                  hops++;
                }
                if (container && container !== document.body) {
                  hideElement(container, 'label "' + t + '" (dinâmico)');
                }
              }
            });
          }
        }
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function start() {
    chrome.storage?.local?.get(['enabled'], ({ enabled = true }) => {
      console.log('[BetBlock] content script ativo:', enabled);
      if (!enabled) return;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    });
  }

  start();
})();
