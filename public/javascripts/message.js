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


function sendMessage() {
    if(document.querySelector(".message_area form textarea").value !=="" && document.querySelector(".message_area form textarea").value !== undefined){
        try {
            let xhrForKey = new XMLHttpRequest();
            xhrForKey.open("POST","/get_key",true);
            let body = "chatUser="+ encodeURIComponent(getCookie("chatUser"));
            xhrForKey.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhrForKey.responseType = "json";
            xhrForKey.onreadystatechange = function(){
                if(xhrForKey.readyState === XMLHttpRequest.DONE && xhrForKey.status === 200) {
                    let key = xhrForKey.response.key;
                    let message = document.querySelector(".message_area textarea").value;
                    addCurrentUserMessage(message,login);
                    message = cesarCode(message,key);
                    socket.emit('message',message,key,login);
                };

            }
            xhrForKey.send(body)
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
    console.log(keys);
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