Code review per SE2_16_171752_P

authors:
- Damiano Stoffie 166312
- Deborah Iori 165475

# User Experience

Usando le credenziali fornite abbiammo effetuato l'accesso.
In generale, abbiamo incontrato difficolta' nell'utilizzare l'applicazione perche' la navigazione e' strutturata in maniera controintuitiva.
La selezione del pasto giornaliero e' particolarmente frustrante perche' non appaiono a schermo messaggi che indicano se i campi richiesti per effettuare l'ordine sono stati correttamente compilati o meno.

# Code review

Files considerati per la review:
- server.js (router/controller/model)
- text.js (contiene funzioni per fare rendering delle view?)
- public/ (viste html)
- private/ (viste html)

Il principali difetti del codice preso in esame sono 3:
- Dove sarebbe stato necessario utilizzare un template engine troviamo invece una serie di routines che concatenano stringhe (text.js). Questo rende _TUTTE_ le ruoutines all'interno del file inutilmente complesse e criptiche.
- Il file server.js e' commentato adeguatamente ma non e' organizzato seguendo un pattern MVC: in particolare, le funzioni tendono a essere eccessivamente complesse anche per via delle query che sono effettuate inline (Esempio: vedi riga 163 GET /private/choose handler). Il codice supera le 80 righe di larghezza con eccessiva frequenza
- Usando JSHINT sono evidenziati casi in cui variabili globali sono utilizzate inavvertitamente

Segue il template per la code review fornito a lezione

##	General
- [ ] MVC pattern used (No: non ci sono modelli, le query sono eseguite inline nei controllers)
- [x]	Images have been optimized

##	Markup
- [x]	Code does not contain inline style attributes
- [x]	Code does not contain deprecated elements & attributes
- [x]	Code is indented using hard tabs (alcuni files html non sono indentati correttamente)
- [x]	Tags and attributes are lowercase
- [x]	Tags are closed and nested properly (alcuni files html non sono indentati correttamente)
- [x]	Tables are only used to display tabular data
- [x]	Element IDs are unique
- [x]	Code validates against the W3C validator
- [ ]	All user input is “sanitized” (No: quando si ordina un pasto non si capisce se la richiesta e' stata processata con successo o meno)

##	Accessibility
- [x]	Page has a proper outline (H1-H6 order)
- [x]	Alt attributes exist on all <img> elements

##	CSS
- [x]	Style blocks are externalized to .css files
- [x]	Consistent naming conventions are used
- [x]	CSS validates against the W3C validator (CSS is mostly the bootstrap distribution)
- [x]	A print-friendly .css file is included in the page

##	Mobile
- [x]	Functions with JavaScript turned off
- [ ]	Image file sizes do not exceed 70kb
- [ ]	Appropriate use of HTML inputs (e.g. email, phone, etc) to trigger corresponding on-screen keyboards (Only input field found is a login form)

##	JavaScript
- [ ]	Script blocks are externalized to .js files (Mixed: there is both inline and externalized js)
- [ ]	Consistent naming conventions are used (No: code is written in italian)
- [ ]	Core page features function with JavaScript disabled
- [x]	Script blocks are placed before the closing <body> tag
- [ ]	Code has been run through JSHint (jshint.com) (No: 35 warnings)

## Code Base Checks
- [x]  All code is checked into SVN or other source code repository
- [x]	Client-side code is free of any references to development and staging environments, URLs, or other development settings
- [ ]	Does the code completely and correctly implement the design?
- [ ]	Is the code well-structured, consistent in style, and consistently formatted? (MVC pattern is not used, html rendering is done by string concatenation)
- [ ]	Are there any uncalled or unneeded procedures or any unreachable code? (No)
- [ ]	Are there any leftover stubs or test routines in the code? (No)
- [x]	Can any code be replaced by calls to external reusable components or library functions? (Yes: template rendering engine)
- [x]	Are there any blocks of repeated code that could be condensed into a single procedure? (Yes: template rendering engine)
- [x]	Are any modules excessively complex and should be restructured or split into multiple routines? (Yes: router/controller/model in server.js)
- [ ]	Are there any redundant or unused variables?

##	Loops and branches
- [x]	Are all loops, branches, and logic constructs complete, correct, and properly nested?
- [x]	Are the most common cases tested first in IF- -ELSEIF chains?
- [x]	Are all cases covered in an IF- -ELSEIF or CASE block, including ELSE or DEFAULT clauses?
- [x]	Does every case statement have a default?
- [x]	Are loop termination conditions obvious and invariably achievable?
- [ ]	Are indexes or subscripts properly initialized, just prior to the loop? (No: sometimes global variables are used)
- [ ]	Can any statements that are enclosed within loops be placed outside the loops?
- [x]	Does the code in the loop avoid manipulating the index variable or using it upon exit from the loop?

## Documentation
- [x]	Is the code clearly and adequately documented with an easy-to-maintain commenting style?
- [x]	Are all comments consistent with the code?
