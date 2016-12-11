//a causa di un funzionamento anomalo della variabile d'ambiente DATABASE_URL, è stato memorizzato il link diretto al database nel file secret-config.json.
//in un vero progetto sarebbe opportuno aggiungere questo file alla lista dei file che git non sincronizza (in .gitignore).
var fileName = "./secret-config.json";
var config;
try {
  	config = require(fileName)
}
catch (err) {	//nel caso in cui secret-config.json sia inesistente o ci siano errori di sintassi, gestisco l'errore
  	config = {}
	console.log("unable to read file '" + fileName + "': ", err);
  	console.log("see secret-config-sample.json for an example");
}

//imposto connectionString come il link diretto al db
var connectionString = config.DATABASE_URL;
var pg = require('pg');

//funzione per eseguire una singola query
function launchQuery(queryString,callback){
	//connetto pg
	pg.connect(
		//link del database
		connectionString, 
		//funzione di callback eseguita alla fine della query
		function(err, client, done) {
		client.query(queryString, function(err, result) {
			//release the client back to the pool
			done();
			//gestisco errore chiamando subito la callback con error = true e result = null
			if (err){ 
				callback(true,null);
		  	}
			//altrimenti chiamo la callback con error = false e result = array delle righe risultate dalla query
		  	else {
				callback(false, result.rows);
		  	}
		});
  	});
}

//funzione ricorsiva per eseguire un array di query in sequenza. Ogni query è eseguita quando la precedente è stata completata.
//La funzione di callback è chiamata solamente quando tutte le query sono state eseguite correttamente o in caso di errore.
//Il caso base è riportato all'inizio: quando l'indice dell'array supera la lunghezza dell'array vuol dire che sono state eseguite tutte le query.
//Nell'implementazione attuale non permette di eseguire query che si aspettano un risultato di ritorno, ma solo query di tipo update/delete/insert
function launchDeepQuery(queryString,q,callback){
	if(q >= queryString.length){
		callback(false);
	} else{
		//connect to database
		pg.connect(
			//enviromental variable, set by heroku when first databse is created
			connectionString, 
			function(err, client, done) {
				//query
				client.query(queryString[q], function(err, result) {
					//release the client back to the pool
					done();

					if(err){
						callback(true);
					} else{
						launchDeepQuery(queryString,q+1,callback);
					}
				});
		});
	}
}

//esporto le due funzioni per poterle utilizzare all'esterno di questa classe
exports.launchQuery = launchQuery;
exports.launchDeepQuery = launchDeepQuery;


