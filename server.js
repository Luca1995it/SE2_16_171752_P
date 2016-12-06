function utente(id,username,password,via){
		this.id = id;
		this.username = username;
		this.password = password;
		this.via = via;
	
		this.toString = function(){
			return 'Utente con id: ' + id + ', con nome: ' + username + ', con password: ' + password + ', che abita in via ' + via;
		}
}

var express = require('express');

var bind = require('bind');

var db = require('./db.js');
var tx = require('./text.js');

var app = express();

//connect DB libraries
var pg = require('pg');

//util libraries
var util = require('util');

//manages sessions
var session = require('express-session')

//db_url if process.env.DATABASE_URL does not work
var connectionString = process.env.DATABASE_URL || 
	'postgres://keyivvkxtdtdvz:dtrZkEkbep1o7SjFYF9APp_T4F@ec2-54-235-177-45.compute-1.amazonaws.com:5432/d6dc0imrseapqc?ssl=true';

//a middleware for json parsing
var bodyParser = require('body-parser');

/* This example demonstrates adding a generic 
JSON and urlencoded parser as a 
top-level middleware, which will parse 
the bodies of all incoming requests. This is the simplest setup. */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

app.use(express.static('assets'));
app.use(express.static('foto'));

//use sessions
app.use(session({ 
	//required, used to prevent tampering
	secret: 'string for the hash', 
	//set time of validity of cookies
	cookie: { maxAge: 60 * 60 * 1000 }
}));

app.use('/$',function(req,res){
	res.redirect('/private/home');
});

//funzione filtro per non autenticati
app.use('/private/*', function(req,res,next){
	if(req.session.user != undefined) next();
	
	else bind.toFile('private/login.html',{
		messaggioErrore: "Inserisci le tue credenziali"
	}, function(data){
		res.writeHead(200, {'Content-Type':'text/html'});
		res.end(data);
	})
});

//ritorno pagina di login
app.use('/login', function(req,res){
	bind.toFile('private/login.html',{
		messaggioErrore: "Inserisci le tue credenziali"
	}, function(data){
		res.writeHead(200, {'Content-Type':'text/html'});
		res.end(data);
	});
});		//ok

//funzione di autenticazione
app.post('/accedi', function(req,res){
	
	var query = { text: 'select * from utenti where username = $1 and password = $2',
			values: [req.body.username,req.body.password] }
	
	db.launchQuery(query, function(err,result){
		if(err){
			res.redirect('/error');
		}
		else if(result.length>0){
			req.session.user = new utente(result[0].id,result[0].username,result[0].password,result[0].via);
			console.log("Logged user: " + req.session.user.username);
			res.redirect('/private/home');
		}
		else {
			bind.toFile('private/login.html',{
				messaggioErrore: "Username o password errati"
			}, function(data){
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end(data);
			});
		}
	});
});	//ok

app.get('/private/home',function(req,res){		//ok
	bind.toFile('private/home.html',
		{},
		function(data){
			res.send(data);
	});
});	//ok

app.get('/private/menuOggi', function(req,res){
	res.writeHead(200, {'Content-Type': 'text/html'});

	var text = '';
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	db.launchQuery({
		text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id;',
		values: [req.session.user.id,(new Date()).getDay()]
	}, function(err,result) {
		if(err){
			res.redirect('/error');
		}
		else {
			
			//text += tx.intestazione(orario[o] + ' - ' + tipo[t],4);
			//if(result.length < 1){
			//	text += tx.intestazione('Nessun pasto selezionato',5);
			//} else text += tx.addRigaMenu(result);
			
			db.launchQuery({
				text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
				values: [req.session.user.id]
			}, function(err,allergie){
				if(err){
					res.redirect('/error');
				} else{
					for(o in orario){
						for(t in tipo){
							var least = false;
							text += tx.intestazione(orario[o] + " - " + tipo[t]);
							for(i in result){
								if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
									least = true;
									text += tx.addInterlinea();
									text += tx.addRiga(result[i]);
									for(a in allergie){
										if(allergie[a].id_menu == result[i].id_menu) text += tx.alertMessage('Contiene allergeni',red,5);
									}
								}
							}
							if(!least) text += tx.addRigaInterlinea('Nessun pasto trovato');
						}
					}
					bind.toFile('private/menuOggi.html',{
						tabella: text
					},function(data){
						res.end(data);
					});
				}
			});
		}
	});		
});	//ok

app.get('/private/choose', function(req,res){
	

	var text = '';
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	
	db.launchQuery({
		text: 'select count(*) as num from sceglie where id_utente = $1 and data = now() + interval \'1 day\'',
		values: [req.session.user.id]
	}, function(err,ret){
		console.log(ret);
		if(err){
			res.redirect('/error');
		}
		if(parseInt(ret[0].num) == 0){
			db.launchQuery({
				text: 'select *, menu.id as toid from menu, pasti where giorno = extract(DOW FROM now() + interval \'1 day\') and menu.id_pasti = pasti.id;'
			}, function(err,result) {
				if(err){
					res.redirect('/error');
				}
				else {

					db.launchQuery({
						text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
						values: [req.session.user.id]
					}, function(err,allergie){
						if(err){
							res.redirect('/error');
						} else{
							text += tx.openForm('/private/insertScegli','post');
							for(o in orario){
								for(t in tipo){
									var least = false;
									text += tx.intestazione(orario[o] + " - " + tipo[t],3);
									for(i in result){
										if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
											least = true;
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

											for(a in allergie){
												if(allergie[a].id_menu == result[i].id_menu) text += tx.alertMessage('Contiene allergeni',red,5);
											}
										}
									}
									if (!least) text += tx.addRigaInterlinea('Nessun pasto trovato');
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
		} else{
			bind.toFile('private/scegli.html',{
				tabella: 'Hai già effettuato la prenotazione per domani' + tx.link('/private/cancella',Rifalla)
			},function(data){
				res.end(data);
			});
		}
	});
});

app.post('/private/insertScegli',function(req,res){
	console.log(req.body);
	var query = [];
	for(c in req.body){
		console.log(c);
		query.push({
			text: 'insert into sceglie (id_utente,id_menu,data) values ($1,$2,$3)',
			values: [req.session.user.id,parseInt(req.body[c]),(new Date())]
		});
	}
	db.launchDeepQuery(query,0,function(err) {
		if (err) res.redirect('/error');
		else res.redirect('/private/home');
	});
});

app.get('/private/cancella',function(req,res){
	db.launchQuery({
		text: 'delete from sceglie where id_utente = $1 and data = now() + interval \'1 day\''
	}, function(err,result){
		if(err){
			res.redirect('/error');
		} else res.redirect('/private/choose');
	});
});

app.get('/private/prova',function(req,res){
	
	var pgClient = new pg.Client(connectionString);
	pgClient.connect();
	var query = pgClient.query("SELECT * from sceglie;");
});

app.get('/private/vota',function(req,res){
	pg.connect(
		connectionString, 
		function(err, client, done) {

			client.query({
				text: 'select * from sceglie,menu,pasti where sceglie.id_utente = $1 and sceglie.voto = 0 and sceglie.id_menu = menu.id and menu.id_pasti = pasti.id order by data;',
				values: [req.session.user.id]
			}, function(err, result) {
				done();
				if (err) res.redirect('/error');
		  		else {
					var text = '';
					text += '<div class=\"row\">';
					text += '<div class=\"col-md-3\"><h4>Immagine</h4></div>';
					text += '<div class=\"col-md-3\"><h4>Nome e Data</h4></div>';
					text += '<div class=\"col-md-3\"><h4>Descrizione</h4></div>';
					text += '</div>';
					
					text += '<form action=\"/private/addVoto\" method=\"post\">';
					for(i = 0; i < result.rows.length; i++){
						var row = result.rows[i];
						text += '<div class=\"row\">';
						text += '<div class=\"col-md-3\">';
						text += '<img src=\"' + row.fotopath + '\" alt=\"immagine non disponibile\">';
						text += '</div>';
						text += '<div class=\"col-md-3\">';
						text += '<h4>' + row.nome +'</h4><br>';
						text += '<h5>' + row.data.toDateString() + '</h5>';
						text += '<h5>' + row.tipo + ' - ' + row.orario + '</h5>';
						text += '</div>';
						text += '<div class=\"col-md-3\">';
						text += '<h4>' + row.descr +'</h4>';
						text += '</div>';
						text += '<div class=\"col-md-3\">';
						text += '<input type=\"radio\" name=\"' + row.id_menu + '\" value=\"' + 0 + '\" checked>' + 'No vote' + ' |';
						text += '<input type=\"radio\" name=\"' + row.id_menu + '\" value=\"' + 1 + '\">' + 1 + ' |';
						text += '<input type=\"radio\" name=\"' + row.id_menu + '\" value=\"' + 2 + '\">' + 2 + ' |';
						text += '<input type=\"radio\" name=\"' + row.id_menu + '\" value=\"' + 3 + '\">' + 3 + ' |';
						text += '<input type=\"radio\" name=\"' + row.id_menu + '\" value=\"' + 4 + '\">' + 4 + ' |';
						text += '<input type=\"radio\" name=\"' + row.id_menu + '\" value=\"' + 5 + '\">' + 5;
						text += '</div>';
						text += '</div>';
						text += '<div class=\"row\"><hr></div>';	//riga di separazione
					}
					text += '<div class=\"row\">';
					text += '<div class=\"col-md-4\"></div>';
					text += '<div class=\"col-md-4\"><button type=\"submit\">Aggiungi Voti!</button></div>';
					text += '<div class=\"col-md-4\"></div>';
					text += '</div>';
					text += '</form>';
					
					bind.toFile('private/vota.html',{
						tabella: text
					},function(data){
						res.end(data);
					})
				}
			});
	});
});

app.post('/private/addVoto',function(req,res){
	var query = [];
	for(var c in req.body){
		if(parseInt(req.body[c])!=0){
			query.push({
				text: 'update sceglie set voto = $1 where id_utente = $2 and id_menu = $3',
				values: [parseInt(req.body[c]),req.session.user.id,parseInt(c)]
			});
		}
	}
	db.launchSerialInsert(query, function(err) {
		if (err) res.redirect('/error');
	});
	res.redirect('/private/vota');
});

app.post('/private/addAllergia', function(req,res){
	db.launchQuery({
		text: 'insert into intollerante (id_utente,id_allergie) values ($1,$2);',
		values: [req.session.user.id,parseInt(req.body.id_allergie)]
	}, function(err, result) {
		done();
		if (err) res.redirect('/error');
		else res.redirect('/private/allergie');
	});
});

app.post('/private/removeAllergia', function(req,res){
	db.launchQuery({
		text: 'delete from intollerante where id_utente = $1 and id_allergie = $2;',
		values: [req.session.user.id,parseInt(req.body.id_allergie)]
	}, function(err, result) {
		done();
		if (err) res.redirect('/error');
		else res.redirect('/private/allergie');
	});
});

app.get('/private/allergie', function(req,res){
	//connect to database
	pg.connect(
		connectionString, 
		function(err, client, done) {
			var text1 = '';
			var text2 = '';
			
			client.query({
				text: 'select * from allergie, intollerante where intollerante.id_utente = $1 and allergie.id = intollerante.id_allergie;',
				values: [req.session.user.id]
			}, function(err, result) {
				done();
				if (err) res.redirect('/error');
		  		else {
					for(i = 0; i < result.rows.length; i++){
						text1 += '<div class=\"row\">';
						text1 += '<div class=\"col-md-8\">' + result.rows[i].nome + '</div>';
						text1 += '<div class=\"col-md-4\"><form action=\"/private/removeAllergia\" method=\"post\">';
						text1 += '<input type=\"text\" hidden name=\"id_allergie\" value=\"' + result.rows[i].id + '\"/>';
						text1 += '<button type=\"submit\">Rimuovi</button>';
						text1 += '</form></div>';
						text1 += '</div>';
					}
				}
			});
			
			client.query({
				text: 'select * from allergie;'
			}, function(err, result) {
				done();
				if (err) res.redirect('/error');
		  		else {
					for(i = 0; i < result.rows.length; i++){
						text2 += '<option value=\"' + result.rows[i].id + '\">' + result.rows[i].nome + '</option>';
					}
					bind.toFile('private/gestisciAllergie.html',
						{
							tabella: text1,
							selezione: text2
						},
						function(data){
							res.send(data);
					});
				}
			});
	});
});

app.use('/error',function(req,res){
	bind.toFile('error_page.html',{},function(data){ res.send(data); });
});



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

