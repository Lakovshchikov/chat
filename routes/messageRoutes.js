let db,
    io,
    rsaWrapper;


function setParams(_db,_io,_rsaWrapper) {
    db=_db;
    io=_io;
    rsaWrapper=_rsaWrapper;

}



//Получение открытого ключа
function getKey(req,res) {
    let query = `SELECT * FROM keys WHERE cookie = '${req.body.chatUser}'`;
    db.query(query)
        .then(data => {
            if(data[0].key!=null){
                let decrypt_key = rsaWrapper.decrypt(rsaWrapper.serverPrivate,data[0].key)
                res.send({ key: decrypt_key })
            }
            else{
                res.send({ key: null })
            }
        })
        .catch(e=>{
            console.log(e);
        });
}

//Установка симметричного ключа в БД
function setKey(req) {
    let query = `UPDATE keys SET key = ('${req.body.key}') WHERE cookie = '${req.body.cookie}'`;
    db.query(query);
}

function newMessage(req,res) {
    let code_mess = req.body.message;
    let cookie = req.cookies.chatUser;
    let query = `SELECT * FROM keys WHERE cookie = \'${cookie}\'`;
    db.one(query)
        .then(user =>{
            let decrypted_key = rsaWrapper.decrypt(rsaWrapper.serverPrivate,user.key);
            let decodeM = decodeMessage(code_mess,decrypted_key);
            res.send({ message: "Зашифрованное сообщение: " +req.body.message,codeMes:"Расшифрованное сообщение: " + decodeM});
        })
        .catch(e =>{
            console.log(e);
        })
}


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

module.exports = {
    newMessage:newMessage,
    setParams:setParams,
    getKey:getKey,
    setKey:setKey

}