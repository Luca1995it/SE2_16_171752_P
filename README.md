# SE2_16_171752_P
Il progetto è così strutturato:
- server.js: il cuore dell'applicazione, contiene tutti i middleware in attesa di essere chiamati
- text.js: contiene primitive per generare codice html per i template in modo che server.js non debba essere pieno di parti di view
- cartella assets: contiene tutti i file necessari a bootstrap per funzionare
- relazioni_database.graphml: è il grafo della struttura delle tabelle sul database
- secret-config.json: contiene parametri di autenticazione per il database in modo che non siano visibili in chiaro nei file sorgente
- cartella spec: contiene i test case di jasmine
- cartella public: contiene i file sorgenti dei template html pubblici
- cartella private: contiene i file sorgenti dei template html privati
- package.json: file descriptor dell'applicazione
- oggetti.js: contiene le funzioni per generare gli oggetti associati alle tabelle del database
- cartella node_modules: contiene tutte le librerie di nodejs
- cartella foto: contiene le foto dei menù
- error_page.html: file a cui si viene reindirizzati in caso di errore nell'esecuzione dell'applicazione
- db.js: contiene tutte le primitive necessarie ad effettuare operazioni sul database
- create.sql: contiene le istruzioni originali per generare le tabelle sul database
- cartella api: contiene le api (in formato yaml) del progetto
