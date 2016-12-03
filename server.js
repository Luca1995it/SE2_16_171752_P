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

function pasto(id,tipo,orario,id_pasti,giorno,nome,descr,fotopath){
	this.id = id;
	this.tipo = tipo;
	this.orario = orario;
	this.id_pasti = id_pasti;
	this.giorno = giorno;
	this.nome = nome;
	this.descr = descr;
	this.fotopath = fotopath;
}

var express = require('express');

var bind = require('bind');

var db = require('./db.js');

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

//use sessions
app.use(session({ 
	//required, used to prevent tampering
	secret: 'string for the hash', 
	//set time of validity of cookies
	cookie: { maxAge: 60000 }
}));

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

	res.writeHead(200, {'Content-Type': 'text/html'});
	
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
				res.redirect('error_page.html');
		  	}
		  	else {
				if(result.rows.length>0){
					req.session.user = new utente(result.rows[0].id,result.rows[0].username,result.rows[0].password,result.rows[0].via);
					console.log("Logged user: " + req.session.user.username);
					res.redirect('/home');
				}
				else {
					bind.toFile('private/login.html',{
						messaggioErrore: "Username o password errati"
					}, function(data){
						res.end(data);
					});
				}
		  	}
			
		});
  	});
});

app.get('/private/menuOggi', function(req,res){
	
	res.writeHead(200, {'Content-Type': 'text/html'});
	
	//connect to database
	pg.connect(
		//enviromental variable, set by heroku when first databse is created
		connectionString, 
		function(err, client, done) {
		//query
		client.query({
			text: 'select * from menu natural join info where menu.giorno = $1',
			values: [(new Date()).getDay()]
		}, function(err, result) {
			//release the client back to the pool
			done();
			//manages err
			if (err){ 
				res.redirect('error_page.html');
		  	}
		  	else {
				bind.toFile('private/home.html',
					, 
					function(data){
						res.end(data);
					}
				);
			}
		});
  	});
});

app.get('/private/home', function(req,res){
	bind.toFile('private/home.html',
		req.session.username, 
		function(data){
			res.end(data);
		}
	);
});







app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

