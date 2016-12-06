//db_url if process.env.DATABASE_URL does not work
var connectionString = process.env.DATABASE_URL || 
	'postgres://keyivvkxtdtdvz:dtrZkEkbep1o7SjFYF9APp_T4F@ec2-54-235-177-45.compute-1.amazonaws.com:5432/d6dc0imrseapqc?ssl=true';

var pg = require('pg');

function lauchQuery(queryString,callback){
	//connect to database
	pg.connect(
		//enviromental variable, set by heroku when first databse is created
		connectionString, 
		function(err, client, done) {
		//query
		client.query(queryString, function(err, result) {
			//release the client back to the pool
			done();
			//manages err
			if (err){ 
				callback(true,null);
		  	}
		  	else {
				callback(false, result.rows);
		  	}
		});
  	});
}


exports.lauchQuery = lauchQuery;

