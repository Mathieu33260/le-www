/* eslint-disable */

!function (w) {
    // Old browsers
    w.console = w.console || {};
    var l = w.console,
    f = function () {};
    l.debug = l.debug || f,
    l.log = l.log || f,
    l.error = l.error || f,
    l.groupCollapsed = l.groupCollapsed || f,
    l.groupEnd = l.groupEnd || f;
}(window);

var dataLayer = dataLayer || [];
Array.prototype.indexOf||(Array.prototype.indexOf=function(a,b){var c;if(null==this)throw new TypeError('"this" is null or not defined');var d=Object(this),e=d.length>>>0;if(0===e)return-1;var f=0|b;if(f>=e)return-1;for(c=Math.max(f>=0?f:e-Math.abs(f),0);c<e;){if(c in d&&d[c]===a)return c;c++}return-1});

var leErrs = {
    lastArgs : [null, null, null],
    nbSameError : 0,
    meta : {},
    shouldTrack : function (args) {
        if(this.lastArgs[0] === args[0] && this.lastArgs[1] === args[1] && this.lastArgs[2] === args[2]) {
            if(this.nbSameError > 2) {
                return false;
            }
            this.nbSameError ++;
        } else {
            this.lastArgs = args;
            this.nbSameError = 1; // Re-init
        }
        return true;
    },
    track : function (error) {
        if(env!='prod'){
            console.error('leErrs.track : ', error);
        }
        if((!getInternetExplorerVersion() || getInternetExplorerVersion() > 8) && this.shouldTrack([error.name + ": " + error.message, error.fileName || error.sourceURL, error.line || error.lineNumber])) {
            var _errsIsDefined = typeof _errs !== 'undefined';
            $.each(this.meta, function(index, value){
                if(_errsIsDefined){
                    _errs.meta[index] = value;
                }
            });
            if(_errsIsDefined){
                return _errs.push(error);
            }
        }
    }
};
if(env=='prod'){
    (function(_,e,rr,s){_errs=[s];var c=_.onerror;_.onerror=function(){var a=arguments;if(!leErrs.shouldTrack(a)){return;}_errs.push(a);
    c&&c.apply(this,a)};var b=function(){var c=e.createElement(rr),b=e.getElementsByTagName(rr)[0];
    c.src="//beacon.errorception.com/"+s+".js";c.async=!0;b.parentNode.insertBefore(c,b)};
    _.addEventListener?_.addEventListener("load",b,!1):_.attachEvent("onload",b)})
    (window,document,"script",errorcep);
    _errs.meta = {userId: userId,ip: ip,screenWidth: window.innerWidth,referrer: document.referrer};
}

function getCookie(name) {
    var value = "; " + window.document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    window.document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function eraseCookie(name) {
    setCookie(name, 0, 0);
}

if (window.location.search.indexOf('beta_aroundme') > -1) {
    navigator.geolocation.getCurrentPosition(function(pos) {
        XMLHttpRequest.prototype.origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open   = function () {
            this.origOpen.apply(this, arguments);
            this.setRequestHeader('X-BETA-GEO-LAT', pos.coords.latitude);
            this.setRequestHeader('X-BETA-GEO-LNG', pos.coords.longitude);
            this.setRequestHeader('X-BETA-KM-MAX', '1000');
        };
    });
}
