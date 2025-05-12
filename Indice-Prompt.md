---
title: DR Prompt Grimorium
description: "Indice di sezione"
tags: [prompt]
creazione: 2025-05-11
ultima-modifica: 2025-05-11
---

# DR Prompt Grimorium

## Immagini

```dataview
TABLE WITHOUT ID
    file.link AS "Titolo File",
    description AS "Descrizione"
FROM "Immagini"
WHERE file.name != this.file.name AND file.ext = "md"
```

## Marketing

```dataview
TABLE WITHOUT ID
    file.link AS "Titolo File",
    description AS "Descrizione"
FROM "Marketing"
WHERE file.name != this.file.name AND file.ext = "md"
```

## Self Improvement

```dataview
TABLE WITHOUT ID
    file.link AS "Titolo File",
    description AS "Descrizione"
FROM "Self-Improvement"
WHERE file.name != this.file.name AND file.ext = "md"
```

