---
title: Indice Prompt
description: "Indice di sezione"
tags: [prompt, indici]
date: "2025-05-11"
---

# Indice Prompt

## Comunicazione e Marketing

```dataview
TABLE WITHOUT ID
    file.link AS "Titolo File",
    description AS "Descrizione"
FROM "Marketing"
WHERE file.name != this.file.name AND file.ext = "md"
```

---

## Immagini

```dataview
TABLE WITHOUT ID
    file.link AS "Titolo File",
    description AS "Descrizione"
FROM "Immagini"
WHERE file.name != this.file.name AND file.ext = "md"
```

---

## Self Improvement

```dataview
TABLE WITHOUT ID
    file.link AS "Titolo File",
    description AS "Descrizione"
FROM "Self-Improvement"
WHERE file.name != this.file.name AND file.ext = "md"
```

---