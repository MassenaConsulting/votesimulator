<!--
  Vote Simulator - README (Português do Brasil)
  Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. Licenciado sob a Licença MIT (veja LICENSE).

  Projeto de estudo, fornecido "NO ESTADO EM QUE SE ENCONTRA", sem garantia de qualquer tipo. A Massena Consulting LLC não se
  responsabiliza por erros, imprecisões ou qualquer consequência do seu uso.
  Dados eleitorais: dados públicos do Tribunal Superior Eleitoral (TSE).
-->
# Simulador de Apuração de Votos

> **Idiomas:** este README está disponível em português (este arquivo) e em inglês: [README.md](README.md). O próprio app tem duas bandeiras de idioma (Brasil = pt-BR, EUA = en-US) no cabeçalho e no aviso de boas-vindas.
>
> **Projeto de estudo.** Foi construído para fins de estudo, apesar de usar dados reais e públicos obtidos através do site do TSE.

HTML + CSS + JS puro, sem dependências nem servidor: abra `index.html` no navegador.

## Uso
1. Escolha o cenário e a ordem de chegada das urnas.
2. Informe eleitores, urnas e comparecimento (ou use "Usar totais do TSE").
3. **Sortear** gera outra ordem aleatória. Clique em **Iniciar**. O gráfico recebe um lote de urnas a cada 2 s.
4. Ajuste a velocidade de 1x a 10x (barra) ou use **Acelerar (10x)**.
5. **Totalização sem animação** plota todos os dados de uma vez.
6. Escolha o idioma pelas bandeiras (cabeçalho ou aviso de boas-vindas). A escolha fica salva no navegador.
7. Um aviso de boas-vindas abre toda vez que a página carrega, com os avisos e uma explicação em linguagem simples ("como se você tivesse 8 anos") do app e da Teoria dos Senadores. O botão **Sobre e avisos** (cabeçalho e rodapé) reabre o aviso. A página ao fundo não rola enquanto ele está aberto.

## Cenários
| Cenário | O que mostra |
|---|---|
| Espelhado (A = B) | Partidos com proporção idêntica em toda urna. Linhas sobrepostas, gráfico espelhado simétrico. |
| Virada tardia | A lidera no começo (urnas favoráveis chegam primeiro) e B vira no fim. |
| Empate técnico | Diferença final de 0,5 p.p.; liderança alterna. |
| Dados reais TSE (2026 1º turno, 2022 1º e 2º turnos) | Boletins de urna oficiais, urna a urna. |

Ordens de chegada
- Sintéticos: aleatória, por região (viés crescente), favoráveis a A/B primeiro.
- Dados reais (urna a urna, os votos nunca mudam, só a ordem): chegada real (`DT_BU_RECEBIDO`), aleatória por urna, por município, por estado, por região do país, municípios maiores/menores primeiro.
- Granularidade: ~100, ~30 ou ~10 atualizações. Poucas atualizações grandes dão curvas em degraus.

## Estrutura do projeto
```
js/analytics.js            eventos do Google Analytics 4 (cliques, configurações, rolagem, tempo na página)
index.html                 página principal (aviso no cabeçalho, seletor de idioma, rodapé)
css/style.css              estilos (tema claro/escuro)
assets/favicon.svg         ícone do site
assets/og-image.png        imagem de prévia para redes sociais (1200x630)
js/i18n.js                 traduções pt-BR / en-US e formatação de números
js/engine.js               motor da simulação (cenários sintéticos, dados reais, Teoria dos Senadores)
js/charts.js               gráficos em canvas (espelho, linhas, dica ao passar o mouse)
js/app.js                  interface e laço de simulação
data/ballot_boxes_president_2026_round1.js   dados reais, uma linha por urna (499.206 urnas)
data/ballot_boxes_president_2022_round1.js   dados reais (472.028 urnas)
data/ballot_boxes_president_2022_round2.js   dados reais (472.028 urnas)
data/aggregated_president_2026_round1.js     agregado por UF x minuto (usado só por statistical_analysis.py)
scripts/build_ballot_boxes.py                baixa os zips do TSE e gera os arquivos por urna
scripts/repack_ballot_boxes.py              converte os arquivos de dados para o formato 2, menor
scripts/build_aggregated_data.py             gera o agregado por UF x minuto
scripts/statistical_analysis.py              testes de permutação sobre a ordem de chegada
scripts/senate_analysis.py                   Teoria dos Senadores: limites, correlações, regressão de Goodman, cenários
```

## Dados do TSE
Fonte: https://dadosabertos.tse.jus.br/dataset/resultados-2026-boletim-de-urna
- `scripts/build_ballot_boxes.py` baixa os zips por UF e gera um arquivo por eleição, uma linha por urna (usados pelo app):
  ```
  python scripts/build_ballot_boxes.py 2022-2 uf <pasta_temp> <UF>          # uma UF por vez (cache .npz)
  python scripts/build_ballot_boxes.py 2022-2 merge <pasta_temp> data/ballot_boxes_president_2022_round2.js
  ```
  Eleições aceitas: `2026-1`, `2022-1`, `2022-2` (ano-turno). Os arquivos são carregados sob demanda ao escolher o cenário.
- Formato dos dados: cada arquivo define `window.TSE_DS["<ano>-<turno>"]` com metadados e um bloco binário base64 + zlib (UF em `u8`, depois cada coluna `u16` em dois planos de bytes: todos os bytes baixos, depois todos os altos; `"fmt": 2`). O `scripts/repack_ballot_boxes.py` converte arquivos antigos do formato 1 (cerca de 15% menores após o repack). As chaves dos metadados mantêm os nomes originais em português (`fonte`, `candidatos`, `municipios`, `colunas`, ...), pois fazem parte do formato.
- Colunas de Senado por urna: `s_pl`, `s_pt`, `s_out`, `s_bn` (votos em PL, PT, outros partidos, brancos + nulos).
- `scripts/build_aggregated_data.py` gera o agregado por UF x minuto (370 KB), usado só por `statistical_analysis.py`.

## Modelo
- Urna sintética: tamanho com variação de ±15%, 2,5% brancos, 3% nulos, votos válidos por distribuição do grupo da urna + ruído normal (método dos maiores restos para somar exato).
- Urna real: com 499.206 urnas o resultado é exato; com menos, cada urna simulada agrupa urnas consecutivas da ordem escolhida, escaladas para os eleitores informados. A semente do sorteio é fixa (reprodutível).
- Gráficos: % dos votos válidos acumulados por % de urnas apuradas.

## Limitações
- O horário de chegada vem do campo `DT_BU_RECEBIDO` (minuto). Empates dentro do mesmo minuto são sorteados.
- Cenários A/B sintéticos são ilustrativos, não previsões.
- Projeto de estudo: resultados, textos e explicações podem conter erros.

## Análise estatística
`python scripts/statistical_analysis.py [n_perm_blocos] [n_perm_urnas]` testa se a trajetória real ("um sobe, o outro desce") é compatível com ordem aleatória de chegada (permutação por bloco UF x minuto e por urna), mede quanto é explicado pela mistura de UFs e lista UF, minuto mediano de chegada e % de cada candidato.

## SEO e compartilhamento
- `index.html` tem título, descrição, palavras-chave, autor, robots, cor do tema, tags Open Graph / Twitter e JSON-LD (`WebApplication`).
- Título, descrição e tags sociais acompanham o idioma escolhido (pt-BR / en-US). Dá para linkar um idioma direto com `?lang=pt-BR` ou `?lang=en-US`.
- `<noscript>` mostra uma descrição curta nos dois idiomas.
- Publicado em https://votesimulator.org/. O `index.html` tem link canonical, alternativas `hreflang` (en-US, pt-BR, x-default), `og:url` e URLs absolutas em `og:image` / `twitter:image`. `robots.txt` e `sitemap.xml` ficam na raiz do site.
- Depois de publicar: verifique o domínio no Google Search Console e envie `https://votesimulator.org/sitemap.xml`.

## Analytics (Google Analytics 4)
- O `index.html` carrega o snippet gtag; o `js/analytics.js` envia os eventos. Só ids de elementos e valores de opções são enviados, nunca texto digitado. O aviso de boas-vindas informa o visitante.
- Eventos: `button_click`, `language_select`, `setting_change`, `speed_set`, `simulation_complete`, `dialog_open`, `dialog_close`, `chart_hover`, `scroll_depth`, `engagement_time`, `link_click`, `js_error`.
- Eventos principais (conversões) recomendados, no GA4 em Admin > Eventos > "Marcar como evento principal": `simulation_complete` (visitante viu uma apuração completa) e `language_select`.
- Dimensões personalizadas recomendadas (Admin > Definições personalizadas, escopo de evento): `language`, `setting`, `value`, `button_id`, `scenario`, `order`, `theory`. Sem elas, esses parâmetros não aparecem nos relatórios.

## Gráficos interativos
O box "líder atual" mostra o líder e o % de votos válidos dele; passe o mouse (ou foque) nele para ver os detalhes mais recentes dos votos válidos de cada candidato (resultado final quando a apuração termina).
Passe o mouse (ou toque) sobre qualquer gráfico: aparece a linha vertical com urnas apuradas, votos acumulados e % de cada série, e a diferença entre 1º e 2º.

## Teoria dos Senadores
Hipótese: quem votou em senador do PL não vota em Lula; quem votou em senador do PT não vota em Bolsonaro.
- App (cenários reais 2026 e 2022, 1º turno): seletor "Teoria dos Senadores" com **Primeiro senador**, **Segundo senador** (só 2026) e **Primeiro ou segundo senador** (só 2026), mais um painel comparativo e o teste de compatibilidade. A legenda do gráfico explica a opção escolhida. O objetivo é explorar a hipótese como um "e se": os resultados mostram o que aconteceria SE ela fosse verdadeira e não provam nada sozinhos.
- `python scripts/senate_analysis.py`: limites, correlações entre urnas, regressão de Goodman e os três cenários.
- Grupos pelo partido do candidato a senador (PL, PT); demais partidos = "Demais".
- 2026: cada eleitor vota 2x para Senador e o boletim soma os dois. O 1º voto é aproximado por metade dos votos do partido. 2022: voto único (exato).
- Limite central: o boletim é agregado por urna. Não existe o par (voto de senador, voto de presidente) de cada eleitor, então a teoria só pode ser testada por limites e inferência ecológica.
- **Primeiro ou segundo senador** (2026, 2 votos por eleitor): algum PL (sem PT) = Bolsonaro; algum PT (sem PL) = Lula; um PL e um PT = Indecisos (série própria); nenhum dos dois = Outro. Dentro de cada urna os 2 votos são tratados como independentes: P(só PL) = 1-(1-pl)^2-2*pl*pt; P(só PT) = 1-(1-pt)^2-2*pl*pt; P(ambos) = 2*pl*pt.
- Resultado 2026: PL 34,8% - PT 14,3% - Indecisos 4,7% - Outro 46,2%.
- Botão **Ignorar os demais (só PL e PT)** (só em "Primeiro ou segundo senador"): tira quem não votou em senador do PL nem do PT. Os percentuais passam a usar só Bolsonaro, Lula e Indecisos (2026: 64,8% - 26,4% - 8,8%).
- Observação: o boletim não separa o 1º do 2º voto de senador, então "Segundo senador" dá exatamente os mesmos números de "Primeiro senador".

## Adicionando o 2º turno de 2026 (25/10/2026)
1. Quando o TSE publicar os arquivos do 2º turno, abra https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/buweb/ e copie o carimbo de data/hora dos zips (`bweb_2t_<UF>_<carimbo>.zip`).
2. Para cada UF e depois o merge: `TSE_TS=<carimbo> python scripts/build_ballot_boxes.py 2026-2 uf <pasta_temp> <UF>` (27 UFs + `ZZ` exterior), depois `TSE_TS=<carimbo> python scripts/build_ballot_boxes.py 2026-2 merge <pasta_temp> data/ballot_boxes_president_2026_round2.js`.
3. No `js/engine.js`, troque `HAS_2026_ROUND2 = true`. O cenário "Dados reais TSE: 2026, 2º turno" aparece na lista (os textos já estão no `js/i18n.js`).
4. Confira os totais com o resultado oficial antes de publicar.

## Aviso e licença
Código aberto sob a [Licença MIT](LICENSE). Código-fonte: https://github.com/MassenaConsulting/votesimulator. Contribuições e forks são bem-vindos.

Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. Licenciado sob a Licença MIT (veja LICENSE).

Projeto de estudo, fornecido "NO ESTADO EM QUE SE ENCONTRA", sem garantia de qualquer tipo. A Massena Consulting LLC não se responsabiliza por erros, imprecisões ou qualquer consequência do seu uso. Os dados eleitorais são públicos e vêm do Tribunal Superior Eleitoral (TSE); este projeto não tem vínculo com o TSE nem é endossado por ele.
