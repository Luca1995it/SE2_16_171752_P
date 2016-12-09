//classe utente, utilizzata per memorizzare un utente nella sessione e permettere di accedere ad aree private
function utente(id,username,via){
		this.id = id;
		this.username = username;
		this.via = via;
	
		this.toString = function(){
			return 'Utente con id: ' + id + ', con nome: ' + username + ', che abita in via ' + via;
		}
}
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

//use sessions
app.use(session({ 
	//richiesta, per prevenire manomissione dei cookie da parte degli utenti
	secret: 'string for the hash', 
	//tempo di vita dei cookie - 1 ora (in millisecondi)
	cookie: { maxAge: 60 * 60 * 1000 }
}));

//filtro che si occupa reindirizzare alla home tutte le richieste "generiche" del tipo /
app.use('/$',function(req,res){
	//reindirizzo al middleware che si occupa della home page
	res.redirect('/private/home');
});

// filtro per non autenticati, protegge la sezione private da chi non è loggato
app.use('/private/*', function(req,res,next){
	//se l'utente è loggato permetto il proseguimento ...
	if(req.session.user != undefined) next();
	
	//... altrimenti rimando alla pagina di login
	else res.redirect('/login');
});

//ritorno pagina di login con il messaggio standard di richiesta delle credenziali
app.use('/login', function(req,res){
	
	bind.toFile('private/login.html',{
		//messaggio che verrà mostrato sopra il form
		messaggioErrore: "Inserisci le tue credenziali"
	}, function(data){
		//setto l'header della risposta con statusCode 200 (OK) e contenuto di tipo pagina html
		res.writeHead(200, {'Content-Type':'text/html'});
		res.end(data);
	});
});

//funzione di autenticazione
app.post('/accedi', function(req,res){
	
	//dichiaro la query che dovrà essere eseguita con gli specificatori di formato $1 e $2,
	//che saranno automaticamente rimpiazzati dai valori che l'utente ha inserito nel form
	var query = { text: 'select * from utenti where username = $1 and password = $2',
			//grazie a body-parser, accedere ai campi del form è davvero semplice: req.body.nome_dell_input
			values: [req.body.username,req.body.password] 
	};
	
	//lancio la funzione launchQuery definita in db.js, permette di eseguire una query ed infine chiama la funzione come secondo parametro
	//result è l'array che contiene le righe risultate dalla query
	db.launchQuery(query, function(err,result){
		//se c'è stato un errore, rimando a error
		if(err){
			res.redirect('/error');
		}
		//altrimenti controllo che sia stato trovato un utente con quel username e quella password
		else if(result.length==1){
			req.session.user = new utente(result[0].id,result[0].username,result[0].via);
			res.redirect('/private/home');
		}
		//infine, se utente e password erano errati, rimando al login con un messaggio 
		else {
			bind.toFile('private/login.html',{
				messaggioErrore: "Username o password errati"
			}, function(data){
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end(data);
			});
		}
	});
});

//ritono la home page modificata con i parametri dell'utente loggato in modo che sia personalizzata
app.get('/private/home',function(req,res){
	bind.toFile('private/home.html',
		req.session.user,
		function(data){
			res.writeHead(200, {'Content-Type':'text/html'});
			res.end(data);
	});
});

//ritorna il menù che è stato scelto per oggi, anche vuoto in caso l'utente non abbia scelto niente il giorno precedente
app.get('/private/menuOggi', function(req,res){
	//text sarà la variabile che conterrà il codice HTML che verrà aggiunto al file menuOggi.html
	var text = '';
	//orario e tipo mi permetteranno di ordinare i risultati della ricerca e mostrarli di conseguenza
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	//lancio la query per estrarre i piatti scelti per oggi
	db.launchQuery({
		text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id;',
		values: [req.session.user.id,(new Date()).getDay()]
	}, function(err,result) {
		if(err){
			res.redirect('/error');
		}
		else {
			//lancio una seconda query per estrarre tutti i menù a cui l'utente è allergico
			db.launchQuery({
				text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
				values: [req.session.user.id]
			}, function(err,allergie){
				if(err){
					res.redirect('/error');
				} else{
					//per ogni orario (pranzo e cena) estraggo i pasti di ogni tipo (primo,secondo,contorno) e li aggiungo come testo html
					//se non ho risultati stampo un messaggio
					if(result.length == 0) text += tx.intestazione('Nessun pasto ordinato per oggi',3);
					else{
						for(o in orario){
							for(t in tipo){
								text += tx.intestazione(orario[o] + " - " + tipo[t]);
								for(i in result){
									if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
										least = true;
										//aggiunge una separazione tra righe come <hr>
										text += tx.addInterlinea();
										//aggiunge una riga preformattata contenente l'immagine, il nome e la decrizione del piatto
										text += tx.openRiga();
										text += tx.openColonna(4);
										text += tx.addImg(result[i].fotopath);
										text += tx.closeColonna();
										text += tx.openColonna(4);
										text += tx.setDim(result[i].nome,4);
										text += tx.closeColonna();
										text += tx.openColonna(4);
										text += tx.setDim(result[i].descr,5);
										text += tx.closeColonna();
										text += tx.closeRiga();
										//se un dei piatti a cui l'utente è allergico coincide con quello scelto, aggiungo una riga di avvertimento
										for(a in allergie){
											if(allergie[a].id_menu == result[i].id_menu) text += tx.alertMessage('Contiene allergeni',red,5);
										}
									}
								}


							}
						}
					}
					//aggiungo il contenuto a menuOggi.html sotto l'identificatore tabella
					bind.toFile('private/menuOggi.html',{
						tabella: text
					},function(data){
						res.writeHead(200, {'Content-Type':'text/html'});
						res.end(data);
					});
				}
			});
		}
	});		
});

app.get('/private/menuSettimanale',function(req,res){
	//text sarà la variabile che conterrà il codice HTML che verrà aggiunto al file menuOggi.html
	var text = '';
	//orario e tipo mi permetteranno di ordinare i risultati della ricerca e mostrarli di conseguenza
	var giorni = [0,1,2,3,4,5,6];
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	//lancio la query per estrarre i piatti scelti per il giorno in questione
	db.launchQuery({
		text: 'select * from menu,pasti where menu.id_pasti = pasti.id;'
	}, function(err,result) {
		if(err){
			res.redirect('/error');
		}
		else {
			//lancio una seconda query per estrarre tutti i menù a cui l'utente è allergico
			db.launchQuery({
				text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
				values: [req.session.user.id]
			}, function(err,allergie){
				if(err){
					res.redirect('/error');
				} else{
					//per ogni giorno ripeto:
					//per ogni orario (pranzo e cena) estraggo i pasti di ogni tipo (primo,secondo,contorno) e li aggiungo come testo html
					//se non ho risultati stampo un messaggio
					if(result.length == 0) text += tx.intestazione('Nessun pasto trovato per questa settimana, ci scusiamo');
					else{
						text += tx.openRiga();
						for(g in giorni){
							text += tx.openColonna(1);
							text += tx.button('btn' + g, 'Mostra giorno ' + tx.getStringDay(g));
							text += tx.closeColonna();
						}
						text += tx.closeRiga();
						
						for(g in giorni){
							text += tx.openDiv('show' + g);
							text += tx.aCapo();
							text += tx.intestazione(tx.getStringDay(g));
							for(o in orario){
								for(t in tipo){
									text += tx.aCapo() + tx.aCapo();
									text += tx.intestazione(orario[o] + " - " + tipo[t]);
									for(i in result){
										if(result[i].tipo == tipo[t] && result[i].orario == orario[o] && result[i].giorno == giorni[g]){
											//aggiunge una separazione tra righe come <hr>
											text += tx.addInterlinea();
											//aggiunge una riga preformattata contenente l'immagine, il nome e la decrizione del piatto
											text += tx.openRiga();
											text += tx.openColonna(4);
											text += tx.addImg(result[i].fotopath);
											text += tx.closeColonna();
											text += tx.openColonna(4);
											text += tx.setDim(result[i].nome,4);
											text += tx.closeColonna();
											text += tx.openColonna(4);
											text += tx.setDim(result[i].descr,5);
											text += tx.closeColonna();
											text += tx.closeRiga();
											//se un dei piatti a cui l'utente è allergico coincide con quello scelto, aggiungo una riga di avvertimento
											for(a in allergie){
												if(allergie[a].id_menu == result[i].id_menu) text += tx.alertMessage('Contiene allergeni',red,5);
											}
										}
									}
								}
							}
							text += tx.closeDiv();
						}
					}
					//aggiungo il contenuto a menuOggi.html sotto l'identificatore tabella
					bind.toFile('private/menuSettimana.html',{
						tabella: text
					},function(data){
						res.writeHead(200, {'Content-Type':'text/html'});
						res.end(data);
					});
				}
			});
		}
	});		
});

//middleware chiamato per ritornare la lista dei piatti che è possibile scegliere per il giorno successivo, racchiusi in un opportuno form
app.get('/private/choose', function(req,res){
	//variabile per testo html che verrà inserito nel file html
	var text = '';
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	//prima di tutto controllo che l'utente non avesse già effettuato l'ordine con la seguente query
	db.launchQuery({
		text: 'select count(*) as num from sceglie where id_utente = $1 and data::date = (now() + interval \'1 day\')::date',
		values: [req.session.user.id]
	}, function(err,ret){
		console.log(ret);
		if(err){
			res.redirect('/error');
		}
		//se non è ancora stato selezionato nessun pasto per domani
		if(parseInt(ret[0].num) == 0){
			db.launchQuery({
				//estraggo tutti i piatti disponibili il giorno successivo (i pasti si ripetono settimanalmente)
				//la funzione DOW FROM now() estrae il numero del giorno della settimana nell'intervallo 1-7
				//e dato che in nostro DB lavora con giorni della settimana nell'intervallo 0-6, 
				//non è necessario aggiugere un intervallo di un giorno nella query
				text: 'select *, menu.id as toid from menu, pasti where giorno = extract(DOW FROM now()) and menu.id_pasti = pasti.id;'
			}, function(err,result) {
				if(err){
					res.redirect('/error');
				}
				else {
					//cerco eventali piatti a cui l'utente potrebbe essere allergico
					db.launchQuery({
						text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
						values: [req.session.user.id]
					}, function(err,allergie){
						if(err){
							res.redirect('/error');
						} else{
							//apro un form nel testo html che andrò ad inserire
							text += tx.openForm('/private/insertScegli','post');
							//itero su orario (pranzo,cena) e poi su tipo (primo,secondo,contorno) per estrarre i pasti e mostrarli in ordine
							for(o in orario){
								for(t in tipo){
									//inserisco un intestazione del tipo PRANZO - SECONDI
									text += tx.intestazione(orario[o] + " - " + tipo[t],3);
									//se non è disponibile nessun pasto (non dovrebbe accadere) mostro un semplice messaggio
									if (result.length == 0) text += tx.addRigaInterlinea('Nessun pasto trovato');
									//altrimenti creo una semplice tabella html con le primitive definite nel file text.js
									else{
										for(i in result){
											if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
												text += tx.addInterlinea();
												text += tx.openRiga();
												text += tx.openColonna(4);
												text += tx.addImg(result[i].fotopath);
												text += tx.closeColonna();
												text += tx.openColonna(3);
												text += tx.setDim(result[i].nome,4);
												text += tx.closeColonna();
												text += tx.openColonna(3);
												text += tx.setDim(result[i].descr,5);
												text += tx.closeColonna();
												text += tx.openColonna(2);
												text += tx.addInput('radio',tipo[t]+orario[o],result[i].toid);
												text += tx.closeColonna();
												text += tx.closeRiga();
												//se un dei piatti a cui l'utente è allergico coincide con quello scelto, aggiungo una riga di avvertimento
												for(a in allergie){
													if(allergie[a].id_menu == result[i].id_menu) text += tx.alertMessage('Contiene allergeni',red,5);
												}
											}
										}
									} 
								}
							}
							text += tx.addInterlinea();
							text += tx.formButton('Scegli!');
							text += tx.closeForm();
							bind.toFile('private/scegli.html',{
								tabella: text
							},function(data){
								res.writeHead(200, {'Content-Type': 'text/html'});
								res.end(data);
							});
						}
					});
				}
			});	
		} 
		//se era già stato selezionato un pasto per il giorno successivo inserisco un messaggio e la possibilità di rifare la prenotazione
		//cancellando quella precedente con il middleware /private/cancella
		else{
			bind.toFile('private/scegli.html',{
				tabella: 'Hai già effettuato la prenotazione per domani' + tx.link('/private/cancella',' - Eliminala e riscegli - ')
			},function(data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.end(data);
			});
		}
	});
});

//inserisce nel database le scelte fatte dall'utente nella scelta del menu per il giorno successivo
app.post('/private/insertScegli',function(req,res){
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
		if (err) res.redirect('/error');
		else res.redirect('/private/home');
	});
});

//middleware per rimuovere dal database tutte le prenotazioni fatte per l'indomani, quando l'utente dedice di volerle rifare
app.get('/private/cancella',function(req,res){
	db.launchQuery({
		text: 'delete from sceglie where id_utente = $1 and data::date = (now() + interval \'1 day\')::date',
		values: [req.session.user.id]
	}, function(err,result){
		if(err){
			res.redirect('/error');
			//rimando alla funzione per rieseguire la scelta dei piatti per il giorno seguente
		} else res.redirect('/private/choose');
	});
});

//mostra una lista di pasti consumati per il quale non è ancora stato rilasciato un voto.
//nel db il valore 0 indica ancora senza voto, mentre i valori da 1 a 5 indicano che il voto è stato registrato correttamente
app.get('/private/vota',function(req,res){
	db.launchQuery({
		text: 'select * from sceglie,menu,pasti where sceglie.id_utente = $1 and sceglie.voto = 0 and sceglie.id_menu = menu.id and menu.id_pasti = pasti.id order by data;',
		values: [req.session.user.id]
	}, function(err, result) {
		if (err) res.redirect('/error');
		else {
			//variabile di tipo stringa in cui memorizzo il testo che aggiungerà codice html al file vota.html
			//viene aggiunta un'intestazione e un form/tabella contenente i vari piatti consumati,
			//affiancati da un input radio per la scelta del voto
			//per i piatti ai quali l'utente non vuole ancora lasciare un giudizio si lascia il valore 0
			var text = '';
			text += tx.openRiga();
			text += tx.openColonna(3) + tx.setDim('Immagine',4) + tx.closeColonna();
			text += tx.openColonna(3) + tx.setDim('Nome e data',4) + tx.closeColonna();
			text += tx.openColonna(3) + tx.setDim('Descrizione',4) + tx.closeColonna();
			text += tx.openColonna(3) + tx.setDim('Voto',4) + tx.closeColonna();
			text += tx.closeRiga();

			text += tx.openForm('/private/addVoto','post');
			for(i in result.length){
				text += tx.addInterlinea();
				text += tx.openRiga();
				text += tx.openColonna(3);
				text += tx.addImg(result[i].fotopath);
				text += tx.closeColonna();
				text += tx.openColonna(3);
				text += tx.setDim(result[i].nome,4);
				text += tx.setDim(result[i].data.toDateString(),5);
				text += tx.setDim(result[i].tipo + ' - ' + result[i].orario,5);
				text += tx.closeColonna();
				text += tx.openColonna(3);
				text += tx.setDim(result[i].descr,5);
				text += tx.closeColonna();
				text += tx.openColonna(3);
				text += tx.addInputChecked('radio',result[i].id_menu,0) + tx.setDim('No vote',4) + tx.aCapo();
				text += tx.addInput('radio',result[i].id_menu,1) + tx.setDim('1',4) + tx.aCapo();
				text += tx.addInput('radio',result[i].id_menu,2) + tx.setDim('2',4) + tx.aCapo();
				text += tx.addInput('radio',result[i].id_menu,3) + tx.setDim('3',4) + tx.aCapo();
				text += tx.addInput('radio',result[i].id_menu,4) + tx.setDim('4',4) + tx.aCapo();
				text += tx.addInput('radio',result[i].id_menu,5) + tx.setDim('5',4) + tx.aCapo();
				text += tx.closeColonna();
				text += tx.closeRiga();			
			}
			text += tx.openRiga();
			text += tx.openColonna(4) + tx.closeColonna();
			text += tx.openColonna(4) + tx.formButton('Aggiungi Voti!') + tx.closeColonna();
			text += tx.openColonna(4) + tx.closeColonna();
			text += tx.closeRiga();
			text += tx.closeForm();

			bind.toFile('private/vota.html',{
				tabella: text
			},function(data){
				res.writeHead(200, {'Content-Type':'text/html'});
				res.end(data);
			})
		}
	});
});

//middleware che si occupa della registrazione dei voti sul database
//i voti vengono controllati perchè quelli con valore 0 non hanno senso ad riscritti uguali nel db
app.post('/private/addVoto',function(req,res){
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
	//lancio la serie di query con la funzione launchDeep query, 
	//che al termine di tutto il suo lavoro chiama la funzione passata come secondo argomento
	db.launchDeepInsert(query,0,function(err) {
		if (err) res.redirect('/error');
		else res.redirect('/private/vota');
	});
});

//middleware chiamato per aggiungere un'allergia dell'utente corrente sul database
app.post('/private/addAllergia', function(req,res){
	db.launchQuery({
		text: 'insert into intollerante (id_utente,id_allergie) values ($1,$2);',
		values: [req.session.user.id,parseInt(req.body.id_allergie)]
	}, function(err, result) {
		res.redirect('/private/allergie');
	});
});

//middleware chiamato per rimuovere un'allergia dell'utente corrente sul database
app.post('/private/removeAllergia', function(req,res){
	db.launchQuery({
		text: 'delete from intollerante where id_utente = $1 and id_allergie = $2;',
		values: [req.session.user.id,parseInt(req.body.id_allergie)]
	}, function(err, result) {
		if (err) res.redirect('/error');
		else res.redirect('/private/allergie');
	});
});

app.get('/private/allergie', function(req,res){
	//due variabili di tipo stringa per memorizzare le due parti di testo html che genero dinamicamente e che vanno aggiunte a gestisciAllergie.html
	var text1 = '';
	var text2 = '';
			
	db.launchQuery({
		//seleziono tutte le allergie dell'utente corrente
		text: 'select * from allergie, intollerante where intollerante.id_utente = $1 and allergie.id = intollerante.id_allergie;',
		values: [req.session.user.id]
	}, function(err, result) {
		if (err) res.redirect('/error');
		else {
			//parte di formattazione del testo html per la visualizzazione delle allergie. Ogni allergia sarà affiancata dal bottone per rimuoverla
			for(i = 0; i < result.length; i++){
				text1 += tx.openRiga();
				text1 += tx.openColonna(8) + tx.setDim(result[i].nome,4);
				text1 += tx.closeColonna();
				text1 += tx.openColonna(4) + tx.openForm('/private/removeAllergia','post');
				text1 += tx.addInputHidden('text','id_allergie',result[i].id);
				text1 += tx.formButton("Rimuovi");
				text1 += tx.closeForm();
				text1 += tx.closeColonna();
				text1 += tx.closeRiga();
			}
			text1 += tx.addInterlinea();
			//aggiungo un select-field per poter scegliere ed aggiungere una nuova allergia all'utente corrente
			db.launchQuery({
				text: 'select * from allergie;'
			}, function(err, result) {
				if (err) res.redirect('/error');
				else {
					for(i = 0; i < result.length; i++){
						text2 += tx.addOption(result[i].id,result[i].nome);
					}
					bind.toFile('private/gestisciAllergie.html',
					{
						tabella: text1,
						selezione: text2
					},
					function(data){
						res.writeHead(200, {'Content-Type':'text/html'});
						res.end(data);
					});
				}
			});
		}
	});
});

//middleware chiamato nel caso in cui un errore sia stato incontrato dagli altri middleware o dal database nell'elaborazione delle richieste
//la dichiarazione poteva essere inserita come statica in express ma in implementazioni future potrebbe 
//trasformarsi in un template per mostrare lo specifico errore anche all'utente
app.use('/error',function(req,res){
	res.sendFile('error_page.html',{ root : __dirname});
});

//metto in ascolto il sistema sulla porta precedentemente settata ed eseguo la funzione anonima per mostrare come accedere al sistema
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

