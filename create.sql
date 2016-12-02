create table utenti(
	id serial primary key,
	username varchar(50),
	password varchar(50),
	via varchar(100)
);

create table menu(
	id serial primary key,
	tipo varchar(50),
	giorno varchar(20),
	orario varchar(50)
);

create table sceglie(
	id_utente integer references utenti(id),
	id_menu integer references menu(id),
	data date,
	voto integer default 0,
	primary key (id_utente,data,id_menu)
);

create table allergie(
	id serial primary key,
	nome varchar(50)
);

create table contiene(
	id_menu integer references menu(id),
	id_allergie integer references allergie(id)
);

create table intollerante(
	id_utente integer references utenti(id),
	id_allergie integer references allergie(id)
);
