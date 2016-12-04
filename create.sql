create table utenti(
	id serial primary key,
	username varchar(50),
	password varchar(50),
	via varchar(100)
);

create table menu(
	id serial primary key,
	tipo varchar(50),
	giorno integer,
	orario varchar(50),
	id_pasti integer references pasti(id)
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

create table pasti(
	id serial primary key,
	nome varchar(50),
	descr varchar(1024)
);

select count(*) as risultato from
	(select contiene.id_allergie from 
		(select res.id_menu from (select id_menu from sceglie where sceglie.id_utente = 14) as res, menu where res.id_menu = menu.id and giorno = 0 and orario = 'pranzo' and tipo = 'secondo') as foo,
		contiene
	 where foo.id_menu = contiene.id_menu) as pippo,
	 intollerante
where pippo.id_allergie = intollerante.id_allergie and id_utente = 14;
