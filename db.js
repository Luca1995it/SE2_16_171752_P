//file per query su db (postgres)

//connect DB libraries
var pg = require('pg');

//util libraries
var util = require('util');

/* standard query form
//connect to database
	pg.connect(
		process.env.DATABASE_URL, 
		function(err, client, done) {
		client.query('SELECT * FROM test_table', function(err, result) {
			done();
			
			if (err){ 
				//onError
				console.error(err); 
		  	}
		  	else {
				//onSuccess
		  	}
		});
  	});
*/

function addUtente(username, password, via){
	var connectionString = 'postgres://keyivvkxtdtdvz:dtrZkEkbep1o7SjFYF9APp_T4F@ec2-54-235-177-45.compute-1.amazonaws.com:5432/d6dc0imrseapqc?ssl=true';
	
	console.log("Connection to: " + connectionString);
	pg.connect(connectionString, 
		function(err, client, done) {
			
			client.query({
				text: 'insert into utenti (username,password,via) values ($1,$2,$3)',
				values: [username,password,via]
			}, 
			function(err, result) {
				done();
			
				if (err){
				//onError
					console.error('Error adding new user to db: ' + err); 
					return false;
		  		}
		  		else {
					console.log('added ' + result);
		  		}
			});
  		}
	);
	return true;
}


function removeUtente(id){
	pg.connect(
		process.env.DATABASE_URL, 
		function(err, client, done) {
			
			var query = 'DELETE FROM UTENTI WHERE ID = ' + id;
			client.query(query, 
						function(err, result) {
							done();
			
							if (err){ 
								//onError
								console.error('Error removin user from db: ' + err); 
		  					}
		  					else {
								return true;
		  					}
						}
			);
  		}
	);
}


function addScelta(id_utente, id_menu){
	pg.connect(
		process.env.DATABASE_URL, 
		function(err, client, done) {
			
			var query = 'INSERT INTO SCEGLIE (ID_UTENTE,ID_MENU) VALUES (' + id_utente + ',' + id_menu + ')';
			client.query(query, 
						function(err, result) {
							done();
			
							if (err){ 
								//onError
								console.error('Error adding scelta to db: ' + err); 
		  					}
		  					else {
								return true;
		  					}
						}
			);
  		}
	);
}


exports.addUtente = addUtente;
exports.addScelta = addScelta;
exports.removeUtente = removeUtente;