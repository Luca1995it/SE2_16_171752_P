function utente(id,username,password,via){
		this.id = id;
		this.username = username;
		this.password = password;
		this.via = via;
	
		this.toString = function(){
			return 'Utente con id: ' + id + ', con nome: ' + username + ', con password: ' + password + ', che abita in via ' + via;
		}
}

function allergia(nome){
	this.nome = nome;
}

function pasto(id,tipo,orario,giorno,nome,descr,fotopath){
	this.id = id;
	this.tipo = tipo;
	this.orario = orario;
	this.giorno = giorno;
	this.nome = nome;
	this.descr = descr;
	this.fotopath = fotopath;
}

var express = require('express');

var bind = require('bind');


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
	cookie: { maxAge: 60000 }
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
});

//funzione di autenticazione
app.post('/accedi', function(req,res){
	var username = req.body.username;
	var password = req.body.password;
	
	//connect to database
	pg.connect(
		//enviromental variable, set by heroku when first databse is created
		connectionString, 
		function(err, client, done) {
		//query
		client.query({
			text: 'select * from utenti where username = $1 and password = $2',
			values: [username,password]
		}, function(err, result) {
			//release the client back to the pool
			done();
			//manages err
			if (err){ 
				res.redirect('/error');
		  	}
		  	else {
				if(result.rows.length>0){
					req.session.user = new utente(result.rows[0].id,result.rows[0].username,result.rows[0].password,result.rows[0].via);
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
		  	}
			
		});
  	});
});

app.get('/private/home',function(req,res){
	bind.toFile('private/home.html',
		{},
		function(data){
			res.send(data);
	});
});

app.get('/private/menuOggi', function(req,res){
	res.writeHead(200, {'Content-Type': 'text/html'});
	//connect to database
	pg.connect(
		connectionString, 
		function(err, client, done) {
		var text = '';
			
		client.query({
			text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id and orario = $3 and tipo = $4;',
			values: [req.session.user.id,(new Date()).getDay(),'pranzo','primo']
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				text += '<div class=\"row\"><h3>Pranzo - Primi</h3></div>';
				if(result.rows.length < 1){
					text += '<div class=\"row\">Nessun pasto selezionato</div>'
				} else text += addRiga(result);
			}
		});
			
		client.query({
			text: 'select count(*) as risultato from (select contiene.id_allergie from (select res.id_menu from (select id_menu from sceglie where sceglie.id_utente = $1) as res, menu where res.id_menu = menu.id and giorno = $2 and orario = $3 and tipo = $4) as foo, contiene where foo.id_menu = contiene.id_menu) as pippo, intollerante where pippo.id_allergie = intollerante.id_allergie and id_utente = $5;',
			values: [req.session.user.id,(new Date()).getDay(),'pranzo','primo',req.session.user.id]
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				if(result.rows[0].risultato > 0){
					text += '<div class=\"row\"><h4 style=\"color: red\">Contiene allergeni !</h4></div>';
				}
			}
		});
			
		client.query({
			text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id and orario = $3 and tipo = $4;',
			values: [req.session.user.id,(new Date()).getDay(),'pranzo','secondo']
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				text += '<div class=\"row\"><h3>Pranzo - Secondi</h3></div>';
				if(result.rows.length < 1){
					text += '<div class=\"row\">Nessun pasto selezionato</div>'
				} else text += addRiga(result);
			}
		});
			
		client.query({
			text: 'select count(*) as risultato from (select contiene.id_allergie from (select res.id_menu from (select id_menu from sceglie where sceglie.id_utente = $1) as res, menu where res.id_menu = menu.id and giorno = $2 and orario = $3 and tipo = $4) as foo, contiene where foo.id_menu = contiene.id_menu) as pippo, intollerante where pippo.id_allergie = intollerante.id_allergie and id_utente = $5;',
			values: [req.session.user.id,(new Date()).getDay(),'pranzo','secondo',req.session.user.id]
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				if(result.rows[0].risultato > 0){
					text += '<div class=\"row\"><h4 style=\"color: red\">Contiene allergeni !</h4></div>';
				}
			}
		});
			
		client.query({
			text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id and orario = $3 and tipo = $4;',
			values: [req.session.user.id,(new Date()).getDay(),'pranzo','contorno']
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				text += '<div class=\"row\"><h3>Pranzo - Contorni</h3></div>';
				if(result.rows.length < 1){
					text += '<div class=\"row\">Nessun pasto selezionato</div>'
				} else text += addRiga(result);
			}
		});
			
		client.query({
			text: 'select count(*) as risultato from (select contiene.id_allergie from (select res.id_menu from (select id_menu from sceglie where sceglie.id_utente = $1) as res, menu where res.id_menu = menu.id and giorno = $2 and orario = $3 and tipo = $4) as foo, contiene where foo.id_menu = contiene.id_menu) as pippo, intollerante where pippo.id_allergie = intollerante.id_allergie and id_utente = $5;',
			values: [req.session.user.id,(new Date()).getDay(),'pranzo','contorno',req.session.user.id]
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				if(result.rows[0].risultato > 0){
					text += '<div class=\"row\"><h4 style=\"color: red\">Contiene allergeni !</h4></div>';
				}
			}
		});
			
		client.query({
			text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id and orario = $3 and tipo = $4;',
			values: [req.session.user.id,(new Date()).getDay(),'cena','primo']
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				text += '<div class=\"row\"><h3>Cena - Primi</h3></div>';
				if(result.rows.length < 1){
					text += '<div class=\"row\">Nessun pasto selezionato</div>'
				} else text += addRiga(result);
			}
		});
			
		client.query({
			text: 'select count(*) as risultato from (select contiene.id_allergie from (select res.id_menu from (select id_menu from sceglie where sceglie.id_utente = $1) as res, menu where res.id_menu = menu.id and giorno = $2 and orario = $3 and tipo = $4) as foo, contiene where foo.id_menu = contiene.id_menu) as pippo, intollerante where pippo.id_allergie = intollerante.id_allergie and id_utente = $5;',
			values: [req.session.user.id,(new Date()).getDay(),'cena','primo',req.session.user.id]
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				if(result.rows[0].risultato > 0){
					text += '<div class=\"row\"><h4 style=\"color: red\">Contiene allergeni !</h4></div>';
				}
			}
		});
			
		client.query({
			text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id and orario = $3 and tipo = $4;',
			values: [req.session.user.id,(new Date()).getDay(),'cena','secondo']
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				text += '<div class=\"row\"><h3>Cena - Secondi</h3></div>';
				if(result.rows.length < 1){
					text += '<div class=\"row\">Nessun pasto selezionato</div>'
				} else text += addRiga(result);
			}
		});
			
		client.query({
			text: 'select count(*) as risultato from (select contiene.id_allergie from (select res.id_menu from (select id_menu from sceglie where sceglie.id_utente = $1) as res, menu where res.id_menu = menu.id and giorno = $2 and orario = $3 and tipo = $4) as foo, contiene where foo.id_menu = contiene.id_menu) as pippo, intollerante where pippo.id_allergie = intollerante.id_allergie and id_utente = $5;',
			values: [req.session.user.id,(new Date()).getDay(),'cena','secondo',req.session.user.id]
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				if(result.rows[0].risultato > 0){
					text += '<div class=\"row\"><h4 style=\"color: red\">Contiene allergeni !</h4></div>';
				}
			}
		});
			
		client.query({
			text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id and orario = $3 and tipo = $4;',
			values: [req.session.user.id,(new Date()).getDay(),'cena','contorno']
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				text += '<div class=\"row\"><h3>Cena - Contorni</h3></div>';
				if(result.rows.length < 1){
					text += '<div class=\"row\">Nessun pasto selezionato</div>'
				} else text += addRiga(result);
			}
		});

		client.query({
			text: 'select count(*) as risultato from (select contiene.id_allergie from (select res.id_menu from (select id_menu from sceglie where sceglie.id_utente = $1) as res, menu where res.id_menu = menu.id and giorno = $2 and orario = $3 and tipo = $4) as foo, contiene where foo.id_menu = contiene.id_menu) as pippo, intollerante where pippo.id_allergie = intollerante.id_allergie and id_utente = $5;',
			values: [req.session.user.id,(new Date()).getDay(),'cena','contorno',req.session.user.id]
		}, function(err, result) {
			done();
			if (err) res.redirect('/error');
		  	else {
				if(result.rows[0].risultato > 0){
					text += '<div class=\"row\"><h4 style=\"color: red\">Contiene allergeni !</h4></div>';
				}
				bind.toFile('private/menuOggi.html',
					{
						tabella: text
					}, function(data){
						res.end(data);
					}		
				);
			}
		});
  	});
});

app.get('/private/choose', function(req,res){
	pg.connect(
		connectionString, 
		function(err, client, done) {

			client.query({
				text: 'select data from sceglie where data BETWEEN NOW() AND now() + INTERVAL \'7 DAY\' and id_utente = $1 group by data;',
				values: [req.session.user.id]
			}, function(err, result) {
				done();
				if (err) res.redirect('/error');
		  		else {
					var date = [];
					for(i = 0; i < result.rows.length; i++){
						date.push(result.rows[i].data);
					}
					
				}
			});
	});
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
					text += '<form action=\"/private/addVoti\" method=\"post\">';
					for(i = 0; i < result.rows.length; i++){
						var row = result.rows[i];
						text += '<div class=\"row\">';
						text += '<div class=\"col-md-3\">';
						text += '<img src=\"' + row.fotopath + '\" alt=\"immagine non disponibile\">';
						text += '</div>';
						text += '<div class=\"col-md-3\">';
						text += '<h4>' + row.nome +'</h4>';
						text += '</div>';
						text += '<div class=\"col-md-3\">';
						text += '<h4>' + row.descr +'</h4>';
						text += '</div>';
						text += '<div class=\"col-md-3\">';
						text += '<input type=\"radio\" name=\"' + 'voto' + i + '\" value=\"' + 0 + '\">' + 'No vote' + ' |';
						text += '<input type=\"radio\" name=\"' + 'voto' + i + '\" value=\"' + 1 + '\">' + 1 + ' |';
						text += '<input type=\"radio\" name=\"' + 'voto' + i + '\" value=\"' + 2 + '\">' + 2 + ' |';
						text += '<input type=\"radio\" name=\"' + 'voto' + i + '\" value=\"' + 3 + '\">' + 3 + ' |';
						text += '<input type=\"radio\" name=\"' + 'voto' + i + '\" value=\"' + 4 + '\">' + 4 + ' |';
						text += '<input type=\"radio\" name=\"' + 'voto' + i + '\" value=\"' + 5 + '\">' + 5 + ' |';
						text += '</div>';
						text += '</div>';
					}
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

app.post('/private/addAllergia', function(req,res){
	pg.connect(
		connectionString, 
		function(err, client, done) {

			client.query({
				text: 'insert into intollerante (id_utente,id_allergie) values ($1,$2);',
				values: [req.session.user.id,parseInt(req.body.id_allergie)]
			}, function(err, result) {
				done();
				if (err) res.redirect('/error');
		  		else {
					res.redirect('/private/allergie');
				}
			});
	});
});

app.post('/private/removeAllergia', function(req,res){
	pg.connect(
		connectionString, 
		function(err, client, done) {

			client.query({
				text: 'delete from intollerante where id_utente = $1 and id_allergie = $2;',
				values: [req.session.user.id,parseInt(req.body.id_allergie)]
			}, function(err, result) {
				done();
				if (err) res.redirect('/error');
		  		else {
					res.redirect('/private/allergie');
				}
			});
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

function addRiga(result){
	var text = '';
	for(i = 0; i < result.rows.length; i++){
		var row = result.rows[i];
		text += '<div class=\"row\">';
		text += '<div class=\"col-md-4\">';
		text += '<img src=\"' + row.fotopath + '\" alt=\"immagine non disponibile\">';
		text += '</div>';
		text += '<div class=\"col-md-4\">';
		text += '<h4>' + row.nome +'</h4>';
		text += '</div>';
		text += '<div class=\"col-md-4\">';
		text += '<h4>' + row.descr +'</h4>';
		text += '</div>';
		text += '</div>';
	}
	return text;
}




app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

