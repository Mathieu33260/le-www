/* POLYFILL Array.from */
if (!Array.from) {
  Array.from = (function () {
      var toStr = Object.prototype.toString;
      var isCallable = function (fn) {
          return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
      };
      var toInteger = function (value) {
          var number = Number(value);
          if (isNaN(number)) { return 0; }
          if (number === 0 || !isFinite(number)) { return number; }
          return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };
      var maxSafeInteger = Math.pow(2, 53) - 1;
      var toLength = function (value) {
          var len = toInteger(value);
          return Math.min(Math.max(len, 0), maxSafeInteger);
      };

      // The length property of the from method is 1.
      return function from(arrayLike/*, mapFn, thisArg */) {
          // 1. Let C be the this value.
          var C = this;

          // 2. Let items be ToObject(arrayLike).
          var items = Object(arrayLike);

          // 3. ReturnIfAbrupt(items).
          if (arrayLike == null) {
              throw new TypeError('Array.from requires an array-like object - not null or undefined');
          }

          // 4. If mapfn is undefined, then let mapping be false.
          var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
          var T;
          if (typeof mapFn !== 'undefined') {
              // 5. else
              // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
              if (!isCallable(mapFn)) {
                  throw new TypeError('Array.from: when provided, the second argument must be a function');
              }

              // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
              if (arguments.length > 2) {
                  T = arguments[2];
              }
          }

          // 10. Let lenValue be Get(items, "length").
          // 11. Let len be ToLength(lenValue).
          var len = toLength(items.length);

          // 13. If IsConstructor(C) is true, then
          // 13. a. Let A be the result of calling the [[Construct]] internal method
          // of C with an argument list containing the single item len.
          // 14. a. Else, Let A be ArrayCreate(len).
          var A = isCallable(C) ? Object(new C(len)) : new Array(len);

          // 16. Let k be 0.
          var k = 0;
          // 17. Repeat, while k < len… (also steps a - h)
          var kValue;
          while (k < len) {
              kValue = items[k];
              if (mapFn) {
                  A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
              } else {
                  A[k] = kValue;
              }
              k += 1;
          }
          // 18. Let putStatus be Put(A, "length", len, true).
          A.length = len;
          // 20. Return A.
          return A;
      };
  }());
}
/* END POLYFILL Array.from */

/* POLYFILL append */

// Source: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
/* eslint-disable */
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('append')) {
      return;
    }
    Object.defineProperty(item, 'append', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function append() {
        var argArr = Array.prototype.slice.call(arguments),
          docFrag = document.createDocumentFragment();
        
        argArr.forEach(function (argItem) {
          var isNode = argItem instanceof Node;
          docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
        });
        
        this.appendChild(docFrag);
      }
    });
  });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);

/* END POLYFILL append */

/* POLYFILL remove */

// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('remove')) {
      return;
    }
    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        if (this.parentNode !== null)
          this.parentNode.removeChild(this);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/* END POLYFILL remove */

/* POLYFILL closest */
// from https://developer.mozilla.org/fr/docs/Web/API/Element/closest

if (!Element.prototype.matches)
  Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;

if (!Element.prototype.closest)
  Element.prototype.closest = function(s) {
      var el = this;
      if (!document.documentElement.contains(el)) return null;
      do {
          if (el.matches(s)) return el;
          el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType == 1); 
      return null;
  };

/* END POLYFILL closest */
