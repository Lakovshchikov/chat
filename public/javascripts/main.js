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
    rsaWrapper.publicEncrypt(publicKey,pass)
        .then(encrypted_pass=>{
            let tmp_form = createTmpForm(formAction,login,encrypted_pass);
            let form = document.querySelector("form");
            form.appendChild(tmp_form.form);
            tmp_form.btn.click();
        })
}