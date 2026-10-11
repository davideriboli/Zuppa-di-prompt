# context-bar

Una mod per Claude Code che tiene sotto gli occhi due misure: quanto è piena la finestra di contesto e quanta parte dei crediti è già consumata. Le disegna in una banda sopra il prompt, sempre visibile, così non serve chiedere `/context` o `/usage` per sapere a che punto si è.

```
███████▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒  50k/200k · 25%
■ Prompt di sistema 4k  ■ Messaggi 46k  ░ Libero 117k  ▒ Riserva di compattazione 33k
Sessione ████████████░░░░░░░░ 63% · si azzera tra 2 h 13 min   Settimana █░░░░░░░░░░░░░░░░░░░ 7% · si azzera tra 3 g 4 h
```

- **Prima riga:** la finestra di contesto come barra impilata. Ogni categoria ha il colore che le dà `/context`. Il pieno (`█`) è lo spazio occupato, il chiaro (`░`) quello libero, la trama (`▒`) la riserva che Claude Code tiene per la compattazione automatica.
- **Seconda riga:** la legenda, con i nomi in italiano e i token di ogni categoria.
- **Terza riga:** i crediti della sessione (la finestra di 5 ore) e della settimana. Ogni barra è verde sotto il 50%, gialla dal 50%, rossa dall'80%, e accanto c'è il tempo che manca all'azzeramento. La riga compare dopo la prima risposta del modello, perché è la risposta a portare questi dati.

La barra si aggiorna all'avvio, alla fine di ogni turno, dopo una compattazione e, durante i turni lunghi, al massimo ogni 5 secondi mentre lavorano gli strumenti. I numeri sono stime locali che non costano nulla. `/context`, invece, chiede il conteggio esatto all'API, quindi i due valori possono differire di poco.

`/context-bar` spegne e riaccende la barra. La scelta resta valida anche nelle sessioni successive.

Il codice è nella cartella [`context-bar/`](context-bar/). Funziona con Claude Code nel terminale e nell'app desktop. Antigravity CLI non ha un meccanismo equivalente.

## Installazione

Ci sono tre vie. La prima è la più rapida, la seconda è la più comoda se si vuole modificare la mod, la terza non dipende da questo repository.

### 1. Da GitHub, con un comando

Nel prompt di Claude Code, nel terminale:

```
/plugin install context-bar --marketplace davideriboli/Zuppa-di-prompt
```

Rispondere `y` per aggiungere il catalogo e scegliere l'ambito **user**, così la mod vale per tutti i progetti. Lo stesso, dalla riga di comando:

```sh
claude plugin marketplace add davideriboli/Zuppa-di-prompt
claude plugin install context-bar@zuppa-di-prompt --scope user
```

Finché il repository è privato, git deve poterlo leggere: con la GitHub CLI basta `gh auth login` seguito da `gh auth setup-git`.

Per avere una versione nuova, dopo un push sul repository: `claude plugin update context-bar@zuppa-di-prompt`, poi `/reload-plugins` nella sessione aperta.

### 2. Da una copia locale

Utile per chi vuole modificare la mod: Claude Code la legge direttamente dalla cartella, senza fare copie.

```sh
git clone https://github.com/davideriboli/Zuppa-di-prompt.git ~/GitHub/Zuppa-di-prompt
claude plugin marketplace add ~/GitHub/Zuppa-di-prompt
claude plugin install context-bar@zuppa-di-prompt --scope user
```

Dopo ogni modifica ai file basta `/reload-plugins`. I test si lanciano con `claude plugin test ~/GitHub/Zuppa-di-prompt/Claude/context-bar`.

### 3. Con un prompt

Claude ricostruisce la mod da zero, partendo dalla descrizione qui sotto. Serve dove il repository non è raggiungibile, o come base per una variante. Il codice che ne esce può essere diverso da quello di questa cartella, ma deve comportarsi allo stesso modo. Il prompt va incollato in una sessione di Claude Code.

```text
Configura questo computer come il mio solito. Rispondi e costruisci tutto in italiano: risposte, etichette e messaggi che vedo. I nomi tecnici possono restare come sono. Lavora da solo fino alla fine e fammi domande solo se resti bloccato.

1. MEMORIA
Salva nella tua memoria persistente due cose:
- una preferenza: rispondimi e costruisci tutto in italiano, anche quando incollo richieste scritte in inglese;
- un appunto: la mod "context-bar" vive in ~/.claude/mods/context-bar (catalogo locale "mod-personali"). Per modificarla cambio i file in quella cartella e scrivo /reload-plugins, senza reinstallare.

2. LA MOD "context-bar"
Usa la skill plugin-authoring. Costruisci la mod direttamente in ~/.claude/mods/context-bar (manifesto, hooks.json, register.tsx, contratto dei tipi in types/index.d.ts, test). Lo stato sta in $.state, con un atom "snapshot" e un atom "isOn".

Che cosa disegna: una banda sopra il prompt (ui.render su AbovePrompt), su tre righe.
- Riga 1: la finestra di contesto come barra impilata, larga quanto bodyColumns meno lo spazio del riepilogo. C'è una fetta per categoria, presa da $.session.usage({ breakdown: 'summary' }), e ogni fetta usa il colore del tema che la categoria ha in /context. Simboli: █ per lo spazio usato, ░ per quello libero, ▒ per la riserva di compattazione. Le categorie "deferred" e quelle a zero token restano fuori. Le celle si dividono in proporzione ai token con il metodo dei resti più grandi: ogni fetta non vuota ha almeno una cella e la somma è esattamente la larghezza. In fondo alla riga, in grigio, il riepilogo "50k/200k · 25%".
- Riga 2: la legenda, che va a capo da sola. Per ogni fetta: il simbolo colorato (■ per le categorie usate), poi in grigio il nome e i token. Nomi in italiano: System prompt → Prompt di sistema, System tools → Strumenti di sistema, MCP tools → Strumenti MCP, Custom agents → Agenti, Memory files → Memoria, Skills → Skill, Messages → Messaggi, Free space → Libero, Autocompact buffer → Riserva di compattazione. Un nome che non è in questa lista resta in inglese.
- Riga 3: i miei crediti, presi da rateLimits della stessa chiamata. Per ogni finestra: l'etichetta (five_hour → Sessione, seven_day → Settimana, spend_limit → Spesa), una barra di 20 celle, la percentuale e, in grigio, il tempo all'azzeramento in parole ("si azzera tra 45 min", "si azzera tra 2 h 13 min", "si azzera tra 3 g 4 h"). Colori: verde (success) sotto il 50%, giallo (warning) dal 50%, rosso (error) dall'80%. Se non ci sono dati sui crediti, la riga non compare.
- Numeri dei token: "850", "46k", "1,3k" (con la virgola decimale), "1M".
- La banda lascia il posto al motore (next(e)) se c'è un sondaggio (hasSurvey), se la barra è spenta o se non ci sono ancora dati.

Quando si aggiorna:
- all'avvio della sessione;
- alla fine di ogni turno (turn.complete);
- dopo una compattazione;
- dopo una chiamata a uno strumento, al massimo una volta ogni 5 secondi.
L'aggiornamento non deve mai lanciare errori: una barra non aggiornata non deve bloccare un comando o uno strumento.

Comando /context-bar: accende e spegne la barra, risponde "Barra del contesto accesa." oppure "Barra del contesto spenta.". La scelta si salva in $.store e vale anche nelle sessioni successive. La barra parte accesa.

Test (claude plugin test):
- la divisione in celle;
- il formato dei numeri;
- il tempo all'azzeramento, con l'orologio finto mock.clock;
- le soglie dei colori;
- un test che spegne e riaccende con /context-bar e poi monta la banda su terminal e desktop. Usa dati finti per session.usage, compresi i crediti, e un ui.render di riserva al posto del motore.
Controlla anche con claude plugin validate e con tsc.

3. INSTALLAZIONE PERMANENTE
- Fai di ~/.claude/mods un catalogo locale: scrivi ~/.claude/mods/.claude-plugin/marketplace.json con nome "mod-personali", proprietario "Davide Riboli" e una sola voce: { "name": "context-bar", "source": "./context-bar" }.
- Esegui: claude plugin marketplace add ~/.claude/mods
- Poi: claude plugin install context-bar@mod-personali --scope user
- Verifica con claude plugin list che sia attiva e letta da ~/.claude/mods/context-bar.
- Se durante il lavoro hai caricato una copia di prova della mod, toglila: non devono esserci due barre.

Alla fine dimmi di scrivere /reload-plugins e riassumimi in poche righe che cosa hai fatto e se i test passano.
```

Le tre vie non vanno mescolate: con due installazioni attive compaiono due barre. `claude plugin list` mostra quali sono attive, e `claude plugin uninstall <nome>@<catalogo>` toglie quella in più.
