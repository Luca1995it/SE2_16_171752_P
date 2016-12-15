var request = require("request");
var bind = require('bind');

//funzione generale per il testin via reguest get/post
function testStatusCodeRequest(method,statusCodeExpected,params,URL){
	if(!Array.isArray(statusCodeExpected)) statusCodeExpected = [statusCodeExpected];
	method = method.toLowerCase();
	it("returns status code in statusCodeExpected", function(done) {
		switch (method){
			case 'get':
				request.get(base_url+URL, function(error, response, body) {
					expect(statusCodeExpected).toContain(response.statusCode);
					done();
				});
				
				break;
				
			case 'post':
				request.post({
					headers: {'content-type' : 'application/x-www-form-urlencoded'},
					url: base_url+URL,
					form: params
				}, function(error, response, body) {
					expect(statusCodeExpected).toContain(response.statusCode);
					done();
				});
				
				break;
		}
	});
}

var base_url = "http://localhost:5000";
var allUrlsGET = [];
allUrlsGET.push('/');
allUrlsGET.push('/login');
allUrlsGET.push('/home');
allUrlsGET.push('/private/menuOggi');
allUrlsGET.push('/private/menuSettimanale');
allUrlsGET.push('/private/choose');
allUrlsGET.push('/private/choose');
allUrlsGET.push('/private/cancella');
allUrlsGET.push('/private/vota');
allUrlsGET.push('/private/allergie');

describe("Pasti Trentino Server", function() {
  	describe("Status code test suite for GET request", function() {
		for(u in allUrlsGET){
			testStatusCodeRequest('get',200,undefined,allUrlsGET[u]);
		}
  	});
});

describe("Pasti Trentino Server", function() {
  	describe("Status code test suite for error", function() {
		testStatusCodeRequest('get',406,undefined,'/error');
  	});
});

var parameter = [];
parameter.push({ username: 'admin',password: 'admin'});
parameter.push({ username: '',password: 'ciao'});
parameter.push({ username: '213456gsdrvq4wtrg35we4rgq34egr',password: '43tgatg3q4aqtg35er4drthgfrtyhgvfrtyhgfrtyh5aegt24q3gawred'});
parameter.push({ username: 'utente',password: 'password'});
parameter.push({ username: 123,password: 'ciao'});
parameter.push({ username: undefined ,password: undefined});
parameter.push({ username: null,password: null});


describe("Login test for multiple requests", function(){
	for(p in parameter){
		testStatusCodeRequest('post',[200,302],parameter[p],'/accedi');
	}
});


parameter = [];
parameter.push({id_allergie: '4'});
parameter.push({id_allergie: '-1'});
parameter.push({id_allergie: null});
parameter.push({id_allergie: undefined});
parameter.push({id_allergie: '10000'});
parameter.push({id_allergie: 4});
parameter.push({id_allergie: 'ciao'});


describe("Test di aggiunta di una allergia", function(){
	//login to test the private area
	request.post({
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url: base_url+'/accedi',
		form: { username: 'admin',password: 'admin'}
	}, function(error, response, body) {
	});
	
	for(p in parameter){
		 testStatusCodeRequest('post',[200,302],parameter[p],'/private/addAllergia');
	}
});
