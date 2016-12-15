//collegamento a oggetti.js che per il momento contiene solo il costruttore di utente
var obj = require('./oggetti.js');

//express, un web-server js basato su node.js
var express = require('express');

//bind, usata per gestire template su node.js
var bind = require('bind');

//modulo che contiene le funzioni necessarie alla memorizzazione di dati sul database heroku
var db = require('./db.js');

//modulo che contiene tutte le primitive necessarie a gestire codice HTML con javascript
var tx = require('./text.js');

//dichiaro la variabile app come istanza di express su cui farò girare tutti i middleware
var app = express();

//importo la libreria necessara a gestire le sessioni del web-server
var session = require('express-session')

//funzione middleware per il json parsing
var bodyParser = require('body-parser');

//Inserisco JSON e urlencoded parser come top-level middleware che faranno il parsing del body di ogni richiesta
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//setto la porta di ascolto del web.server a process.env.PORT se è definita, 5000 altrimenti
app.set('port', (process.env.PORT || 5000));

//i file in assets e foto potranno essere richiesti senza una espressa funzione middleware che si occupi per ognuno di loro
app.use(express.static('assets'));
app.use(express.static('foto'));
app.use(express.static('public'));

//use sessions
app.use(session({ 
	//richiesta, per prevenire manomissione dei cookie da parte degli utenti
	secret: 'string for the hash', 
	//tempo di vita dei cookie - 1 ora (in millisecondi)
	cookie: { maxAge: 60 * 60 * 1000 }
}));

//funzione per rimandare ad un file di template con le opzioni desiderate
function useTemplate(res,path,options){
	bind.toFile(path,options, function(data){
		res.writeHead(200, {'Content-Type':'text/html'});
		res.end(data);
	});
}

//filtro che si occupa reindirizzare alla home tutte le richieste "generiche" del tipo /
app.get('/$',function(req,res){
	//reindirizzo al middleware che si occupa della home page
	res.redirect('/home');
});

// filtro per non autenticati, protegge la sezione private da chi non è loggato
app.use('/private/*', function(req,res,next){
	//se l'utente è loggato permetto il proseguimento ...
	if(req.session.user != undefined) next();
	//... altrimenti rimando alla pagina di login
	else res.redirect('/login');
});

//ritorno pagina di login con il messaggio standard di richiesta delle credenziali
app.get('/login', function(req,res){
	//messaggioErrore è il messaggio che verrà mostrato sopra il form 
	useTemplate(res,'private/login.html',{messaggioErrore: "Inserisci le tue credenziali"});
});

//funzione di autenticazione
app.post('/accedi', function(req,res){
	if(req.body != undefined){
		if(req.body.username != undefined && req.body.username != '' && req.body.password != undefined && req.body.password != ''){
			//dichiaro la query che dovrà essere eseguita con gli specificatori di formato $1 e $2,
			//che saranno automaticamente rimpiazzati dai valori che l'utente ha inserito nel form
			var query = { text: 'select * from utenti where username = $1 and password = $2',
					//grazie a body-parser, accedere ai campi del form è davvero semplice: req.body.nome_dell_input
					values: [req.body.username,req.body.password] 
			};
			
			//lancio la funzione launchQuery definita in db.js che permette di eseguire una query ed infine chiama la funzione come secondo parametro
			//result è l'array che contiene le righe risultate dalla query
			db.launchQuery(query, function(err,result){
				//se c'è stato un errore, rimando a error
				if(err) res.redirect('/error');
				//altrimenti controllo che sia stato trovato un utente con quel username e quella password
				else if(result.length==1){
					req.session.user = new obj.utente(result[0].id,result[0].username,result[0].via);
					res.redirect('/home');
				}
				//infine, se utente e password erano errati, rimando al login con un messaggio 
				else {
					useTemplate(res,'private/login.html',{
						//tx.menu ritorna il codice html della tabella generata per mostrare i dati di result
						messaggioErrore: "Username o password errati"
					});
				}
			});
		} else{
			useTemplate(res,'private/login.html',{
				//tx.menu ritorna il codice html della tabella generata per mostrare i dati di result
				messaggioErrore: "Username o password errati"
			});
		}
	} else {
		res.redirect('/error');
	}
});

//ritono la home page modificata con i parametri dell'utente loggato in modo che sia personalizzabile
app.get('/home',function(req,res){
	useTemplate(res,'public/home.html',req.session.user);
});

//ritorna il menù che è stato scelto per oggi, anche vuoto in caso l'utente non abbia scelto pasti il giorno precedente
app.get('/private/menuOggi', function(req,res){

	//lancio la query per estrarre i piatti scelti per oggi
	db.launchQuery({
		text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id;',
		values: [req.session.user.id,(new Date()).getDay()]			//new Date().getDay() ritorna il numero del giorno della settimana tra 0 e 6
	}, function(err,result) {
		if(err) res.redirect('/error');
		else {
			//lancio una seconda query per estrarre tutti i menù a cui l'utente è allergico
			db.launchQuery({
				text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
				values: [req.session.user.id]
			}, function(err,allergie){
				if(err) res.redirect('/error');
				else{
					//aggiungo il risultato della funzione tx.menu a menuOggi.html sotto l'identificatore tabella
					useTemplate(res,'private/menuOggi.html',{ 
						//tx.menu ritorna il codice html della tabella generata per mostrare i dati di result
						tabella: tx.menu(result,allergie) 
					});
				}
			});
		}
	});		
});

//mostra nella pagina la lista di tutti i piatti disponibili durante la settimana, con alcuni pulsanti per visualizzare giorni specifici
app.get('/private/menuSettimanale',function(req,res){
	//lancio la query per estrarre i piatti scelti per il giorno in questione
	db.launchQuery({
		text: 'select * from menu,pasti where menu.id_pasti = pasti.id;'
	}, function(err,result) {
		if(err) res.redirect('/error');
		else {
			//lancio una seconda query per estrarre tutti i menù a cui l'utente è allergico
			db.launchQuery({
				text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
				values: [req.session.user.id]
			}, function(err,allergie){
				if(err) res.redirect('/error'); else{
					//aggiungo il risultato della funzione tx.menSettimanale a menuOggi.html sotto l'identificatore tabella
					useTemplate(res,'private/menuSettimana.html',{
						//tx.menuSettimanale ritorna il codice html della tabella generata per mostrare i dati di result
						//ed alcuni pulsanti per la gestione dei giorni
						tabella: tx.menuSettimanale(result,allergie)
					});
				}
			});
		}
	});		
});

//middleware chiamato per ritornare la lista dei piatti che è possibile scegliere per il giorno successivo, racchiusi in un opportuno form
app.get('/private/choose', function(req,res){
	//prima di tutto controllo che l'utente non avesse già effettuato l'ordine con la seguente query
	db.launchQuery({
		text: 'select count(*) as num from sceglie where id_utente = $1 and data::date = (now() + interval \'1 day\')::date',
		values: [req.session.user.id]
	}, function(err,ret){
		if(err) res.redirect('/error');
		//se non è ancora stato selezionato nessun pasto per domani
		if(parseInt(ret[0].num) == 0){
			db.launchQuery({
				//estraggo tutti i piatti disponibili il giorno successivo (i pasti si ripetono settimanalmente)
				//la funzione DOW FROM now() estrae il numero del giorno della settimana nell'intervallo 1-7
				//e dato che in nostro DB lavora con giorni della settimana nell'intervallo 0-6, 
				//non è necessario aggiugere un intervallo di un giorno nella query
				text: 'select *, menu.id as toid from menu, pasti where giorno = extract(DOW FROM now()) and menu.id_pasti = pasti.id;'
			}, function(err,result) {
				if(err) res.redirect('/error');
				else {
					//cerco eventali piatti a cui l'utente potrebbe essere allergico
					db.launchQuery({
						text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
						values: [req.session.user.id]
					}, function(err,allergie){
						if(err) res.redirect('/error');
						else{
							useTemplate(res,'private/scegli.html',{
								tabella: tx.menuChoose(result,allergie)
							});
						}
					});
				}
			});	
		} 
		//se era già stato selezionato un pasto per il giorno successivo inserisco un messaggio e la possibilità di rifare la prenotazione
		//cancellando quella precedente con il middleware /private/cancella
		else{
			useTemplate(res,'private/scegli.html',{
				tabella: 'Hai già effettuato la prenotazione per domani' + tx.link('/private/cancella',' -> Eliminala e riscegli <- ')
			});
		}
	});
});

//inserisce nel database le scelte fatte dall'utente nella scelta del menu per il giorno successivo
app.post('/private/choose',function(req,res){
	if(req.body != undefined){
		//creo un array di query che dovranno essere eseguite dalla funzione launchDeepQuey
		var query = [];
		for(c in req.body){
			query.push({
				text: 'insert into sceglie (id_utente,id_menu,data) values ($1,$2,now() + interval \'1 day\')',
				values: [req.session.user.id,parseInt(req.body[c])]
			});
		}
		//lancio le query dicendo di partire dalla prima (0) nell'array e di eseguire, una volta terminato, la funzione come secondo paramentro
		db.launchDeepQuery(query,0,function(err) {
			if (err) res.redirect('/error');		//in caso di errore rimando a /error
			else res.redirect('/home');				//in caso di successo rimando alla home
		});
	} else res.redirect('/error');
});

//middleware per rimuovere dal database tutte le prenotazioni fatte per l'indomani, quando l'utente dedice di volerle rifare
app.get('/private/cancella',function(req,res){
	db.launchQuery({
		text: 'delete from sceglie where id_utente = $1 and data::date = (now() + interval \'1 day\')::date',
		values: [req.session.user.id]
	}, function(err,result){
		if(err) res.redirect('/error');
		else res.redirect('/private/choose');
	});
});

//mostra una lista di pasti consumati per il quale non è ancora stato rilasciato un voto.
//nel db il valore 0 indica ancora senza voto, mentre i valori da 1 a 5 indicano che il voto è stato registrato correttamente
app.get('/private/vota',function(req,res){
	db.launchQuery({
		text: 'select * from sceglie,menu,pasti where sceglie.id_utente = $1 and sceglie.data::date <= now()::date and sceglie.voto = 0 and sceglie.id_menu = menu.id and menu.id_pasti = pasti.id order by data;',
		values: [req.session.user.id]
	}, function(err, result) {
		if (err) res.redirect('/error');
		else {
			useTemplate(res,'private/vota.html',{
				tabella: tx.menuVoto(result)	//menuVoto ritorna una tabella HTML con campi di input per scegliere un voto da 1 a 5
			});
		}
	});
});

//middleware che si occupa della registrazione dei voti sul database
//i voti vengono controllati perchè quelli con valore 0 non hanno senso ad essere riscritti uguali nel db
app.post('/private/addVoto',function(req,res){
	if(req.body != undefined){
		//creo array di query da eseguire per aggiornare i voti sul db
		var query = [];
		for(c in req.body){
			if(parseInt(req.body[c])!=0){
				query.push({
					text: 'update sceglie set voto = $1 where id_utente = $2 and id_menu = $3',
					values: [parseInt(req.body[c]),req.session.user.id,parseInt(c)]
				});
			}
		}
		//lancio la serie di query con la funzione launchDeepQuery, 
		//che al termine di tutto il suo lavoro chiama la funzione passata come secondo argomento
		db.launchDeepQuery(query,0,function(err) {
			if (err) res.redirect('/error');
			else res.redirect('/private/vota');
		});
	} else res.redirect('/error');
});

//middleware chiamato per aggiungere un'allergia dell'utente corrente sul database
app.post('/private/addAllergia', function(req,res){
	if(req.body != undefined){
		if((req.body.id_allergie != undefined) && (typeof req.body.id_allergie === 'string')){
			db.launchQuery({
				text: 'insert into intollerante (id_utente,id_allergie) values ($1,$2);',
				values: [req.session.user.id,parseInt(req.body.id_allergie)]
			}, function(err, result) {
				res.redirect('/private/allergia');
			});
		} else res.redirect('/private/allergia');
	} else res.redirect('/error');
});

//middleware chiamato per rimuovere un'allergia dell'utente corrente sul database
app.post('/private/removeAllergia', function(req,res){
	if(req.body != undefined){
		db.launchQuery({
			text: 'delete from intollerante where id_utente = $1 and id_allergie = $2;',
			values: [req.session.user.id,parseInt(req.body.id_allergie)]
		}, function(err, result) {
			if (err) res.redirect('/error');
			else res.redirect('/private/allergie');
		});
	} else res.redirect('/error');
});

app.get('/private/allergie', function(req,res){
			
	db.launchQuery({
		//seleziono tutte le allergie dell'utente corrente
		text: 'select * from allergie, intollerante where intollerante.id_utente = $1 and allergie.id = intollerante.id_allergie;',
		values: [req.session.user.id]
	}, function(err, result) {
		if (err) res.redirect('/error');
		else {
			db.launchQuery({
				text: 'select * from allergie;'
			}, function(err, allergie) {
				if (err) res.redirect('/error');
				else {
					useTemplate(res,'private/gestisciAllergie.html',
					{
						//ritorna una semplice tabella HTML per mostrare le allergie
						tabella: tx.menuAllergie(result),	
						//aggiungo un select-field per poter scegliere ed aggiungere una nuova allergia all'utente corrente
						//ed un pulsante per confermare la scelta
						selezione: tx.buttonAllergie(allergie)
					});
				}
			});
		}
	});
});

//middleware chiamato nel caso in cui un errore sia stato incontrato dagli altri middleware o dal database nell'elaborazione delle richieste
//la dichiarazione poteva essere inserita come statica in express ma in implementazioni future potrebbe 
//trasformarsi in un template per mostrare lo specifico errore anche all'utente
app.get('/error',function(req,res){
	//ritorno la pagina di errore e codice 406
	res.writeHead(406, {'Content-Type':'text/html'});
	bind.toFile('error_page.html',{},function(data){
		res.end(data);
	});
});

//metto in ascolto il sistema sulla porta precedentemente settata ed eseguo la funzione anonima per mostrare come accedere al sistema tramite browser
app.listen(app.get('port'), function() {
  	console.log('Node app is running on port', app.get('port'));
});

