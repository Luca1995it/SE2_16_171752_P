exports.intestazione = intestazione;
exports.openRiga = openRiga;
exports.closeRiga = closeRiga;
exports.openColonna = openColonna;
exports.closeColonna = closeColonna;
exports.setDim = setDim;
exports.addImg = addImg;
exports.addInterlinea = addInterlinea;
exports.addRigaInterlinea = addRigaInterlinea;
exports.alertMessage = alertMessage;
exports.setColor = setColor;
exports.openForm = openForm;
exports.closeForm = closeForm;
exports.addInput = addInput;
exports.formButton = formButton;
exports.link = link;
exports.addInputChecked = addInputChecked;
exports.addInputHidden = addInputHidden;
exports.addOption = addOption;
exports.getStringDay = getStringDay;
exports.button = button;
exports.openDiv = openDiv;
exports.closeDiv = clodeDiv;
exports.aCapo = aCapo;

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
