'use strict';

var db = require('./database.js');

var oj = require('./oggetti.js');

exports.accediPOST = function(args, req, res, next) {
	var query = { text: 'select * from utenti where username = $1 and password = $2',
		//grazie a body-parser, accedere ai campi del form è davvero semplice: req.body.nome_dell_input
		values: [args.username,args.password]
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
			req.session.user = new oj.utente(result[0].id,result[0].username,result[0].via);
			res.end(JSON.stringify({res: true}));
		}
		//infine, se utente e password erano errati, rimando al login con un messaggio 
		else {
			res.end(JSON.stringify({res: false}));
		}
	});
}

exports.privateAddAllergiaPOST = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
  // no response value expected for this operation
  res.end();
}

exports.privateGetAllergiaGET = function(args, res, next) {
	
}

exports.privateGetMyallergiaGET = function(args, res, next) {

}

exports.privateGetPastiDaVotareGET = function(args, res, next) {

}

exports.privateGetPiattiGET = function(args, req,  res, next) {
	//lancio la query per estrarre i piatti scelti per il giorno in questione
	db.launchQuery({
		text: 'select * from menu,pasti where menu.id_pasti = pasti.id;'
	}, function(err,result) {
		if(err){
			res.end(JSON.stringify({logged: true, error:true}));
		}
		else {
			//lancio una seconda query per estrarre tutti i menù a cui l'utente è allergico
			db.launchQuery({
				text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
				values: [req.session.user.id]
			}, function(err,allergie){
				if(err){
					res.end(JSON.stringify({logged: true, error:true}));
				} else {
					res.end(JSON.stringify(
						{
							logged: true, error: false,
							res: result, allergie: allergie
						})
					);	
				}
			});
		}
	});		
}

exports.privateGetPiattiChooseGET = function(args, req, res, next){
	//prima di tutto controllo che l'utente non avesse già effettuato l'ordine con la seguente query
	db.launchQuery({
		text: 'select count(*) as num from sceglie where id_utente = $1 and data::date = (now() + interval \'1 day\')::date',
		values: [req.session.user.id]
	}, function(err,ret){
		if(err){
			res.end(JSON.stringify({logged: true, error:true}));
		}
		//se non è ancora stato selezionato nessun pasto per domani
		db.launchQuery({
			text: 'select *, menu.id as toid from menu, pasti where giorno = extract(DOW FROM now()) and menu.id_pasti = pasti.id;'
		}, function(err,result) {
			if(err){
				res.end(JSON.stringify({logged: true, error:true}));
			}
			else {
				//cerco eventali piatti a cui l'utente potrebbe essere allergico
				db.launchQuery({
					text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
					values: [req.session.user.id]
				}, function(err,allergie){
					if(err){
						res.end(JSON.stringify({logged: true, error:true}));
					} else{
						if(parseInt(ret[0].num) == 0){
							res.end(JSON.stringify({
								logged: true,
								error: false,
								justChoosed: false,
								res: result,
								allergie: allergie
							}));
						} else {
							res.end(JSON.stringify({
								logged: true,
								error: false,
								justChoosed: true,
								res: result,
								allergie: allergie
							}));
						}
					}
				});
			}
		});	
	});
}

exports.privateGetPiattiSceltiGET = function(args, req, res, next){
	//lancio la query per estrarre i piatti scelti per oggi
	db.launchQuery({
		text: 'select * from (select * from (select * from utenti natural join sceglie where utenti.id = $1 and sceglie.data = now()) as res, menu where res.id_menu = menu.id and giorno = $2) as x, pasti where x.id_pasti = pasti.id;',
		values: [req.session.user.id,(new Date()).getDay()]
	}, function(err,result) {
		if(err){
			res.end(JSON.stringify({logged: true, error:true}));
		}
		else {
			//lancio una seconda query per estrarre tutti i menù a cui l'utente è allergico
			db.launchQuery({
				text: 'select contiene.id_menu from intollerante, contiene where intollerante.id_utente = $1 and intollerante.id_allergie = contiene.id_allergie;',
				values: [req.session.user.id]
			}, function(err,allergie){
				if(err){
					res.end(JSON.stringify({logged: true, error:true}));
				} else{
					console.log(result);
					console.log(allergie);
					res.end(JSON.stringify(
						{
							logged: true, error: false,
							res: result, allergie: allergie
						})
					);	
				}
			});
		}
	});
}

exports.privateInsertSceltaPOST = function(args, req, res, next) {
	var idList = JSON.parse(args.list);
	var queryList = [];
	queryList.push({
		text: 'delete from sceglie where id_utente = $1 and data::date = (now() + interval \'1 day\')::date',
		values: [req.session.user.id]
	});
	for(var i in idList){
		queryList.push({
			text: 'insert into sceglie (id_utente,id_menu,data) values ($1,$2,now() + interval \'1 day\')',
			values: [req.session.user.id,parseInt(idList[i])]
		});
	}
	//lancio le query dicendo di partire dalla prima (0) nell'array e di eseguire, una volta terminato, la funzione come secondo paramentro
	db.launchDeepQuery(queryList,0,function(err) {
		if (err) res.end(JSON.stringify({error:true}));
		else res.end(JSON.stringify({error:false}));
	});
}

exports.privateRemoveAllergiaPOST = function(args, res, next) {

}
