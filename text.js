exports.aCapo = function aCapo(){
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

function menu(result){
	var text = '';
	//orario e tipo mi permetteranno di ordinare i risultati della ricerca e mostrarli di conseguenza
	var orario = ['pranzo','cena'];
	var tipo = ['primo','secondo','contorno'];
	
	//per ogni orario (pranzo e cena) estraggo i pasti di ogni tipo (primo,secondo,contorno) e li aggiungo come testo html
	//se non ho risultati stampo un messaggio
	if(result.length == 0) text += tx.intestazione('Nessun pasto ordinato per oggi',3);
	else{
		for(o in orario){
			for(t in tipo){
				text += tx.intestazione(orario[o] + " - " + tipo[t]);
				for(i in result){
					if(result[i].tipo == tipo[t] && result[i].orario == orario[o]){
						text += tx.lineMenu(result[i]);
						//se un dei piatti a cui l'utente è allergico coincide con quello scelto, aggiungo una riga di avvertimento
						for(a in allergie){
							if(allergie[a].id_menu == result[i].id_menu) text += tx.alertMessage('Contiene allergeni',red,5);
						}
					}
				}
			}
		}
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

function lineMenuCH(line){
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
	text += addInput('radio',line.tipo+line.orario,line.toid,'choose');
	text += closeColonna();
	text += closeRiga();
	return text;
}

function lineVoto(line){
	
}
