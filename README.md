# BetBlock

Extensão para Google Chrome que bloqueia automaticamente propagandas de apostas esportivas e cassinos enquanto você navega.

![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
![Versão](https://img.shields.io/badge/versão-1.0.0-red)
![Licença](https://img.shields.io/badge/licença-MIT-green)

---

## Como funciona

O BetBlock age em duas camadas simultâneas:

**Bloqueio de rede** — mais de 50 domínios de apostas conhecidos são interceptados antes mesmo de carregar no navegador (Betano, Bet365, Sportingbet, Superbet, KTO, Brazino, etc.).

**Detecção no conteúdo** — um script analisa cada página em tempo real e oculta:
- Banners e imagens de apostas (incluindo anúncios de redes como neo7x)
- Cards com códigos promocionais ("use SUPERTRV", "bônus de boas-vindas")
- Chamadas para ação afiliadas ("Visite a Betano", "Aposte no Superbet")
- Conteúdo editorial patrocinado sobre apostas
- Containers marcados como "Advertisement" ou "Publicidade"

## Instalação

### Chrome Web Store
*(em breve)*

### Manual (modo desenvolvedor)

1. Baixe ou clone este repositório
   ```bash
   git clone https://github.com/diegoyamasaki/betblock.git
   ```
2. Abra `chrome://extensions` no Chrome
3. Ative o **Modo do desenvolvedor** (canto superior direito)
4. Clique em **Carregar sem compactação**
5. Selecione a pasta `betblock`

## Funcionalidades

- 🚫 Bloqueio de rede em 50+ domínios de apostas
- 🔍 Detecção por marca, CTA, linguagem promocional e label de anúncio
- 📊 Contador de anúncios bloqueados por página e total da sessão
- 🔴 Badge no ícone mostrando o número em tempo real
- ⚙️ Toggle para ligar/desligar com um clique
- 🔒 Zero coleta de dados — tudo local, nenhuma informação enviada a servidores

## Marcas bloqueadas

Betano · Bet365 · Sportingbet · Pixbet · Esporte da Sorte · Superbet · Betnacional · Novibet · Betfair · KTO · BetMGM · Brazino · Galera.Bet · Vaidebet · Rivalo · Betsul · Betway · Unibet · Melbet · Parimatch · 1xBet · Bet7k · e muitas outras.

## Privacidade

O BetBlock não coleta, armazena nem transmite nenhum dado pessoal.

→ [Política de Privacidade completa](https://diegoyamasaki.github.io/betblock/privacy_policy.html)

## Encontrou um anúncio não bloqueado?

Abra uma [issue](https://github.com/diegoyamasaki/betblock/issues) com o site e o HTML do elemento (botão direito → Inspecionar → Copy outerHTML). Adicionamos rápido.

## Licença

MIT — livre para usar, modificar e distribuir.
