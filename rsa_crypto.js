const rsaWrapper = {};
var rsa,
    fs,
    crypto,
    path;

rsaWrapper.dependencyInjection = (_fs,_rsa,_crypto,_path) => {
    fs = _fs;
    rsa = _rsa;
    crypto = _crypto;
    path = _path;
}
//создание пары ключей
rsaWrapper.generateKeys = (direction) => {
    let key = new rsa();
    //2048 - длина ключа, 65537 - открытая экспонента
    key.generateKeyPair(2048, 65537);
    //сохранение ключа в формате PEM (по pkcs стандарту)
    fs.writeFileSync(path.resolve(__dirname, "keys", direction + "_private.pem"), key.exportKey(`pkcs8-private-pem`));
    fs.writeFileSync(path.resolve(__dirname,"./","public", `keys`, direction + `_public.pem`), key.exportKey(`pkcs8-public-pem`));
    return true;
}

rsaWrapper.generateClientKeys = () => {
    let key = new rsa();
    key.generateKeyPair(2048, 65537);
    let p = path.resolve(__dirname,"./","public", "keys");
    console.log(p);
    fs.writeFileSync(path.resolve(__dirname,"./","public", "keys",  "client_private.pem"), key.exportKey(`pkcs8-private-pem`));
    fs.writeFileSync(path.resolve(__dirname,"./","public", `keys`, `client_public.pem`), key.exportKey(`pkcs8-public-pem`));
    return true;
};

//получение серверного публичного ключа
rsaWrapper.getKeys = (basePath) => {
    let server_public_key = fs.readFileSync(path.resolve(basePath,"../","public","keys", `server_public.pem`)).toString("utf-8");
    // server_public_key = server_public_key.match(/-----BEGIN PRIVATE KEY-----([^&]*)-----END PRIVATE KEY-----/ig);
    // let client_public_key = fs.readFileSync(path.resolve(basePath,"../","public","keys", `client_public.pem`)).toString("utf-8");
    // client_public_key = client_public_key.match(/-----BEGIN PRIVATE KEY-----([^&]*)-----END PRIVATE KEY-----/ig);
    // let client_private_key = fs.readFileSync(path.resolve(basePath,"../","public","keys", `client_private.pem`)).toString("utf-8");
    // client_private_key = client_private_key.match(/-----BEGIN PRIVATE KEY-----([^&]*)-----END PRIVATE KEY-----/ig);
    return {server_public_key:server_public_key}
};


//инициализация серверных ключей
rsaWrapper.initLoadServerKeys = (basePath) => {
    rsaWrapper.serverPub = fs.readFileSync(path.resolve(basePath,"public", "keys", "server_public.pem"));
    console.log("server_pub_key");
    console.log(typeof rsaWrapper.serverPub);
    console.log(rsaWrapper.serverPub);
    //console.log(rsaWrapper.serverPub.toString("utf-8"));
    rsaWrapper.serverPrivate = fs.readFileSync(path.resolve(basePath, "keys", "server_private.pem"));
    //костыль
    //rsaWrapper.clientPub = fs.readFileSync(path.resolve(basePath,"public","keys","client_private.pem"));
};

//шифрование сообщения
rsaWrapper.encrypt= (publicKey, message) => {
    console.log("Key:");
    console.log(typeof publicKey);
    console.log(publicKey);
    //crypto - библиотека для криптошрафии
    //шифрование сообщения публичным ключем
    let enc = crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message));
    return enc.toString(`base64`);
};
//расшифровка сообщения
rsaWrapper.decrypt = (privateKey, message) => {
    //crypto - библиотека для криптошрафии
    //расшифровка сообщения публичным ключем
    let enc = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.RSA_PKCS1_OAEP_PADDING
    }, Buffer.from(message, 'base64'));
    return enc.toString();
};

module.exports = rsaWrapper;
