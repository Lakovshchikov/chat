// let enter_btn = document.querySelector("form input[value=\"Вход\"]");
//
// enter_btn.addEventListener("click",login);
// let reg_btn = document.querySelector("form input[value=\"Регистрация\"]");
//
// reg_btn.addEventListener("click",registration);

window.onload = function () {
    document.querySelector("input[name=\"key\"]").value = randomInteger(1,100);
}

// function login() {
//     let xhr = new XMLHttpRequest();
//     xhr.open("POST","/login",true);
//     let login = document.querySelector("input[type=\"text\"]").value;
//     let pass = document.querySelector("input[type=\"password\"]").value;
//     let key = randomInteger(1,100);
//     let body = `login=${encodeURIComponent(login)}&pass=${encodeURIComponent(pass)}&key=${encodeURIComponent(key)}`
//     xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
//     xhr.send(body);
// }
//
// function registration() {
//     let xhr = new XMLHttpRequest();
//     xhr.open("POST","/registration",true);
//     let login = document.querySelector("input[type=\"text\"]").value;
//     let pass = document.querySelector("input[type=\"password\"]").value;
//     let key = randomInteger(1,100);
//     let body = `login=${encodeURIComponent(login)}&pass=${encodeURIComponent(pass)}&key=${encodeURIComponent(key)}`
//     xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
//     xhr.send(body);
// }

function randomInteger(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
}