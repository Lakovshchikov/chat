let db,
    io;


function setParams(_db,_io) {
    db=_db;
    io=_io;
}




function getKey(req,res) {
    db.query("SELECT * FROM keys WHERE cookie = $1",[req.body.chatUser])
        .then(data => {
            res.send({ key: data[0].key })
        });
}

function newMessage(req,res) {
    db.query("SELECT * FROM keys WHERE cookie = $1",[req.body.chatUser])
        .then(data =>{
            let decodeMes = decodeMessage(req.body.code_message,data[0].key);
            res.send({ decodeM: decodeMes,codeM:req.body.code_message });
        })
}





function randomInteger(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
}

function decodeMessage(message,key){
    const offset = key;
    let out = '';
    for (let i=0; i< message.length; i++){
        let code = message.charCodeAt(i);
        code = code - offset;
        out += String.fromCharCode(code);
    }
    return out;
}

module.exports = {
    newMessage:newMessage,
    setParams:setParams,
    getKey:getKey

}