(function () {

    'use strict';
    //получение объекта, ддоступа к возможностям криптографии браузера
    var crypto = window.crypto.subtle;
    //настройки шифрования
    var rsaParams =  {name:"RSA-OAEP", hash: {name: "SHA-1"}};

    //установка публичного ключа
    function importPublicKey(keyInPemFormat){
        return new Promise(function(resolve, reject){
            //преобразование из PEM формата
            var key = converterWrapper.convertPemToBinary2(keyInPemFormat);
            key = converterWrapper.base64StringToArrayBuffer(key);
            //импортирование ключа, возвращение объекта CryptoKey
            crypto.importKey('spki', key, rsaParams, false, ["encrypt"])
                .then(function(cryptokey) {
                    resolve(cryptokey);
                });
        });
    }
    //установка закрытого ключа
    function importPrivateKey(keyInPemFormat){
        //преобразование из PEM формата
        var key = converterWrapper.convertPemToBinary2(keyInPemFormat);
        key = converterWrapper.base64StringToArrayBuffer(key);
        //импортирование ключа, возвращение объекта CryptoKey
        return new Promise(function(resolve, reject){
            crypto.importKey('pkcs8', key, rsaParams, false, ["decrypt"])
                .then(function(cryptokey) {
                    resolve(cryptokey);
                });
        });
    }
    //Шифрование публичным ключем
    function publicEncrypt(keyInPemFormat, message) {
        return new Promise(function(resolve, reject){
            importPublicKey(keyInPemFormat).then(function (key) {
                //Зашифровка сообщения
                crypto.encrypt(rsaParams, key, converterWrapper.str2abUtf8(message))
                    .then(function(encrypted){
                        resolve(converterWrapper.arrayBufferToBase64String(encrypted));
                    });
            })
        });
    }
    //Расшифровка закрытым ключем
    function privateDecrypt(keyInPemFormat, encryptedBase64Message) {
        return new Promise(function(resolve, reject){
            importPrivateKey(keyInPemFormat).then(function (key) {
                //расшифровка сообщения
                crypto.decrypt(rsaParams, key, converterWrapper.base64StringToArrayBuffer(encryptedBase64Message))
                    .then(function(decrypted){
                        resolve(converterWrapper.arrayBufferToUtf8(decrypted));
                    });
            });
        });
    }

    function getPublicKeyArrayBuffer(keyInPemFormat){
        importPublicKey(keyInPemFormat).then(function (key) {
            return key;
        })
    }

    window.rsaWrapper = {
        importPrivateKey: importPrivateKey,
        importPublicKey: importPublicKey,
        privateDecrypt: privateDecrypt,
        publicEncrypt: publicEncrypt,
        getPublicKeyArrayBuffer:getPublicKeyArrayBuffer
    }

}());
