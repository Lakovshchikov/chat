let key;
let encrypted_key;
let server_public_key;
//формирование ключа для шифрования сообщения
window.onload = function() {
    //отправка запроса на получени ключа
    let xhrForKey = new XMLHttpRequest();
    xhrForKey.open("POST", "/get_key", true);
    let body = "chatUser=" + encodeURIComponent(getCookie("chatUser"));
    xhrForKey.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhrForKey.responseType = "json";
    xhrForKey.onload = function () {
        key = xhrForKey.response.key;
        //если ключ вернулся пустым - формируется новый и сохраняется в БД
        if(key==null){
            let xhrSetKey = new XMLHttpRequest();
            key = randomInteger(1,100);
            xhrSetKey.open("POST", "/set_key", true);
            let body_key = "cookie=" + encodeURIComponent(getCookie("chatUser")) + "&key=" + encodeURIComponent(key);
            xhrSetKey.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhrSetKey.send(body_key);
            //получение публичного ключа сервера, и шифрование ключа для сообщения
            getServerPubKey();
        }
        else{
            getServerPubKey();
        }
    }
    xhrForKey.send(body)
}

function getServerPubKey() {
    let xhrGetPubKey = new XMLHttpRequest();
    xhrGetPubKey.open("GET","get_public_key",true);
    xhrGetPubKey.responseType = "json";
    xhrGetPubKey.onload= function () {
        console.log(`Публичный ключ сервера: ${xhrGetPubKey.response.key}`);
        server_public_key = xhrGetPubKey.response.key;
        rsaWrapper.publicEncrypt(server_public_key,key)
            .then(k=>{
                encrypted_key=k;
            })
    }
    xhrGetPubKey.send();
}

document.querySelector(".message_area input").addEventListener("click",sendMessage);
document.querySelector(".message_area input[value=\"Выход\"").addEventListener("click",exit);
let login = document.querySelector(".userName").textContent;

var socket = io();
socket.emit("userConnected",{login:login});
socket.on('messageReceived', (data) => {
    addUserMessage(data.message,data.login);
})
socket.on('userConnectedMess',data=>{
    addServerMessage(`Пользователь ${data.login} зашел в чат`);
})
socket.on('userDisconnectMess',data=>{
    addServerMessage((`Пользователь ${data.login} вышел из чата`));
})

//Для нескольких клиентов, но не работает
// socket.on('server_encrypted_mes',data=>{
//     addUserMessage(data.encrypted_message,data.login);
//     rsaWrapper.privateDecrypt(document.getElementById("client_private_key").value,data.encrypted_message).then( message => {
//         console.log(message);
//         console.log(typeof message);
//
//         addUserMessage(message,data.login);
//     });
//
// })
// socket.on("getPubKeys",(data)=>{
//     socket.emit("keys",rsaWrapper.getPublicKeyArrayBuffer(document.getElementById("client_public_key").value));
// })


function sendMessage() {
    if(document.querySelector(".message_area form textarea").value !=="" && document.querySelector(".message_area form textarea").value !== undefined){
        try {
            let message = document.querySelector(".message_area textarea").value;
            addCurrentUserMessage(message,login);
            //Для нескольких клиентов, но не работает
            // rsaWrapper.publicEncrypt(document.getElementById("server_public_key").value,message)
            //     .then((msg)=>{
            //         addCodeMessage(msg,"current");
            //         socket.emit("rsa_encrypted_mes",msg);
            //     })
                // .then(socket.emit("rsa_encrypted_mes",{encrypted_message:message.toString("base64"),login:"current"}));
            message = cesarCode(message,key);
            addCodeMessage(key,login);
            addCodeMessage(message,login);
            //Для отображения того, что приходит на сервер, но надо поправить из-за шифрования(ключа)
                let xht = new XMLHttpRequest();
                xht.open("POST","/new_message",true);
                let body = "message=" + encodeURIComponent(message) + "&key=" +encodeURIComponent(encrypted_key);
                xht.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xht.responseType = "json";
                xht.onload = function(){
                    addServerMessage(xht.response.message);
                    addServerMessage(xht.response.codeMes);
                }
                xht.send(body);
            socket.emit('message',message,encrypted_key,login);
        }
        catch (e) {
            addErrorMessage(e.message);
        }
    }
    else{
        alert("Введите сообщение!");
    }
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
    return out;
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ))
    return matches ? decodeURIComponent(matches[1]) : undefined
}

function exit() {
    socket.emit('userDisconnect',{login:login});
}

function randomInteger(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
}





function addCurrentUserMessage(text,userName) {
    createMessage("user_message",text,userName);
}

function addCodeMessage(text,userName) {
    createMessage("code_message",text,userName+"-code");
}

function addErrorMessage(text) {
    createMessage("error_message",text);
}

function addServerMessage(text) {
    createMessage("server_message",text,"Server");
}

function addUserMessage(text,userName) {
    createMessage("",text,userName);
}

function createMessage(type_class,text,userName) {
    let message_area = document.querySelector(".messages");
    let message = document.createElement("div");
    message.classList.add("message");
    if(type_class!="")
        message.classList.add(type_class);

    let h3 = document.createElement("h3");
    h3.innerText=userName;
    message.appendChild(h3);

    let text_container = document.createElement("div");
    text_container.classList.add("text_container");
    let text_div = document.createElement("span");
    text_div.classList.add("text_mess");
    text_div.innerText = text;
    text_container.appendChild(text_div);
    message.appendChild(text_container);

    message_area.appendChild(message);
}