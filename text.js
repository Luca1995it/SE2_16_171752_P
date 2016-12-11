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

function openForm(action,method){
	return '<form action=\"' + action + '\" method=\"' + method + '\">';
}

function closeForm(){
	return '</form>';
}

function addInput(type,name,value){
	return '<input type=\"' + type + '\" name=\"' + name + '\" value=\"' + value + '\"/>';
}

function formButton(text){
	return '<button type=\"submit\">' + text + '</button>';
}

function button(id,text){
	return '<button id=\"' + id + '\">' + text + '</button>';
}

exports.link = function link(src,text){
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

function closeDiv(){
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

exports.menu = function menu(result,allergie){
	var text = '';
	//orario e tipo mi permetteranno di ordinare i risultati della ricerca e mostrarli di conseguenza
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	//per ogni orario (pranzo e cena) estraggo i pasti di ogni tipo (primo,secondo,contorno) e li aggiungo come testo html
	//se non ho risultati stampo un messaggio
	if(result.length == 0) text += intestazione('Nessun pasto ordinato per oggi',3);
	else{
		for(o in orario){
			for(t in tipo){
				text += intestazione(orario[o] + " - " + tipo[t]);
				for(i in result){
					if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
						text += lineMenu(result[i]);
						//se un dei piatti a cui l'utente è allergico coincide con quello scelto, aggiungo una riga di avvertimento
						for(a in allergie){
							if(allergie[a].id_menu == result[i].id_menu) text += alertMessage('Contiene allergeni',red,5);
						}
					}
				}
			}
		}
	}
	return text;
}

exports.menuSettimanale = function menuSettimanale(result,allergie){
	var text = '';
	//giorni, orario e tipo mi permetteranno di ordinare i risultati della ricerca e mostrarli di conseguenza
	var giorni = [0,1,2,3,4,5,6];
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	//per ogni giorno ripeto:
	//per ogni orario (pranzo e cena) estraggo i pasti di ogni tipo (primo,secondo,contorno) e li aggiungo come testo html
	//se non ho risultati stampo un messaggio
	if(result.length == 0) text += intestazione('Nessun pasto trovato per questa settimana, ci scusiamo');
	else{
		text += openRiga();
		for(g in giorni){
			text += openColonna(1);
			text += button('btn' + g, 'Mostra giorno ' + getStringDay(g));
			text += closeColonna();
		}
		text += closeRiga();

		for(g in giorni){
			text += openDiv('show' + g);
			text += aCapo();
			text += intestazione(getStringDay(g));
			for(o in orario){
				for(t in tipo){
					text += aCapo() + aCapo();
					text += intestazione(orario[o] + " - " + tipo[t]);
					for(i in result){
						if(result[i].tipo == tipo[t] && result[i].orario == orario[o] && result[i].giorno == giorni[g]){
							//aggiunge una separazione tra righe come <hr>
							text += lineMenu(result[i]);
							//se un dei piatti a cui l'utente è allergico coincide con quello scelto, aggiungo una riga di avvertimento
							for(a in allergie){
								if(allergie[a].id_menu == result[i].id_menu){
									text += alertMessage('Contiene allergeni',red,5);
								}
							}
						}
					}
				}
			}
			text += closeDiv();
		}
	}
	return text;
}

exports.menuChoose = function menuChoose(result,allergie){
	var text = '';
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	//apro un form nel testo html che andrò ad inserire
	text += openForm('/private/insertScegli','post');
	//itero su orario (pranzo,cena) e poi su tipo (primo,secondo,contorno) per estrarre i pasti e mostrarli in ordine
	for(o in orario){
		for(t in tipo){
			//inserisco un intestazione del tipo PRANZO - SECONDI
			text += intestazione(orario[o] + " - " + tipo[t],3);
			//se non è disponibile nessun pasto (non dovrebbe accadere) mostro un semplice messaggio
			if (result.length == 0) text += addRigaInterlinea('Nessun pasto trovato');
			//altrimenti creo una semplice tabella html con le primitive definite nel file text.js
			else{
				for(i in result){
					if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
						text += lineMenuCH(result[i],tipo[t]+orario[o]);
						//se un dei piatti a cui l'utente è allergico coincide con quello scelto, aggiungo una riga di avvertimento
						for(a in allergie){
							if(allergie[a].id_menu == result[i].id_menu) text += alertMessage('Contiene allergeni',red,5);
						}
					}
				}
			} 
		}
	}
	text += addInterlinea();
	text += formButton('Scegli!');
	text += closeForm();
	return text;
}

exports.menuVoto = function menuVoto(result){
	var text = '';
	if(result.length>0){
		//viene aggiunta un'intestazione e un form/tabella contenente i vari piatti consumati,
		//affiancati da un input radio per la scelta del voto
		//per i piatti ai quali l'utente non vuole ancora lasciare un giudizio si lascia il valore 0
		text += header('Immagine','Nome e data','Descrizione','Voto');

		text += openForm('/private/addVoto','post');
		for(i in result){
			text += lineVoto(result[i]);
		}
		text += openRiga();
		text += openColonna(4) + closeColonna();
		text += openColonna(4) + formButton('Aggiungi Voti!') + closeColonna();
		text += openColonna(4) + closeColonna();
		text += closeRiga();
		text += closeForm();
	}
	else text += setDim('Nessun pasto da votare',3)
	return text;
}

function lineVoto(line){
	var text = '';
	text += addInterlinea();
	text += openRiga();
	text += openColonna(3);
	text += addImg(line.fotopath);
	text += closeColonna();
	text += openColonna(3);
	text += setDim(line.nome,4);
	text += setDim(line.data.toDateString(),5);
	text += setDim(line.tipo + ' - ' + line.orario,5);
	text += closeColonna();
	text += openColonna(3);
	text += setDim(line.descr,5);
	text += closeColonna();
	text += openColonna(3);
	text += addInputChecked('radio',line.id_menu,0) + setDim('No vote',4);
	text += addInput('radio',line.id_menu,1) + setDim('1',4);
	text += addInput('radio',line.id_menu,2) + setDim('2',4);
	text += addInput('radio',line.id_menu,3) + setDim('3',4);
	text += addInput('radio',line.id_menu,4) + setDim('4',4);
	text += addInput('radio',line.id_menu,5) + setDim('5',4);
	text += closeColonna();
	text += closeRiga();		
	return text;
}

exports.menuAllergie = function menuAllergie(result){
	var text = '';
	for(i = 0; i < result.length; i++){
		text += lineAllergie(result[i]);
	}
	text += addInterlinea();
	return text;
}

exports.buttonAllergie = function buttonAllergie(option){
	var text = '';
	for(i = 0; i < option.length; i++){
		text += addOption(option[i].id,option[i].nome);
	}
	return text;
}

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

function lineMenuCH(line,name){
	var text = '';
	//aggiunge una separazione tra righe come <hr>
	text += addInterlinea();
	//aggiunge una riga preformattata contenente l'immagine, il nome, la decrizione del piatto ed un input field di ripo radio per la scelta
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
	text += addInput('radio',name,line.toid);
	text += closeColonna();
	text += closeRiga();
	return text;
}

function lineAllergie(line){
	var text = '';
	text += openRiga();
	text += openColonna(8) + setDim(line.nome,4);
	text += closeColonna();
	text += openColonna(4);
	text += openForm('/private/removeAllergia','post');
	text += addInputHidden('text','id_allergie',line.id);
	text += formButton("Rimuovi");
	text += closeForm();
	text += closeColonna();
	text += closeRiga();
	return text;
}


function header(immagine,nome,descr){
	var text = '';
	text += openRiga();
	text += openColonna(4) + setDim(immagine,4) + closeColonna();
	text += openColonna(4) + setDim(nome,4) + closeColonna();
	text += openColonna(4) + setDim(descr,4) + closeColonna();
	text += closeRiga();
	return text;
}

function header(immagine,nome,descr,voto){
	var text = '';
	text += openRiga();
	text += openColonna(3) + setDim(immagine,4) + closeColonna();
	text += openColonna(3) + setDim(nome,4) + closeColonna();
	text += openColonna(3) + setDim(descr,4) + closeColonna();
	text += openColonna(3) + setDim(voto,4) + closeColonna();
	text += closeRiga();
	return text;
}
