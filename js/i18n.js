/*
 * Vote Simulator - UI translations (pt-BR / en-US)
 * Copyright (C) 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.
 *
 * Study project, provided "AS IS", without warranty of any kind. Massena Consulting LLC is not
 * responsible for errors, inaccuracies or any consequence of using it.
 * Election data: public data from the Brazilian Superior Electoral Court (TSE).
 */
/* Tiny i18n layer, no dependencies. Exposed as window.I18n.
   - static text:  data-i18n="key"  (textContent)  and  data-i18n-attr="attr:key;attr:key"
   - dynamic text: I18n.t('key', {param: value})
   - numbers:      I18n.num(), I18n.pct(), I18n.dec()  (locale aware) */
(function (g) {
  'use strict';

  const LANGS = ['pt-BR', 'en-US'];
  const STORE_KEY = 'vote-simulator-lang';

  const DICT = {
    'en-US': {
      'app.title': 'Vote Counting Simulator',
      'header.intro': 'Academic project. Shows how the chart evolves as ballot boxes arrive, in several scenarios. Base: TSE ballot-box bulletins (President, 2026 and 2022).',
      'header.study': 'This project was built for study purposes, although it uses real, public data obtained from the TSE website.',
      'header.langs': 'This site is available in two languages: English (en-US) and Portuguese (pt-BR). Use the language selector to switch.',
      'lang.label': 'Language / Idioma',
      'footer.copy': 'Massena Consulting LLC, Delaware, USA © 2026. All rights reserved.',

      'cfg.title': 'Settings',
      'cfg.scenario': 'Scenario',
      'cfg.order': 'Ballot-box arrival order',
      'cfg.theory': 'Senators Theory',
      'theory.off': 'Off (real votes)',
      'theory.exclusion': 'Veto only (1st senator)',
      'theory.fidelity': 'Team loyalty (1st senator)',
      'theory.senators': 'Two-senator team (1st or 2nd)',
      'cfg.voters': 'Voters',
      'cfg.boxes': 'Ballot boxes',
      'cfg.turnout': 'Turnout (%)',
      'cfg.batch': 'Boxes per update',
      'cfg.batchPh': 'auto',
      'cfg.gran': 'Update granularity',
      'gran.smooth': 'Smooth (~100 updates)',
      'gran.medium': 'Medium (~30)',
      'gran.coarse': 'Large batches (~10)',
      'cfg.useTSE': 'Use TSE totals',
      'speed.speed': 'Speed:',
      'speed.every': 'updates every',
      'speed.sec': 's',
      'btn.start': 'Start',
      'btn.pause': 'Pause',
      'btn.resume': 'Resume',
      'btn.accel': 'Speed up (10x)',
      'btn.normal': 'Normal speed',
      'btn.total': 'Count without animation',
      'btn.totalTitle': 'Plots all the data at once, without animation',
      'btn.restart': 'Restart',
      'btn.shuffle': 'Shuffle',
      'btn.shuffleTitle': 'Draws another random order',
      'btn.theme': 'Theme',
      'opt.showFinal': 'Show final result (dashed)',

      'stat.boxes': 'ballot boxes counted',
      'stat.votes': 'votes counted',
      'stat.leader': 'current leader',
      'stat.swaps': 'lead changes',
      'card.mirror': 'Votes counted by candidate',
      'card.mirrorAria': 'Mirrored chart of the top two candidates',
      'card.lines': '% of valid votes during the count',
      'card.linesAria': 'Line chart of the count',
      'card.theory': 'Senators Theory: whoever votes for a PL senator does not vote for Lula, whoever votes for a PT senator does not vote for Bolsonaro',
      'card.theoryAria': 'Senators Theory',
      'th.scenario': 'Scenario',
      'th.undecided': 'Undecided',
      'th.others': 'Others',
      'th.winner': 'Winner',
      'card.totals': 'Partial totals',
      'th.cand': 'Candidate / party',
      'th.votes': 'Votes',
      'th.valid': '% valid',
      'row.blank': 'Blank',
      'row.null': 'Null',

      'notice.loading': 'Loading TSE data...',
      'notice.fail': 'Failed to load the data: {msg}',
      'err.noFile': 'File not found: {src}',
      'err.noDecomp': 'This browser has no DecompressionStream support.',
      'err.noData': 'TSE data not loaded.',

      'chart.boxes': 'Ballot boxes: {n} / {N} ({p})',
      'chart.votes': '{name}: {v} votes ({p})',
      'chart.diff': 'Difference: {d} votes',

      'order.aleatoria': 'Random',
      'order.regiao': 'By region (growing bias)',
      'order.favA': 'Boxes favorable to A first',
      'order.favB': 'Boxes favorable to B first',
      'order.chegada': 'Real arrival (TSE timestamp)',
      'order.aleat_urna': 'Random by ballot box',
      'order.aleat_mun': 'Random by municipality',
      'order.aleat_uf': 'Random by state',
      'order.aleat_regiao': 'Random by region of the country',
      'order.mun_grandes': 'Largest municipalities first',
      'order.mun_pequenos': 'Smallest municipalities first',

      'scn.espelhado.name': 'Mirrored (A = B)',
      'scn.espelhado.desc': 'Parties A and B get exactly the same share in every ballot box. The lines overlap and the mirrored chart is symmetric.',
      'scn.virada.name': 'Late comeback',
      'scn.virada.desc': 'A leads early because its ballot boxes arrive first; B overtakes at the end. Change the order to see the effect of data arrival.',
      'scn.empate.name': 'Statistical tie',
      'scn.empate.desc': 'Final gap of 0.5 percentage point between A and B. The lead alternates during the count.',
      'scn.real.name': 'Real TSE data: 2026, 1st round (President)',
      'scn.real.desc': 'Official TSE ballot-box bulletins (499,206 boxes). Only the arrival order changes between the options; the votes of each box are the real ones.',
      'scn.real22b.name': 'Real TSE data: 2022, 2nd round (President)',
      'scn.real22b.desc': 'Ballot-box bulletins of the 2022 runoff (472,028 boxes, two candidates: the mirror is arithmetic, B = 100% − A).',
      'scn.real22a.name': 'Real TSE data: 2022, 1st round (President)',
      'scn.real22a.desc': 'Ballot-box bulletins of the 2022 first round (472,028 boxes, 11 candidates).',

      'series.partyA': 'Party A',
      'series.partyB': 'Party B',
      'series.others': 'Others',
      'series.otherCands': 'Other candidates',
      'series.otherNoPLPT': 'Other (neither PL nor PT)',
      'series.undecided': 'Undecided (one PL senator and one PT senator)',

      'legend.exclusion': 'Senators Theory, "Veto only (1st senator)": whoever voted for a PL senator does not vote for Lula and whoever voted for a PT senator does not vote for Bolsonaro. The vetoed votes move to the other options, in the proportion of each ballot box.',
      'legend.fidelity': 'Senators Theory, "Team loyalty (1st senator)": PL senator = vote for Bolsonaro; PT senator = vote for Lula; any other party = "Other candidates". Allies from other parties fall into "Other candidates".',
      'legend.senators': 'Senators Theory, "Two-senator team (1st or 2nd)" (2026, two senator votes per voter): any PL senator, without PT = Bolsonaro; any PT senator, without PL = Lula; one PL and one PT = Undecided; neither party (includes blank and null) = Other. The bulletin sums the two votes per box, so the two votes are treated as independent inside each box.',
      'theory.descOff': 'Real presidential votes, unchanged.',
      'theory.descExclusion': 'Veto only: voters of a PL senator do not vote for Lula and voters of a PT senator do not vote for Bolsonaro. The vetoed vote moves to the other options, in the proportion of the box.',
      'theory.descFidelity': 'Team loyalty: PL senator = vote for Bolsonaro; PT senator = vote for Lula; any other party = "Other candidates".',
      'theory.descSenators': 'Two-senator team: considers both senator votes. Any PL = Bolsonaro; any PT = Lula; one PL and one PT = Undecided; neither = Other.',
      'theory.rowReal': 'Real votes',
      'theory.rowExclusion': 'Veto only (1st senator)',
      'theory.rowFidelity': 'Team loyalty (1st senator)',
      'theory.rowSenators': 'Two-senator team (1st or 2nd)',
      'theory.test': 'Compatibility test: by the minimum count, {vL} Lula votes ({pL}% of the total, in {nL} boxes) and {vF} votes of Bolsonaro ({pF}%) would not fit the theory. The real votes fit almost entirely, but the test is loose: it only discards the impossible and does not tell "never votes" from "rarely votes".',
      'theory.note2026': 'In 2026 each voter casts 2 votes for Senator and the bulletin sums both: the 1st vote was approximated by half of each party\'s votes. ',
      'theory.note2022': 'In 2022 each voter cast 1 vote for Senator. ',
      'theory.noteParties': 'Groups follow the party of the candidate (PL, PT); allies from other parties fall into "Others", so full loyalty underestimates both sides.',
      'theory.noteSenators': ' "Two-senator team": the bulletin does not give each voter\'s pair of votes, so the two votes are treated as independent in each box (one PL and one PT = Undecided).',
      'btn.about': 'About & warnings',
      'btn.aboutTitle': 'Opens the warnings and the explanation of how this app works',
      'modal.title': 'Welcome! Please read this first',
      'modal.ok': 'Got it, let’s start!',
      'warn.title': 'Important warnings',
      'warn.data': 'The numbers come from public files of the TSE (the Brazilian Superior Electoral Court). This project is not connected to the TSE and is not approved by it.',
      'warn.asis': 'This is a study project, offered "as is". It can have mistakes, and Massena Consulting LLC is not responsible for errors or for anything that happens because someone used it.',
      'warn.analytics': 'This site uses Google Analytics to count visits and clicks (anonymous usage data, such as which buttons are used). It does not collect what you type.',
      'warn.rights': '© 2026 Massena Consulting LLC, Delaware, USA. All rights reserved.',
      'warn.noPrediction': 'Nothing here predicts or proves anything about elections. It is only a way to learn how counting charts behave.',
      'how.title': 'How does the app work? (explained like you are 8 years old)',
      'how.p1': 'In Brazil, people vote on a machine called an "urna" (ballot box). Each urna keeps the votes of one small group of people. When voting ends, each urna sends its numbers to the TSE, like a classroom sending its score to the school.',
      'how.p2': 'The chart is a scoreboard. At the start it is empty. Every 2 seconds the app opens a few more urnas and adds their votes, so the lines move. At the end every urna has been counted and the lines stop.',
      'how.p3': 'You hold the remote control:',
      'how.li1': 'Pick a scenario: real elections, or made-up ones to play with.',
      'how.li2': 'Pick the order the urnas arrive, like choosing which classrooms hand in their scores first.',
      'how.li3': 'Press Start to watch. Use the speed bar to go faster, up to 10 times faster.',
      'how.li4': 'Press "Count without animation" to see the final picture right away.',
      'how.li5': 'Press Shuffle to mix the order in a different way.',
      'how.p4': 'Why do the two lines look like a mirror? When two candidates get almost all the votes, a bigger slice for one means a smaller slice for the other. It works like a seesaw: one goes up, the other goes down.',
      'how.p5': 'Why do the lines wiggle at first and calm down later? At the start only a few urnas were counted, and a small group can look very different from the whole country. The more urnas arrive, the closer the chart gets to the final result.',
      'how.p6': 'The order matters! If urnas from places that vote for one candidate arrive first, that candidate looks ahead at the beginning, even though the final result does not change.',
      'stheory.title': 'The Senators Theory (explained like you are 8 years old)',
      'stheory.p1': 'Imagine two rival school teams: the PL team and the PT team. On election day each person votes for a president and also for senators, the people who help make the laws. In 2026 each person votes for 2 senators.',
      'stheory.p2': 'Some people have an idea, called a theory: whoever votes for a senator from the PL team would never vote for Lula for president, and whoever votes for a senator from the PT team would never vote for Bolsonaro.',
      'stheory.p3': 'A theory is a guess, not a fact. So the app plays "what if the guess were true?". It takes the real votes and moves them around following the rule, to see how the result would change. You can choose one of three games:',
      'stheory.g1': 'Veto only (1st senator): the votes that break the rule are taken away and shared among the other options, in the same proportion as that urna. Nothing else changes.',
      'stheory.g2': 'Team loyalty (1st senator): everybody sticks to their team. Voted for a PL senator: votes for Bolsonaro. Voted for a PT senator: votes for Lula. Any other party: goes to "Others".',
      'stheory.g3': 'Two-senator team (1st or 2nd): looks at both senator votes. At least one PL senator and no PT: Bolsonaro. At least one PT senator and no PL: Lula. One PL and one PT: "Undecided", a person torn between the teams. No PL and no PT: Others.',
      'stheory.p4': 'Careful: an urna only tells how many votes each senator party got, not who voted for whom. So the app uses math to guess how the two senator votes mix inside each urna. These are exercises of imagination, not facts.',
      'stheory.l1': 'A party is not a whole side: friends of PL or PT from other parties are counted as "Others".',
      'stheory.l2': 'In real life, people may repeat the same party in both senator votes more than the math assumes.',
      'stheory.l3': 'The results show what would happen IF the theory were true. They do not prove it or disprove it.',
      'meta.title': 'Vote Counting Simulator – Real TSE Ballot-Box Data',
      'meta.description': 'Study simulator of vote counting: watch real TSE ballot-box data (Brazil 2022, 2026) build live charts, change the arrival order and test the Senators Theory.',
      'meta.keywords': 'vote counting simulator, election results chart, TSE, Brazil election 2026, ballot box data, mirrored chart, Senators Theory, election data visualization',
      'meta.ogLocale': 'en_US',
      'meta.ogLocaleAlt': 'pt_BR',
      'meta.imageAlt': 'Vote Counting Simulator: live chart of the votes counted by candidate',
      'help.title': 'What does each button do?',
      'help.start': 'Start / Pause / Resume',
      'help.startText': 'Starts the count. While it runs the button turns into Pause; after pausing it becomes Resume. Use it to watch the chart grow, one update at a time.',
      'help.accel': 'Speed up (10x)',
      'help.accelText': 'Jumps to 10x speed; click again to go back to the speed you had. Use it when you are in a hurry but still want to see the movement. The speed bar sets any speed from 1x to 10x.',
      'help.total': 'Count without animation',
      'help.totalText': 'Draws the whole count at once. Use it to see the final picture or to compare scenarios quickly.',
      'help.restart': 'Restart',
      'help.restartText': 'Clears the count and starts over with the same settings. Use it to watch it again.',
      'help.shuffle': 'Shuffle',
      'help.shuffleText': 'Draws a new random order for the ballot boxes and restarts. Use it to see how luck in the arrival order changes the curve. It only matters in random orders.',
      'help.theme': 'Theme',
      'help.themeText': 'Switches between light and dark colors. Use it when the screen is too bright or too dark.',
      'help.useTSE': 'Use TSE totals',
      'help.useTSEText': 'Fills voters, ballot boxes and turnout with the real TSE numbers. Use it to replay a real election at full size.',
      'help.final': 'Show final result (dashed)',
      'help.finalText': 'Draws dashed lines where each candidate will end. Turn it off to hide the spoiler.',
      'help.note': 'Changing any setting restarts the count by itself.'
    },

    'pt-BR': {
      'app.title': 'Simulador de Apuração de Votos',
      'header.intro': 'Projeto acadêmico. Mostra como o gráfico evolui conforme as urnas chegam, em vários cenários. Base: boletins de urna do TSE (Presidente, 2026 e 2022).',
      'header.study': 'Esse projeto foi construído para fins de estudo, apesar de usar dados reais e públicos obtidos através do site do TSE.',
      'header.langs': 'Este site está disponível em duas línguas: português (pt-BR) e inglês (en-US). Use o seletor de idioma para alternar.',
      'lang.label': 'Idioma / Language',
      'footer.copy': 'Massena Consulting LLC, Delaware, USA © 2026. Todos os direitos reservados.',

      'cfg.title': 'Configuração',
      'cfg.scenario': 'Cenário',
      'cfg.order': 'Ordem de chegada das urnas',
      'cfg.theory': 'Teoria dos Senadores',
      'theory.off': 'Desligada (votos reais)',
      'theory.exclusion': 'Só o veto (1º senador)',
      'theory.fidelity': 'Fidelidade ao time (1º senador)',
      'theory.senators': 'Time dos 2 senadores (1º ou 2º)',
      'cfg.voters': 'Eleitores',
      'cfg.boxes': 'Urnas',
      'cfg.turnout': 'Comparecimento (%)',
      'cfg.batch': 'Urnas por atualização',
      'cfg.batchPh': 'auto',
      'cfg.gran': 'Granularidade das atualizações',
      'gran.smooth': 'Fluida (~100 atualizações)',
      'gran.medium': 'Média (~30)',
      'gran.coarse': 'Em lotes grandes (~10)',
      'cfg.useTSE': 'Usar totais do TSE',
      'speed.speed': 'Velocidade:',
      'speed.every': 'atualiza a cada',
      'speed.sec': 's',
      'btn.start': 'Iniciar',
      'btn.pause': 'Pausar',
      'btn.resume': 'Continuar',
      'btn.accel': 'Acelerar (10x)',
      'btn.normal': 'Velocidade normal',
      'btn.total': 'Totalização sem animação',
      'btn.totalTitle': 'Plota todos os dados de uma vez, sem animação',
      'btn.restart': 'Reiniciar',
      'btn.shuffle': 'Sortear',
      'btn.shuffleTitle': 'Sorteia outra ordem aleatória',
      'btn.theme': 'Tema',
      'opt.showFinal': 'Mostrar resultado final (tracejado)',

      'stat.boxes': 'urnas apuradas',
      'stat.votes': 'votos contados',
      'stat.leader': 'líder atual',
      'stat.swaps': 'trocas de liderança',
      'card.mirror': 'Votos apurados por candidato',
      'card.mirrorAria': 'Gráfico espelhado entre os dois primeiros',
      'card.lines': '% dos votos válidos ao longo da apuração',
      'card.linesAria': 'Gráfico de linhas da apuração',
      'card.theory': 'Teoria dos Senadores: quem vota em senador do PL não vota em Lula, quem vota em senador do PT não vota em Bolsonaro',
      'card.theoryAria': 'Teoria dos Senadores',
      'th.scenario': 'Cenário',
      'th.undecided': 'Indecisos',
      'th.others': 'Demais',
      'th.winner': 'Vencedor',
      'card.totals': 'Totais parciais',
      'th.cand': 'Candidato / partido',
      'th.votes': 'Votos',
      'th.valid': '% válidos',
      'row.blank': 'Brancos',
      'row.null': 'Nulos',

      'notice.loading': 'Carregando dados do TSE...',
      'notice.fail': 'Falha ao carregar os dados: {msg}',
      'err.noFile': 'Arquivo não encontrado: {src}',
      'err.noDecomp': 'Navegador sem DecompressionStream.',
      'err.noData': 'Dados do TSE não carregados.',

      'chart.boxes': 'Urnas: {n} / {N} ({p})',
      'chart.votes': '{name}: {v} votos ({p})',
      'chart.diff': 'Diferença: {d} votos',

      'order.aleatoria': 'Aleatória',
      'order.regiao': 'Por região (viés crescente)',
      'order.favA': 'Urnas favoráveis a A primeiro',
      'order.favB': 'Urnas favoráveis a B primeiro',
      'order.chegada': 'Chegada real (horário TSE)',
      'order.aleat_urna': 'Aleatória por urna',
      'order.aleat_mun': 'Aleatória por município',
      'order.aleat_uf': 'Aleatória por estado',
      'order.aleat_regiao': 'Aleatória por região do país',
      'order.mun_grandes': 'Municípios maiores primeiro',
      'order.mun_pequenos': 'Municípios menores primeiro',

      'scn.espelhado.name': 'Espelhado (A = B)',
      'scn.espelhado.desc': 'Partidos A e B recebem exatamente a mesma proporção em cada urna. As linhas se sobrepõem e o gráfico espelhado fica simétrico.',
      'scn.virada.name': 'Virada tardia',
      'scn.virada.desc': 'A lidera no início porque suas urnas chegam primeiro; B vira no fim. Troque a ordem para ver o efeito da chegada dos dados.',
      'scn.empate.name': 'Empate técnico',
      'scn.empate.desc': 'Diferença final de 0,5 ponto percentual entre A e B. A liderança alterna ao longo da apuração.',
      'scn.real.name': 'Dados reais TSE: 2026, 1º turno (Presidente)',
      'scn.real.desc': 'Boletins de urna oficiais do TSE (499.206 urnas). Só a ordem de chegada muda entre as opções; os votos de cada urna são os reais.',
      'scn.real22b.name': 'Dados reais TSE: 2022, 2º turno (Presidente)',
      'scn.real22b.desc': 'Boletins de urna do 2º turno de 2022 (472.028 urnas, dois candidatos: o espelho é aritmético, B = 100% − A).',
      'scn.real22a.name': 'Dados reais TSE: 2022, 1º turno (Presidente)',
      'scn.real22a.desc': 'Boletins de urna do 1º turno de 2022 (472.028 urnas, 11 candidatos).',

      'series.partyA': 'Partido A',
      'series.partyB': 'Partido B',
      'series.others': 'Outros',
      'series.otherCands': 'Demais candidatos',
      'series.otherNoPLPT': 'Outro (sem PL nem PT)',
      'series.undecided': 'Indecisos (um senador PL e outro PT)',

      'legend.exclusion': 'Teoria dos Senadores, "Só o veto (1º senador)": quem votou em senador do PL não vota em Lula e quem votou em senador do PT não vota em Bolsonaro. Os votos vetados migram para as outras opções, na proporção de cada urna.',
      'legend.fidelity': 'Teoria dos Senadores, "Fidelidade ao time (1º senador)": senador do PL = voto em Bolsonaro; senador do PT = voto em Lula; qualquer outro partido = "Demais candidatos". Aliados de outros partidos caem em "Demais".',
      'legend.senators': 'Teoria dos Senadores, "Time dos 2 senadores (1º ou 2º)" (2026, dois votos de senador por eleitor): algum senador do PL, sem PT = Bolsonaro; algum senador do PT, sem PL = Lula; um do PL e outro do PT = Indecisos; nenhum dos dois partidos (inclui brancos e nulos) = Outro. O boletim soma os dois votos por urna, então os dois são tratados como independentes dentro de cada urna.',
      'theory.descOff': 'Votos reais de presidente, sem alteração.',
      'theory.descExclusion': 'Só o veto: eleitor de senador PL não vota Lula e eleitor de senador PT não vota em Bolsonaro. O voto vetado migra para as outras opções, na proporção da urna.',
      'theory.descFidelity': 'Fidelidade ao time: senador PL = voto em Bolsonaro; senador PT = voto em Lula; qualquer outro partido = "Demais".',
      'theory.descSenators': 'Time dos 2 senadores: considera os dois votos de senador. Algum PL = Bolsonaro; algum PT = Lula; um PL e um PT = Indeciso; nenhum dos dois = Outro.',
      'theory.rowReal': 'Votos reais',
      'theory.rowExclusion': 'Só o veto (1º senador)',
      'theory.rowFidelity': 'Fidelidade ao time (1º senador)',
      'theory.rowSenators': 'Time dos 2 senadores (1º ou 2º)',
      'theory.test': 'Teste de compatibilidade: pela conta mínima, {vL} votos de Lula ({pL}% do total, em {nL} urnas) e {vF} votos de Bolsonaro ({pF}%) não caberiam na teoria. Os votos reais cabem quase por inteiro, mas o teste é frouxo: só descarta o impossível e não distingue "nunca vota" de "vota pouco".',
      'theory.note2026': 'Em 2026 cada eleitor vota 2x para Senador e o boletim soma os dois votos: o 1º voto foi aproximado por metade dos votos de cada partido. ',
      'theory.note2022': 'Em 2022 cada eleitor votou 1x para Senador. ',
      'theory.noteParties': 'Grupos pelo partido do candidato (PL, PT); aliados de outros partidos entram em "Demais", por isso a fidelidade total subestima os dois lados.',
      'theory.noteSenators': ' "Time dos 2 senadores": o boletim não informa o par de votos de cada eleitor, então os dois votos são tratados como independentes em cada urna (um PL e um PT = Indeciso).',
      'btn.about': 'Sobre e avisos',
      'btn.aboutTitle': 'Abre os avisos e a explicação de como este app funciona',
      'modal.title': 'Bem-vindo! Leia isto primeiro',
      'modal.ok': 'Entendi, vamos começar!',
      'warn.title': 'Avisos importantes',
      'warn.data': 'Os números vêm de arquivos públicos do TSE (Tribunal Superior Eleitoral). Este projeto não tem ligação com o TSE e não foi aprovado por ele.',
      'warn.asis': 'Este é um projeto de estudo, oferecido "no estado em que se encontra". Pode ter erros, e a Massena Consulting LLC não se responsabiliza por erros nem por qualquer coisa que aconteça por causa do uso.',
      'warn.analytics': 'Este site usa o Google Analytics para contar visitas e cliques (dados de uso anônimos, como quais botões são usados). Ele não coleta o que você digita.',
      'warn.rights': '© 2026 Massena Consulting LLC, Delaware, USA. Todos os direitos reservados.',
      'warn.noPrediction': 'Nada aqui prevê nem prova algo sobre eleições. É só um jeito de aprender como os gráficos de apuração se comportam.',
      'how.title': 'Como o app funciona? (explicado como se você tivesse 8 anos)',
      'how.p1': 'No Brasil, as pessoas votam numa máquina chamada urna. Cada urna guarda os votos de um grupinho de pessoas. Quando a votação termina, cada urna manda seus números para o TSE, como uma sala de aula mandando a nota para a escola.',
      'how.p2': 'O gráfico é um placar. No começo ele está vazio. A cada 2 segundos o app abre mais algumas urnas e soma os votos delas, então as linhas se mexem. No fim, todas as urnas foram contadas e as linhas param.',
      'how.p3': 'Quem manda é você, com o controle remoto:',
      'how.li1': 'Escolha um cenário: eleições reais ou inventadas só para brincar.',
      'how.li2': 'Escolha a ordem em que as urnas chegam, como escolher qual sala entrega a nota primeiro.',
      'how.li3': 'Aperte Iniciar para assistir. Use a barra de velocidade para ir mais rápido, até 10 vezes mais.',
      'how.li4': 'Aperte "Totalização sem animação" para ver o desenho final na hora.',
      'how.li5': 'Aperte Sortear para misturar a ordem de outro jeito.',
      'how.p4': 'Por que as duas linhas parecem um espelho? Quando dois candidatos ficam com quase todos os votos, uma fatia maior para um significa uma fatia menor para o outro. É uma gangorra: um sobe, o outro desce.',
      'how.p5': 'Por que as linhas balançam no começo e se acalmam depois? No início poucas urnas foram contadas, e um grupo pequeno pode ser bem diferente do país inteiro. Quanto mais urnas chegam, mais o gráfico se aproxima do resultado final.',
      'how.p6': 'A ordem importa! Se as urnas de lugares que votam num candidato chegam primeiro, esse candidato aparece na frente no começo, mesmo que o resultado final não mude.',
      'stheory.title': 'A Teoria dos Senadores (explicada como se você tivesse 8 anos)',
      'stheory.p1': 'Imagine dois times rivais na escola: o time PL e o time PT. No dia da eleição cada pessoa vota para presidente e também para senadores, as pessoas que ajudam a fazer as leis. Em 2026 cada pessoa vota em 2 senadores.',
      'stheory.p2': 'Algumas pessoas têm uma ideia, chamada teoria: quem vota em senador do time PL nunca votaria em Lula para presidente, e quem vota em senador do time PT nunca votaria em Bolsonaro.',
      'stheory.p3': 'Teoria é um palpite, não um fato. Então o app brinca de "e se o palpite fosse verdade?". Ele pega os votos reais e muda eles de lugar seguindo a regra, para ver como o resultado mudaria. Você escolhe um de três jogos:',
      'stheory.g1': 'Só o veto (1º senador): os votos que quebram a regra são retirados e repartidos entre as outras opções, na mesma proporção daquela urna. Mais nada muda.',
      'stheory.g2': 'Fidelidade ao time (1º senador): todo mundo fica com o seu time. Votou em senador do PL: vota em Bolsonaro. Votou em senador do PT: vota em Lula. Qualquer outro partido: vai para "Demais".',
      'stheory.g3': 'Time dos 2 senadores (1º ou 2º): olha os dois votos de senador. Pelo menos um senador do PL e nenhum do PT: Bolsonaro. Pelo menos um do PT e nenhum do PL: Lula. Um do PL e um do PT: "Indeciso", uma pessoa dividida entre os times. Nenhum do PL nem do PT: Demais.',
      'stheory.p4': 'Cuidado: a urna só diz quantos votos cada partido de senador recebeu, não quem votou em quem. Por isso o app usa matemática para chutar como os dois votos de senador se misturam dentro de cada urna. São exercícios de imaginação, não fatos.',
      'stheory.l1': 'Partido não é um lado inteiro: amigos do PL ou do PT de outros partidos entram em "Demais".',
      'stheory.l2': 'Na vida real, as pessoas podem repetir o mesmo partido nos dois votos de senador mais do que a matemática supõe.',
      'stheory.l3': 'Os resultados mostram o que aconteceria SE a teoria fosse verdadeira. Eles não provam nem desmentem a teoria.',
      'meta.title': 'Simulador de Apuração de Votos – Dados Reais do TSE',
      'meta.description': 'Simulador de apuração (estudo): dados reais de urnas do TSE (2022 e 2026) viram gráficos ao vivo; mude a ordem de chegada e teste a Teoria dos Senadores.',
      'meta.keywords': 'simulador de apuração, gráfico de apuração, TSE, eleição 2026, urna eletrônica, boletim de urna, gráfico espelhado, Teoria dos Senadores, visualização de dados eleitorais',
      'meta.ogLocale': 'pt_BR',
      'meta.ogLocaleAlt': 'en_US',
      'meta.imageAlt': 'Simulador de Apuração de Votos: gráfico ao vivo dos votos apurados por candidato',
      'help.title': 'O que faz cada botão?',
      'help.start': 'Iniciar / Pausar / Continuar',
      'help.startText': 'Começa a apuração. Enquanto roda, o botão vira Pausar; depois de pausar, vira Continuar. Use para ver o gráfico crescer, uma atualização por vez.',
      'help.accel': 'Acelerar (10x)',
      'help.accelText': 'Pula para a velocidade 10x; clique de novo para voltar à velocidade anterior. Use quando tiver pressa, mas ainda quiser ver o movimento. A barra de velocidade define qualquer valor de 1x a 10x.',
      'help.total': 'Totalização sem animação',
      'help.totalText': 'Desenha a apuração inteira de uma vez. Use para ver o resultado final ou comparar cenários rapidamente.',
      'help.restart': 'Reiniciar',
      'help.restartText': 'Zera a apuração e recomeça com as mesmas configurações. Use para assistir de novo.',
      'help.shuffle': 'Sortear',
      'help.shuffleText': 'Sorteia uma nova ordem aleatória das urnas e reinicia. Use para ver como a sorte da ordem de chegada muda a curva. Só faz diferença nas ordens aleatórias.',
      'help.theme': 'Tema',
      'help.themeText': 'Alterna entre cores claras e escuras. Use quando a tela estiver clara ou escura demais.',
      'help.useTSE': 'Usar totais do TSE',
      'help.useTSEText': 'Preenche eleitores, urnas e comparecimento com os números reais do TSE. Use para rever uma eleição real em tamanho natural.',
      'help.final': 'Mostrar resultado final (tracejado)',
      'help.finalText': 'Desenha linhas tracejadas onde cada candidato vai terminar. Desligue para não ver o resultado antes da hora.',
      'help.note': 'Mudar qualquer configuração reinicia a apuração sozinho.'
    }
  };

  function initialLang() {
    // 1) ?lang=pt | pt-BR | en | en-US in the URL (shareable link per language)
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (/^pt/i.test(q || '')) return 'pt-BR';
      if (/^en/i.test(q || '')) return 'en-US';
    } catch (e) { /* ignore */ }
    // 2) saved choice, 3) browser language
    try {
      const s = localStorage.getItem(STORE_KEY);
      if (LANGS.indexOf(s) >= 0) return s;
    } catch (e) { /* storage may be blocked */ }
    return /^pt/i.test(navigator.language || '') ? 'pt-BR' : 'en-US';
  }

  let lang = initialLang();
  const listeners = [];
  const nfCache = {};

  function t(key, params) {
    let s = (DICT[lang] && DICT[lang][key]);
    if (s === undefined) s = DICT['en-US'][key];
    if (s === undefined) return key;
    if (params) s = s.replace(/\{(\w+)\}/g, function (m, k) { return k in params ? params[k] : m; });
    return s;
  }

  /* number formatting follows the selected language */
  function nf(dec) {
    const k = lang + '|' + dec;
    return nfCache[k] || (nfCache[k] = new Intl.NumberFormat(lang, { minimumFractionDigits: dec, maximumFractionDigits: dec }));
  }
  function num(v) { return nf(0).format(Math.round(v)); }
  function dec(v, d) { return nf(d).format(v); }
  function pct(v, d) { return nf(d === undefined ? 1 : d).format(v) + '%'; }

  /* applies the translations to every [data-i18n] / [data-i18n-attr] element */
  function apply(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        const i = pair.indexOf(':');
        if (i > 0) el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
      });
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) {   // flag buttons stay in sync (header + dialog)
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    document.documentElement.setAttribute('lang', lang);
    document.title = t('meta.title');
  }

  function setLang(l) {
    if (LANGS.indexOf(l) < 0 || l === lang) return;
    lang = l;
    try { localStorage.setItem(STORE_KEY, l); } catch (e) { /* ignore */ }
    try {                                                   // keeps the URL shareable: ?lang=pt-BR
      const u = new URL(location.href); u.searchParams.set('lang', l);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* file:// or sandboxed pages may refuse */ }
    apply();
    listeners.forEach(function (fn) { fn(lang); });
  }

  g.I18n = {
    LANGS: LANGS, t: t, num: num, dec: dec, pct: pct, apply: apply, setLang: setLang,
    get lang() { return lang; },
    onChange: function (fn) { listeners.push(fn); }
  };
})(window);
