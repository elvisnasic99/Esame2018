
'use strict';
var config = {
    userName: 'elvisnasic',
    password: 'Esamedistato2018',
    server: 'elvisnasic.database.windows.net',
    options:
        {
            database: 'AbstractShop'
            ,encrypt=true;
        }
}

var idProdotto;
var ImportoCartaDiCredito;
var costo_prodotto;
var connection;
var nome;
var cognome;
var username;
var password;
var idUtente;
var Codice;
var Scadenza;
var Tipo;
var Importo;
var CodiceSicurezza;
var DataApertura;
var IBAN;
var nome;
var cognome;
var nome_prodotto;
var passwordNuova;
var InfoProdotto;
var prodottoDaAcquistare;
var tipologiaAcquisto;
var generator = require('generate-password');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'elvisnasic22.en@gmail.com',
        pass: 'Esamedistato2018'
    }
});
const Hapi = require('hapi');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
const server = new Hapi.Server();
server.connection({ port: process.env.port, host: process.env.host });

//Login relativo ad un utente
server.route({
    method: 'POST',
    path: '/api/Login',
    handler: function (request, reply) {
        var user_passwordLogin = "";
        var nickname_login = "";
        connection = new Connection(config);
        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Connected');
                nickname_login = request.payload.nome;
                user_passwordLogin = request.payload.password;
                Login(reply, nickname_login, user_passwordLogin);
            }
        });
    }
})
function Login(reply, nickname, user_password) {
    var login = [];
    var index = 0;
    var id_utente;
    var nickame;
    var request = new Request('SELECT IdUtente, username from  AbstractShop.dbo.LoginUtenti WHERE username like @utente and PasswordUtente like @pwd',
        function (err, rowCount) {
            if (err) { console.log(err); }
            else {
                console.log(rowCount + ' rows');
                if (rowCount >= 1) {
                    login.push({ esito: 'OK', idUtente: id_utente, nickname: nickame });
                    reply(login);
                } else { login.push({ esito: 'KO',tipologia:'Utente o password errati. Riprova!' }); reply(login); }
            }
        });
    request.on('row', function (columns) {
        columns.forEach(function (column, reply) {
            console.log(column.metadata.colName + ': ' + column.value);

            if (index == 1) { nickame = column.value; } else { id_utente = column.value; }
            index++;
        });
        console.log("-------------------");
    });

    request.addParameter('utente', TYPES.VarChar, nickname);
    request.addParameter('pwd', TYPES.VarChar, user_password);
    connection.execSql(request);
}

//Registrazione di un utente nel portale
server.route({
    method: 'POST',
    path: '/api/Registra',
    handler: function (request, reply) {
        connection = new Connection(config);
        nome = request.payload.nome;
        cognome = request.payload.cognome;
        var data_nascita = request.payload.dataNasicta;
        var residenza = request.payload.residenza;
        var cittaResidenza = request.payload.citta;
        var TelefonoCellulare = request.payload.cellulare;
        var TelefonoFisso = request.payload.fisso;
        var email = request.payload.email;
        username = request.payload.username;
        password = request.payload.password;
        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Connected');
                RegistraUtente(reply, nome, cognome, data_nascita, residenza, cittaResidenza, TelefonoCellulare, TelefonoFisso, email);
            }

        });
    }
})

//Funzione che registra un utente
function RegistraUtente(reply, nome, cognome, data_nascita, residenza, cittaResidenza, TelefonoCellulare, TelefonoFisso, email) {
    var pwd;
    var esito_registrazione = [];
    var request = new Request('INSERT INTO AbstractShop.dbo.Utenti(Nome,Cognome,DataNascita,Residenza,Citta,TelefonoCellulare,TelefonoFisso,email) VALUES(@nome,@cognome,@data,@residenza,@citta,@cellulare,@fisso,@email); select @@identity',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_registrazione.push({ esito: 'KO', tipologia: 'Insert Utente' });
                reply(esito_registrazione);
            }
            else {
                console.log(rowCount + 'rows');
                RegistraLogin(reply, username, password, idUtente,email);
            }
        });


    request.on('row', function (columns) {
        idUtente = columns[0].value;
        console.log('New ID: ' + columns[0].value);
    });


    request.addParameter('nome', TYPES.VarChar, nome);
    request.addParameter('cognome', TYPES.VarChar, cognome);
    request.addParameter('data', TYPES.Date, data_nascita);
    request.addParameter('residenza', TYPES.VarChar, residenza);
    request.addParameter('citta', TYPES.VarChar, cittaResidenza);
    request.addParameter('cellulare', TYPES.VarChar, TelefonoCellulare);
    request.addParameter('fisso', TYPES.VarChar, TelefonoFisso);
    request.addParameter('email', TYPES.VarChar, email);
    connection.execSql(request);
}


//Registra il login dell'utente
function RegistraLogin(reply, username, password, idUtente,email) {
    var pwd;
    var esito_registrazione = [];
    var request = new Request('INSERT INTO AbstractShop.dbo.LoginUtenti(IdUtente,username,PasswordUtente) VALUES(@id,@username,@pwd)',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_registrazione.push({ esito: 'KO', tipologia: 'Insert Login' });
                reply(esito_registrazione);
            }
            else {
                console.log(rowCount + 'rows');
                esito_registrazione.push({ esito: 'OK' });
                reply(esito_registrazione);

            }
        });

    var mailOptions = {
        from: 'elvisnasic22.en@gmail.com',
        to: email,
        subject: 'Registrazione Virtual Shop',
        text: 'Gentile ' + nome + ' ' + cognome + ' ti confermiamo la registrazione al nostro portale con le seguenti credenziali:  USERNAME:' + username + ' PASSWORD: ' + password
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) { console.log(error); }
        else { console.log("OK email"); }
    })

    request.addParameter('id', TYPES.Int, idUtente);
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('pwd', TYPES.VarChar, password);
    connection.execSql(request);
}

//Api registrazione dati bancari utente(CartaDiCredito)
server.route({
    method: 'POST',
    path: '/api/Registra/CartaDiCredito',
    handler: function (request, reply) {
        connection = new Connection(config);
        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Connected');
                Codice = request.payload.Codice;
                Scadenza = request.payload.Scadenza;
                Tipo = request.payload.Tipo;
                Importo = request.payload.Importo;
                CodiceSicurezza = request.payload.CodiceSicurezza;
                RegistraDatiBancari(reply, Codice, Scadenza, Tipo, Importo, CodiceSicurezza);
            }
        });
    }
})
//Funzione che registra i dati bancari dell'utente(CartaDiCredito)
function RegistraDatiBancari(reply, Codice, Scadenza, Tipo, Importo, CodiceSicurezza) {
    var esito_registrazione = [];
    var request = new Request('INSERT INTO AbstractShop.dbo.[CarteDiCredito](IdUtente,Codice,Scadenza,Tipo,Importo,CodiceSicurezza) VALUES(@id,@Codice,@Scadenza,@Tipo,@Importo,@CodiceSicurezza)',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_registrazione.push({ esito: 'KO', tipologia: 'Insert Login' });
                reply(esito_registrazione);
            }
            else {
                console.log(rowCount + 'rows');
                esito_registrazione.push({ esito: 'OK' });
                reply(esito_registrazione);

            }
        });
    request.addParameter('id', TYPES.Int, idUtente);
    request.addParameter('Codice', TYPES.VarChar, Codice);
    request.addParameter('Scadenza', TYPES.Date, Scadenza);
    request.addParameter('Tipo', TYPES.VarChar, Tipo);
    request.addParameter('Importo', TYPES.Money, Importo);
    request.addParameter('CodiceSicurezza', TYPES.VarChar, CodiceSicurezza);
    connection.execSql(request);
}


//Api registrazione dati bancari utente(ContoCorrente)
server.route({
    method: 'POST',
    path: '/api/Registra/ContoCorrente',
    handler: function (request, reply) {
        connection = new Connection(config);
        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Connected');
                IBAN = request.payload.IBAN;
                DataApertura = request.payload.DataApertura;
                RegistraContoCorrente(reply, IBAN, DataApertura);
            }
        });
    }
})

//Funzione che registra i dati bancari dell'utente(ContoCorrente)
function RegistraContoCorrente(reply, Codice, Scadenza, Tipo, Importo, CodiceSicurezza) {
    var esito_registrazione = [];
    var request = new Request('INSERT INTO AbstractShop.dbo.[ContoCorrenti]([IdUtente],[IBAN],[DataApertura]) VALUES(@id,@IBAN,@DataApertura)',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_registrazione.push({ esito: 'KO', tipologia: 'Insert Login' });
                reply(esito_registrazione);
            }
            else {
                console.log(rowCount + 'rows');
                esito_registrazione.push({ esito: 'OK' });
                reply(esito_registrazione);

            }
        });
    request.addParameter('id', TYPES.Int, idUtente);
    request.addParameter('IBAN', TYPES.VarChar, IBAN);
    request.addParameter('DataApertura', TYPES.Date, DataApertura);
    connection.execSql(request);
}

//Api che recupera la password
server.route({
    method: 'POST',
    path: '/api/RecuperoPassword',
    handler: function (request, reply) {
        connection = new Connection(config);
        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Connected');
                username = request.payload.username;
                ControlloEmail(reply, username);
            }
        });
    }
})
//Funzione che controlla l'esistenza o meno dello username inserito
function ControlloEmail(reply, username) {
    var esito_controllo = [];
    var request = new Request('SELECT IdUtente FROM LoginUtenti WHERE username like @user',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_controllo.push({ esito: 'KO', tipologia: 'Errore connessione!' });
                reply(esito_controllo);
            }
            else if(rowCount==0){esito_controllo.push({ esito: 'KO', tipologia: 'Username errato!' });reply(esito_controllo);}else {
                console.log(rowCount + 'rows');
                passwordNuova = generator.generate({
                    length: 10,
                    numbers: true
                });
                console.log('nuova password: ' + passwordNuova);
                GeneraNuovaPassword(reply, idUtente, passwordNuova);
            }
        });

    request.on('row', function (columns) {
        idUtente = columns[0].value;
        console.log('ID UTENTE: ' + idUtente);
    });


    request.addParameter('user', TYPES.VarChar, username);
    connection.execSql(request);
}


//Funzione che manda un'email con la nuova password generata automaticamente
function GeneraNuovaPassword(reply, idUtente, passwordNuova) {
    var esito_controllo = [];
    var request = new Request('select email from utenti  WHERE Utenti.IdUtente=@id; UPDATE LoginUtenti SET PasswordUtente=@passwordNuova WHERE IdUtente=@idUtente',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_controllo.push({ esito: 'KO', tipologia: 'Nessun email presente!' });
                reply(esito_controllo);
            }
            else {
                console.log(rowCount + 'rows');
                //Salvare la password dentro il db
                //Mandare Email di conferma 
                var mailOptions = {
                    from: 'elvisnasic22.en@gmail.com',
                    to: 'elvis.nasic.studenti@isii.it',
                    subject: 'Cambio Password',
                    text: 'Gentile utente ti confermiamo il cambio passoword con una fornita automaticamente dal sistema: PASSWORD: ' + passwordNuova
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) { console.log(error); }
                    else { console.log("OK email"); }
                })
                esito_controllo.push({ esito: 'OK', tipologia: 'Passowrd cambiata correttamente' });
                reply(esito_controllo);
            }
        });

    request.on('row', function (columns) {
        var email = columns[0].value;
        console.log('Email:  ' + email);
    });


    request.addParameter('id', TYPES.Int, idUtente);
    request.addParameter('passwordNuova', TYPES.VarChar, passwordNuova);
    request.addParameter('idUtente', TYPES.Int, idUtente);
    connection.execSql(request);
}

//Api che ritorna le informazioni di un prodotto
server.route({
    method: 'GET',
    path: '/api/Informazioni',
    handler: function (request, reply) {
        connection = new Connection(config);
        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Connected');
                InfoProdotto = encodeURIComponent(request.query.prodotto);
                InformazioniProdotto(reply, InfoProdotto);
            }
        });
    }
})
//Funzione che recupera le info di un prodotto
function InformazioniProdotto(reply, InfoProdotto) {
    var esito_registrazione = [];
    var request = new Request('SELECT * FROM Prodotti WHERE Prodotti.Nome like @prodotto',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_registrazione.push({ esito: 'KO' });
                reply(esito_registrazione);
            }
            else {
                console.log(rowCount + 'rows');

                reply(esito_registrazione);

            }
        });

    request.on('row', function (columns) {

        var idProdotto = columns[0].value;
        var nome_prodotto = columns[1].value;
        var costo_prodotto = columns[2].value;
        var descrizione = columns[3].value;
        //esito_registrazione.push({esito: 'OK'});
        esito_registrazione.push({ esito: 'OK', id: idProdotto, nome: nome_prodotto, costo: costo_prodotto, descrizione: descrizione});

    });
    request.addParameter('prodotto', TYPES.VarChar, InfoProdotto);
    connection.execSql(request);

}

//Api che gestisce l'acquisto di un prodotto
server.route({
    method: 'PUT',
    path: '/api/Acquisto',
    handler: function (request, reply) {
        connection = new Connection(config);
        connection.on('connect', function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Connected');
                prodottoDaAcquistare = request.payload.prodotto;
                tipologiaAcquisto = request.payload.tipologia;
                idUtente = request.payload.id;
                AcquistaProdotto(reply, prodottoDaAcquistare, tipologiaAcquisto, idUtente);
            }
        });
    }
})
//Funzione acquisto di un prodotto
function AcquistaProdotto(reply, prodottoDaAcquistare, tipologiaAcquisto, idUtente) {
    var esito_registrazione = [];

    var request = new Request('SELECT * FROM Prodotti WHERE Prodotti.Nome like @prodotto',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_registrazione.push({ esito: 'KO' });
                reply(esito_registrazione);
            }
            else {
                if (tipologiaAcquisto == 'cp') {
                    ControllaCredito(reply);
                }
                else if (tipologiaAcquisto == 'cc' || tipologiaAcquisto == 'cdc') {
                    InserisciProdotto(reply);
                }

                console.log(rowCount + 'rows');
            }

        });

    request.on('row', function (columns) {

        idProdotto = columns[0].value;
        nome_prodotto = columns[1].value;
        costo_prodotto = columns[2].value;
        var descrizione = columns[3].value;
        esito_registrazione.push({ esito: 'OK', id: idProdotto, nome: nome_prodotto, costo: costo_prodotto, descrizione: descrizione });

    });

    request.addParameter('prodotto', TYPES.VarChar, prodottoDaAcquistare);
    connection.execSql(request);

}
//Funzione che controlla il credito sulla carta prepagata
function ControllaCredito(reply) {
    var _importo = [];
    var esito_acquisto = [];
    var request = new Request('SELECT [Importo] FROM [CarteDiCredito] WHERE [IdUtente]=@id and [Tipo] like @tipologia',
        function (err, rowCount) {
            if (err) {
                console.log(err); esito_acquisto.push({ esito: 'KO' });
                //reply(esito_acquisto);
            }
            else {
                if (tipologiaAcquisto == 'cp' && costo_prodotto > ImportoCartaDiCredito) {
                    esito_acquisto.push({ esito: 'KO', tipoErrore: 'Non ci sono abbastanza soldi sulla carta di credito' });
                }
                else if (tipologiaAcquisto == 'cp' && costo_prodotto <= ImportoCartaDiCredito) {
                    esito_acquisto.push({ esito: 'OK', EsitoAcquisto: 'Acquisto avvenuto con successo' });
                    SetMoney(reply, ImportoCartaDiCredito, costo_prodotto);

                    var mailOptions = {
                        from: 'elvisnasic22.en@gmail.com',
                        to: 'elvis.nasic.studenti@isii.it',
                        subject: 'Acquisto ' + nome_prodotto,
                        text: 'Gentile cliente ti confermiamo che hai acquistato ' + nome_prodotto + ' e la spedizione avverrà entro i 3 giorni lavorativi. Grazie mille, lo staff.'
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) { console.log(error); }
                        else { console.log("OK email"); }
                    })

                }
                
            }
            reply(esito_acquisto);
        });

    request.on('row', function (columns) {

        ImportoCartaDiCredito = columns[0].value;
        console.log('cc: ' + ImportoCartaDiCredito)
    });

    request.addParameter('id', TYPES.Int, idUtente);
    request.addParameter('tipologia', TYPES.VarChar, 'Ricaricabile');
    connection.execSql(request);
}
//Set money
function SetMoney(reply, ImportoCartaDiCredito, costo_prodotto) {
    var nuovo_importo = ImportoCartaDiCredito - costo_prodotto;
    var esito = [];
    var request = new Request(' UPDATE CarteDiCredito SET Importo=@importo WHERE IdUtente=@idUtente',
        function (err, rowCount) {
            if (err) {
                console.log(err);
            }
            else { InserisciProdotto(reply); }
        });

    request.addParameter('idUtente', TYPES.Int, idUtente);
    request.addParameter('importo', TYPES.Money, nuovo_importo);
    request.addParameter('idProdotto', TYPES.Money, idProdotto);
    connection.execSql(request);
}

//Funzione che inserisce l'elemento nella tabella ponte(prodottiXcliente)
function InserisciProdotto(reply) {
    var esito = [];
    var request = new Request('INSERT INTO ProdottiInCliente(IdUtente,IdProdotto) VALUES(@idUtente,@idProdotto)',
        function (err, rowCount) {
            if (err) {
                console.log(err);
                esito.push({ esito: 'KO', tipoErrore: 'Errore durante la procedura di acquisto.' });
                reply(esito);
            }
            else { esito.push({ esito: 'OK', EsitoAcquisto: 'Acquisto avvenuto con successo' }); reply(esito); }
        });
    request.addParameter('idUtente', TYPES.Int, idUtente);
    request.addParameter('idProdotto', TYPES.Money, idProdotto);
    connection.execSql(request);
}
//Start del server
server.start(function (err) {
    if (err) { throw err; }
    console.log("Server ruunning at: " + server.info.uri);
});

