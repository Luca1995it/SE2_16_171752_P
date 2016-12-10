'use strict';

var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var serverPort = 5000;
var express = require('express');
var app = express();
var session = require('express-session')

//funzione middleware per il json parsing
var bodyParser = require('body-parser');

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  // useStubs: process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
};

//use sessions
app.use(session({ 
	//richiesta, per prevenire manomissione dei cookie da parte degli utenti
	secret: 'string for the hash', 
	//tempo di vita dei cookie - 1 ora (in millisecondi)
	cookie: { maxAge: 60 * 60 * 1000 }
}));

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
	
	//Inserisco JSON e urlencoded parser come top-level middleware che faranno il parsing del body di ogni richiesta
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	
  	// Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  	app.use(middleware.swaggerMetadata());

  	// Validate Swagger requests
  	app.use(middleware.swaggerValidator());

  	// Route validated requests to appropriate controller
  	app.use(middleware.swaggerRouter(options));

  	// Serve the Swagger documents and Swagger UI
  	app.use(middleware.swaggerUi());
	
});

// For static resources
app.use(express.static('foto'));
app.use(express.static('assets'));
app.use(express.static('public'));

//directive to use port 5000
app.set('port', (process.env.PORT || 5000));

// Start the server
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});
