let db,crypto;
let secret    = 'secret';
let algorithm = 'sha256';   //consider using sha256
let hash, hmac;

function setParams(_db,_crypto) {
    db = _db;
    crypto = _crypto;
}




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

function enter(req,res) {
    hmac = crypto.createHmac(algorithm,secret);
    hmac.write(req.body.pass);
    hmac.end();
    hash = hmac.read().toString('hex');
    db.one("SELECT * FROM users WHERE login = $1 and pass = $2",[req.body.login,hash])
        .then(user =>{
            let randomNumber=Math.random().toString();
            randomNumber=randomNumber.substring(2,randomNumber.length);
            res.cookie('chatUser',randomNumber);
            // let key = randomInteger(1, 100);
            db.query("INSERT INTO keys(cookie,login) VALUES ($1,$2)",[randomNumber,req.body.login])
                .then(res.redirect("/chat_room"));
        })
        .catch(e => {
            console.log(e);
            res.render("reg_page.ejs",{error:true, error_message:"Неверный логин или пароль!"});
        })
}

function registration(req,res){
    hmac = crypto.createHmac(algorithm,secret);
    hmac.write(req.body.pass);
    hmac.end();
    hash = hmac.read().toString('hex');
    db.one("SELECT * FROM users WHERE login = $1 and pass = $2",[req.body.login,hash])
        .then(user =>{
            res.render("reg_page.ejs",{error:true,error_message:"Пользователь с таким логином уже существует!"});
        })
        .catch(e => {
            if(e.name == "QueryResultError"){
                db.query("INSERT INTO users(login,pass) VALUES ($1,$2)",[req.body.login,hash]).
                then( response => {
                    let randomNumber = Math.random().toString();
                    randomNumber = randomNumber.substring(2, randomNumber.length);
                    res.cookie('chatUser', randomNumber);
                    //let key = randomInteger(1, 100);
                    db.query("INSERT INTO keys(cookie,key,login) VALUES ($1,$2,$3)", [randomNumber, req.body.key, req.body.login])
                        .then(res.redirect("/chat_room"));
                });
            }
            else{
                res.render("reg_page.ejs",{error:true, error_message:"Что-то пошло не так :("});
            }
        })
}

function chatRoomPage (req, res){
    let cookie = req.cookies.chatUser;
    if(cookie === undefined){
        res.redirect("/");
    }
    else{
        db.one("SELECT * FROM keys WHERE cookie = $1",[cookie])
            .then(user=>{
                res.render("chat_room.ejs",{login:user.login});
            })
    }
}

function randomInteger(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
}

function exit(req,res){
    let cookie = req.cookies.chatUser;
    db.query("DELETE FROM keys WHERE cookie = $1",[cookie])
        .then(obj=>{res.clearCookie('chatUser');
                res.clearCookie("chatUser");
                res.redirect("/");}
            )
}



module.exports = {
    setParams:setParams,
    enter:enter,
    mainPage:mainPage,
    registration:registration,
    chatRoomPage:chatRoomPage,
    exit:exit
}