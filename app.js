//Подключание необходимых модулей
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var crypto = require("crypto");
var pgp = require("pg-promise")({});
var fs = require("fs")
var rsa = require("node-rsa");
var commonRoutes = require("./routes/commonRoutes");
var messageRoutes = require("./routes/messageRoutes");
var rsaWrapper = require("./rsa_crypto");


//Настройка БД
const databaseConfig= {
    host: "localhost",
    port: 5432,
    database: "Protection_of_Information",
    user: "postgres",
    password: "0123456789"
};

var pg = pgp(databaseConfig);

//Настройка сервера
var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// настройка шифратора
rsaWrapper.dependencyInjection(fs,rsa,crypto,path);
//созданеи серверных ключей
rsaWrapper.generateKeys("server");
//инициализация ключей
rsaWrapper.initLoadServerKeys(__dirname);

// var msg;
//Работа с сокетами
io.sockets.on("connection",function (socket) {
    // socket.on("rsa_encrypted_mes",function (encrypted_message) {
    //     console.log("Зашифрованное сообщение, пришедшее на сервер с клиента:");
    //     console.log(encrypted_message);
    //     msg = rsaWrapper.decrypt(rsaWrapper.serverPrivate,encrypted_message);
    //     console.log("Расшифрованное сообщение, пришедшее на сервер с клиента:")
    //     console.log(msg);
    //     //костыль
    //     msg = rsaWrapper.encrypt(rsaWrapper.clientPub,msg);
    //     console.log("Зашифрованное сообщение, отправленное на клиентов:")
    //     console.log(msg);
    //     socket.emit('server_encrypted_mes',{encrypted_message:msg,login:"login"})
    //     //socket.broadcast.emit("getPubKeys",{});
    //     // msg = rsaWrapper.encrypt(rsaWrapper.serverPub,msg);
    //     // console.log("Зашифрованное сообщение, отправленное на клиентов:")
    //     // console.log(msg);
    //     // socket.broadcast.emit('server_encrypted_mes',{encrypted_message:msg,login:"login"})
    // })
    // socket.on("keys",function (key) {
    //     msg = rsaWrapper.encrypt(key,msg);
    //     console.log("Зашифрованное сообщение, отправленное на клиентов:")
    //     console.log(msg);
    //     socket.broadcast.emit('server_encrypted_mes',{encrypted_message:msg,login:"login"})
    // });
    socket.on("userConnected",function (user) {
        socket.broadcast.emit('userConnectedMess', {'login': user.login} )
    })
    socket.on('userDisconnect',function (user) {
        socket.broadcast.emit('userDisconnectMess',{login: user.login} )
    })
    //получение сообщения от клиента
    socket.on('message', function (msg,login) {
        let query = `SELECT * FROM keys WHERE login = '${login}'`;
        pg.query(query)
            .then(result => {
                console.log(`Зашифрованный ключ пользователя из БД: \n ${result[0].key}`);
                let decrypted_key = rsaWrapper.decrypt(rsaWrapper.serverPrivate,result[0].key);
                console.log(`Зашифрованное сообщение: \n ${msg}`);
                console.log(`Декодированный ключ: \n ${decrypted_key}`);
                let decodeM = decodeMessage(msg,decrypted_key);
                console.log(`Расшифрованное сообщение: \n ${decodeM}`);
                //отправка сообщения на клиентов
                socket.broadcast.emit('messageReceived', {'login': login, 'message':decodeM,'codeMes':msg} )
            });

    });
})


//Расшифровка сообщения симметричным ключем
function decodeMessage(message,key){
    let a = 0;
    let keys = "";
    const offset = key;
    let out = '';
    for (let i=0; i< message.length; i++){
        keys = keys + a;
        let code = message.charCodeAt(i);
        code = code - offset - a;
        out += String.fromCharCode(code);
        a++;
    }
    return out;
}

function cesarCode(text,key) {
    let a = 0;
    let keys = "";
    const offset = key;
    let out = '';
    for (let i=0; i< text.length; i++){
        keys = keys + a;
        let code = text.charCodeAt(i);
        code = code + offset + a;
        out += String.fromCharCode(code);
        a++;
    }
    console.log(keys);
    return out;
}


commonRoutes.setParams(pg,crypto);
messageRoutes.setParams(pg,io,rsaWrapper);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css',express.static("public/stylesheets"));
app.use('/scripts',express.static("public/javascripts"));
app.use('/keys',express.static("public/keys"));


//Маршрутизация
app.get('/', commonRoutes.mainPage);
app.post('/login',commonRoutes.enter);
app.post('/new_message',messageRoutes.newMessage);
app.post('/registration',commonRoutes.registration);
app.get('/chat_room',commonRoutes.chatRoomPage);
app.get('/exit',commonRoutes.exit);
app.post('/get_key',messageRoutes.getKey);
app.post('/set_key',messageRoutes.setKey);
app.get('/get_public_key',commonRoutes.getPublicKey);
app.post('/get_current_state',commonRoutes.getCurrentStateUser);
app.post('/setNewPass',commonRoutes.setNewPass);
app.post('/check_user',commonRoutes.checkUser);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
