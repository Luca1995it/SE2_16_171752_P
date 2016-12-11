var request = require("request");

var base_url = "http://localhost:5000/"

describe("Hello World Server", function() {
	describe("GET /", function() {
    	it("returns status code 200", function() {
      		request.get(base_url, function(error, response, body) {
				console.log('testing');
        		expect(response.statusCode).toBe(300);
				done();
			});
    	});
  	});
});