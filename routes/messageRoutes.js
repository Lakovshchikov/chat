let db,
    io,
    rsaWrapper;


function setParams(_db,_io,_rsaWrapper) {
    db=_db;
    io=_io;
    rsaWrapper=_rsaWrapper;

}




function getKey(req,res) {
    let query = `SELECT * FROM keys WHERE cookie = '${req.body.chatUser}'`;
    db.query(query)
        .then(data => {
            res.send({ key: data[0].key })
        });
}

function setKey(req) {
    let query = `UPDATE keys SET key = (${req.body.key}) WHERE cookie = '${req.body.cookie}'`;
    db.query(query);
}

function newMessage(req,res) {
    let code_mess = req.body.message;
    let decrypted_key = rsaWrapper.decrypt(rsaWrapper.serverPrivate,req.body.key);
    let decodeM = decodeMessage(code_mess,decrypted_key);
    res.send({ message: req.body.message,codeMes:decodeM});
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