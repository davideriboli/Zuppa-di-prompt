---
title: Manualistica
description: "Indice di sezione"
tags: [risorse-varie]
creazione: 2025-05-11
ultima-modifica: 2025-05-11
---

# Manualistica

## Indice dei volumi

```dataviewjs
let folderPath = "Biblio";
let files = app.vault.getFiles(); // Ottiene tutti i file nel vault

// Filtra i file che sono nella cartella desiderata
let filesInFolder = files.filter(file =>
    file.path.startsWith(folderPath) && // Il percorso inizia con la cartella
    file.path.length > folderPath.length + 1 // Assicura che non sia la cartella stessa
    // Puoi aggiungere qui ulteriori filtri per estensione se necessario, es:
    // && (file.extension === 'pdf' || file.extension === 'epub')
);

// Ordina i file per nome
filesInFolder.sort((a, b) => a.name.localeCompare(b.name));

// Crea l'elenco puntato con link cliccabili
dv.list(filesInFolder.map(file => dv.fileLink(file.path)));
```