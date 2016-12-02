var express = require('express');

var bind = require('bind');

var db = require('./db.js');

var app = express();
app.set('port', (process.env.PORT || 5000));


app.get('/add', function(req,res){
	if(db.addUtente('ciao','maiale23','largo rospi 4')){
		res.send("Tutto biene");
	} else res.send('Bene un casso');
});







app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

