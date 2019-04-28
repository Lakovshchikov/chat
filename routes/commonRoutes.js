let db,crypto;
let secret    = 'secret';
let algorithm = 'sha256';   //consider using sha256
let hash, hmac;
const rsaWrapper = require("../rsa_crypto");

function setParams(_db,_crypto) {
    db = _db;
    crypto = _crypto;
}



//Страница входа
function mainPage(req,res) {
    let cookie = req.cookies.chatUser;
    if(cookie === undefined){
        // res.render("reg_page.ejs",{error:false, error_message:""});
        res.render('reg_page.ejs', {
            error:false,
            error_message:""
        }, function(err, html){
            if (err) {
                console.log("ERR", err)

                // An error occurred, stop execution and return 500
                return res.status(500).send();
            }

            // Return the HTML of the View
            console.log("Done");
            return res.send(html);
        });
    }
    else{
        res.redirect("/chat_room");
    }
    // cookie === undefined ? res.render("reg_page.ejs",{error:false, error_message:""}) : res.redirect("/chat_room");
}

// function enter(req,res) {
//     hmac = crypto.createHmac(algorithm,secret);
//     console.log(`Зашифрованный пароль, пришедший с клиента: \n ${req.body.pass}`);
//     let decrypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,req.body.pass);
//     console.log(`Декодированный пароль: ${decrypted_pass}`);
//     hmac.write(decrypted_pass);
//     hmac.end();
//     hash = hmac.read().toString('hex');
//     db.one("SELECT * FROM users WHERE login = $1 and pass = $2",[req.body.login,hash])
//         .then(user =>{
//             let randomNumber=Math.random().toString();
//             randomNumber=randomNumber.substring(2,randomNumber.length);
//             res.cookie('chatUser',randomNumber);
//             db.query("INSERT INTO keys(cookie,login) VALUES ($1,$2)",[randomNumber,req.body.login])
//                 //Генерация ключей для клиента
//                 //.then(rsaWrapper.generateClientKeys())
//                 .then(res.redirect("/chat_room"));
//         })
//         .catch(e => {
//             console.log(e);
//             res.render("reg_page.ejs",{error:true, error_message:"Неверный логин или пароль!"});
//         })
// }
//Вход
function enter(req,res) {
    //Поиск пользователя с таким логином в БД
    db.one("SELECT current_state FROM users_temp_keys WHERE login = $1", [req.body.login])
    //Если пользователь найден - возвращаем его состояние, которое опрееляет текущий пароль
        .then(state => {
            let column = "";
            switch (state.current_state) {
                case 1:
                    column = "first_pass";
                    break;
                case 2:
                    column = "second_pass";
                    break;
                case 3:
                    column = "third_pass";
                    break;
                case 4:
                    column = "fourth_pass";
                    break;
                case 5:
                    column = "fifth_pass";
                    break;
            }
            //Проверяем пароль
            console.log(`Зашифрованный пароль, пришедший с клиента: \n ${req.body.pass}`);
            let decrypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate, req.body.pass);
            console.log(`Декодированный пароль: ${decrypted_pass}`);
            //Поиск пользователя с таким логином
            let query = "SELECT * FROM users_temp_keys WHERE login = " + "\'" + req.body.login + "\'";
            db.one(query)
                .then(pass => {
                    //Получаем текущий пароль пользователя
                    let pass_db = getEncryptedPass(pass, column);
                    //Если текущий пароль пользователя из БД совпадает с введенным на странице входа - перенаправляем пользователяна страницу чата
                    if (pass_db == decrypted_pass) {
                        let randomNumber = Math.random().toString();
                        randomNumber = randomNumber.substring(2, randomNumber.length);
                        res.cookie('chatUser', randomNumber);
                        db.query("INSERT INTO keys(cookie,login) VALUES ($1,$2)", [randomNumber, req.body.login])
                        //Генерация ключей для клиента
                        //.then(rsaWrapper.generateClientKeys())
                            .then(res.redirect("/chat_room"));
                    }
                    else {
                        res.render("reg_page.ejs", {error: true, error_message: "Неверный логин или пароль!"});
                    }

                })
                .catch(e => {
                    console.log(e);
                    res.render("reg_page.ejs", {error: true, error_message: "Неверный логин или пароль!"});
                })
        })
        .catch(e => {
            console.log(e);
            res.render("reg_page.ejs", {error: true, error_message: "Неверный логин или пароль!"});
        })
}

// function registration(req,res){
//     hmac = crypto.createHmac(algorithm,secret);
//     //for rsa pass encrypted
//     console.log(`Зашифрованный пароль, пришедший с клиента: \n ${req.body.pass}`);
//     let decrypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,req.body.pass);
//     console.log(`Декодированный пароль: ${decrypted_pass}`);
//     //
//     //hmac.write(req.body.pass);
//     hmac.write(decrypted_pass);
//     hmac.end();
//     hash = hmac.read().toString('hex');
//     db.one("SELECT * FROM users WHERE login = $1 and pass = $2",[req.body.login,hash])
//         .then(user =>{
//             res.render("reg_page.ejs",{error:true,error_message:"Пользователь с таким логином уже существует!"});
//         })
//         .catch(e => {
//             if(e.name == "QueryResultError"){
//                 db.query("INSERT INTO users(login,pass) VALUES ($1,$2)",[req.body.login,hash]).
//                 then( response => {
//                     let randomNumber = Math.random().toString();
//                     randomNumber = randomNumber.substring(2, randomNumber.length);
//                     res.cookie('chatUser', randomNumber);
//                     //let key = randomInteger(1, 100);
//                     db.query("INSERT INTO keys(cookie,key,login) VALUES ($1,$2,$3)", [randomNumber, req.body.key, req.body.login])
//                         .then(res.redirect("/chat_room"));
//                 });
//             }
//             else{
//                 res.render("reg_page.ejs",{error:true, error_message:"Что-то пошло не так :("});
//             }
//         })
// }


//Регистрация - ключи создаются на стороне сервера

// function registration(req,res) {
//     //for rsa pass encrypted
//     console.log(`Зашифрованный пароль, пришедший с клиента: \n ${req.body.pass}`);
//     let decrypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,req.body.pass);
//     console.log(`Декодированный пароль: ${decrypted_pass}`);
//     //Проверка занятости логина
//     db.one("SELECT * FROM users_temp_keys WHERE login = $1",[req.body.login])
//         .then(user =>{
//             //Если логин занят - возвращаем ошибку
//             res.render("reg_page.ejs",{error:true,error_message:"Пользователь с таким логином уже существует!"});
//         })//Если логин свободен - регистрируем пользователя
//         .catch(e => {
//             if(e.name == "QueryResultError"){
//                 let pass_hash = [];
//                 pass_hash.push(req.body.pass);
//                 //Генерируем апароли на 5 сессий
//                 while (pass_hash.length!=5){
//                     let randomNumber = Math.random().toString();
//                     randomNumber = randomNumber.substring(2, randomNumber.length);
//                     console.log("REG PASS");
//                     console.log(`${pass_hash.length + 1} : ${randomNumber}`);
//                     randomNumber = rsaWrapper.encrypt(rsaWrapper.serverPub,randomNumber);
//                     pass_hash.push(randomNumber);
//                 }
//                 //Записываем зашифрованные пароли в БД
//                 db.query("INSERT INTO users_temp_keys (login,first_pass,second_pass,third_pass,fourth_pass,fifth_pass,current_state) VALUES ($1,$2,$3,$4,$5,$6,$7)",
//                     [req.body.login,pass_hash[0],pass_hash[1],pass_hash[2],pass_hash[3],pass_hash[4],"1"]).
//                         then( response => {
//                             //создаем сессию и перенаправляем пользователя на страниуц чата
//                             let randomNumber = Math.random().toString();
//                             randomNumber = randomNumber.substring(2, randomNumber.length);
//                             res.cookie('chatUser', randomNumber);
//                             db.query("INSERT INTO keys(cookie,key,login) VALUES ($1,$2,$3)", [randomNumber, req.body.key, req.body.login])
//                                 .then(res.redirect("/chat_room"));
//
//                         })
//                         .catch(e =>{
//                             console.log(e);
//                         });
//             }
//             else{
//                 res.render("reg_page.ejs",{error:true, error_message:"Что-то пошло не так :("});
//             }
//         })
// }

// Регистрация - ключи создаются на стороне клиента
function registration(req,res) {
    console.log(`Зашифрованный пароль, пришедший с клиента: \n ${req.body.pass}`);
    let decrypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,req.body.pass);
    console.log(`Декодированный пароль: ${decrypted_pass}`);
    //Проверка занятости логина
    db.one("SELECT * FROM users_temp_keys WHERE login = $1",[req.body.login])
        .then(user =>{
            //Если логин занят - возвращаем ошибку
            res.render("reg_page.ejs",{error:true,error_message:"Пользователь с таким логином уже существует!"});
        })//Если логин свободен - регистрируем пользователя
        .catch(e => {
            if(e.name == "QueryResultError"){
                //Получаем пароли от клиента
                    let arr_pass = decrypted_pass.split(":");
                    let encrypted_pass_array = [];
                    arr_pass.forEach((item,i)=>{
                        encrypted_pass_array.push(rsaWrapper.encrypt(rsaWrapper.serverPub,arr_pass[i]));
                    })
                    //Записываем зашифрованные пароли в БД
                    db.query("INSERT INTO users_temp_keys (login,first_pass,second_pass,third_pass,fourth_pass,fifth_pass,current_state) VALUES ($1,$2,$3,$4,$5,$6,$7)",
                        [req.body.login,encrypted_pass_array[0],encrypted_pass_array[1],encrypted_pass_array[2],encrypted_pass_array[3],encrypted_pass_array[4],"1"])
                        .then( response => {
                            //создаем сессию и перенаправляем пользователя на страниуц чата
                            let randomNumber = Math.random().toString();
                            randomNumber = randomNumber.substring(2, randomNumber.length);
                            res.cookie('chatUser', randomNumber);
                            db.query("INSERT INTO keys(cookie,key,login) VALUES ($1,$2,$3)", [randomNumber, req.body.key, req.body.login])
                                .then(res.redirect("/chat_room"));

                        })
                        .catch(e =>{
                            console.log(e);
                        });
                }
            else{
                res.render("reg_page.ejs",{error:true, error_message:"Что-то пошло не так :("});
            }
            }
        )
}

// function chatRoomPage (req, res){
//     let cookie = req.cookies.chatUser;
//     if(cookie === undefined){
//         res.redirect("/");
//     }
//     else{
//         db.one("SELECT * FROM keys WHERE cookie = $1",[cookie])
//             .then(user=>{
//                 //Отображение ключей на странице
//                 // let keys = rsaWrapper.getKeys(__dirname);
//                 res.render("chat_room.ejs",{login:user.login});
//             })
//     }
// }

//Страница чата
// function chatRoomPage (req, res){
//     //Если нет идентификатора сессии - перенаправляем на страницу входа
//     let cookie = req.cookies.chatUser;
//     if(cookie === undefined){
//         res.redirect("/");
//     }
//     //Иначе - перенаправляем на страницу чата
//     else{
//         db.one("SELECT * FROM keys WHERE cookie = $1",[cookie])
//             .then(user=>{
//                 //определение текущего состояния пользователя
//                 db.one("SELECT current_state FROM users_temp_keys WHERE login = $1",[user.login])
//                     .then(state=>{
//                         //Если состояние = 5 - создаем новые пароли на 5 сессий
//                         if(state.current_state=="5"){
//                             let new_pass = generateKeys();
//                             db.query("UPDATE users_temp_keys SET first_pass = $1,second_pass = $2, third_pass = $3, fourth_pass = $4, fifth_pass = $5 WHERE login = $6",
//                                 [new_pass[0],new_pass[1],new_pass[2],new_pass[3],new_pass[4],user.login])
//                         }
//                         //Если это состояние = 1 или 5 - показываем пароли на странице чата
//                         if(state.current_state=="5" || state.current_state == "1"){
//                             db.query("SELECT * FROM users_temp_keys WHERE login = $1",[user.login])
//                                 .then(keys=>{
//
//                                     let all_keys = rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].first_pass) + "\n" +
//                                         rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].second_pass) + "\n" +
//                                         rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].third_pass) + "\n" +
//                                         rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].fourth_pass) + "\n" +
//                                         rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].fifth_pass);
//
//
//                                     res.render("chat_room.ejs",{"login":user.login,"show_pass":true,"pass":all_keys});
//                                 })
//                         }
//                         else {
//                             res.render("chat_room.ejs",{"login":user.login,
//                                 "show_pass":false,
//                                 "pass":""});
//                         }
//                     })
//
//             })
//     }
// }

//Вход в комнату чата
function chatRoomPage (req, res){
    //Если нет идентификатора сессии - перенаправляем на страницу входа
    let cookie = req.cookies.chatUser;
    if(cookie === undefined){
        res.redirect("/");
    }
    //Иначе - перенаправляем на страницу чата
    else{
        db.one("SELECT * FROM keys WHERE cookie = $1",[cookie])
            .then(user=>{
                //определение текущего состояния пользователя
                db.one("SELECT current_state FROM users_temp_keys WHERE login = $1",[user.login])
                    .then(state=>{
                        //Если он первый раз заходит под новым паролем - показываем пароли на странице
                        if(state.current_state == "1"){
                            db.query("SELECT * FROM users_temp_keys WHERE login = $1",[user.login])
                                .then(keys=>{
                                    let all_keys = rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].first_pass) + "\n" +
                                        rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].second_pass) + "\n" +
                                        rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].third_pass) + "\n" +
                                        rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].fourth_pass) + "\n" +
                                        rsaWrapper.decrypt(rsaWrapper.serverPrivate,keys[0].fifth_pass);
                                    res.render("chat_room.ejs",{"login":user.login,"show_pass":true,"pass":all_keys});
                                })
                        }
                        else {
                            res.render("chat_room.ejs",{"login":user.login,
                                "show_pass":false,
                                "pass":""});
                        }
                    })

            })
    }
}

// function exit(req,res){
//     let cookie = req.cookies.chatUser;
//     db.query("DELETE FROM keys WHERE cookie = $1",[cookie])
//         .then(obj=>{res.clearCookie('chatUser');
//             res.clearCookie("chatUser");
//             res.redirect("/");}
//         )
// }

//Выход из чата
function exit(req,res){
    //Поиск пользоватея по идентификатору сессии
    let cookie = req.cookies.chatUser;
    db.one("SELECT * FROM keys WHERE cookie = $1",[cookie])
        .then(user=>{
            //Определение текущего состояния пользователя
            db.one("SELECT current_state FROM users_temp_keys WHERE login = $1",[user.login])
                .then(state=>{
                    //Изменение состояния пользователя
                    let new_state = 0;
                    if(state.current_state!=5){
                        new_state = state.current_state + 1;
                    }
                    else{
                        new_state = 1;
                    }
                    //Обновление состояния пользователя
                    db.query("UPDATE users_temp_keys SET current_state = $1 WHERE login = $2",[new_state,user.login])
                        .then(response=>{
                            //Удаление идентификатора сессии и перенаправление на страницу входа
                            db.query("DELETE FROM keys WHERE cookie = $1",[cookie])
                                .then(obj=>{res.clearCookie('chatUser');
                                    // res.clearCookie("chatUser");
                                    res.redirect("/");}
                                )
                        })
                })
        })
}



function getPublicKey(req,res){
    let keys = rsaWrapper.getKeys(__dirname);
    res.send({key:keys.server_public_key});
}

//Определение текущего состояния пользователя
function getCurrentStateUser(req,res){
    let login = req.body.login;
        db.one("SELECT current_state FROM users_temp_keys WHERE login = $1",[login])
            .then(state=>{
                res.send({state:state.current_state})
            })
            .catch(e=>{
                console.log(e);
                res.redirect("/login");
            })
}

//Установка новых паролей
function setNewPass(req,res){
    console.log(`Зашифрованные пароли, пришедшие с клиента: \n ${req.body.pass}`);
    let decrypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,req.body.pass);
    console.log(`Декодированный пароль: ${decrypted_pass}`);
    //Шифрование паролей
        let arr_pass = decrypted_pass.split(":");
        let encrypted_pass_array = [];
        arr_pass.forEach((item,i)=>{
            encrypted_pass_array.push(rsaWrapper.encrypt(rsaWrapper.serverPub,arr_pass[i]));
        })
        //Записываем зашифрованные пароли в БД
        db.query("UPDATE users_temp_keys SET first_pass = $1,second_pass = $2, third_pass = $3, fourth_pass = $4, fifth_pass = $5, current_state = 1 WHERE login = $6",
            [encrypted_pass_array[0],encrypted_pass_array[1],encrypted_pass_array[2],encrypted_pass_array[3],encrypted_pass_array[4],req.body.login])
            .then( () => {
                res.send("ok");
            })
            .catch(e=>{
                console.log(e);
            })
}

//Верификация пользователя для состояния = 5
function checkUser(req,res) {
    console.log(`Зашифрованный пароль, пришедший с клиента на проверку 5 раз: \n ${req.body.pass}`);
    let decrypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate, req.body.pass);
    console.log(`Декодированный пароль на проверку 5 раз: ${decrypted_pass}`);
    let query = "SELECT * FROM users_temp_keys WHERE login = " + "\'" + req.body.login + "\'";
    db.one(query)
        .then(pass => {
            //Проверка пароля
            let pass_db = rsaWrapper.decrypt(rsaWrapper.serverPrivate, pass.fifth_pass);
            if (pass_db == decrypted_pass) {
                console.log("Пароль верный!")
                res.send({correct:true})
            }
            else {
                console.log("Пароль не верный!")
                res.send({correct:false})
            }
        })
        .catch(() =>{
            res.send({correct:false})
        })
}



//helping functions
//Генерация ключей на 5 сессий
// function generateKeys(){
//     let pass_hash = [];
//     while (pass_hash.length!=5){
//         let randomNumber = Math.random().toString();
//         randomNumber = randomNumber.substring(2, randomNumber.length);
//         console.log("GEN PASS");
//         console.log(`${pass_hash.length + 1} : ${randomNumber}`);
//         randomNumber = rsaWrapper.encrypt(rsaWrapper.serverPrivate,randomNumber);
//         pass_hash.push(randomNumber);
//     }
//     return pass_hash;
// }

//Вспомагательная функция получения текущего пароля
function getEncryptedPass(pass,param){
    let encypted_pass = "";
    switch (param) {
        case "first_pass" :
            encypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,pass.first_pass);;
        break;
        case "second_pass" :
            encypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,pass.second_pass);
            break;
        case "third_pass" :
            encypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,pass.third_pass);
            break;
        case "fourth_pass" :
            encypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,pass.fourth_pass);
            break;
        case "fifth_pass" :
            encypted_pass = rsaWrapper.decrypt(rsaWrapper.serverPrivate,pass.fifth_pass);
            break;
        default :
            encypted_pass = "";
            break;
    }
    return encypted_pass;
}






module.exports = {
    setParams:setParams,
    enter:enter,
    mainPage:mainPage,
    registration:registration,
    chatRoomPage:chatRoomPage,
    exit:exit,
    getPublicKey:getPublicKey,
    getCurrentStateUser:getCurrentStateUser,
    setNewPass:setNewPass,
    checkUser:checkUser
}