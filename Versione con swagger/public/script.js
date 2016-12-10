$( document ).ready(function() {
    hidePrivate();
});

function login(message){
	message = message || 'Inserisci utente e password';
	$('#contenuto').html(message);
	$('#login1').show();
}

function accedi(){
	var username = $('#username').val();
	var password = $('#password').val();
	$.ajax({
		type: 'post',
		url: '/accedi',
		data: {
			username: username,
			password: password
		},
		success: function(res){
			if(res.res){
				$('#contenuto').html('Accesso effettuato con successo');
				showPrivate(); 
				$('#login1').hide();
			} else {
				login('Utente o password errati');
			}
		},
		dataType: 'json'
	});
}

function caricaEdu(){
	$.ajax({
		type: 'get',
		url: '/edu.html',
		success: function(data){
			$('#contenuto').html(data);
		}
	});
}

function caricaNotizie(){
	$.ajax({
		type: 'get',
		url: '/notizie.html',
		success: function(data){
			$('#contenuto').html(data);
		}
	});
}

function caricaCuriosita(){
	$.ajax({
		type: 'get',
		url: '/curiosita.html',
		success: function(data){
			$('#contenuto').html(data);
		}
	});
}

function menuOggi(){
	$.ajax({
		type: 'get',
		url: '/private/getPiattiScelti',
		dataType: 'json',
		success: function(data){
			var text = '';
			if(!data.error){
				var orario = ['pranzo','cena'];
				var tipo = ['primo','secondo','contorno'];
				var result = data.res;
				
				if(result.length==0){
					text += intestazione('Nessun pasto per oggi');
				} else {
					for(o in orario){
						for(t in tipo){
							text += aCapo();
							text += intestazione(orario[o] + " - " + tipo[t]);
							for(i in result){
								if(result[i].tipo == tipo[t] && result[i].orario == orario[o] && result[i].giorno == giorni[g]){
									console.log("Add");	
									text += lineMenu(result[i]);
								}
							}
						}
						text += aCapo();
						text += aCapo();
					}
				}
				
			} else text += 'There was and error';
			$('#contenuto').html(text);	
		}
	});
}

function menuSettimana(){
	$.ajax({
		type: 'get',
		url: '/private/getPiatti',
		dataType: 'json',
		success: function(data){
			var text = '';
			if(!data.error){
				var giorni = [0,1,2,3,4,5,6];
				var orario = ['pranzo','cena'];
				var tipo = ['primo','secondo','contorno'];
				var result = data.res;
				
				for(g in giorni){
					text += intestazione(getStringDay(g));
					for(o in orario){
						for(t in tipo){
							text += aCapo();
							text += intestazione(orario[o] + " - " + tipo[t]);
							for(i in result){
								if(result[i].tipo == tipo[t] && result[i].orario == orario[o] && result[i].giorno == giorni[g]){
									console.log("Add");	
									text += lineMenu(result[i]);
								}
							}
						}
					}
					text += aCapo();
					text += aCapo();
				}
				
			} else text += 'There was and error';
			$('#contenuto').html(text);	
		}
	});
}

function choose(){
	$.ajax({
		type: 'get',
		url: '/private/getPiattiChoose',
		dataType: 'json',
		success: function(data){
			var text = '';
			if(!data.error){
				if(data.justChoosed){
					text += setColor(setDim('Hai già effettuato una scelta per domani, continuando essa verrà sovrascritta!',3),'red');
				}
				
				var orario = ['pranzo','cena'];
				var tipo = ['primo','secondo','contorno'];
				var result = data.res;
				console.log(data);
				if(result.length==0){
					text += intestazione('Nessun pasto per oggi');
				} else {
					for(o in orario){
						for(t in tipo){
							text += aCapo();
							text += intestazione(orario[o] + " - " + tipo[t]);
							for(i in result){
								if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
									text += lineMenuCH(result[i]);
								}
							}
						}
						text += aCapo();
						text += aCapo();
					}
				}
				text += buttonWithOnclick('addScelta()','Invia le scelte');
				text += aCapo() + aCapo();
				
			} else text += 'There was and error';
			$('#contenuto').html(text);	
		}
	});
}

function addScelta(){
	var res = [];
	var inputs = document.getElementsByClassName('choose');
	for(i in inputs){
		if(inputs[i].checked){
			res.push(inputs[i].value);
		}
	}
	$.ajax({
		url: '/private/insertScelta',
		type: 'post',
		data: {
			list: JSON.stringify(res)
		},
		dataType: 'json',
		success: function(data){
			console.log(data);
			if(!data.error){
				$('#contenuto').html('Scelta memorizzata correttamente');
			}
			else{
				$('#contenuto').html('Si è verificato un errore, riprova');
			}
		}
	});
}

function vota(){
	
}

function allergie(){
	
}

function showPrivate(){
	$('#private1').show();
	$('#private2').show();
	$('#private3').show();
	$('#private4').show();
	$('#private5').show();
	$("#loginButton").hide();
	
}

function hidePrivate(){
	$('#private1').hide();
	$('#private2').hide();
	$('#private3').hide();
	$('#private4').hide();
	$('#private5').hide();
	$("#loginButton").show();
}







/////// USEFULL FUNCTIONS TO WRITE CLEAN HTML

function lineMenu(line){
	var text = '';
	//aggiunge una separazione tra righe come <hr>
	text += addInterlinea();
	//aggiunge una riga preformattata contenente l'immagine, il nome e la decrizione del piatto
	text += openRiga();
	text += openColonna(4);
	text += addImg(line.fotopath);
	text += closeColonna();
	text += openColonna(4);
	text += setDim(line.nome,4);
	text += closeColonna();
	text += openColonna(4);
	text += setDim(line.descr,5);
	text += closeColonna();
	text += closeRiga();
	return text;
}

function lineMenuCH(line){
	var text = '';
	//aggiunge una separazione tra righe come <hr>
	text += addInterlinea();
	//aggiunge una riga preformattata contenente l'immagine, il nome e la decrizione del piatto
	text += openRiga();
	text += openColonna(4);
	text += addImg(line.fotopath);
	text += closeColonna();
	text += openColonna(3);
	text += setDim(line.nome,4);
	text += closeColonna();
	text += openColonna(3);
	text += setDim(line.descr,5);
	text += closeColonna();
	text += openColonna(2);
	text += addInput('radio',line.tipo+line.orario,line.toid,'choose');
	text += closeColonna();
	text += closeRiga();
	return text;
}

function aCapo(){
	return '<br>';
}

function intestazione(testo,dim){
	return '<div class=\"row\">' + setDim(testo,dim).toUpperCase() + '</div>';
}

function openRiga(){
	return '<div class=\"row\">';
}

function closeRiga(){
	return '</div>';
}

function openColonna(dim){
	return '<div class=\"col-md-' + dim + '\">';
}

function closeColonna(){
	return '</div>';
}

function setDim(testo,dim){
	return '<h' + dim + '>'+ testo + '</h' + dim + '>';
}

function addImg(src){
	return '<img src=\"' + src + '\" alt=\"immagine non disponibile\">';
}

function setColor(text,color){
	return '<div style=\"color: ' + color + '\">' + text + '</div>';
}

function addInterlinea(){
	return '<hr>';
}

function addRigaInterlinea(){
	return '<div class=\"row\"><hr></div>';
}

function alertMessage(text,color,dim){
	return setDim(setColor(text,color),dim);
}

function openForm(id){
	return '<form id=\"' + id + '\">';
}

function closeForm(){
	return '</form>';
}

function addInput(type,name,value,classe){
	return '<input class=\"' + classe + '\" type=\"' + type + '\" name=\"' + name + '\" value=\"' + value + '\"/>';
}

function formButton(text){
	return '<button type=\"submit\">' + text + '</button>';
}

function button(id,text){
	return '<button id=\"' + id + '\">' + text + '</button>';
}

function buttonWithOnclick(onclick,text){
	return '<button onclick=\"' + onclick + '\">' + text + '</button>';
}

function link(src,text){
	return '<a href=\"' + src + '\">' + text + '</a>';
}

function addInputChecked(type,name,value){
	return '<input checked type=\"' + type + '\" name=\"' + name + '\" value=\"' + value + '\"/>';
}

function addInputHidden(type,name,value){
	return '<input hidden type=\"' + type + '\" name=\"' + name + '\" value=\"' + value + '\"/>';
}

function addOption(value,text){
	return '<option value=\"' + value + '\">' + text + '</option>';
}

function openDiv(id){
	return '<div id=\"' + id + '\">';
}

function clodeDiv(){
	return '</div>';
}

function getStringDay(giorno){
	switch (giorno-0){
			case (0): return 'Lunedì';
			case (1): return 'Martedì';
			case (2): return 'Mercoledì';
			case (3): return 'Giovedì';
			case (4): return 'Venerdì';
			case (5): return 'Sabato';
			case (6): return 'Domenica';
	}
	return undefined;
}
