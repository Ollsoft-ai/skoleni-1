1. Project Rules
```
-- Seznam tabulek
SELECT name FROM sqlite_master WHERE type='table';

-- Struktura konkrétní tabulky
PRAGMA table_info(tasks);
PRAGMA table_info(categories);
```
+
```
Používej pure html, css a jquery. Pro ikony používej fontawesome. 

Zde je jak vypadá SQL lite schéma databáze:
xxxxx
```
2. Autocomplete + cursor TAB
3. AI okno
    - Ask mode
    - kontext (web, files)
    - Edit mode
    - Agent mode
    - Inline code edit
    - Codebase indexing

Ukoly:
- Zeptat se jaky sql query mohu pouzit 
- Hezci styling s novymi ikonami
- Pie graf na pocet splnenych ukolu
- Funkce na export dat do jsonu
- Agent mode ukazat jak on spin uppne webserver
- Na buggy pouzit web

4. AI commit messages

Inline code edits

Zkratky
```
Ctrl/Cmd + K – Inline code editing
Ctrl/Cmd + I – Otevřít AI interface
Ctrl/Cmd + shift + J – Cusror settings/project rules
V Chatu – Ctrl/Cmd + enter → search through whole codebase

https://docs.cursor.com/kbd 
```
