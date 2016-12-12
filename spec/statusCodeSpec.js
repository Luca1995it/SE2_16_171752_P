var request = require("request");
var bind = require('bind');

var base_url = "http://localhost:5000";
var allUrls = [];
allUrls.push('/');
allUrls.push('/login');
allUrls.push('/accedi');
allUrls.push('/home');
allUrls.push('/private/menuOggi');
allUrls.push('/private/menuSettimanale');
allUrls.push('/private/choose');
allUrls.push('/private/choose');
allUrls.push('/private/cancella');
allUrls.push('/private/vota');
allUrls.push('/private/addVoto');
allUrls.push('/private/addAllergia');
allUrls.push('/private/removeAllergia');
allUrls.push('/private/allergie');
allUrls.push('/error');


describe("Pasti Trentino Server", function() {
  	describe("Status code test suite", function() {
		for(u in allUrls){
    		it("returns status code 200", function(done) {
      			request.get(base_url+allUrls[u], function(error, response, body) {
        			expect(response.statusCode).toBe(200);
					done();
      			});
    		});
		}
  	});
});
