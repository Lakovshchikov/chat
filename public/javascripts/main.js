let enter_btn = document.querySelector("form input[value=\"Вход\"]");
enter_btn.click.preventDefault();
enter_btn.addEventListener("click",login);

function login() {
    let xhr = new XMLHttpRequest();
    xhr.send("POST","/login",true);
    let login = document.getElementsByName("login").value;
    let pass = document.getElementsByName("pass").value;
    let body = `login=${encodeURIComponent(login)}&pass=${encodeURIComponent(pass)}`
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function(){

    }
    xhr.send(body);
}

function randomInteger(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1)
    rand = Math.round(rand);
    return rand;
}