let enter_btn = document.querySelector("form input[value=\"Вход\"]");
enter_btn.addEventListener("click",()=>{
    getPrivateKey("/login");
});
let reg_btn = document.querySelector("form input[value=\"Регистрация\"]");
reg_btn.addEventListener("click",()=>{
    getPrivateKey("/registration");
});

let publicKey;

//Получение открытого ключа
function getPrivateKey (route) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET","/get_public_key",true);
    xhr.responseType = "json";
    xhr.onload= function () {
        console.log(`Публичный ключ сервера: ${xhr.response.key}`);
        publicKey = xhr.response.key;
        action(route);
    }
    xhr.send();
}


function createTmpForm(formAction,login,pass) {
    let form = document.createElement("form");
    form.style.display = "none";

    let login_inp = document.createElement("input");
    login_inp.setAttribute("type","text");
    login_inp.value = login;
    login_inp.setAttribute("name","login")
    form.appendChild(login_inp);

    let pass_inp = document.createElement("input");
    pass_inp.setAttribute("type","pass");
    pass_inp.setAttribute("name","pass");
    pass_inp.value = pass;
    form.appendChild(pass_inp);

    let btn_submit = document.createElement("input");
    btn_submit.setAttribute("type","submit");
    btn_submit.formAction = formAction;
    btn_submit.formMethod = "post";
    form.appendChild(btn_submit);

    return {form:form,btn:btn_submit};
}

//Формирование POST-запросов для входа и регистрации
function action(formAction) {
    let login = document.querySelector("input[type=\"text\"]").value;
    let pass = document.querySelector("input[type=\"password\"]").value;

    //Если вход
    if(formAction == "/login"){
        //Запрос состояния пользователя
        let xhr = new XMLHttpRequest();
        xhr.open("POST","/get_current_state",true);
        let body_x = "login=" + encodeURIComponent(login);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.responseType = "json";
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4 && xhr.status == 200) {
                let current_state = xhr.response.state;
                //Если состояние = 5 - генерируем новые пароли
                if(current_state == 5){
                    //Проверяем текущий пароль и логин
                    rsaWrapper.publicEncrypt(publicKey,pass)
                        .then(encrypted_pass=>{
                            let xhr_check_user = new XMLHttpRequest();
                            xhr_check_user.open("POST","/check_user",true);
                            let body_check = "login=" + encodeURIComponent(login) + "&pass=" + encodeURIComponent(encrypted_pass);
                            xhr_check_user.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                            xhr_check_user.responseType = "json";
                            xhr_check_user.onreadystatechange = function() {
                                if(xhr_check_user.readyState == 4 && xhr_check_user.status == 200) {
                                    //Если логин и пароль верные - создаем новые
                                    if(xhr_check_user.response.correct){
                                        let keys = 0;
                                        let randomNumber="";
                                        let first_pass = 0;
                                        while (keys!=5){
                                            randomNumber += randomInteger(10000000,99999999).toString();
                                            if(keys<1)
                                                first_pass = randomNumber;
                                            console.log(randomNumber);
                                            keys++;
                                            if(keys<5)
                                                randomNumber +=":";
                                        }
                                        console.log("GEN 5 PASS");
                                        console.log(`${randomNumber}`);
                                        //Шифруем сгенерированные пароли
                                        rsaWrapper.publicEncrypt(publicKey,randomNumber)
                                            .then(encrypted_pass=>{
                                                //Отправляем на сервер
                                                let xhrSetPass= new XMLHttpRequest();
                                                let body = "login=" + encodeURIComponent(login) + "&pass=" + encodeURIComponent(encrypted_pass);
                                                xhrSetPass.open("POST","/setNewPass",true);
                                                xhrSetPass.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                                                xhrSetPass.onreadystatechange = function() {
                                                    if(xhr.readyState == 4 && xhr.status == 200) {
                                                        rsaWrapper.publicEncrypt(publicKey,first_pass)
                                                            .then(encrypted_pass=>{
                                                                let tmp_form = createTmpForm(formAction,login,encrypted_pass);
                                                                let form = document.querySelector("form");
                                                                form.appendChild(tmp_form.form);
                                                                tmp_form.btn.click();
                                                            })
                                                    }
                                                }
                                                xhrSetPass.send(body);
                                            })
                                    }
                                    else{
                                        document.querySelector("input[type=\"text\"]").value = "";
                                        document.querySelector("input[type=\"password\"]").value = "";
                                        window.alert("Неверный пароль!")
                                    }
                                }
                            }
                            xhr_check_user.send(body_check);
                        })
                }
                //Если состояние не = 5, отправляем форму на сервер
                else {
                    rsaWrapper.publicEncrypt(publicKey,pass)
                        .then(encrypted_pass=>{
                            let tmp_form = createTmpForm(formAction,login,encrypted_pass);
                            let form = document.querySelector("form");
                            form.appendChild(tmp_form.form);
                            tmp_form.btn.click();
                        })
                }
            }
        }
        xhr.send(body_x);
        }
    //Если регистрация
    else{
        generateKeys(formAction,login);
    }
}


//Генерация ключей и отправка на сервер
function generateKeys(formAction,login){
    let keys = 0;
    let randomNumber="";
    while (keys!=5){
        randomNumber += randomInteger(10000000,99999999).toString();
        console.log(randomNumber);
        keys++;
        if(keys<5)
            randomNumber +=":";

    }
    console.log("GEN 5 PASS");
    console.log(`${randomNumber}`);
    //Шифрование полученных ключей и отправка на сервер
    rsaWrapper.publicEncrypt(publicKey,randomNumber)
        .then(encrypted_pass=>{
            let tmp_form = createTmpForm(formAction,login,encrypted_pass);
            let form = document.querySelector("form");
            form.appendChild(tmp_form.form);
            tmp_form.btn.click();
        })
}

function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}