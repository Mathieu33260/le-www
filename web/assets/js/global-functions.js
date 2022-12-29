/* eslint-disable */

function loadJs(a,b){var c=document.getElementsByTagName("head")[0],d=document.createElement("script");d.type="text/javascript",d.src=a,d.onreadystatechange=b,d.onload=b,c.appendChild(d)}

/*
 * http://spyrestudios.com/building-a-live-textarea-character-count-limit-with-css3-and-jquery/
 * @param {jQuery} obj
 * @param {integer} limit
 * @param {function} callback
 * @example $('#giftText').on('keyup',function(){ formLimitsCharacters({input: $(this),limit: 80,substr: true});});
 */
function formLimitsCharacters(object){
    var counter = $(object.input).siblings(".counter").find("span"),
        text = $(object.input).val(),
        length = Array.from(text).length; // with that emojis = 1
    counter.html(length - 1);
    if(length > object.limit){
        counter.html(object.limit - length);
        if(object.substr){
            $(object.input).val(text.substr(0, object.limit));
        }
        if(typeof object.callbackExceeded !== 'undefined'){
            object.callbackExceeded(length);
        }
    }else {
        counter.html(object.limit - length);
        if(typeof object.callbackCorrect !== 'undefined'){
            object.callbackCorrect(length);
        }
    }
}

function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getWidth() {
    if (self.innerWidth) {
        return self.innerWidth;
    }

    if (document.documentElement && document.documentElement.clientWidth) {
        return document.documentElement.clientWidth;
    }

    if (document.body) {
        return document.body.clientWidth;
    }
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getDateFromString(str) {
    var month = parseInt(str.substring(5, 7));
    if(month > 0){
        month = month-1;
    }
    var date = new Date(
        str.substring(0, 4),
        month,
        str.substring(8, 10),
        str.substring(11, 13),
        str.substring(14, 16),
        str.substring(17, 19)
    );
    return date;
}

function getInternetExplorerVersion() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
}

function validatePhoneMobile(num) {
    var re = /^(06|07)[0-9]{8}$/;
    return re.test(num);
}

function validateEmail(email) {
    var re = /^([\w-+]+(?:\.[\w-+]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}