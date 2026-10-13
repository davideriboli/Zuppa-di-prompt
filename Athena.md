# Athena

Un sistema per costruire e gestire un insegnamento dentro un vault di Obsidian, insieme a un agente che lavora nel terminale: Claude Code, Antigravity CLI o Gemini CLI. Vale per qualunque materia: un corso universitario o accademico, una classe di scuola superiore, un laboratorio.

Athena vive in un repository tutto suo: **[davideriboli/Athena](https://github.com/davideriboli/Athena)**. Questa è solo la scheda che la presenta.

## Come funziona

Si apre l'agente nella cartella e si dice «ciao». L'agente intervista il docente, una domanda alla volta: come si chiama il corso, quante ore, chi sono gli studenti, di che cosa parla, se vuole uno o due repository. A ogni domanda si può rispondere «lo decidiamo dopo» o «non lo so». Alla fine l'agente propone una struttura e, quando il docente la conferma, costruisce il corso: sillabo, programma, glossario, guide alle installazioni, esercitazioni, progetto finale, risorse.

Ogni lezione ha quattro file:

- la **dispensa** per gli studenti
- le **diapositive**, da proiettare con Obsidian
- il **copione** del docente, con i tempi e le parole da dire
- il **registro**, con il testo da incollare nel registro elettronico e su Classroom

Per tutto il semestre, sei skill accompagnano il lavoro: `athena` (l'intervista), `ciao` e `grazie` (aprire e chiudere una sessione), `lezione` (scrivere una lezione), `registro` (chiuderla dopo averla fatta), `esporta` (pubblicarla nel repository degli studenti, se il corso ne ha uno). Funzionano allo stesso modo con Claude Code e con Antigravity CLI.

Athena nasce dal vault dei miei corsi di Cibernetica e Drammaturgia Multimediale del 2026/27, da cui ho ricavato le regole, le skill e gli script.

## Come si usa

La via più comoda: sulla pagina del repository, **Use this template** → **Create a new repository**, privato. Così il vault ha subito il suo backup su GitHub. Poi:

```sh
git clone https://github.com/<il-tuo-account>/<nome-del-corso>.git
cd <nome-del-corso>
claude        # oppure: agy, gemini
```

e dire «ciao».

Senza GitHub: *Code* → *Download ZIP*, scompattare, aprire il terminale nella cartella e avviare l'agente.

Il manuale completo, con tutti i comandi, è nel [README di Athena](https://github.com/davideriboli/Athena#readme).
