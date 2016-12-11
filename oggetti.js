//classe utente, utilizzata per memorizzare un utente nella sessione e permettere di accedere ad aree private
exports.utente = function utente(id,username,via){
		this.id = id;
		this.username = username;
		this.via = via;
	
		this.toString = function(){
			return 'Utente con id: ' + id + ', con nome: ' + username + ', che abita in via ' + via;
		}
}