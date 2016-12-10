'use strict';

var url = require('url');

var Default = require('./DefaultService');

module.exports.accediPOST = function accediPOST (req, res, next) {
	Default.accediPOST(req.body, req, res, next);
};

module.exports.privateAddAllergiaPOST = function privateAddAllergiaPOST (req, res, next) {
  	Default.privateAddAllergiaPOST(req.body, res, next);
};

module.exports.privateGET = function privateGET (req, res, next) {
  	Default.privateGET(req.body, res, next);
};

module.exports.privatePOST = function privatePOST (req, res, next) {
  	Default.privatePOST(req.body, res, next);
};

module.exports.privateGetAllergiaGET = function privateGetAllergiaGET (req, res, next) {
  	Default.privateGetAllergiaGET(req.body, res, next);
};

module.exports.privateGetMyallergiaGET = function privateGetMyallergiaGET (req, res, next) {
  	Default.privateGetMyallergiaGET(req.body, res, next);
};

module.exports.privateGetPastiDaVotareGET = function privateGetPastiDaVotareGET (req, res, next) {
  	Default.privateGetPastiDaVotareGET(req.body, res, next);
};

module.exports.privateGetPiattiGET = function privateGetPiattiGET (req, res, next) {
	if(isLogged(req)){
		Default.privateGetPiattiGET(req.body, req, res, next);
	}else{
		res.end(JSON.stringify({logged: false}));
	}
};

module.exports.privateGetPiattiSceltiGET = function privateGetPiattiSceltiGET (req, res, next) {
	if(isLogged(req)){
		Default.privateGetPiattiSceltiGET(req.body, req, res, next);
	}else{
		res.end(JSON.stringify({logged: false}));
	}
};

module.exports.privateGetPiattiChooseGET = function privateGetPiattiChooseGET (req, res, next) {
	if(isLogged(req)){
		Default.privateGetPiattiChooseGET(req.body,req,res,next);
	}else{
		res.end(JSON.stringify({logged: false}));
	}
}

module.exports.privateInsertSceltaPOST = function privateInsertSceltaPOST (req, res, next) {
	if(isLogged(req)){
		Default.privateInsertSceltaPOST(req.body, req, res, next);
	}else{
		res.end(JSON.stringify({logged: false}));
	}
}

	

module.exports.privateRemoveAllergiaPOST = function privateRemoveAllergiaPOST (req, res, next) {
  	Default.privateRemoveAllergiaPOST(req.body, res, next);
};


function isLogged(req){
	if(req.session.user != undefined) return true;
	else return false;
}
