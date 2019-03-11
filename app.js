var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var crypto = require("crypto");
var pgp = require("pg-promise")({});
//поставить время жизни cookie на 30 мин
//перенести событие входа пользователя на кнопку входа
//событие на выход
const databaseConfig= {
    host: "localhost",
    port: 5432,
    database: "Protection_of_Information",
    user: "postgres",
    password: "0123456789"
};

var pg = pgp(databaseConfig);

var commonRoutes = require("./routes/commonRoutes");
var messageRoutes = require("./routes/messageRoutes");



var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

io.sockets.on("connection",function (socket) {
    socket.on("userConnected",function (user) {
        socket.broadcast.emit('userConnectedMess', {'login': user.login} )
    })
    socket.on('userDisconnect',function (user) {
        socket.broadcast.emit('userDisconnectMess',{login: user.login} )
    })
    socket.on('message', function (msg,key,login) {
        let decodeM = decodeMessage(msg,key);
        socket.broadcast.emit('messageReceived', {'login': login, 'message':decodeM} )
    });
})


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
messageRoutes.setParams(pg,io);

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



app.get('/', commonRoutes.mainPage);
app.post('/login',commonRoutes.enter);
app.post('/new_message',messageRoutes.newMessage);
app.post('/registration',commonRoutes.registration);
app.get('/chat_room',commonRoutes.chatRoomPage);
app.get('/exit',commonRoutes.exit);
app.post('/get_key',messageRoutes.getKey);








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
