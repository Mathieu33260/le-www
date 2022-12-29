/*!
 * Vue.js v2.2.0
 * (c) 2014-2017 Evan You
 * Released under the MIT License.
 */
/*!
 * Vue.js v2.5.16
 * (c) 2014-2018 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Vue = factory());
}(this, (function () { 'use strict';

/*  */

var emptyObject = Object.freeze({});

// these helpers produces better vm code in JS engines due to their
// explicitness and function inlining
function isUndef (v) {
  return v === undefined || v === null
}

function isDef (v) {
  return v !== undefined && v !== null
}

function isTrue (v) {
  return v === true
}

function isFalse (v) {
  return v === false
}

/**
 * Check if value is primitive
 */
function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value e.g. [object Object]
 */
var _toString = Object.prototype.toString;

function toRawType (value) {
  return _toString.call(value).slice(8, -1)
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}

function isRegExp (v) {
  return _toString.call(v) === '[object RegExp]'
}

/**
 * Check if val is a valid array index.
 */
function isValidArrayIndex (val) {
  var n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

/**
 * Convert a value to a string that is actually rendered.
 */
function toString (val) {
  return val == null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 */
function toNumber (val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (
  str,
  expectsLowerCase
) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? function (val) { return map[val.toLowerCase()]; }
    : function (val) { return map[val]; }
}

/**
 * Check if a tag is a built-in tag.
 */
var isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if a attribute is a reserved attribute.
 */
var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array
 */
function remove (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 */
function cached (fn) {
  var cache = Object.create(null);
  return (function cachedFn (str) {
    var hit = cache[str];
    return hit || (cache[str] = fn(str))
  })
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

/**
 * Capitalize a string.
 */
var capitalize = cached(function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
});

/**
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
});

/**
 * Simple bind polyfill for environments that do not support it... e.g.
 * PhantomJS 1.x. Technically we don't need this anymore since native bind is
 * now more performant in most browsers, but removing it would be breaking for
 * code that was able to run in PhantomJS 1.x, so this must be kept for
 * backwards compatibility.
 */

/* istanbul ignore next */
function polyfillBind (fn, ctx) {
  function boundFn (a) {
    var l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length;
  return boundFn
}

function nativeBind (fn, ctx) {
  return fn.bind(ctx)
}

var bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind;

/**
 * Convert an Array-like object to a real Array.
 */
function toArray (list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret
}

/**
 * Mix properties into target object.
 */
function extend (to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}

/**
 * Merge an Array of Objects into a single Object.
 */
function toObject (arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/)
 */
function noop (a, b, c) {}

/**
 * Always return false.
 */
var no = function (a, b, c) { return false; };

/**
 * Return same value
 */
var identity = function (_) { return _; };

/**
 * Generate a static keys string from compiler modules.
 */
function genStaticKeys (modules) {
  return modules.reduce(function (keys, m) {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
function looseEqual (a, b) {
  if (a === b) { return true }
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      var isArrayA = Array.isArray(a);
      var isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every(function (e, i) {
          return looseEqual(e, b[i])
        })
      } else if (!isArrayA && !isArrayB) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(function (key) {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

function looseIndexOf (arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) { return i }
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
function once (fn) {
  var called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  }
}

var SSR_ATTR = 'data-server-rendered';

var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];

var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured'
];

/*  */

var config = ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  productionTip: "development" !== 'production',

  /**
   * Whether to enable devtools
   */
  devtools: "development" !== 'production',

  /**
   * Whether to record perf
   */
  performance: false,

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
})

/*  */

/**
 * Check if a string starts with $ or _
 */
function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.
 */
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Parse simple path.
 */
var bailRE = /[^\w.$]/;
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.');
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) { return }
      obj = obj[segments[i]];
    }
    return obj
  }
}

/*  */

// can we use __proto__?
var hasProto = '__proto__' in {};

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined';
var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;

// Firefox has a "watch" function on Object.prototype...
var nativeWatch = ({}).watch;

var supportsPassive = false;
if (inBrowser) {
  try {
    var opts = {};
    Object.defineProperty(opts, 'passive', ({
      get: function get () {
        /* istanbul ignore next */
        supportsPassive = true;
      }
    })); // https://github.com/facebook/flow/issues/285
    window.addEventListener('test-passive', null, opts);
  } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
var _isServer;
var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

// detect devtools
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

/* istanbul ignore next */
function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

var hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

var _Set;
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = (function () {
    function Set () {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has (key) {
      return this.set[key] === true
    };
    Set.prototype.add = function add (key) {
      this.set[key] = true;
    };
    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

/*  */

var warn = noop;
var tip = noop;
var generateComponentTrace = (noop); // work around flow check
var formatComponentName = (noop);

{
  var hasConsole = typeof console !== 'undefined';
  var classifyRE = /(?:^|[-_])(\w)/g;
  var classify = function (str) { return str
    .replace(classifyRE, function (c) { return c.toUpperCase(); })
    .replace(/[-_]/g, ''); };

  warn = function (msg, vm) {
    var trace = vm ? generateComponentTrace(vm) : '';

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace);
    } else if (hasConsole && (!config.silent)) {
      console.error(("[Vue warn]: " + msg + trace));
    }
  };

  tip = function (msg, vm) {
    if (hasConsole && (!config.silent)) {
      console.warn("[Vue tip]: " + msg + (
        vm ? generateComponentTrace(vm) : ''
      ));
    }
  };

  formatComponentName = function (vm, includeFile) {
    if (vm.$root === vm) {
      return '<Root>'
    }
    var options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm || {};
    var name = options.name || options._componentTag;
    var file = options.__file;
    if (!name && file) {
      var match = file.match(/([^/\\]+)\.vue$/);
      name = match && match[1];
    }

    return (
      (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
      (file && includeFile !== false ? (" at " + file) : '')
    )
  };

  var repeat = function (str, n) {
    var res = '';
    while (n) {
      if (n % 2 === 1) { res += str; }
      if (n > 1) { str += str; }
      n >>= 1;
    }
    return res
  };

  generateComponentTrace = function (vm) {
    if (vm._isVue && vm.$parent) {
      var tree = [];
      var currentRecursiveSequence = 0;
      while (vm) {
        if (tree.length > 0) {
          var last = tree[tree.length - 1];
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++;
            vm = vm.$parent;
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence];
            currentRecursiveSequence = 0;
          }
        }
        tree.push(vm);
        vm = vm.$parent;
      }
      return '\n\nfound in\n\n' + tree
        .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
            ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
            : formatComponentName(vm))); })
        .join('\n')
    } else {
      return ("\n\n(found in " + (formatComponentName(vm)) + ")")
    }
  };
}

/*  */


var uid = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep () {
  this.id = uid++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null;
var targetStack = [];

function pushTarget (_target) {
  if (Dep.target) { targetStack.push(Dep.target); }
  Dep.target = _target;
}

function popTarget () {
  Dep.target = targetStack.pop();
}

/*  */

var VNode = function VNode (
  tag,
  data,
  children,
  text,
  elm,
  context,
  componentOptions,
  asyncFactory
) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
  this.elm = elm;
  this.ns = undefined;
  this.context = context;
  this.fnContext = undefined;
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
};

var prototypeAccessors = { child: { configurable: true } };

// DEPRECATED: alias for componentInstance for backwards compat.
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
  return this.componentInstance
};

Object.defineProperties( VNode.prototype, prototypeAccessors );

var createEmptyVNode = function (text) {
  if ( text === void 0 ) text = '';

  var node = new VNode();
  node.text = text;
  node.isComment = true;
  return node
};

function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode (vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.isCloned = true;
  return cloned
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    ob.dep.notify();
    return result
  });
});

/*  */

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
var shouldObserve = true;

function toggleObserving (value) {
  shouldObserve = value;
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    var augment = hasProto
      ? protoAugment
      : copyAugment;
    augment(value, arrayMethods, arrayKeys);
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i]);
  }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src, keys) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive (
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  if (!getter && arguments.length === 2) {
    val = obj[key];
  }
  var setter = property && property.set;

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if ("development" !== 'production' && customSetter) {
        customSetter();
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set (target, key, val) {
  if ("development" !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    "development" !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }
  if (!ob) {
    target[key] = val;
    return val
  }
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
function del (target, key) {
  if ("development" !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    "development" !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key];
  if (!ob) {
    return
  }
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/*  */

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
var strats = config.optionMergeStrategies;

/**
 * Options with restrictions
 */
{
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        "option \"" + key + "\" can only be used during instance " +
        'creation with the `new` keyword.'
      );
    }
    return defaultStrat(parent, child)
  };
}

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData (to, from) {
  if (!from) { return to }
  var key, toVal, fromVal;
  var keys = Object.keys(from);
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal);
    }
  }
  return to
}

/**
 * Data
 */
function mergeDataOrFn (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      var instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal;
      var defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

strats.data = function (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      "development" !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      );

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
};

/**
 * Hooks and props are merged as arrays.
 */
function mergeHook (
  parentVal,
  childVal
) {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

LIFECYCLE_HOOKS.forEach(function (hook) {
  strats[hook] = mergeHook;
});

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets (
  parentVal,
  childVal,
  vm,
  key
) {
  var res = Object.create(parentVal || null);
  if (childVal) {
    "development" !== 'production' && assertObjectType(key, childVal, vm);
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (
  parentVal,
  childVal,
  vm,
  key
) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) { parentVal = undefined; }
  if (childVal === nativeWatch) { childVal = undefined; }
  /* istanbul ignore if */
  if (!childVal) { return Object.create(parentVal || null) }
  {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = {};
  extend(ret, parentVal);
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child];
  }
  return ret
};

/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal,
  childVal,
  vm,
  key
) {
  if (childVal && "development" !== 'production') {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = Object.create(null);
  extend(ret, parentVal);
  if (childVal) { extend(ret, childVal); }
  return ret
};
strats.provide = mergeDataOrFn;

/**
 * Default strategy.
 */
var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
};

/**
 * Validate component names
 */
function checkComponents (options) {
  for (var key in options.components) {
    validateComponentName(key);
  }
}

function validateComponentName (name) {
  if (!/^[a-zA-Z][\w-]*$/.test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'can only contain alphanumeric characters and the hyphen, ' +
      'and must start with a letter.'
    );
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    );
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options, vm) {
  var props = options.props;
  if (!props) { return }
  var res = {};
  var i, val, name;
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') {
        name = camelize(val);
        res[name] = { type: null };
      } else {
        warn('props must be strings when using array syntax.');
      }
    }
  } else if (isPlainObject(props)) {
    for (var key in props) {
      val = props[key];
      name = camelize(key);
      res[name] = isPlainObject(val)
        ? val
        : { type: val };
    }
  } else {
    warn(
      "Invalid value for option \"props\": expected an Array or an Object, " +
      "but got " + (toRawType(props)) + ".",
      vm
    );
  }
  options.props = res;
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options, vm) {
  var inject = options.inject;
  if (!inject) { return }
  var normalized = options.inject = {};
  if (Array.isArray(inject)) {
    for (var i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] };
    }
  } else if (isPlainObject(inject)) {
    for (var key in inject) {
      var val = inject[key];
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val };
    }
  } else {
    warn(
      "Invalid value for option \"inject\": expected an Array or an Object, " +
      "but got " + (toRawType(inject)) + ".",
      vm
    );
  }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options) {
  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def = dirs[key];
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def };
      }
    }
  }
}

function assertObjectType (name, value, vm) {
  if (!isPlainObject(value)) {
    warn(
      "Invalid value for option \"" + name + "\": expected an Object, " +
      "but got " + (toRawType(value)) + ".",
      vm
    );
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions (
  parent,
  child,
  vm
) {
  {
    checkComponents(child);
  }

  if (typeof child === 'function') {
    child = child.options;
  }

  normalizeProps(child, vm);
  normalizeInject(child, vm);
  normalizeDirectives(child);
  var extendsFrom = child.extends;
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm);
  }
  if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }
  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
function resolveAsset (
  options,
  type,
  id,
  warnMissing
) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  var assets = options[type];
  // check local registration variations first
  if (hasOwn(assets, id)) { return assets[id] }
  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
  var PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
  // fallback to prototype chain
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if ("development" !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}

/*  */

function validateProp (
  key,
  propOptions,
  propsData,
  vm
) {
  var prop = propOptions[key];
  var absent = !hasOwn(propsData, key);
  var value = propsData[key];
  // boolean casting
  var booleanIndex = getTypeIndex(Boolean, prop.type);
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
    } else if (value === '' || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      var stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }
  {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm, prop, key) {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  // warn against non-factory defaults for Object & Array
  if ("development" !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
function assertProp (
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }
  if (!valid) {
    warn(
      "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', ')) +
      ", got " + (toRawType(value)) + ".",
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

function assertType (value, type) {
  var valid;
  var expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    var t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ''
}

function isSameType (a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex (type, expectedTypes) {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (var i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

/*  */

function handleError (err, vm, info) {
  if (vm) {
    var cur = vm;
    while ((cur = cur.$parent)) {
      var hooks = cur.$options.errorCaptured;
      if (hooks) {
        for (var i = 0; i < hooks.length; i++) {
          try {
            var capture = hooks[i].call(cur, err, vm, info) === false;
            if (capture) { return }
          } catch (e) {
            globalHandleError(e, cur, 'errorCaptured hook');
          }
        }
      }
    }
  }
  globalHandleError(err, vm, info);
}

function globalHandleError (err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      logError(e, null, 'config.errorHandler');
    }
  }
  logError(err, vm, info);
}

function logError (err, vm, info) {
  {
    warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err);
  } else {
    throw err
  }
}

/*  */
/* globals MessageChannel */

var callbacks = [];
var pending = false;

function flushCallbacks () {
  pending = false;
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

// Here we have async deferring wrappers using both microtasks and (macro) tasks.
// In < 2.4 we used microtasks everywhere, but there are some scenarios where
// microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690) or even between bubbling of the same
// event (#6566). However, using (macro) tasks everywhere also has subtle problems
// when state is changed right before repaint (e.g. #6813, out-in transitions).
// Here we use microtask by default, but expose a way to force (macro) task when
// needed (e.g. in event handlers attached by v-on).
var microTimerFunc;
var macroTimerFunc;
var useMacroTask = false;

// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = function () {
    setImmediate(flushCallbacks);
  };
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  var channel = new MessageChannel();
  var port = channel.port2;
  channel.port1.onmessage = flushCallbacks;
  macroTimerFunc = function () {
    port.postMessage(1);
  };
} else {
  /* istanbul ignore next */
  macroTimerFunc = function () {
    setTimeout(flushCallbacks, 0);
  };
}

// Determine microtask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  var p = Promise.resolve();
  microTimerFunc = function () {
    p.then(flushCallbacks);
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) { setTimeout(noop); }
  };
} else {
  // fallback to macro
  microTimerFunc = macroTimerFunc;
}

/**
 * Wrap a function so that if any code inside triggers state change,
 * the changes are queued using a (macro) task instead of a microtask.
 */
function withMacroTask (fn) {
  return fn._withTask || (fn._withTask = function () {
    useMacroTask = true;
    var res = fn.apply(null, arguments);
    useMacroTask = false;
    return res
  })
}

function nextTick (cb, ctx) {
  var _resolve;
  callbacks.push(function () {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    if (useMacroTask) {
      macroTimerFunc();
    } else {
      microTimerFunc();
    }
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}

/*  */

var mark;
var measure;

{
  var perf = inBrowser && window.performance;
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    mark = function (tag) { return perf.mark(tag); };
    measure = function (name, startTag, endTag) {
      perf.measure(name, startTag, endTag);
      perf.clearMarks(startTag);
      perf.clearMarks(endTag);
      perf.clearMeasures(name);
    };
  }
}

/* not type checking this file because flow doesn't play well with Proxy */

var initProxy;

{
  var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  );

  var warnNonPresent = function (target, key) {
    warn(
      "Property or method \"" + key + "\" is not defined on the instance but " +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    );
  };

  var hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy);

  if (hasProxy) {
    var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
    config.keyCodes = new Proxy(config.keyCodes, {
      set: function set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
          return false
        } else {
          target[key] = value;
          return true
        }
      }
    });
  }

  var hasHandler = {
    has: function has (target, key) {
      var has = key in target;
      var isAllowed = allowedGlobals(key) || key.charAt(0) === '_';
      if (!has && !isAllowed) {
        warnNonPresent(target, key);
      }
      return has || !isAllowed
    }
  };

  var getHandler = {
    get: function get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        warnNonPresent(target, key);
      }
      return target[key]
    }
  };

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      var options = vm.$options;
      var handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler;
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
}

/*  */

var seenObjects = new _Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
function traverse (val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}

/*  */

var normalizeEvent = cached(function (name) {
  var passive = name.charAt(0) === '&';
  name = passive ? name.slice(1) : name;
  var once$$1 = name.charAt(0) === '~'; // Prefixed last, checked first
  name = once$$1 ? name.slice(1) : name;
  var capture = name.charAt(0) === '!';
  name = capture ? name.slice(1) : name;
  return {
    name: name,
    once: once$$1,
    capture: capture,
    passive: passive
  }
});

function createFnInvoker (fns) {
  function invoker () {
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments$1);
      }
    } else {
      // return handler return value for single handlers
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns;
  return invoker
}

function updateListeners (
  on,
  oldOn,
  add,
  remove$$1,
  vm
) {
  var name, def, cur, old, event;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);
    /* istanbul ignore if */
    if (isUndef(cur)) {
      "development" !== 'production' && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur);
      }
      add(event.name, cur, event.once, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      old.fns = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}

/*  */

function mergeVNodeHook (def, hookKey, hook) {
  if (def instanceof VNode) {
    def = def.data.hook || (def.data.hook = {});
  }
  var invoker;
  var oldHook = def[hookKey];

  function wrappedHook () {
    hook.apply(this, arguments);
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    remove(invoker.fns, wrappedHook);
  }

  if (isUndef(oldHook)) {
    // no existing hook
    invoker = createFnInvoker([wrappedHook]);
  } else {
    /* istanbul ignore if */
    if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
      // already a merged invoker
      invoker = oldHook;
      invoker.fns.push(wrappedHook);
    } else {
      // existing plain hook
      invoker = createFnInvoker([oldHook, wrappedHook]);
    }
  }

  invoker.merged = true;
  def[hookKey] = invoker;
}

/*  */

function extractPropsFromVNodeData (
  data,
  Ctor,
  tag
) {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  var propOptions = Ctor.options.props;
  if (isUndef(propOptions)) {
    return
  }
  var res = {};
  var attrs = data.attrs;
  var props = data.props;
  if (isDef(attrs) || isDef(props)) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      {
        var keyInLowerCase = key.toLowerCase();
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            "Prop \"" + keyInLowerCase + "\" is passed to component " +
            (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
            " \"" + key + "\". " +
            "Note that HTML attributes are case-insensitive and camelCased " +
            "props need to use their kebab-case equivalents when using in-DOM " +
            "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
          );
        }
      }
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey, false);
    }
  }
  return res
}

function checkProp (
  res,
  hash,
  key,
  altKey,
  preserve
) {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key];
      if (!preserve) {
        delete hash[key];
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true
    }
  }
  return false
}

/*  */

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
function simpleNormalizeChildren (children) {
  for (var i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
function normalizeChildren (children) {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function isTextNode (node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

function normalizeArrayChildren (children, nestedIndex) {
  var res = [];
  var i, c, lastIndex, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (isUndef(c) || typeof c === 'boolean') { continue }
    lastIndex = res.length - 1;
    last = res[lastIndex];
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]).text);
          c.shift();
        }
        res.push.apply(res, c);
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = "__vlist" + nestedIndex + "_" + i + "__";
        }
        res.push(c);
      }
    }
  }
  return res
}

/*  */

function ensureCtor (comp, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default;
  }
  return isObject(comp)
    ? base.extend(comp)
    : comp
}

function createAsyncPlaceholder (
  factory,
  data,
  context,
  children,
  tag
) {
  var node = createEmptyVNode();
  node.asyncFactory = factory;
  node.asyncMeta = { data: data, context: context, children: children, tag: tag };
  return node
}

function resolveAsyncComponent (
  factory,
  baseCtor,
  context
) {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }

  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }

  if (isDef(factory.contexts)) {
    // already pending
    factory.contexts.push(context);
  } else {
    var contexts = factory.contexts = [context];
    var sync = true;

    var forceRender = function () {
      for (var i = 0, l = contexts.length; i < l; i++) {
        contexts[i].$forceUpdate();
      }
    };

    var resolve = once(function (res) {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor);
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender();
      }
    });

    var reject = once(function (reason) {
      "development" !== 'production' && warn(
        "Failed to resolve async component: " + (String(factory)) +
        (reason ? ("\nReason: " + reason) : '')
      );
      if (isDef(factory.errorComp)) {
        factory.error = true;
        forceRender();
      }
    });

    var res = factory(resolve, reject);

    if (isObject(res)) {
      if (typeof res.then === 'function') {
        // () => Promise
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject);
        }
      } else if (isDef(res.component) && typeof res.component.then === 'function') {
        res.component.then(resolve, reject);

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor);
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor);
          if (res.delay === 0) {
            factory.loading = true;
          } else {
            setTimeout(function () {
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true;
                forceRender();
              }
            }, res.delay || 200);
          }
        }

        if (isDef(res.timeout)) {
          setTimeout(function () {
            if (isUndef(factory.resolved)) {
              reject(
                "timeout (" + (res.timeout) + "ms)"
              );
            }
          }, res.timeout);
        }
      }
    }

    sync = false;
    // return in case resolved synchronously
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}

/*  */

function isAsyncPlaceholder (node) {
  return node.isComment && node.asyncFactory
}

/*  */

function getFirstComponentChild (children) {
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}

/*  */

/*  */

function initEvents (vm) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

var target;

function add (event, fn, once) {
  if (once) {
    target.$once(event, fn);
  } else {
    target.$on(event, fn);
  }
}

function remove$1 (event, fn) {
  target.$off(event, fn);
}

function updateComponentListeners (
  vm,
  listeners,
  oldListeners
) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add, remove$1, vm);
  target = undefined;
}

function eventsMixin (Vue) {
  var hookRE = /^hook:/;
  Vue.prototype.$on = function (event, fn) {
    var this$1 = this;

    var vm = this;
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };

  Vue.prototype.$once = function (event, fn) {
    var vm = this;
    function on () {
      vm.$off(event, on);
      fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm
  };

  Vue.prototype.$off = function (event, fn) {
    var this$1 = this;

    var vm = this;
    // all
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$off(event[i], fn);
      }
      return vm
    }
    // specific event
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null;
      return vm
    }
    if (fn) {
      // specific handler
      var cb;
      var i$1 = cbs.length;
      while (i$1--) {
        cb = cbs[i$1];
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i$1, 1);
          break
        }
      }
    }
    return vm
  };

  Vue.prototype.$emit = function (event) {
    var vm = this;
    {
      var lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          "Event \"" + lowerCaseEvent + "\" is emitted in component " +
          (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
          "Note that HTML attributes are case-insensitive and you cannot use " +
          "v-on to listen to camelCase events when using in-DOM templates. " +
          "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
        );
      }
    }
    var cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      var args = toArray(arguments, 1);
      for (var i = 0, l = cbs.length; i < l; i++) {
        try {
          cbs[i].apply(vm, args);
        } catch (e) {
          handleError(e, vm, ("event handler for \"" + event + "\""));
        }
      }
    }
    return vm
  };
}

/*  */



/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 */
function resolveSlots (
  children,
  context
) {
  var slots = {};
  if (!children) {
    return slots
  }
  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];
    var data = child.data;
    // remove slot attribute if the node is resolved as a Vue slot node
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot;
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      var name = data.slot;
      var slot = (slots[name] || (slots[name] = []));
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || []);
      } else {
        slot.push(child);
      }
    } else {
      (slots.default || (slots.default = [])).push(child);
    }
  }
  // ignore slots that contains only whitespace
  for (var name$1 in slots) {
    if (slots[name$1].every(isWhitespace)) {
      delete slots[name$1];
    }
  }
  return slots
}

function isWhitespace (node) {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

function resolveScopedSlots (
  fns, // see flow/vnode
  res
) {
  res = res || {};
  for (var i = 0; i < fns.length; i++) {
    if (Array.isArray(fns[i])) {
      resolveScopedSlots(fns[i], res);
    } else {
      res[fns[i].key] = fns[i].fn;
    }
  }
  return res
}

/*  */

var activeInstance = null;
var isUpdatingChildComponent = false;

function initLifecycle (vm) {
  var options = vm.$options;

  // locate first non-abstract parent
  var parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}

function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate');
    }
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    vm._vnode = vnode;
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      );
      // no need for the ref nodes after initial patch
      // this prevents keeping a detached DOM tree in memory (#5851)
      vm.$options._parentElm = vm.$options._refElm = null;
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    activeInstance = prevActiveInstance;
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

  Vue.prototype.$forceUpdate = function () {
    var vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  };

  Vue.prototype.$destroy = function () {
    var vm = this;
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy');
    vm._isBeingDestroyed = true;
    // remove self from parent
    var parent = vm.$parent;
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm);
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown();
    }
    var i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }
    // call the last hook...
    vm._isDestroyed = true;
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);
    // fire destroyed hook
    callHook(vm, 'destroyed');
    // turn off all instance listeners.
    vm.$off();
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null;
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null;
    }
  };
}

function mountComponent (
  vm,
  el,
  hydrating
) {
  vm.$el = el;
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode;
    {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        );
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        );
      }
    }
  }
  callHook(vm, 'beforeMount');

  var updateComponent;
  /* istanbul ignore if */
  if ("development" !== 'production' && config.performance && mark) {
    updateComponent = function () {
      var name = vm._name;
      var id = vm._uid;
      var startTag = "vue-perf-start:" + id;
      var endTag = "vue-perf-end:" + id;

      mark(startTag);
      var vnode = vm._render();
      mark(endTag);
      measure(("vue " + name + " render"), startTag, endTag);

      mark(startTag);
      vm._update(vnode, hydrating);
      mark(endTag);
      measure(("vue " + name + " patch"), startTag, endTag);
    };
  } else {
    updateComponent = function () {
      vm._update(vm._render(), hydrating);
    };
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, null, true /* isRenderWatcher */);
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true;
    callHook(vm, 'mounted');
  }
  return vm
}

function updateChildComponent (
  vm,
  propsData,
  listeners,
  parentVnode,
  renderChildren
) {
  {
    isUpdatingChildComponent = true;
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren
  var hasChildren = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    parentVnode.data.scopedSlots || // has new scoped slots
    vm.$scopedSlots !== emptyObject // has old scoped slots
  );

  vm.$options._parentVnode = parentVnode;
  vm.$vnode = parentVnode; // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode;
  }
  vm.$options._renderChildren = renderChildren;

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject;
  vm.$listeners = listeners || emptyObject;

  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false);
    var props = vm._props;
    var propKeys = vm.$options._propKeys || [];
    for (var i = 0; i < propKeys.length; i++) {
      var key = propKeys[i];
      var propOptions = vm.$options.props; // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm);
    }
    toggleObserving(true);
    // keep a copy of raw propsData
    vm.$options.propsData = propsData;
  }

  // update listeners
  listeners = listeners || emptyObject;
  var oldListeners = vm.$options._parentListeners;
  vm.$options._parentListeners = listeners;
  updateComponentListeners(vm, listeners, oldListeners);

  // resolve slots + force update if has children
  if (hasChildren) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context);
    vm.$forceUpdate();
  }

  {
    isUpdatingChildComponent = false;
  }
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) { return true }
  }
  return false
}

function activateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = false;
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false;
    for (var i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'activated');
  }
}

function deactivateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = true;
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true;
    for (var i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'deactivated');
  }
}

function callHook (vm, hook) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget();
  var handlers = vm.$options[hook];
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      try {
        handlers[i].call(vm);
      } catch (e) {
        handleError(e, vm, (hook + " hook"));
      }
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
  popTarget();
}

/*  */


var MAX_UPDATE_COUNT = 100;

var queue = [];
var activatedChildren = [];
var has = {};
var circular = {};
var waiting = false;
var flushing = false;
var index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0;
  has = {};
  {
    circular = {};
  }
  waiting = flushing = false;
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  flushing = true;
  var watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort(function (a, b) { return a.id - b.id; });

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    id = watcher.id;
    has[id] = null;
    watcher.run();
    // in dev build, check and stop circular updates.
    if ("development" !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? ("in watcher with expression \"" + (watcher.expression) + "\"")
              : "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();

  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }
}

function callUpdatedHooks (queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted) {
      callHook(vm, 'updated');
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
function queueActivatedComponent (vm) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false;
  activatedChildren.push(vm);
}

function callActivatedHooks (queue) {
  for (var i = 0; i < queue.length; i++) {
    queue[i]._inactive = true;
    activateChildComponent(queue[i], true /* true */);
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  }
}

/*  */

var uid$1 = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options,
  isRenderWatcher
) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$1; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression = expOrFn.toString();
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = function () {};
      "development" !== 'production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get () {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm);
  } catch (e) {
    if (this.user) {
      handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value
};

/**
 * Add a dependency to this directive.
 */
Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    var dep = this$1.deps[i];
    if (!this$1.newDepIds.has(dep.id)) {
      dep.removeSub(this$1);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate () {
  this.value = this.get();
  this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    this$1.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown () {
    var this$1 = this;

  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this$1.deps[i].removeSub(this$1);
    }
    this.active = false;
  }
};

/*  */

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function initState (vm) {
  vm._watchers = [];
  var opts = vm.$options;
  if (opts.props) { initProps(vm, opts.props); }
  if (opts.methods) { initMethods(vm, opts.methods); }
  if (opts.data) {
    initData(vm);
  } else {
    observe(vm._data = {}, true /* asRootData */);
  }
  if (opts.computed) { initComputed(vm, opts.computed); }
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

function initProps (vm, propsOptions) {
  var propsData = vm.$options.propsData || {};
  var props = vm._props = {};
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  var keys = vm.$options._propKeys = [];
  var isRoot = !vm.$parent;
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false);
  }
  var loop = function ( key ) {
    keys.push(key);
    var value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    {
      var hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive(props, key, value, function () {
        if (vm.$parent && !isUpdatingChildComponent) {
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, "_props", key);
    }
  };

  for (var key in propsOptions) loop( key );
  toggleObserving(true);
}

function initData (vm) {
  var data = vm.$options.data;
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};
  if (!isPlainObject(data)) {
    data = {};
    "development" !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  while (i--) {
    var key = keys[i];
    {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      "development" !== 'production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {
      proxy(vm, "_data", key);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}

function getData (data, vm) {
  // #7573 disable dep collection when invoking data getters
  pushTarget();
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, "data()");
    return {}
  } finally {
    popTarget();
  }
}

var computedWatcherOptions = { lazy: true };

function initComputed (vm, computed) {
  // $flow-disable-line
  var watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if ("development" !== 'production' && getter == null) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}

function defineComputed (
  target,
  key,
  userDef
) {
  var shouldCache = !isServerRendering();
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : userDef;
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop;
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set
      : noop;
  }
  if ("development" !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        ("Computed property \"" + key + "\" was assigned to but it has no setter."),
        this
      );
    };
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createComputedGetter (key) {
  return function computedGetter () {
    var watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value
    }
  }
}

function initMethods (vm, methods) {
  var props = vm.$options.props;
  for (var key in methods) {
    {
      if (methods[key] == null) {
        warn(
          "Method \"" + key + "\" has an undefined value in the component definition. " +
          "Did you reference the function correctly?",
          vm
        );
      }
      if (props && hasOwn(props, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a prop."),
          vm
        );
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
          "Avoid defining component methods that start with _ or $."
        );
      }
    }
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm);
  }
}

function initWatch (vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher (
  vm,
  expOrFn,
  handler,
  options
) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options)
}

function stateMixin (Vue) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  var dataDef = {};
  dataDef.get = function () { return this._data };
  var propsDef = {};
  propsDef.get = function () { return this._props };
  {
    dataDef.set = function (newData) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    };
    propsDef.set = function () {
      warn("$props is readonly.", this);
    };
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);
  Object.defineProperty(Vue.prototype, '$props', propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {};
    options.user = true;
    var watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) {
      cb.call(vm, watcher.value);
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };
}

/*  */

function initProvide (vm) {
  var provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide;
  }
}

function initInjections (vm) {
  var result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach(function (key) {
      /* istanbul ignore else */
      {
        defineReactive(vm, key, result[key], function () {
          warn(
            "Avoid mutating an injected value directly since the changes will be " +
            "overwritten whenever the provided component re-renders. " +
            "injection being mutated: \"" + key + "\"",
            vm
          );
        });
      }
    });
    toggleObserving(true);
  }
}

function resolveInject (inject, vm) {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    var result = Object.create(null);
    var keys = hasSymbol
      ? Reflect.ownKeys(inject).filter(function (key) {
        /* istanbul ignore next */
        return Object.getOwnPropertyDescriptor(inject, key).enumerable
      })
      : Object.keys(inject);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var provideKey = inject[key].from;
      var source = vm;
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break
        }
        source = source.$parent;
      }
      if (!source) {
        if ('default' in inject[key]) {
          var provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault;
        } else {
          warn(("Injection \"" + key + "\" not found"), vm);
        }
      }
    }
    return result
  }
}

/*  */

/**
 * Runtime helper for rendering v-for lists.
 */
function renderList (
  val,
  render
) {
  var ret, i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length);
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i);
    }
  } else if (typeof val === 'number') {
    ret = new Array(val);
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i);
    }
  } else if (isObject(val)) {
    keys = Object.keys(val);
    ret = new Array(keys.length);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      ret[i] = render(val[key], key, i);
    }
  }
  if (isDef(ret)) {
    (ret)._isVList = true;
  }
  return ret
}

/*  */

/**
 * Runtime helper for rendering <slot>
 */
function renderSlot (
  name,
  fallback,
  props,
  bindObject
) {
  var scopedSlotFn = this.$scopedSlots[name];
  var nodes;
  if (scopedSlotFn) { // scoped slot
    props = props || {};
    if (bindObject) {
      if ("development" !== 'production' && !isObject(bindObject)) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        );
      }
      props = extend(extend({}, bindObject), props);
    }
    nodes = scopedSlotFn(props) || fallback;
  } else {
    var slotNodes = this.$slots[name];
    // warn duplicate slot usage
    if (slotNodes) {
      if ("development" !== 'production' && slotNodes._rendered) {
        warn(
          "Duplicate presence of slot \"" + name + "\" found in the same render tree " +
          "- this will likely cause render errors.",
          this
        );
      }
      slotNodes._rendered = true;
    }
    nodes = slotNodes || fallback;
  }

  var target = props && props.slot;
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}

/*  */

/**
 * Runtime helper for resolving filters
 */
function resolveFilter (id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}

/*  */

function isKeyNotMatch (expect, actual) {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

/**
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */
function checkKeyCodes (
  eventKeyCode,
  key,
  builtInKeyCode,
  eventKeyName,
  builtInKeyName
) {
  var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
}

/*  */

/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
function bindObjectProps (
  data,
  tag,
  value,
  asProp,
  isSync
) {
  if (value) {
    if (!isObject(value)) {
      "development" !== 'production' && warn(
        'v-bind without argument expects an Object or Array value',
        this
      );
    } else {
      if (Array.isArray(value)) {
        value = toObject(value);
      }
      var hash;
      var loop = function ( key ) {
        if (
          key === 'class' ||
          key === 'style' ||
          isReservedAttribute(key)
        ) {
          hash = data;
        } else {
          var type = data.attrs && data.attrs.type;
          hash = asProp || config.mustUseProp(tag, type, key)
            ? data.domProps || (data.domProps = {})
            : data.attrs || (data.attrs = {});
        }
        if (!(key in hash)) {
          hash[key] = value[key];

          if (isSync) {
            var on = data.on || (data.on = {});
            on[("update:" + key)] = function ($event) {
              value[key] = $event;
            };
          }
        }
      };

      for (var key in value) loop( key );
    }
  }
  return data
}

/*  */

/**
 * Runtime helper for rendering static trees.
 */
function renderStatic (
  index,
  isInFor
) {
  var cached = this._staticTrees || (this._staticTrees = []);
  var tree = cached[index];
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  if (tree && !isInFor) {
    return tree
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates
  );
  markStatic(tree, ("__static__" + index), false);
  return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
function markOnce (
  tree,
  index,
  key
) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}

function markStatic (
  tree,
  key,
  isOnce
) {
  if (Array.isArray(tree)) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], (key + "_" + i), isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}

function markStaticNode (node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}

/*  */

function bindObjectListeners (data, value) {
  if (value) {
    if (!isPlainObject(value)) {
      "development" !== 'production' && warn(
        'v-on without argument expects an Object value',
        this
      );
    } else {
      var on = data.on = data.on ? extend({}, data.on) : {};
      for (var key in value) {
        var existing = on[key];
        var ours = value[key];
        on[key] = existing ? [].concat(existing, ours) : ours;
      }
    }
  }
  return data
}

/*  */

function installRenderHelpers (target) {
  target._o = markOnce;
  target._n = toNumber;
  target._s = toString;
  target._l = renderList;
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode;
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
}

/*  */

function FunctionalRenderContext (
  data,
  props,
  children,
  parent,
  Ctor
) {
  var options = Ctor.options;
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  var contextVm;
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent);
    // $flow-disable-line
    contextVm._original = parent;
  } else {
    // the context vm passed in is a functional context as well.
    // in this case we want to make sure we are able to get a hold to the
    // real context instance.
    contextVm = parent;
    // $flow-disable-line
    parent = parent._original;
  }
  var isCompiled = isTrue(options._compiled);
  var needNormalization = !isCompiled;

  this.data = data;
  this.props = props;
  this.children = children;
  this.parent = parent;
  this.listeners = data.on || emptyObject;
  this.injections = resolveInject(options.inject, parent);
  this.slots = function () { return resolveSlots(children, parent); };

  // support for compiled functional template
  if (isCompiled) {
    // exposing $options for renderStatic()
    this.$options = options;
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots();
    this.$scopedSlots = data.scopedSlots || emptyObject;
  }

  if (options._scopeId) {
    this._c = function (a, b, c, d) {
      var vnode = createElement(contextVm, a, b, c, d, needNormalization);
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId;
        vnode.fnContext = parent;
      }
      return vnode
    };
  } else {
    this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
  }
}

installRenderHelpers(FunctionalRenderContext.prototype);

function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {
  var options = Ctor.options;
  var props = {};
  var propOptions = options.props;
  if (isDef(propOptions)) {
    for (var key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData || emptyObject);
    }
  } else {
    if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
    if (isDef(data.props)) { mergeProps(props, data.props); }
  }

  var renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  );

  var vnode = options.render.call(null, renderContext._c, renderContext);

  if (vnode instanceof VNode) {
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options)
  } else if (Array.isArray(vnode)) {
    var vnodes = normalizeChildren(vnode) || [];
    var res = new Array(vnodes.length);
    for (var i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options);
    }
    return res
  }
}

function cloneAndMarkFunctionalResult (vnode, data, contextVm, options) {
  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  var clone = cloneVNode(vnode);
  clone.fnContext = contextVm;
  clone.fnOptions = options;
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot;
  }
  return clone
}

function mergeProps (to, from) {
  for (var key in from) {
    to[camelize(key)] = from[key];
  }
}

/*  */




// Register the component hook to weex native render engine.
// The hook will be triggered by native, not javascript.


// Updates the state of the component to weex native render engine.

/*  */

// https://github.com/Hanks10100/weex-native-directive/tree/master/component

// listening on native callback

/*  */

/*  */

// inline hooks to be invoked on component VNodes during patch
var componentVNodeHooks = {
  init: function init (
    vnode,
    hydrating,
    parentElm,
    refElm
  ) {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      var mountedNode = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      var child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance,
        parentElm,
        refElm
      );
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }
  },

  prepatch: function prepatch (oldVnode, vnode) {
    var options = vnode.componentOptions;
    var child = vnode.componentInstance = oldVnode.componentInstance;
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    );
  },

  insert: function insert (vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  },

  destroy: function destroy (vnode) {
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy();
      } else {
        deactivateChildComponent(componentInstance, true /* direct */);
      }
    }
  }
};

var hooksToMerge = Object.keys(componentVNodeHooks);

function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (isUndef(Ctor)) {
    return
  }

  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    {
      warn(("Invalid Component definition: " + (String(Ctor))), context);
    }
    return
  }

  // async component
  var asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context);
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {};

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor);

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // extract props
  var propsData = extractPropsFromVNodeData(data, Ctor, tag);

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  var listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    var slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
    asyncFactory
  );

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  return vnode
}

function createComponentInstanceForVnode (
  vnode, // we know it's MountedComponentVNode but flow doesn't
  parent, // activeInstance in lifecycle state
  parentElm,
  refElm
) {
  var options = {
    _isComponent: true,
    parent: parent,
    _parentVnode: vnode,
    _parentElm: parentElm || null,
    _refElm: refElm || null
  };
  // check inline-template render functions
  var inlineTemplate = vnode.data.inlineTemplate;
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }
  return new vnode.componentOptions.Ctor(options)
}

function installComponentHooks (data) {
  var hooks = data.hook || (data.hook = {});
  for (var i = 0; i < hooksToMerge.length; i++) {
    var key = hooksToMerge[i];
    hooks[key] = componentVNodeHooks[key];
  }
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel (options, data) {
  var prop = (options.model && options.model.prop) || 'value';
  var event = (options.model && options.model.event) || 'input';(data.props || (data.props = {}))[prop] = data.model.value;
  var on = data.on || (data.on = {});
  if (isDef(on[event])) {
    on[event] = [data.model.callback].concat(on[event]);
  } else {
    on[event] = data.model.callback;
  }
}

/*  */

var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
function createElement (
  context,
  tag,
  data,
  children,
  normalizationType,
  alwaysNormalize
) {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType)
}

function _createElement (
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (isDef(data) && isDef((data).__ob__)) {
    "development" !== 'production' && warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if ("development" !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  var vnode, ns;
  if (typeof tag === 'string') {
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) { applyNS(vnode, ns); }
    if (isDef(data)) { registerDeepBindings(data); }
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns, force) {
  vnode.ns = ns;
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined;
    force = true;
  }
  if (isDef(vnode.children)) {
    for (var i = 0, l = vnode.children.length; i < l; i++) {
      var child = vnode.children[i];
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force);
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings (data) {
  if (isObject(data.style)) {
    traverse(data.style);
  }
  if (isObject(data.class)) {
    traverse(data.class);
  }
}

/*  */

function initRender (vm) {
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
  var options = vm.$options;
  var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
  var renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  var parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
      !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
    }, true);
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, function () {
      !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
    }, true);
  }
}

function renderMixin (Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype);

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
    var _parentVnode = ref._parentVnode;

    // reset _rendered flag on slots for duplicate slot check
    {
      for (var key in vm.$slots) {
        // $flow-disable-line
        vm.$slots[key]._rendered = false;
      }
    }

    if (_parentVnode) {
      vm.$scopedSlots = _parentVnode.data.scopedSlots || emptyObject;
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      handleError(e, vm, "render");
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      {
        if (vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      }
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if ("development" !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode
  };
}

/*  */

var uid$3 = 0;

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    var vm = this;
    // a uid
    vm._uid = uid$3++;

    var startTag, endTag;
    /* istanbul ignore if */
    if ("development" !== 'production' && config.performance && mark) {
      startTag = "vue-perf-start:" + (vm._uid);
      endTag = "vue-perf-end:" + (vm._uid);
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    {
      initProxy(vm);
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    initInjections(vm); // resolve injections before data/props
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, 'created');

    /* istanbul ignore if */
    if ("development" !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

function initInternalComponent (vm, options) {
  var opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  var parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;
  opts._parentElm = options._parentElm;
  opts._refElm = options._refElm;

  var vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

function resolveConstructorOptions (Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = resolveConstructorOptions(Ctor.super);
    var cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor) {
  var modified;
  var latest = Ctor.options;
  var extended = Ctor.extendOptions;
  var sealed = Ctor.sealedOptions;
  for (var key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) { modified = {}; }
      modified[key] = dedupe(latest[key], extended[key], sealed[key]);
    }
  }
  return modified
}

function dedupe (latest, extended, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    var res = [];
    sealed = Array.isArray(sealed) ? sealed : [sealed];
    extended = Array.isArray(extended) ? extended : [extended];
    for (var i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i]);
      }
    }
    return res
  } else {
    return latest
  }
}

function Vue (options) {
  if ("development" !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

/*  */

function initUse (Vue) {
  Vue.use = function (plugin) {
    var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    var args = toArray(arguments, 1);
    args.unshift(this);
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args);
    }
    installedPlugins.push(plugin);
    return this
  };
}

/*  */

function initMixin$1 (Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
    return this
  };
}

/*  */

function initExtend (Vue) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    var name = extendOptions.name || Super.options.name;
    if ("development" !== 'production' && name) {
      validateComponentName(name);
    }

    var Sub = function VueComponent (options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps$1(Sub);
    }
    if (Sub.options.computed) {
      initComputed$1(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
}

function initProps$1 (Comp) {
  var props = Comp.options.props;
  for (var key in props) {
    proxy(Comp.prototype, "_props", key);
  }
}

function initComputed$1 (Comp) {
  var computed = Comp.options.computed;
  for (var key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}

/*  */

function initAssetRegisters (Vue) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(function (type) {
    Vue[type] = function (
      id,
      definition
    ) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if ("development" !== 'production' && type === 'component') {
          validateComponentName(id);
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition);
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition };
        }
        this.options[type + 's'][id] = definition;
        return definition
      }
    };
  });
}

/*  */

function getComponentName (opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance, filter) {
  var cache = keepAliveInstance.cache;
  var keys = keepAliveInstance.keys;
  var _vnode = keepAliveInstance._vnode;
  for (var key in cache) {
    var cachedNode = cache[key];
    if (cachedNode) {
      var name = getComponentName(cachedNode.componentOptions);
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
}

function pruneCacheEntry (
  cache,
  key,
  keys,
  current
) {
  var cached$$1 = cache[key];
  if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
    cached$$1.componentInstance.$destroy();
  }
  cache[key] = null;
  remove(keys, key);
}

var patternTypes = [String, RegExp, Array];

var KeepAlive = {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created: function created () {
    this.cache = Object.create(null);
    this.keys = [];
  },

  destroyed: function destroyed () {
    var this$1 = this;

    for (var key in this$1.cache) {
      pruneCacheEntry(this$1.cache, key, this$1.keys);
    }
  },

  mounted: function mounted () {
    var this$1 = this;

    this.$watch('include', function (val) {
      pruneCache(this$1, function (name) { return matches(val, name); });
    });
    this.$watch('exclude', function (val) {
      pruneCache(this$1, function (name) { return !matches(val, name); });
    });
  },

  render: function render () {
    var slot = this.$slots.default;
    var vnode = getFirstComponentChild(slot);
    var componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // check pattern
      var name = getComponentName(componentOptions);
      var ref = this;
      var include = ref.include;
      var exclude = ref.exclude;
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      var ref$1 = this;
      var cache = ref$1.cache;
      var keys = ref$1.keys;
      var key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
        : vnode.key;
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance;
        // make current key freshest
        remove(keys, key);
        keys.push(key);
      } else {
        cache[key] = vnode;
        keys.push(key);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode);
        }
      }

      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0])
  }
}

var builtInComponents = {
  KeepAlive: KeepAlive
}

/*  */

function initGlobalAPI (Vue) {
  // config
  var configDef = {};
  configDef.get = function () { return config; };
  {
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }
  Object.defineProperty(Vue, 'config', configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn: warn,
    extend: extend,
    mergeOptions: mergeOptions,
    defineReactive: defineReactive
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  Vue.options = Object.create(null);
  ASSET_TYPES.forEach(function (type) {
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin$1(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}

initGlobalAPI(Vue);

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
});

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get: function get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
});

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
});

Vue.version = '2.5.16';

/*  */

// these are reserved for web because they are directly compiled away
// during template compilation
var isReservedAttr = makeMap('style,class');

// attributes that should be using props for binding
var acceptValue = makeMap('input,textarea,option,select,progress');
var mustUseProp = function (tag, type, attr) {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
};

var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

var isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
);

var xlinkNS = 'http://www.w3.org/1999/xlink';

var isXlink = function (name) {
  return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
};

var getXlinkProp = function (name) {
  return isXlink(name) ? name.slice(6, name.length) : ''
};

var isFalsyAttrValue = function (val) {
  return val == null || val === false
};

/*  */

function genClassForVnode (vnode) {
  var data = vnode.data;
  var parentNode = vnode;
  var childNode = vnode;
  while (isDef(childNode.componentInstance)) {
    childNode = childNode.componentInstance._vnode;
    if (childNode && childNode.data) {
      data = mergeClassData(childNode.data, data);
    }
  }
  while (isDef(parentNode = parentNode.parent)) {
    if (parentNode && parentNode.data) {
      data = mergeClassData(data, parentNode.data);
    }
  }
  return renderClass(data.staticClass, data.class)
}

function mergeClassData (child, parent) {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: isDef(child.class)
      ? [child.class, parent.class]
      : parent.class
  }
}

function renderClass (
  staticClass,
  dynamicClass
) {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function stringifyClass (value) {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  /* istanbul ignore next */
  return ''
}

function stringifyArray (value) {
  var res = '';
  var stringified;
  for (var i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) { res += ' '; }
      res += stringified;
    }
  }
  return res
}

function stringifyObject (value) {
  var res = '';
  for (var key in value) {
    if (value[key]) {
      if (res) { res += ' '; }
      res += key;
    }
  }
  return res
}

/*  */

var namespaceMap = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};

var isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template,blockquote,iframe,tfoot'
);

// this map is intentionally selective, only covering SVG elements that may
// contain child elements.
var isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
);

var isPreTag = function (tag) { return tag === 'pre'; };

var isReservedTag = function (tag) {
  return isHTMLTag(tag) || isSVG(tag)
};

function getTagNamespace (tag) {
  if (isSVG(tag)) {
    return 'svg'
  }
  // basic support for MathML
  // note it doesn't support other MathML elements being component roots
  if (tag === 'math') {
    return 'math'
  }
}

var unknownElementCache = Object.create(null);
function isUnknownElement (tag) {
  /* istanbul ignore if */
  if (!inBrowser) {
    return true
  }
  if (isReservedTag(tag)) {
    return false
  }
  tag = tag.toLowerCase();
  /* istanbul ignore if */
  if (unknownElementCache[tag] != null) {
    return unknownElementCache[tag]
  }
  var el = document.createElement(tag);
  if (tag.indexOf('-') > -1) {
    // http://stackoverflow.com/a/28210364/1070244
    return (unknownElementCache[tag] = (
      el.constructor === window.HTMLUnknownElement ||
      el.constructor === window.HTMLElement
    ))
  } else {
    return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
  }
}

var isTextInputType = makeMap('text,number,password,search,email,tel,url');

/*  */

/**
 * Query an element selector if it's not an element already.
 */
function query (el) {
  if (typeof el === 'string') {
    var selected = document.querySelector(el);
    if (!selected) {
      "development" !== 'production' && warn(
        'Cannot find element: ' + el
      );
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}

/*  */

function createElement$1 (tagName, vnode) {
  var elm = document.createElement(tagName);
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
    elm.setAttribute('multiple', 'multiple');
  }
  return elm
}

function createElementNS (namespace, tagName) {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

function createTextNode (text) {
  return document.createTextNode(text)
}

function createComment (text) {
  return document.createComment(text)
}

function insertBefore (parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode);
}

function removeChild (node, child) {
  node.removeChild(child);
}

function appendChild (node, child) {
  node.appendChild(child);
}

function parentNode (node) {
  return node.parentNode
}

function nextSibling (node) {
  return node.nextSibling
}

function tagName (node) {
  return node.tagName
}

function setTextContent (node, text) {
  node.textContent = text;
}

function setStyleScope (node, scopeId) {
  node.setAttribute(scopeId, '');
}


var nodeOps = Object.freeze({
	createElement: createElement$1,
	createElementNS: createElementNS,
	createTextNode: createTextNode,
	createComment: createComment,
	insertBefore: insertBefore,
	removeChild: removeChild,
	appendChild: appendChild,
	parentNode: parentNode,
	nextSibling: nextSibling,
	tagName: tagName,
	setTextContent: setTextContent,
	setStyleScope: setStyleScope
});

/*  */

var ref = {
  create: function create (_, vnode) {
    registerRef(vnode);
  },
  update: function update (oldVnode, vnode) {
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true);
      registerRef(vnode);
    }
  },
  destroy: function destroy (vnode) {
    registerRef(vnode, true);
  }
}

function registerRef (vnode, isRemoval) {
  var key = vnode.data.ref;
  if (!isDef(key)) { return }

  var vm = vnode.context;
  var ref = vnode.componentInstance || vnode.elm;
  var refs = vm.$refs;
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref;
    }
  }
}

/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/paldepind/snabbdom/blob/master/LICENSE
 *
 * modified by Evan You (@yyx990803)
 *
 * Not type-checking this because this file is perf-critical and the cost
 * of making flow understand it is not worth it.
 */

var emptyNode = new VNode('', {}, []);

var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}

function sameInputType (a, b) {
  if (a.tag !== 'input') { return true }
  var i;
  var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
  var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
  return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}

function createKeyToOldIdx (children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) { map[key] = i; }
  }
  return map
}

function createPatchFunction (backend) {
  var i, j;
  var cbs = {};

  var modules = backend.modules;
  var nodeOps = backend.nodeOps;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
  }

  function emptyNodeAt (elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  function createRmCb (childElm, listeners) {
    function remove () {
      if (--remove.listeners === 0) {
        removeNode(childElm);
      }
    }
    remove.listeners = listeners;
    return remove
  }

  function removeNode (el) {
    var parent = nodeOps.parentNode(el);
    // element may have already been removed due to v-html / v-text
    if (isDef(parent)) {
      nodeOps.removeChild(parent, el);
    }
  }

  function isUnknownElement$$1 (vnode, inVPre) {
    return (
      !inVPre &&
      !vnode.ns &&
      !(
        config.ignoredElements.length &&
        config.ignoredElements.some(function (ignore) {
          return isRegExp(ignore)
            ? ignore.test(vnode.tag)
            : ignore === vnode.tag
        })
      ) &&
      config.isUnknownElement(vnode.tag)
    )
  }

  var creatingElmInVPre = 0;

  function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // This vnode was used in a previous render!
      // now it's used as a new node, overwriting its elm would cause
      // potential patch errors down the road when it's used as an insertion
      // reference node. Instead, we clone the node on-demand before creating
      // associated DOM element for it.
      vnode = ownerArray[index] = cloneVNode(vnode);
    }

    vnode.isRootInsert = !nested; // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (isDef(tag)) {
      {
        if (data && data.pre) {
          creatingElmInVPre++;
        }
        if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
          warn(
            'Unknown custom element: <' + tag + '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
            vnode.context
          );
        }
      }

      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode);
      setScope(vnode);

      /* istanbul ignore if */
      {
        createChildren(vnode, children, insertedVnodeQueue);
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue);
        }
        insert(parentElm, vnode.elm, refElm);
      }

      if ("development" !== 'production' && data && data.pre) {
        creatingElmInVPre--;
      }
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }
  }

  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i = vnode.data;
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */, parentElm, refElm);
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue);
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }

  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
      vnode.data.pendingInsert = null;
    }
    vnode.elm = vnode.componentInstance.$el;
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
      setScope(vnode);
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode);
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode);
    }
  }

  function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i;
    // hack for #4339: a reactivated component with inner transition
    // does not trigger because the inner node's created hooks are not called
    // again. It's not ideal to involve module-specific logic in here but
    // there doesn't seem to be a better way to do it.
    var innerNode = vnode;
    while (innerNode.componentInstance) {
      innerNode = innerNode.componentInstance._vnode;
      if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
        for (i = 0; i < cbs.activate.length; ++i) {
          cbs.activate[i](emptyNode, innerNode);
        }
        insertedVnodeQueue.push(innerNode);
        break
      }
    }
    // unlike a newly created component,
    // a reactivated keep-alive component doesn't insert itself
    insert(parentElm, vnode.elm, refElm);
  }

  function insert (parent, elm, ref$$1) {
    if (isDef(parent)) {
      if (isDef(ref$$1)) {
        if (ref$$1.parentNode === parent) {
          nodeOps.insertBefore(parent, elm, ref$$1);
        }
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  function createChildren (vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      {
        checkDuplicateKeys(children);
      }
      for (var i = 0; i < children.length; ++i) {
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
    }
  }

  function isPatchable (vnode) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance._vnode;
    }
    return isDef(vnode.tag)
  }

  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
      cbs.create[i$1](emptyNode, vnode);
    }
    i = vnode.data.hook; // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) { i.create(emptyNode, vnode); }
      if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
    }
  }

  // set scope id attribute for scoped CSS.
  // this is implemented as a special case to avoid the overhead
  // of going through the normal attribute patching process.
  function setScope (vnode) {
    var i;
    if (isDef(i = vnode.fnScopeId)) {
      nodeOps.setStyleScope(vnode.elm, i);
    } else {
      var ancestor = vnode;
      while (ancestor) {
        if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
          nodeOps.setStyleScope(vnode.elm, i);
        }
        ancestor = ancestor.parent;
      }
    }
    // for slot content they should also get the scopeId from the host instance.
    if (isDef(i = activeInstance) &&
      i !== vnode.context &&
      i !== vnode.fnContext &&
      isDef(i = i.$options._scopeId)
    ) {
      nodeOps.setStyleScope(vnode.elm, i);
    }
  }

  function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
    }
  }

  function invokeDestroyHook (vnode) {
    var i, j;
    var data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
      for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
    }
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.length; ++j) {
        invokeDestroyHook(vnode.children[j]);
      }
    }
  }

  function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.tag)) {
          removeAndInvokeRemoveHook(ch);
          invokeDestroyHook(ch);
        } else { // Text node
          removeNode(ch.elm);
        }
      }
    }
  }

  function removeAndInvokeRemoveHook (vnode, rm) {
    if (isDef(rm) || isDef(vnode.data)) {
      var i;
      var listeners = cbs.remove.length + 1;
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners;
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners);
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm);
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm);
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm);
      } else {
        rm();
      }
    } else {
      removeNode(vnode.elm);
    }
  }

  function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    var oldStartIdx = 0;
    var newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    var canMove = !removeOnly;

    {
      checkDuplicateKeys(newCh);
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
        idxInOld = isDef(newStartVnode.key)
          ? oldKeyToIdx[newStartVnode.key]
          : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
        if (isUndef(idxInOld)) { // New element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
        } else {
          vnodeToMove = oldCh[idxInOld];
          if (sameVnode(vnodeToMove, newStartVnode)) {
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
            oldCh[idxInOld] = undefined;
            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
          } else {
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
          }
        }
        newStartVnode = newCh[++newStartIdx];
      }
    }
    if (oldStartIdx > oldEndIdx) {
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function checkDuplicateKeys (children) {
    var seenKeys = {};
    for (var i = 0; i < children.length; i++) {
      var vnode = children[i];
      var key = vnode.key;
      if (isDef(key)) {
        if (seenKeys[key]) {
          warn(
            ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
            vnode.context
          );
        } else {
          seenKeys[key] = true;
        }
      }
    }
  }

  function findIdxInOld (node, oldCh, start, end) {
    for (var i = start; i < end; i++) {
      var c = oldCh[i];
      if (isDef(c) && sameVnode(node, c)) { return i }
    }
  }

  function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {
    if (oldVnode === vnode) {
      return
    }

    var elm = vnode.elm = oldVnode.elm;

    if (isTrue(oldVnode.isAsyncPlaceholder)) {
      if (isDef(vnode.asyncFactory.resolved)) {
        hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
      } else {
        vnode.isAsyncPlaceholder = true;
      }
      return
    }

    // reuse element for static trees.
    // note we only do this if the vnode is cloned -
    // if the new node is not cloned it means the render functions have been
    // reset by the hot-reload-api and we need to do a proper re-render.
    if (isTrue(vnode.isStatic) &&
      isTrue(oldVnode.isStatic) &&
      vnode.key === oldVnode.key &&
      (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
      vnode.componentInstance = oldVnode.componentInstance;
      return
    }

    var i;
    var data = vnode.data;
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode);
    }

    var oldCh = oldVnode.children;
    var ch = vnode.children;
    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
      if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        nodeOps.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      nodeOps.setTextContent(elm, vnode.text);
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
    }
  }

  function invokeInsertHook (vnode, queue, initial) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue;
    } else {
      for (var i = 0; i < queue.length; ++i) {
        queue[i].data.hook.insert(queue[i]);
      }
    }
  }

  var hydrationBailed = false;
  // list of modules that can skip create hook during hydration because they
  // are already rendered on the client or has no need for initialization
  // Note: style is excluded because it relies on initial clone for future
  // deep updates (#7063).
  var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

  // Note: this is a browser-only function so we can assume elms are DOM nodes.
  function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
    var i;
    var tag = vnode.tag;
    var data = vnode.data;
    var children = vnode.children;
    inVPre = inVPre || (data && data.pre);
    vnode.elm = elm;

    if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
      vnode.isAsyncPlaceholder = true;
      return true
    }
    // assert node match
    {
      if (!assertNodeMatch(elm, vnode, inVPre)) {
        return false
      }
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
      if (isDef(i = vnode.componentInstance)) {
        // child component. it should have hydrated its own tree.
        initComponent(vnode, insertedVnodeQueue);
        return true
      }
    }
    if (isDef(tag)) {
      if (isDef(children)) {
        // empty element, allow client to pick up and populate children
        if (!elm.hasChildNodes()) {
          createChildren(vnode, children, insertedVnodeQueue);
        } else {
          // v-html and domProps: innerHTML
          if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
            if (i !== elm.innerHTML) {
              /* istanbul ignore if */
              if ("development" !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('server innerHTML: ', i);
                console.warn('client innerHTML: ', elm.innerHTML);
              }
              return false
            }
          } else {
            // iterate and compare children lists
            var childrenMatch = true;
            var childNode = elm.firstChild;
            for (var i$1 = 0; i$1 < children.length; i$1++) {
              if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                childrenMatch = false;
                break
              }
              childNode = childNode.nextSibling;
            }
            // if childNode is not null, it means the actual childNodes list is
            // longer than the virtual children list.
            if (!childrenMatch || childNode) {
              /* istanbul ignore if */
              if ("development" !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
              }
              return false
            }
          }
        }
      }
      if (isDef(data)) {
        var fullInvoke = false;
        for (var key in data) {
          if (!isRenderedModule(key)) {
            fullInvoke = true;
            invokeCreateHooks(vnode, insertedVnodeQueue);
            break
          }
        }
        if (!fullInvoke && data['class']) {
          // ensure collecting deps for deep class bindings for future updates
          traverse(data['class']);
        }
      }
    } else if (elm.data !== vnode.text) {
      elm.data = vnode.text;
    }
    return true
  }

  function assertNodeMatch (node, vnode, inVPre) {
    if (isDef(vnode.tag)) {
      return vnode.tag.indexOf('vue-component') === 0 || (
        !isUnknownElement$$1(vnode, inVPre) &&
        vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
      )
    } else {
      return node.nodeType === (vnode.isComment ? 8 : 3)
    }
  }

  return function patch (oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
      return
    }

    var isInitialPatch = false;
    var insertedVnodeQueue = [];

    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true;
      createElm(vnode, insertedVnodeQueue, parentElm, refElm);
    } else {
      var isRealElement = isDef(oldVnode.nodeType);
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);
      } else {
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR);
            hydrating = true;
          }
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true);
              return oldVnode
            } else {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              );
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode);
        }

        // replacing existing element
        var oldElm = oldVnode.elm;
        var parentElm$1 = nodeOps.parentNode(oldElm);

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm$1,
          nodeOps.nextSibling(oldElm)
        );

        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          var ancestor = vnode.parent;
          var patchable = isPatchable(vnode);
          while (ancestor) {
            for (var i = 0; i < cbs.destroy.length; ++i) {
              cbs.destroy[i](ancestor);
            }
            ancestor.elm = vnode.elm;
            if (patchable) {
              for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                cbs.create[i$1](emptyNode, ancestor);
              }
              // #6513
              // invoke insert hooks that may have been merged by create hooks.
              // e.g. for directives that uses the "inserted" hook.
              var insert = ancestor.data.hook.insert;
              if (insert.merged) {
                // start at index 1 to avoid re-invoking component mounted hook
                for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                  insert.fns[i$2]();
                }
              }
            } else {
              registerRef(ancestor);
            }
            ancestor = ancestor.parent;
          }
        }

        // destroy old node
        if (isDef(parentElm$1)) {
          removeVnodes(parentElm$1, [oldVnode], 0, 0);
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode);
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm
  }
}

/*  */

var directives = {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode) {
    updateDirectives(vnode, emptyNode);
  }
}

function updateDirectives (oldVnode, vnode) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}

function _update (oldVnode, vnode) {
  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

  var dirsWithInsert = [];
  var dirsWithPostpatch = [];

  var key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // new directive, bind
      callHook$1(dir, 'bind', vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value;
      callHook$1(dir, 'update', vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    var callInsert = function () {
      for (var i = 0; i < dirsWithInsert.length; i++) {
        callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', function () {
      for (var i = 0; i < dirsWithPostpatch.length; i++) {
        callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}

var emptyModifiers = Object.create(null);

function normalizeDirectives$1 (
  dirs,
  vm
) {
  var res = Object.create(null);
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  // $flow-disable-line
  return res
}

function getRawDirName (dir) {
  return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
}

function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
  var fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
    }
  }
}

var baseModules = [
  ref,
  directives
]

/*  */

function updateAttrs (oldVnode, vnode) {
  var opts = vnode.componentOptions;
  if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
    return
  }
  if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
    return
  }
  var key, cur, old;
  var elm = vnode.elm;
  var oldAttrs = oldVnode.data.attrs || {};
  var attrs = vnode.data.attrs || {};
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(attrs.__ob__)) {
    attrs = vnode.data.attrs = extend({}, attrs);
  }

  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      setAttr(elm, key, cur);
    }
  }
  // #4391: in IE9, setting type can reset value for input[type=radio]
  // #6666: IE/Edge forces progress value down to 1 before setting a max
  /* istanbul ignore if */
  if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
    setAttr(elm, 'value', attrs.value);
  }
  for (key in oldAttrs) {
    if (isUndef(attrs[key])) {
      if (isXlink(key)) {
        elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else if (!isEnumeratedAttr(key)) {
        elm.removeAttribute(key);
      }
    }
  }
}

function setAttr (el, key, value) {
  if (el.tagName.indexOf('-') > -1) {
    baseSetAttr(el, key, value);
  } else if (isBooleanAttr(key)) {
    // set attribute for blank value
    // e.g. <option disabled>Select one</option>
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // technically allowfullscreen is a boolean attribute for <iframe>,
      // but Flash expects a value of "true" when used on <embed> tag
      value = key === 'allowfullscreen' && el.tagName === 'EMBED'
        ? 'true'
        : key;
      el.setAttribute(key, value);
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true');
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    baseSetAttr(el, key, value);
  }
}

function baseSetAttr (el, key, value) {
  if (isFalsyAttrValue(value)) {
    el.removeAttribute(key);
  } else {
    // #7138: IE10 & 11 fires input event when setting placeholder on
    // <textarea>... block the first input event and remove the blocker
    // immediately.
    /* istanbul ignore if */
    if (
      isIE && !isIE9 &&
      el.tagName === 'TEXTAREA' &&
      key === 'placeholder' && !el.__ieph
    ) {
      var blocker = function (e) {
        e.stopImmediatePropagation();
        el.removeEventListener('input', blocker);
      };
      el.addEventListener('input', blocker);
      // $flow-disable-line
      el.__ieph = true; /* IE placeholder patched */
    }
    el.setAttribute(key, value);
  }
}

var attrs = {
  create: updateAttrs,
  update: updateAttrs
}

/*  */

function updateClass (oldVnode, vnode) {
  var el = vnode.elm;
  var data = vnode.data;
  var oldData = oldVnode.data;
  if (
    isUndef(data.staticClass) &&
    isUndef(data.class) && (
      isUndef(oldData) || (
        isUndef(oldData.staticClass) &&
        isUndef(oldData.class)
      )
    )
  ) {
    return
  }

  var cls = genClassForVnode(vnode);

  // handle transition classes
  var transitionClass = el._transitionClasses;
  if (isDef(transitionClass)) {
    cls = concat(cls, stringifyClass(transitionClass));
  }

  // set the class
  if (cls !== el._prevClass) {
    el.setAttribute('class', cls);
    el._prevClass = cls;
  }
}

var klass = {
  create: updateClass,
  update: updateClass
}

/*  */

var validDivisionCharRE = /[\w).+\-_$\]]/;

function parseFilters (exp) {
  var inSingle = false;
  var inDouble = false;
  var inTemplateString = false;
  var inRegex = false;
  var curly = 0;
  var square = 0;
  var paren = 0;
  var lastFilterIndex = 0;
  var c, prev, i, expression, filters;

  for (i = 0; i < exp.length; i++) {
    prev = c;
    c = exp.charCodeAt(i);
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
    } else if (
      c === 0x7C && // pipe
      exp.charCodeAt(i + 1) !== 0x7C &&
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren
    ) {
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1;
        expression = exp.slice(0, i).trim();
      } else {
        pushFilter();
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break         // "
        case 0x27: inSingle = true; break         // '
        case 0x60: inTemplateString = true; break // `
        case 0x28: paren++; break                 // (
        case 0x29: paren--; break                 // )
        case 0x5B: square++; break                // [
        case 0x5D: square--; break                // ]
        case 0x7B: curly++; break                 // {
        case 0x7D: curly--; break                 // }
      }
      if (c === 0x2f) { // /
        var j = i - 1;
        var p = (void 0);
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j);
          if (p !== ' ') { break }
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true;
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim();
  } else if (lastFilterIndex !== 0) {
    pushFilter();
  }

  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
    lastFilterIndex = i + 1;
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i]);
    }
  }

  return expression
}

function wrapFilter (exp, filter) {
  var i = filter.indexOf('(');
  if (i < 0) {
    // _f: resolveFilter
    return ("_f(\"" + filter + "\")(" + exp + ")")
  } else {
    var name = filter.slice(0, i);
    var args = filter.slice(i + 1);
    return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
  }
}

/*  */

function baseWarn (msg) {
  console.error(("[Vue compiler]: " + msg));
}

function pluckModuleFunction (
  modules,
  key
) {
  return modules
    ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; })
    : []
}

function addProp (el, name, value) {
  (el.props || (el.props = [])).push({ name: name, value: value });
  el.plain = false;
}

function addAttr (el, name, value) {
  (el.attrs || (el.attrs = [])).push({ name: name, value: value });
  el.plain = false;
}

// add a raw attr (use this in preTransforms)
function addRawAttr (el, name, value) {
  el.attrsMap[name] = value;
  el.attrsList.push({ name: name, value: value });
}

function addDirective (
  el,
  name,
  rawName,
  value,
  arg,
  modifiers
) {
  (el.directives || (el.directives = [])).push({ name: name, rawName: rawName, value: value, arg: arg, modifiers: modifiers });
  el.plain = false;
}

function addHandler (
  el,
  name,
  value,
  modifiers,
  important,
  warn
) {
  modifiers = modifiers || emptyObject;
  // warn prevent and passive modifier
  /* istanbul ignore if */
  if (
    "development" !== 'production' && warn &&
    modifiers.prevent && modifiers.passive
  ) {
    warn(
      'passive and prevent can\'t be used together. ' +
      'Passive handler can\'t prevent default event.'
    );
  }

  // check capture modifier
  if (modifiers.capture) {
    delete modifiers.capture;
    name = '!' + name; // mark the event as captured
  }
  if (modifiers.once) {
    delete modifiers.once;
    name = '~' + name; // mark the event as once
  }
  /* istanbul ignore if */
  if (modifiers.passive) {
    delete modifiers.passive;
    name = '&' + name; // mark the event as passive
  }

  // normalize click.right and click.middle since they don't actually fire
  // this is technically browser-specific, but at least for now browsers are
  // the only target envs that have right/middle clicks.
  if (name === 'click') {
    if (modifiers.right) {
      name = 'contextmenu';
      delete modifiers.right;
    } else if (modifiers.middle) {
      name = 'mouseup';
    }
  }

  var events;
  if (modifiers.native) {
    delete modifiers.native;
    events = el.nativeEvents || (el.nativeEvents = {});
  } else {
    events = el.events || (el.events = {});
  }

  var newHandler = {
    value: value.trim()
  };
  if (modifiers !== emptyObject) {
    newHandler.modifiers = modifiers;
  }

  var handlers = events[name];
  /* istanbul ignore if */
  if (Array.isArray(handlers)) {
    important ? handlers.unshift(newHandler) : handlers.push(newHandler);
  } else if (handlers) {
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
  } else {
    events[name] = newHandler;
  }

  el.plain = false;
}

function getBindingAttr (
  el,
  name,
  getStatic
) {
  var dynamicValue =
    getAndRemoveAttr(el, ':' + name) ||
    getAndRemoveAttr(el, 'v-bind:' + name);
  if (dynamicValue != null) {
    return parseFilters(dynamicValue)
  } else if (getStatic !== false) {
    var staticValue = getAndRemoveAttr(el, name);
    if (staticValue != null) {
      return JSON.stringify(staticValue)
    }
  }
}

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
function getAndRemoveAttr (
  el,
  name,
  removeFromMap
) {
  var val;
  if ((val = el.attrsMap[name]) != null) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1);
        break
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name];
  }
  return val
}

/*  */

/**
 * Cross-platform code generation for component v-model
 */
function genComponentModel (
  el,
  value,
  modifiers
) {
  var ref = modifiers || {};
  var number = ref.number;
  var trim = ref.trim;

  var baseValueExpression = '$$v';
  var valueExpression = baseValueExpression;
  if (trim) {
    valueExpression =
      "(typeof " + baseValueExpression + " === 'string'" +
      "? " + baseValueExpression + ".trim()" +
      ": " + baseValueExpression + ")";
  }
  if (number) {
    valueExpression = "_n(" + valueExpression + ")";
  }
  var assignment = genAssignmentCode(value, valueExpression);

  el.model = {
    value: ("(" + value + ")"),
    expression: ("\"" + value + "\""),
    callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
  };
}

/**
 * Cross-platform codegen helper for generating v-model value assignment code.
 */
function genAssignmentCode (
  value,
  assignment
) {
  var res = parseModel(value);
  if (res.key === null) {
    return (value + "=" + assignment)
  } else {
    return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
  }
}

/**
 * Parse a v-model expression into a base path and a final key segment.
 * Handles both dot-path and possible square brackets.
 *
 * Possible cases:
 *
 * - test
 * - test[key]
 * - test[test1[key]]
 * - test["a"][key]
 * - xxx.test[a[a].test1[key]]
 * - test.xxx.a["asa"][test1[key]]
 *
 */

var len;
var str;
var chr;
var index$1;
var expressionPos;
var expressionEndPos;



function parseModel (val) {
  // Fix https://github.com/vuejs/vue/pull/7730
  // allow v-model="obj.val " (trailing whitespace)
  val = val.trim();
  len = val.length;

  if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
    index$1 = val.lastIndexOf('.');
    if (index$1 > -1) {
      return {
        exp: val.slice(0, index$1),
        key: '"' + val.slice(index$1 + 1) + '"'
      }
    } else {
      return {
        exp: val,
        key: null
      }
    }
  }

  str = val;
  index$1 = expressionPos = expressionEndPos = 0;

  while (!eof()) {
    chr = next();
    /* istanbul ignore if */
    if (isStringStart(chr)) {
      parseString(chr);
    } else if (chr === 0x5B) {
      parseBracket(chr);
    }
  }

  return {
    exp: val.slice(0, expressionPos),
    key: val.slice(expressionPos + 1, expressionEndPos)
  }
}

function next () {
  return str.charCodeAt(++index$1)
}

function eof () {
  return index$1 >= len
}

function isStringStart (chr) {
  return chr === 0x22 || chr === 0x27
}

function parseBracket (chr) {
  var inBracket = 1;
  expressionPos = index$1;
  while (!eof()) {
    chr = next();
    if (isStringStart(chr)) {
      parseString(chr);
      continue
    }
    if (chr === 0x5B) { inBracket++; }
    if (chr === 0x5D) { inBracket--; }
    if (inBracket === 0) {
      expressionEndPos = index$1;
      break
    }
  }
}

function parseString (chr) {
  var stringQuote = chr;
  while (!eof()) {
    chr = next();
    if (chr === stringQuote) {
      break
    }
  }
}

/*  */

var warn$1;

// in some cases, the event used has to be determined at runtime
// so we used some reserved tokens during compile.
var RANGE_TOKEN = '__r';
var CHECKBOX_RADIO_TOKEN = '__c';

function model (
  el,
  dir,
  _warn
) {
  warn$1 = _warn;
  var value = dir.value;
  var modifiers = dir.modifiers;
  var tag = el.tag;
  var type = el.attrsMap.type;

  {
    // inputs with type="file" are read only and setting the input's
    // value will throw an error.
    if (tag === 'input' && type === 'file') {
      warn$1(
        "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
        "File inputs are read only. Use a v-on:change listener instead."
      );
    }
  }

  if (el.component) {
    genComponentModel(el, value, modifiers);
    // component v-model doesn't need extra runtime
    return false
  } else if (tag === 'select') {
    genSelect(el, value, modifiers);
  } else if (tag === 'input' && type === 'checkbox') {
    genCheckboxModel(el, value, modifiers);
  } else if (tag === 'input' && type === 'radio') {
    genRadioModel(el, value, modifiers);
  } else if (tag === 'input' || tag === 'textarea') {
    genDefaultModel(el, value, modifiers);
  } else if (!config.isReservedTag(tag)) {
    genComponentModel(el, value, modifiers);
    // component v-model doesn't need extra runtime
    return false
  } else {
    warn$1(
      "<" + (el.tag) + " v-model=\"" + value + "\">: " +
      "v-model is not supported on this element type. " +
      'If you are working with contenteditable, it\'s recommended to ' +
      'wrap a library dedicated for that purpose inside a custom component.'
    );
  }

  // ensure runtime directive metadata
  return true
}

function genCheckboxModel (
  el,
  value,
  modifiers
) {
  var number = modifiers && modifiers.number;
  var valueBinding = getBindingAttr(el, 'value') || 'null';
  var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
  var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
  addProp(el, 'checked',
    "Array.isArray(" + value + ")" +
    "?_i(" + value + "," + valueBinding + ")>-1" + (
      trueValueBinding === 'true'
        ? (":(" + value + ")")
        : (":_q(" + value + "," + trueValueBinding + ")")
    )
  );
  addHandler(el, 'change',
    "var $$a=" + value + "," +
        '$$el=$event.target,' +
        "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
    'if(Array.isArray($$a)){' +
      "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
          '$$i=_i($$a,$$v);' +
      "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
      "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
    "}else{" + (genAssignmentCode(value, '$$c')) + "}",
    null, true
  );
}

function genRadioModel (
  el,
  value,
  modifiers
) {
  var number = modifiers && modifiers.number;
  var valueBinding = getBindingAttr(el, 'value') || 'null';
  valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
  addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
  addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
}

function genSelect (
  el,
  value,
  modifiers
) {
  var number = modifiers && modifiers.number;
  var selectedVal = "Array.prototype.filter" +
    ".call($event.target.options,function(o){return o.selected})" +
    ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
    "return " + (number ? '_n(val)' : 'val') + "})";

  var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
  var code = "var $$selectedVal = " + selectedVal + ";";
  code = code + " " + (genAssignmentCode(value, assignment));
  addHandler(el, 'change', code, null, true);
}

function genDefaultModel (
  el,
  value,
  modifiers
) {
  var type = el.attrsMap.type;

  // warn if v-bind:value conflicts with v-model
  // except for inputs with v-bind:type
  {
    var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
    var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
    if (value$1 && !typeBinding) {
      var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
      warn$1(
        binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
        'because the latter already expands to a value binding internally'
      );
    }
  }

  var ref = modifiers || {};
  var lazy = ref.lazy;
  var number = ref.number;
  var trim = ref.trim;
  var needCompositionGuard = !lazy && type !== 'range';
  var event = lazy
    ? 'change'
    : type === 'range'
      ? RANGE_TOKEN
      : 'input';

  var valueExpression = '$event.target.value';
  if (trim) {
    valueExpression = "$event.target.value.trim()";
  }
  if (number) {
    valueExpression = "_n(" + valueExpression + ")";
  }

  var code = genAssignmentCode(value, valueExpression);
  if (needCompositionGuard) {
    code = "if($event.target.composing)return;" + code;
  }

  addProp(el, 'value', ("(" + value + ")"));
  addHandler(el, event, code, null, true);
  if (trim || number) {
    addHandler(el, 'blur', '$forceUpdate()');
  }
}

/*  */

// normalize v-model event tokens that can only be determined at runtime.
// it's important to place the event as the first in the array because
// the whole point is ensuring the v-model callback gets called before
// user-attached handlers.
function normalizeEvents (on) {
  /* istanbul ignore if */
  if (isDef(on[RANGE_TOKEN])) {
    // IE input[type=range] only supports `change` event
    var event = isIE ? 'change' : 'input';
    on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
    delete on[RANGE_TOKEN];
  }
  // This was originally intended to fix #4521 but no longer necessary
  // after 2.5. Keeping it for backwards compat with generated code from < 2.4
  /* istanbul ignore if */
  if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
    on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
    delete on[CHECKBOX_RADIO_TOKEN];
  }
}

var target$1;

function createOnceHandler (handler, event, capture) {
  var _target = target$1; // save current target element in closure
  return function onceHandler () {
    var res = handler.apply(null, arguments);
    if (res !== null) {
      remove$2(event, onceHandler, capture, _target);
    }
  }
}

function add$1 (
  event,
  handler,
  once$$1,
  capture,
  passive
) {
  handler = withMacroTask(handler);
  if (once$$1) { handler = createOnceHandler(handler, event, capture); }
  target$1.addEventListener(
    event,
    handler,
    supportsPassive
      ? { capture: capture, passive: passive }
      : capture
  );
}

function remove$2 (
  event,
  handler,
  capture,
  _target
) {
  (_target || target$1).removeEventListener(
    event,
    handler._withTask || handler,
    capture
  );
}

function updateDOMListeners (oldVnode, vnode) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  normalizeEvents(on);
  updateListeners(on, oldOn, add$1, remove$2, vnode.context);
  target$1 = undefined;
}

var events = {
  create: updateDOMListeners,
  update: updateDOMListeners
}

/*  */

function updateDOMProps (oldVnode, vnode) {
  if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
    return
  }
  var key, cur;
  var elm = vnode.elm;
  var oldProps = oldVnode.data.domProps || {};
  var props = vnode.data.domProps || {};
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(props.__ob__)) {
    props = vnode.data.domProps = extend({}, props);
  }

  for (key in oldProps) {
    if (isUndef(props[key])) {
      elm[key] = '';
    }
  }
  for (key in props) {
    cur = props[key];
    // ignore children if the node has textContent or innerHTML,
    // as these will throw away existing DOM nodes and cause removal errors
    // on subsequent patches (#3360)
    if (key === 'textContent' || key === 'innerHTML') {
      if (vnode.children) { vnode.children.length = 0; }
      if (cur === oldProps[key]) { continue }
      // #6601 work around Chrome version <= 55 bug where single textNode
      // replaced by innerHTML/textContent retains its parentNode property
      if (elm.childNodes.length === 1) {
        elm.removeChild(elm.childNodes[0]);
      }
    }

    if (key === 'value') {
      // store value as _value as well since
      // non-string values will be stringified
      elm._value = cur;
      // avoid resetting cursor position when value is the same
      var strCur = isUndef(cur) ? '' : String(cur);
      if (shouldUpdateValue(elm, strCur)) {
        elm.value = strCur;
      }
    } else {
      elm[key] = cur;
    }
  }
}

// check platforms/web/util/attrs.js acceptValue


function shouldUpdateValue (elm, checkVal) {
  return (!elm.composing && (
    elm.tagName === 'OPTION' ||
    isNotInFocusAndDirty(elm, checkVal) ||
    isDirtyWithModifiers(elm, checkVal)
  ))
}

function isNotInFocusAndDirty (elm, checkVal) {
  // return true when textbox (.number and .trim) loses focus and its value is
  // not equal to the updated value
  var notInFocus = true;
  // #6157
  // work around IE bug when accessing document.activeElement in an iframe
  try { notInFocus = document.activeElement !== elm; } catch (e) {}
  return notInFocus && elm.value !== checkVal
}

function isDirtyWithModifiers (elm, newVal) {
  var value = elm.value;
  var modifiers = elm._vModifiers; // injected by v-model runtime
  if (isDef(modifiers)) {
    if (modifiers.lazy) {
      // inputs with lazy should only be updated when not in focus
      return false
    }
    if (modifiers.number) {
      return toNumber(value) !== toNumber(newVal)
    }
    if (modifiers.trim) {
      return value.trim() !== newVal.trim()
    }
  }
  return value !== newVal
}

var domProps = {
  create: updateDOMProps,
  update: updateDOMProps
}

/*  */

var parseStyleText = cached(function (cssText) {
  var res = {};
  var listDelimiter = /;(?![^(]*\))/g;
  var propertyDelimiter = /:(.+)/;
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter);
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return res
});

// merge static and dynamic style data on the same vnode
function normalizeStyleData (data) {
  var style = normalizeStyleBinding(data.style);
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle
    ? extend(data.staticStyle, style)
    : style
}

// normalize possible array / string values into Object
function normalizeStyleBinding (bindingStyle) {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
function getStyle (vnode, checkChild) {
  var res = {};
  var styleData;

  if (checkChild) {
    var childNode = vnode;
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode;
      if (
        childNode && childNode.data &&
        (styleData = normalizeStyleData(childNode.data))
      ) {
        extend(res, styleData);
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData);
  }

  var parentNode = vnode;
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData);
    }
  }
  return res
}

/*  */

var cssVarRE = /^--/;
var importantRE = /\s*!important$/;
var setProp = function (el, name, val) {
  /* istanbul ignore if */
  if (cssVarRE.test(name)) {
    el.style.setProperty(name, val);
  } else if (importantRE.test(val)) {
    el.style.setProperty(name, val.replace(importantRE, ''), 'important');
  } else {
    var normalizedName = normalize(name);
    if (Array.isArray(val)) {
      // Support values array created by autoprefixer, e.g.
      // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
      // Set them one by one, and the browser will only set those it can recognize
      for (var i = 0, len = val.length; i < len; i++) {
        el.style[normalizedName] = val[i];
      }
    } else {
      el.style[normalizedName] = val;
    }
  }
};

var vendorNames = ['Webkit', 'Moz', 'ms'];

var emptyStyle;
var normalize = cached(function (prop) {
  emptyStyle = emptyStyle || document.createElement('div').style;
  prop = camelize(prop);
  if (prop !== 'filter' && (prop in emptyStyle)) {
    return prop
  }
  var capName = prop.charAt(0).toUpperCase() + prop.slice(1);
  for (var i = 0; i < vendorNames.length; i++) {
    var name = vendorNames[i] + capName;
    if (name in emptyStyle) {
      return name
    }
  }
});

function updateStyle (oldVnode, vnode) {
  var data = vnode.data;
  var oldData = oldVnode.data;

  if (isUndef(data.staticStyle) && isUndef(data.style) &&
    isUndef(oldData.staticStyle) && isUndef(oldData.style)
  ) {
    return
  }

  var cur, name;
  var el = vnode.elm;
  var oldStaticStyle = oldData.staticStyle;
  var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};

  // if static style exists, stylebinding already merged into it when doing normalizeStyleData
  var oldStyle = oldStaticStyle || oldStyleBinding;

  var style = normalizeStyleBinding(vnode.data.style) || {};

  // store normalized style under a different key for next diff
  // make sure to clone it if it's reactive, since the user likely wants
  // to mutate it.
  vnode.data.normalizedStyle = isDef(style.__ob__)
    ? extend({}, style)
    : style;

  var newStyle = getStyle(vnode, true);

  for (name in oldStyle) {
    if (isUndef(newStyle[name])) {
      setProp(el, name, '');
    }
  }
  for (name in newStyle) {
    cur = newStyle[name];
    if (cur !== oldStyle[name]) {
      // ie9 setting to null has no effect, must use empty string
      setProp(el, name, cur == null ? '' : cur);
    }
  }
}

var style = {
  create: updateStyle,
  update: updateStyle
}

/*  */

/**
 * Add class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function addClass (el, cls) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(function (c) { return el.classList.add(c); });
    } else {
      el.classList.add(cls);
    }
  } else {
    var cur = " " + (el.getAttribute('class') || '') + " ";
    if (cur.indexOf(' ' + cls + ' ') < 0) {
      el.setAttribute('class', (cur + cls).trim());
    }
  }
}

/**
 * Remove class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function removeClass (el, cls) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(function (c) { return el.classList.remove(c); });
    } else {
      el.classList.remove(cls);
    }
    if (!el.classList.length) {
      el.removeAttribute('class');
    }
  } else {
    var cur = " " + (el.getAttribute('class') || '') + " ";
    var tar = ' ' + cls + ' ';
    while (cur.indexOf(tar) >= 0) {
      cur = cur.replace(tar, ' ');
    }
    cur = cur.trim();
    if (cur) {
      el.setAttribute('class', cur);
    } else {
      el.removeAttribute('class');
    }
  }
}

/*  */

function resolveTransition (def) {
  if (!def) {
    return
  }
  /* istanbul ignore else */
  if (typeof def === 'object') {
    var res = {};
    if (def.css !== false) {
      extend(res, autoCssTransition(def.name || 'v'));
    }
    extend(res, def);
    return res
  } else if (typeof def === 'string') {
    return autoCssTransition(def)
  }
}

var autoCssTransition = cached(function (name) {
  return {
    enterClass: (name + "-enter"),
    enterToClass: (name + "-enter-to"),
    enterActiveClass: (name + "-enter-active"),
    leaveClass: (name + "-leave"),
    leaveToClass: (name + "-leave-to"),
    leaveActiveClass: (name + "-leave-active")
  }
});

var hasTransition = inBrowser && !isIE9;
var TRANSITION = 'transition';
var ANIMATION = 'animation';

// Transition property/event sniffing
var transitionProp = 'transition';
var transitionEndEvent = 'transitionend';
var animationProp = 'animation';
var animationEndEvent = 'animationend';
if (hasTransition) {
  /* istanbul ignore if */
  if (window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined
  ) {
    transitionProp = 'WebkitTransition';
    transitionEndEvent = 'webkitTransitionEnd';
  }
  if (window.onanimationend === undefined &&
    window.onwebkitanimationend !== undefined
  ) {
    animationProp = 'WebkitAnimation';
    animationEndEvent = 'webkitAnimationEnd';
  }
}

// binding to window is necessary to make hot reload work in IE in strict mode
var raf = inBrowser
  ? window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : setTimeout
  : /* istanbul ignore next */ function (fn) { return fn(); };

function nextFrame (fn) {
  raf(function () {
    raf(fn);
  });
}

function addTransitionClass (el, cls) {
  var transitionClasses = el._transitionClasses || (el._transitionClasses = []);
  if (transitionClasses.indexOf(cls) < 0) {
    transitionClasses.push(cls);
    addClass(el, cls);
  }
}

function removeTransitionClass (el, cls) {
  if (el._transitionClasses) {
    remove(el._transitionClasses, cls);
  }
  removeClass(el, cls);
}

function whenTransitionEnds (
  el,
  expectedType,
  cb
) {
  var ref = getTransitionInfo(el, expectedType);
  var type = ref.type;
  var timeout = ref.timeout;
  var propCount = ref.propCount;
  if (!type) { return cb() }
  var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
  var ended = 0;
  var end = function () {
    el.removeEventListener(event, onEnd);
    cb();
  };
  var onEnd = function (e) {
    if (e.target === el) {
      if (++ended >= propCount) {
        end();
      }
    }
  };
  setTimeout(function () {
    if (ended < propCount) {
      end();
    }
  }, timeout + 1);
  el.addEventListener(event, onEnd);
}

var transformRE = /\b(transform|all)(,|$)/;

function getTransitionInfo (el, expectedType) {
  var styles = window.getComputedStyle(el);
  var transitionDelays = styles[transitionProp + 'Delay'].split(', ');
  var transitionDurations = styles[transitionProp + 'Duration'].split(', ');
  var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  var animationDelays = styles[animationProp + 'Delay'].split(', ');
  var animationDurations = styles[animationProp + 'Duration'].split(', ');
  var animationTimeout = getTimeout(animationDelays, animationDurations);

  var type;
  var timeout = 0;
  var propCount = 0;
  /* istanbul ignore if */
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0
      ? transitionTimeout > animationTimeout
        ? TRANSITION
        : ANIMATION
      : null;
    propCount = type
      ? type === TRANSITION
        ? transitionDurations.length
        : animationDurations.length
      : 0;
  }
  var hasTransform =
    type === TRANSITION &&
    transformRE.test(styles[transitionProp + 'Property']);
  return {
    type: type,
    timeout: timeout,
    propCount: propCount,
    hasTransform: hasTransform
  }
}

function getTimeout (delays, durations) {
  /* istanbul ignore next */
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }

  return Math.max.apply(null, durations.map(function (d, i) {
    return toMs(d) + toMs(delays[i])
  }))
}

function toMs (s) {
  return Number(s.slice(0, -1)) * 1000
}

/*  */

function enter (vnode, toggleDisplay) {
  var el = vnode.elm;

  // call leave callback now
  if (isDef(el._leaveCb)) {
    el._leaveCb.cancelled = true;
    el._leaveCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (isUndef(data)) {
    return
  }

  /* istanbul ignore if */
  if (isDef(el._enterCb) || el.nodeType !== 1) {
    return
  }

  var css = data.css;
  var type = data.type;
  var enterClass = data.enterClass;
  var enterToClass = data.enterToClass;
  var enterActiveClass = data.enterActiveClass;
  var appearClass = data.appearClass;
  var appearToClass = data.appearToClass;
  var appearActiveClass = data.appearActiveClass;
  var beforeEnter = data.beforeEnter;
  var enter = data.enter;
  var afterEnter = data.afterEnter;
  var enterCancelled = data.enterCancelled;
  var beforeAppear = data.beforeAppear;
  var appear = data.appear;
  var afterAppear = data.afterAppear;
  var appearCancelled = data.appearCancelled;
  var duration = data.duration;

  // activeInstance will always be the <transition> component managing this
  // transition. One edge case to check is when the <transition> is placed
  // as the root node of a child component. In that case we need to check
  // <transition>'s parent for appear check.
  var context = activeInstance;
  var transitionNode = activeInstance.$vnode;
  while (transitionNode && transitionNode.parent) {
    transitionNode = transitionNode.parent;
    context = transitionNode.context;
  }

  var isAppear = !context._isMounted || !vnode.isRootInsert;

  if (isAppear && !appear && appear !== '') {
    return
  }

  var startClass = isAppear && appearClass
    ? appearClass
    : enterClass;
  var activeClass = isAppear && appearActiveClass
    ? appearActiveClass
    : enterActiveClass;
  var toClass = isAppear && appearToClass
    ? appearToClass
    : enterToClass;

  var beforeEnterHook = isAppear
    ? (beforeAppear || beforeEnter)
    : beforeEnter;
  var enterHook = isAppear
    ? (typeof appear === 'function' ? appear : enter)
    : enter;
  var afterEnterHook = isAppear
    ? (afterAppear || afterEnter)
    : afterEnter;
  var enterCancelledHook = isAppear
    ? (appearCancelled || enterCancelled)
    : enterCancelled;

  var explicitEnterDuration = toNumber(
    isObject(duration)
      ? duration.enter
      : duration
  );

  if ("development" !== 'production' && explicitEnterDuration != null) {
    checkDuration(explicitEnterDuration, 'enter', vnode);
  }

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl = getHookArgumentsLength(enterHook);

  var cb = el._enterCb = once(function () {
    if (expectsCSS) {
      removeTransitionClass(el, toClass);
      removeTransitionClass(el, activeClass);
    }
    if (cb.cancelled) {
      if (expectsCSS) {
        removeTransitionClass(el, startClass);
      }
      enterCancelledHook && enterCancelledHook(el);
    } else {
      afterEnterHook && afterEnterHook(el);
    }
    el._enterCb = null;
  });

  if (!vnode.data.show) {
    // remove pending leave element on enter by injecting an insert hook
    mergeVNodeHook(vnode, 'insert', function () {
      var parent = el.parentNode;
      var pendingNode = parent && parent._pending && parent._pending[vnode.key];
      if (pendingNode &&
        pendingNode.tag === vnode.tag &&
        pendingNode.elm._leaveCb
      ) {
        pendingNode.elm._leaveCb();
      }
      enterHook && enterHook(el, cb);
    });
  }

  // start enter transition
  beforeEnterHook && beforeEnterHook(el);
  if (expectsCSS) {
    addTransitionClass(el, startClass);
    addTransitionClass(el, activeClass);
    nextFrame(function () {
      removeTransitionClass(el, startClass);
      if (!cb.cancelled) {
        addTransitionClass(el, toClass);
        if (!userWantsControl) {
          if (isValidDuration(explicitEnterDuration)) {
            setTimeout(cb, explicitEnterDuration);
          } else {
            whenTransitionEnds(el, type, cb);
          }
        }
      }
    });
  }

  if (vnode.data.show) {
    toggleDisplay && toggleDisplay();
    enterHook && enterHook(el, cb);
  }

  if (!expectsCSS && !userWantsControl) {
    cb();
  }
}

function leave (vnode, rm) {
  var el = vnode.elm;

  // call enter callback now
  if (isDef(el._enterCb)) {
    el._enterCb.cancelled = true;
    el._enterCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (isUndef(data) || el.nodeType !== 1) {
    return rm()
  }

  /* istanbul ignore if */
  if (isDef(el._leaveCb)) {
    return
  }

  var css = data.css;
  var type = data.type;
  var leaveClass = data.leaveClass;
  var leaveToClass = data.leaveToClass;
  var leaveActiveClass = data.leaveActiveClass;
  var beforeLeave = data.beforeLeave;
  var leave = data.leave;
  var afterLeave = data.afterLeave;
  var leaveCancelled = data.leaveCancelled;
  var delayLeave = data.delayLeave;
  var duration = data.duration;

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl = getHookArgumentsLength(leave);

  var explicitLeaveDuration = toNumber(
    isObject(duration)
      ? duration.leave
      : duration
  );

  if ("development" !== 'production' && isDef(explicitLeaveDuration)) {
    checkDuration(explicitLeaveDuration, 'leave', vnode);
  }

  var cb = el._leaveCb = once(function () {
    if (el.parentNode && el.parentNode._pending) {
      el.parentNode._pending[vnode.key] = null;
    }
    if (expectsCSS) {
      removeTransitionClass(el, leaveToClass);
      removeTransitionClass(el, leaveActiveClass);
    }
    if (cb.cancelled) {
      if (expectsCSS) {
        removeTransitionClass(el, leaveClass);
      }
      leaveCancelled && leaveCancelled(el);
    } else {
      rm();
      afterLeave && afterLeave(el);
    }
    el._leaveCb = null;
  });

  if (delayLeave) {
    delayLeave(performLeave);
  } else {
    performLeave();
  }

  function performLeave () {
    // the delayed leave may have already been cancelled
    if (cb.cancelled) {
      return
    }
    // record leaving element
    if (!vnode.data.show) {
      (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
    }
    beforeLeave && beforeLeave(el);
    if (expectsCSS) {
      addTransitionClass(el, leaveClass);
      addTransitionClass(el, leaveActiveClass);
      nextFrame(function () {
        removeTransitionClass(el, leaveClass);
        if (!cb.cancelled) {
          addTransitionClass(el, leaveToClass);
          if (!userWantsControl) {
            if (isValidDuration(explicitLeaveDuration)) {
              setTimeout(cb, explicitLeaveDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }
    leave && leave(el, cb);
    if (!expectsCSS && !userWantsControl) {
      cb();
    }
  }
}

// only used in dev mode
function checkDuration (val, name, vnode) {
  if (typeof val !== 'number') {
    warn(
      "<transition> explicit " + name + " duration is not a valid number - " +
      "got " + (JSON.stringify(val)) + ".",
      vnode.context
    );
  } else if (isNaN(val)) {
    warn(
      "<transition> explicit " + name + " duration is NaN - " +
      'the duration expression might be incorrect.',
      vnode.context
    );
  }
}

function isValidDuration (val) {
  return typeof val === 'number' && !isNaN(val)
}

/**
 * Normalize a transition hook's argument length. The hook may be:
 * - a merged hook (invoker) with the original in .fns
 * - a wrapped component method (check ._length)
 * - a plain function (.length)
 */
function getHookArgumentsLength (fn) {
  if (isUndef(fn)) {
    return false
  }
  var invokerFns = fn.fns;
  if (isDef(invokerFns)) {
    // invoker
    return getHookArgumentsLength(
      Array.isArray(invokerFns)
        ? invokerFns[0]
        : invokerFns
    )
  } else {
    return (fn._length || fn.length) > 1
  }
}

function _enter (_, vnode) {
  if (vnode.data.show !== true) {
    enter(vnode);
  }
}

var transition = inBrowser ? {
  create: _enter,
  activate: _enter,
  remove: function remove$$1 (vnode, rm) {
    /* istanbul ignore else */
    if (vnode.data.show !== true) {
      leave(vnode, rm);
    } else {
      rm();
    }
  }
} : {}

var platformModules = [
  attrs,
  klass,
  events,
  domProps,
  style,
  transition
]

/*  */

// the directive module should be applied last, after all
// built-in modules have been applied.
var modules = platformModules.concat(baseModules);

var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });

/**
 * Not type checking this file because flow doesn't like attaching
 * properties to Elements.
 */

/* istanbul ignore if */
if (isIE9) {
  // http://www.matts411.com/post/internet-explorer-9-oninput/
  document.addEventListener('selectionchange', function () {
    var el = document.activeElement;
    if (el && el.vmodel) {
      trigger(el, 'input');
    }
  });
}

var directive = {
  inserted: function inserted (el, binding, vnode, oldVnode) {
    if (vnode.tag === 'select') {
      // #6903
      if (oldVnode.elm && !oldVnode.elm._vOptions) {
        mergeVNodeHook(vnode, 'postpatch', function () {
          directive.componentUpdated(el, binding, vnode);
        });
      } else {
        setSelected(el, binding, vnode.context);
      }
      el._vOptions = [].map.call(el.options, getValue);
    } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
      el._vModifiers = binding.modifiers;
      if (!binding.modifiers.lazy) {
        el.addEventListener('compositionstart', onCompositionStart);
        el.addEventListener('compositionend', onCompositionEnd);
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        el.addEventListener('change', onCompositionEnd);
        /* istanbul ignore if */
        if (isIE9) {
          el.vmodel = true;
        }
      }
    }
  },

  componentUpdated: function componentUpdated (el, binding, vnode) {
    if (vnode.tag === 'select') {
      setSelected(el, binding, vnode.context);
      // in case the options rendered by v-for have changed,
      // it's possible that the value is out-of-sync with the rendered options.
      // detect such cases and filter out values that no longer has a matching
      // option in the DOM.
      var prevOptions = el._vOptions;
      var curOptions = el._vOptions = [].map.call(el.options, getValue);
      if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
        // trigger change event if
        // no matching option found for at least one value
        var needReset = el.multiple
          ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
          : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
        if (needReset) {
          trigger(el, 'change');
        }
      }
    }
  }
};

function setSelected (el, binding, vm) {
  actuallySetSelected(el, binding, vm);
  /* istanbul ignore if */
  if (isIE || isEdge) {
    setTimeout(function () {
      actuallySetSelected(el, binding, vm);
    }, 0);
  }
}

function actuallySetSelected (el, binding, vm) {
  var value = binding.value;
  var isMultiple = el.multiple;
  if (isMultiple && !Array.isArray(value)) {
    "development" !== 'production' && warn(
      "<select multiple v-model=\"" + (binding.expression) + "\"> " +
      "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
      vm
    );
    return
  }
  var selected, option;
  for (var i = 0, l = el.options.length; i < l; i++) {
    option = el.options[i];
    if (isMultiple) {
      selected = looseIndexOf(value, getValue(option)) > -1;
      if (option.selected !== selected) {
        option.selected = selected;
      }
    } else {
      if (looseEqual(getValue(option), value)) {
        if (el.selectedIndex !== i) {
          el.selectedIndex = i;
        }
        return
      }
    }
  }
  if (!isMultiple) {
    el.selectedIndex = -1;
  }
}

function hasNoMatchingOption (value, options) {
  return options.every(function (o) { return !looseEqual(o, value); })
}

function getValue (option) {
  return '_value' in option
    ? option._value
    : option.value
}

function onCompositionStart (e) {
  e.target.composing = true;
}

function onCompositionEnd (e) {
  // prevent triggering an input event for no reason
  if (!e.target.composing) { return }
  e.target.composing = false;
  trigger(e.target, 'input');
}

function trigger (el, type) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(type, true, true);
  el.dispatchEvent(e);
}

/*  */

// recursively search for possible transition defined inside the component root
function locateNode (vnode) {
  return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
    ? locateNode(vnode.componentInstance._vnode)
    : vnode
}

var show = {
  bind: function bind (el, ref, vnode) {
    var value = ref.value;

    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    var originalDisplay = el.__vOriginalDisplay =
      el.style.display === 'none' ? '' : el.style.display;
    if (value && transition$$1) {
      vnode.data.show = true;
      enter(vnode, function () {
        el.style.display = originalDisplay;
      });
    } else {
      el.style.display = value ? originalDisplay : 'none';
    }
  },

  update: function update (el, ref, vnode) {
    var value = ref.value;
    var oldValue = ref.oldValue;

    /* istanbul ignore if */
    if (!value === !oldValue) { return }
    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    if (transition$$1) {
      vnode.data.show = true;
      if (value) {
        enter(vnode, function () {
          el.style.display = el.__vOriginalDisplay;
        });
      } else {
        leave(vnode, function () {
          el.style.display = 'none';
        });
      }
    } else {
      el.style.display = value ? el.__vOriginalDisplay : 'none';
    }
  },

  unbind: function unbind (
    el,
    binding,
    vnode,
    oldVnode,
    isDestroy
  ) {
    if (!isDestroy) {
      el.style.display = el.__vOriginalDisplay;
    }
  }
}

var platformDirectives = {
  model: directive,
  show: show
}

/*  */

// Provides transition support for a single element/component.
// supports transition mode (out-in / in-out)

var transitionProps = {
  name: String,
  appear: Boolean,
  css: Boolean,
  mode: String,
  type: String,
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String,
  duration: [Number, String, Object]
};

// in case the child is also an abstract component, e.g. <keep-alive>
// we want to recursively retrieve the real component to be rendered
function getRealChild (vnode) {
  var compOptions = vnode && vnode.componentOptions;
  if (compOptions && compOptions.Ctor.options.abstract) {
    return getRealChild(getFirstComponentChild(compOptions.children))
  } else {
    return vnode
  }
}

function extractTransitionData (comp) {
  var data = {};
  var options = comp.$options;
  // props
  for (var key in options.propsData) {
    data[key] = comp[key];
  }
  // events.
  // extract listeners and pass them directly to the transition methods
  var listeners = options._parentListeners;
  for (var key$1 in listeners) {
    data[camelize(key$1)] = listeners[key$1];
  }
  return data
}

function placeholder (h, rawChild) {
  if (/\d-keep-alive$/.test(rawChild.tag)) {
    return h('keep-alive', {
      props: rawChild.componentOptions.propsData
    })
  }
}

function hasParentTransition (vnode) {
  while ((vnode = vnode.parent)) {
    if (vnode.data.transition) {
      return true
    }
  }
}

function isSameChild (child, oldChild) {
  return oldChild.key === child.key && oldChild.tag === child.tag
}

var Transition = {
  name: 'transition',
  props: transitionProps,
  abstract: true,

  render: function render (h) {
    var this$1 = this;

    var children = this.$slots.default;
    if (!children) {
      return
    }

    // filter out text nodes (possible whitespaces)
    children = children.filter(function (c) { return c.tag || isAsyncPlaceholder(c); });
    /* istanbul ignore if */
    if (!children.length) {
      return
    }

    // warn multiple elements
    if ("development" !== 'production' && children.length > 1) {
      warn(
        '<transition> can only be used on a single element. Use ' +
        '<transition-group> for lists.',
        this.$parent
      );
    }

    var mode = this.mode;

    // warn invalid mode
    if ("development" !== 'production' &&
      mode && mode !== 'in-out' && mode !== 'out-in'
    ) {
      warn(
        'invalid <transition> mode: ' + mode,
        this.$parent
      );
    }

    var rawChild = children[0];

    // if this is a component root node and the component's
    // parent container node also has transition, skip.
    if (hasParentTransition(this.$vnode)) {
      return rawChild
    }

    // apply transition data to child
    // use getRealChild() to ignore abstract components e.g. keep-alive
    var child = getRealChild(rawChild);
    /* istanbul ignore if */
    if (!child) {
      return rawChild
    }

    if (this._leaving) {
      return placeholder(h, rawChild)
    }

    // ensure a key that is unique to the vnode type and to this transition
    // component instance. This key will be used to remove pending leaving nodes
    // during entering.
    var id = "__transition-" + (this._uid) + "-";
    child.key = child.key == null
      ? child.isComment
        ? id + 'comment'
        : id + child.tag
      : isPrimitive(child.key)
        ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
        : child.key;

    var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
    var oldRawChild = this._vnode;
    var oldChild = getRealChild(oldRawChild);

    // mark v-show
    // so that the transition module can hand over the control to the directive
    if (child.data.directives && child.data.directives.some(function (d) { return d.name === 'show'; })) {
      child.data.show = true;
    }

    if (
      oldChild &&
      oldChild.data &&
      !isSameChild(child, oldChild) &&
      !isAsyncPlaceholder(oldChild) &&
      // #6687 component root is a comment node
      !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
    ) {
      // replace old child transition data with fresh one
      // important for dynamic transitions!
      var oldData = oldChild.data.transition = extend({}, data);
      // handle transition mode
      if (mode === 'out-in') {
        // return placeholder node and queue update when leave finishes
        this._leaving = true;
        mergeVNodeHook(oldData, 'afterLeave', function () {
          this$1._leaving = false;
          this$1.$forceUpdate();
        });
        return placeholder(h, rawChild)
      } else if (mode === 'in-out') {
        if (isAsyncPlaceholder(child)) {
          return oldRawChild
        }
        var delayedLeave;
        var performLeave = function () { delayedLeave(); };
        mergeVNodeHook(data, 'afterEnter', performLeave);
        mergeVNodeHook(data, 'enterCancelled', performLeave);
        mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
      }
    }

    return rawChild
  }
}

/*  */

// Provides transition support for list items.
// supports move transitions using the FLIP technique.

// Because the vdom's children update algorithm is "unstable" - i.e.
// it doesn't guarantee the relative positioning of removed elements,
// we force transition-group to update its children into two passes:
// in the first pass, we remove all nodes that need to be removed,
// triggering their leaving transition; in the second pass, we insert/move
// into the final desired state. This way in the second pass removed
// nodes will remain where they should be.

var props = extend({
  tag: String,
  moveClass: String
}, transitionProps);

delete props.mode;

var TransitionGroup = {
  props: props,

  render: function render (h) {
    var tag = this.tag || this.$vnode.data.tag || 'span';
    var map = Object.create(null);
    var prevChildren = this.prevChildren = this.children;
    var rawChildren = this.$slots.default || [];
    var children = this.children = [];
    var transitionData = extractTransitionData(this);

    for (var i = 0; i < rawChildren.length; i++) {
      var c = rawChildren[i];
      if (c.tag) {
        if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
          children.push(c);
          map[c.key] = c
          ;(c.data || (c.data = {})).transition = transitionData;
        } else {
          var opts = c.componentOptions;
          var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
          warn(("<transition-group> children must be keyed: <" + name + ">"));
        }
      }
    }

    if (prevChildren) {
      var kept = [];
      var removed = [];
      for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
        var c$1 = prevChildren[i$1];
        c$1.data.transition = transitionData;
        c$1.data.pos = c$1.elm.getBoundingClientRect();
        if (map[c$1.key]) {
          kept.push(c$1);
        } else {
          removed.push(c$1);
        }
      }
      this.kept = h(tag, null, kept);
      this.removed = removed;
    }

    return h(tag, null, children)
  },

  beforeUpdate: function beforeUpdate () {
    // force removing pass
    this.__patch__(
      this._vnode,
      this.kept,
      false, // hydrating
      true // removeOnly (!important, avoids unnecessary moves)
    );
    this._vnode = this.kept;
  },

  updated: function updated () {
    var children = this.prevChildren;
    var moveClass = this.moveClass || ((this.name || 'v') + '-move');
    if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
      return
    }

    // we divide the work into three loops to avoid mixing DOM reads and writes
    // in each iteration - which helps prevent layout thrashing.
    children.forEach(callPendingCbs);
    children.forEach(recordPosition);
    children.forEach(applyTranslation);

    // force reflow to put everything in position
    // assign to this to avoid being removed in tree-shaking
    // $flow-disable-line
    this._reflow = document.body.offsetHeight;

    children.forEach(function (c) {
      if (c.data.moved) {
        var el = c.elm;
        var s = el.style;
        addTransitionClass(el, moveClass);
        s.transform = s.WebkitTransform = s.transitionDuration = '';
        el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
          if (!e || /transform$/.test(e.propertyName)) {
            el.removeEventListener(transitionEndEvent, cb);
            el._moveCb = null;
            removeTransitionClass(el, moveClass);
          }
        });
      }
    });
  },

  methods: {
    hasMove: function hasMove (el, moveClass) {
      /* istanbul ignore if */
      if (!hasTransition) {
        return false
      }
      /* istanbul ignore if */
      if (this._hasMove) {
        return this._hasMove
      }
      // Detect whether an element with the move class applied has
      // CSS transitions. Since the element may be inside an entering
      // transition at this very moment, we make a clone of it and remove
      // all other transition classes applied to ensure only the move class
      // is applied.
      var clone = el.cloneNode();
      if (el._transitionClasses) {
        el._transitionClasses.forEach(function (cls) { removeClass(clone, cls); });
      }
      addClass(clone, moveClass);
      clone.style.display = 'none';
      this.$el.appendChild(clone);
      var info = getTransitionInfo(clone);
      this.$el.removeChild(clone);
      return (this._hasMove = info.hasTransform)
    }
  }
}

function callPendingCbs (c) {
  /* istanbul ignore if */
  if (c.elm._moveCb) {
    c.elm._moveCb();
  }
  /* istanbul ignore if */
  if (c.elm._enterCb) {
    c.elm._enterCb();
  }
}

function recordPosition (c) {
  c.data.newPos = c.elm.getBoundingClientRect();
}

function applyTranslation (c) {
  var oldPos = c.data.pos;
  var newPos = c.data.newPos;
  var dx = oldPos.left - newPos.left;
  var dy = oldPos.top - newPos.top;
  if (dx || dy) {
    c.data.moved = true;
    var s = c.elm.style;
    s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
    s.transitionDuration = '0s';
  }
}

var platformComponents = {
  Transition: Transition,
  TransitionGroup: TransitionGroup
}

/*  */

// install platform specific utils
Vue.config.mustUseProp = mustUseProp;
Vue.config.isReservedTag = isReservedTag;
Vue.config.isReservedAttr = isReservedAttr;
Vue.config.getTagNamespace = getTagNamespace;
Vue.config.isUnknownElement = isUnknownElement;

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives);
extend(Vue.options.components, platformComponents);

// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop;

// public mount method
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating)
};

// devtools global hook
/* istanbul ignore next */
if (inBrowser) {
  setTimeout(function () {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue);
      } else if (
        "development" !== 'production' &&
        "development" !== 'test' &&
        isChrome
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        );
      }
    }
    if ("development" !== 'production' &&
      "development" !== 'test' &&
      config.productionTip !== false &&
      typeof console !== 'undefined'
    ) {
      console[console.info ? 'info' : 'log'](
        "You are running Vue in development mode.\n" +
        "Make sure to turn on production mode when deploying for production.\n" +
        "See more tips at https://vuejs.org/guide/deployment.html"
      );
    }
  }, 0);
}

/*  */

var defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g;
var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

var buildRegex = cached(function (delimiters) {
  var open = delimiters[0].replace(regexEscapeRE, '\\$&');
  var close = delimiters[1].replace(regexEscapeRE, '\\$&');
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
});



function parseText (
  text,
  delimiters
) {
  var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
  if (!tagRE.test(text)) {
    return
  }
  var tokens = [];
  var rawTokens = [];
  var lastIndex = tagRE.lastIndex = 0;
  var match, index, tokenValue;
  while ((match = tagRE.exec(text))) {
    index = match.index;
    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index));
      tokens.push(JSON.stringify(tokenValue));
    }
    // tag token
    var exp = parseFilters(match[1].trim());
    tokens.push(("_s(" + exp + ")"));
    rawTokens.push({ '@binding': exp });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex));
    tokens.push(JSON.stringify(tokenValue));
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}

/*  */

function transformNode (el, options) {
  var warn = options.warn || baseWarn;
  var staticClass = getAndRemoveAttr(el, 'class');
  if ("development" !== 'production' && staticClass) {
    var res = parseText(staticClass, options.delimiters);
    if (res) {
      warn(
        "class=\"" + staticClass + "\": " +
        'Interpolation inside attributes has been removed. ' +
        'Use v-bind or the colon shorthand instead. For example, ' +
        'instead of <div class="{{ val }}">, use <div :class="val">.'
      );
    }
  }
  if (staticClass) {
    el.staticClass = JSON.stringify(staticClass);
  }
  var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
  if (classBinding) {
    el.classBinding = classBinding;
  }
}

function genData (el) {
  var data = '';
  if (el.staticClass) {
    data += "staticClass:" + (el.staticClass) + ",";
  }
  if (el.classBinding) {
    data += "class:" + (el.classBinding) + ",";
  }
  return data
}

var klass$1 = {
  staticKeys: ['staticClass'],
  transformNode: transformNode,
  genData: genData
}

/*  */

function transformNode$1 (el, options) {
  var warn = options.warn || baseWarn;
  var staticStyle = getAndRemoveAttr(el, 'style');
  if (staticStyle) {
    /* istanbul ignore if */
    {
      var res = parseText(staticStyle, options.delimiters);
      if (res) {
        warn(
          "style=\"" + staticStyle + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div style="{{ val }}">, use <div :style="val">.'
        );
      }
    }
    el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
  }

  var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
  if (styleBinding) {
    el.styleBinding = styleBinding;
  }
}

function genData$1 (el) {
  var data = '';
  if (el.staticStyle) {
    data += "staticStyle:" + (el.staticStyle) + ",";
  }
  if (el.styleBinding) {
    data += "style:(" + (el.styleBinding) + "),";
  }
  return data
}

var style$1 = {
  staticKeys: ['staticStyle'],
  transformNode: transformNode$1,
  genData: genData$1
}

/*  */

var decoder;

var he = {
  decode: function decode (html) {
    decoder = decoder || document.createElement('div');
    decoder.innerHTML = html;
    return decoder.textContent
  }
}

/*  */

var isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
);

// Elements that you can, intentionally, leave open
// (and which close themselves)
var canBeLeftOpenTag = makeMap(
  'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
);

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
var isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
);

/**
 * Not type-checking this file because it's mostly vendor code.
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 */

// Regular Expressions for parsing tags and attributes
var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
// but for Vue templates we can enforce a simple charset
var ncname = '[a-zA-Z_][\\w\\-\\.]*';
var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
var startTagOpen = new RegExp(("^<" + qnameCapture));
var startTagClose = /^\s*(\/?)>/;
var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
var doctype = /^<!DOCTYPE [^>]+>/i;
// #7298: escape - to avoid being pased as HTML comment when inlined in page
var comment = /^<!\--/;
var conditionalComment = /^<!\[/;

var IS_REGEX_CAPTURING_BROKEN = false;
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === '';
});

// Special Elements (can contain anything)
var isPlainTextElement = makeMap('script,style,textarea', true);
var reCache = {};

var decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t'
};
var encodedAttr = /&(?:lt|gt|quot|amp);/g;
var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g;

// #5992
var isIgnoreNewlineTag = makeMap('pre,textarea', true);
var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

function decodeAttr (value, shouldDecodeNewlines) {
  var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
  return value.replace(re, function (match) { return decodingMap[match]; })
}

function parseHTML (html, options) {
  var stack = [];
  var expectHTML = options.expectHTML;
  var isUnaryTag$$1 = options.isUnaryTag || no;
  var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no;
  var index = 0;
  var last, lastTag;
  while (html) {
    last = html;
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      var textEnd = html.indexOf('<');
      if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) {
          var commentEnd = html.indexOf('-->');

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) {
              options.comment(html.substring(4, commentEnd));
            }
            advance(commentEnd + 3);
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          var conditionalEnd = html.indexOf(']>');

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2);
            continue
          }
        }

        // Doctype:
        var doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
          advance(doctypeMatch[0].length);
          continue
        }

        // End tag:
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          var curIndex = index;
          advance(endTagMatch[0].length);
          parseEndTag(endTagMatch[1], curIndex, index);
          continue
        }

        // Start tag:
        var startTagMatch = parseStartTag();
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          if (shouldIgnoreFirstNewline(lastTag, html)) {
            advance(1);
          }
          continue
        }
      }

      var text = (void 0), rest = (void 0), next = (void 0);
      if (textEnd >= 0) {
        rest = html.slice(textEnd);
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1);
          if (next < 0) { break }
          textEnd += next;
          rest = html.slice(textEnd);
        }
        text = html.substring(0, textEnd);
        advance(textEnd);
      }

      if (textEnd < 0) {
        text = html;
        html = '';
      }

      if (options.chars && text) {
        options.chars(text);
      }
    } else {
      var endTagLength = 0;
      var stackedTag = lastTag.toLowerCase();
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
      var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length;
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1);
        }
        if (options.chars) {
          options.chars(text);
        }
        return ''
      });
      index += html.length - rest$1.length;
      html = rest$1;
      parseEndTag(stackedTag, index - endTagLength, index);
    }

    if (html === last) {
      options.chars && options.chars(html);
      if ("development" !== 'production' && !stack.length && options.warn) {
        options.warn(("Mal-formatted tag at end of template: \"" + html + "\""));
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag();

  function advance (n) {
    index += n;
    html = html.substring(n);
  }

  function parseStartTag () {
    var start = html.match(startTagOpen);
    if (start) {
      var match = {
        tagName: start[1],
        attrs: [],
        start: index
      };
      advance(start[0].length);
      var end, attr;
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length);
        match.attrs.push(attr);
      }
      if (end) {
        match.unarySlash = end[1];
        advance(end[0].length);
        match.end = index;
        return match
      }
    }
  }

  function handleStartTag (match) {
    var tagName = match.tagName;
    var unarySlash = match.unarySlash;

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag);
      }
      if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
        parseEndTag(tagName);
      }
    }

    var unary = isUnaryTag$$1(tagName) || !!unarySlash;

    var l = match.attrs.length;
    var attrs = new Array(l);
    for (var i = 0; i < l; i++) {
      var args = match.attrs[i];
      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') { delete args[3]; }
        if (args[4] === '') { delete args[4]; }
        if (args[5] === '') { delete args[5]; }
      }
      var value = args[3] || args[4] || args[5] || '';
      var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines;
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines)
      };
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs });
      lastTag = tagName;
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end);
    }
  }

  function parseEndTag (tagName, start, end) {
    var pos, lowerCasedTagName;
    if (start == null) { start = index; }
    if (end == null) { end = index; }

    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase();
    }

    // Find the closest opened tag of the same type
    if (tagName) {
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0;
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if ("development" !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            ("tag <" + (stack[i].tag) + "> has no matching end tag.")
          );
        }
        if (options.end) {
          options.end(stack[i].tag, start, end);
        }
      }

      // Remove the open elements from the stack
      stack.length = pos;
      lastTag = pos && stack[pos - 1].tag;
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end);
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end);
      }
      if (options.end) {
        options.end(tagName, start, end);
      }
    }
  }
}

/*  */

var onRE = /^@|^v-on:/;
var dirRE = /^v-|^@|^:/;
var forAliasRE = /([^]*?)\s+(?:in|of)\s+([^]*)/;
var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
var stripParensRE = /^\(|\)$/g;

var argRE = /:(.*)$/;
var bindRE = /^:|^v-bind:/;
var modifierRE = /\.[^.]+/g;

var decodeHTMLCached = cached(he.decode);

// configurable state
var warn$2;
var delimiters;
var transforms;
var preTransforms;
var postTransforms;
var platformIsPreTag;
var platformMustUseProp;
var platformGetTagNamespace;



function createASTElement (
  tag,
  attrs,
  parent
) {
  return {
    type: 1,
    tag: tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    parent: parent,
    children: []
  }
}

/**
 * Convert HTML string to AST.
 */
function parse (
  template,
  options
) {
  warn$2 = options.warn || baseWarn;

  platformIsPreTag = options.isPreTag || no;
  platformMustUseProp = options.mustUseProp || no;
  platformGetTagNamespace = options.getTagNamespace || no;

  transforms = pluckModuleFunction(options.modules, 'transformNode');
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

  delimiters = options.delimiters;

  var stack = [];
  var preserveWhitespace = options.preserveWhitespace !== false;
  var root;
  var currentParent;
  var inVPre = false;
  var inPre = false;
  var warned = false;

  function warnOnce (msg) {
    if (!warned) {
      warned = true;
      warn$2(msg);
    }
  }

  function closeElement (element) {
    // check pre state
    if (element.pre) {
      inVPre = false;
    }
    if (platformIsPreTag(element.tag)) {
      inPre = false;
    }
    // apply post-transforms
    for (var i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options);
    }
  }

  parseHTML(template, {
    warn: warn$2,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    start: function start (tag, attrs, unary) {
      // check namespace.
      // inherit parent ns if there is one
      var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs);
      }

      var element = createASTElement(tag, attrs, currentParent);
      if (ns) {
        element.ns = ns;
      }

      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forbidden = true;
        "development" !== 'production' && warn$2(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          "<" + tag + ">" + ', as they will not be parsed.'
        );
      }

      // apply pre-transforms
      for (var i = 0; i < preTransforms.length; i++) {
        element = preTransforms[i](element, options) || element;
      }

      if (!inVPre) {
        processPre(element);
        if (element.pre) {
          inVPre = true;
        }
      }
      if (platformIsPreTag(element.tag)) {
        inPre = true;
      }
      if (inVPre) {
        processRawAttrs(element);
      } else if (!element.processed) {
        // structural directives
        processFor(element);
        processIf(element);
        processOnce(element);
        // element-scope stuff
        processElement(element, options);
      }

      function checkRootConstraints (el) {
        {
          if (el.tag === 'slot' || el.tag === 'template') {
            warnOnce(
              "Cannot use <" + (el.tag) + "> as component root element because it may " +
              'contain multiple nodes.'
            );
          }
          if (el.attrsMap.hasOwnProperty('v-for')) {
            warnOnce(
              'Cannot use v-for on stateful component root element because ' +
              'it renders multiple elements.'
            );
          }
        }
      }

      // tree management
      if (!root) {
        root = element;
        checkRootConstraints(root);
      } else if (!stack.length) {
        // allow root elements with v-if, v-else-if and v-else
        if (root.if && (element.elseif || element.else)) {
          checkRootConstraints(element);
          addIfCondition(root, {
            exp: element.elseif,
            block: element
          });
        } else {
          warnOnce(
            "Component template should contain exactly one root element. " +
            "If you are using v-if on multiple elements, " +
            "use v-else-if to chain them instead."
          );
        }
      }
      if (currentParent && !element.forbidden) {
        if (element.elseif || element.else) {
          processIfConditions(element, currentParent);
        } else if (element.slotScope) { // scoped slot
          currentParent.plain = false;
          var name = element.slotTarget || '"default"';(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
        } else {
          currentParent.children.push(element);
          element.parent = currentParent;
        }
      }
      if (!unary) {
        currentParent = element;
        stack.push(element);
      } else {
        closeElement(element);
      }
    },

    end: function end () {
      // remove trailing whitespace
      var element = stack[stack.length - 1];
      var lastNode = element.children[element.children.length - 1];
      if (lastNode && lastNode.type === 3 && lastNode.text === ' ' && !inPre) {
        element.children.pop();
      }
      // pop stack
      stack.length -= 1;
      currentParent = stack[stack.length - 1];
      closeElement(element);
    },

    chars: function chars (text) {
      if (!currentParent) {
        {
          if (text === template) {
            warnOnce(
              'Component template requires a root element, rather than just text.'
            );
          } else if ((text = text.trim())) {
            warnOnce(
              ("text \"" + text + "\" outside root element will be ignored.")
            );
          }
        }
        return
      }
      // IE textarea placeholder bug
      /* istanbul ignore if */
      if (isIE &&
        currentParent.tag === 'textarea' &&
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }
      var children = currentParent.children;
      text = inPre || text.trim()
        ? isTextTag(currentParent) ? text : decodeHTMLCached(text)
        // only preserve whitespace if its not right after a starting tag
        : preserveWhitespace && children.length ? ' ' : '';
      if (text) {
        var res;
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          children.push({
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text: text
          });
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          children.push({
            type: 3,
            text: text
          });
        }
      }
    },
    comment: function comment (text) {
      currentParent.children.push({
        type: 3,
        text: text,
        isComment: true
      });
    }
  });
  return root
}

function processPre (el) {
  if (getAndRemoveAttr(el, 'v-pre') != null) {
    el.pre = true;
  }
}

function processRawAttrs (el) {
  var l = el.attrsList.length;
  if (l) {
    var attrs = el.attrs = new Array(l);
    for (var i = 0; i < l; i++) {
      attrs[i] = {
        name: el.attrsList[i].name,
        value: JSON.stringify(el.attrsList[i].value)
      };
    }
  } else if (!el.pre) {
    // non root node in pre blocks with no attributes
    el.plain = true;
  }
}

function processElement (element, options) {
  processKey(element);

  // determine whether this is a plain element after
  // removing structural attributes
  element.plain = !element.key && !element.attrsList.length;

  processRef(element);
  processSlot(element);
  processComponent(element);
  for (var i = 0; i < transforms.length; i++) {
    element = transforms[i](element, options) || element;
  }
  processAttrs(element);
}

function processKey (el) {
  var exp = getBindingAttr(el, 'key');
  if (exp) {
    if ("development" !== 'production' && el.tag === 'template') {
      warn$2("<template> cannot be keyed. Place the key on real elements instead.");
    }
    el.key = exp;
  }
}

function processRef (el) {
  var ref = getBindingAttr(el, 'ref');
  if (ref) {
    el.ref = ref;
    el.refInFor = checkInFor(el);
  }
}

function processFor (el) {
  var exp;
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    var res = parseFor(exp);
    if (res) {
      extend(el, res);
    } else {
      warn$2(
        ("Invalid v-for expression: " + exp)
      );
    }
  }
}



function parseFor (exp) {
  var inMatch = exp.match(forAliasRE);
  if (!inMatch) { return }
  var res = {};
  res.for = inMatch[2].trim();
  var alias = inMatch[1].trim().replace(stripParensRE, '');
  var iteratorMatch = alias.match(forIteratorRE);
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '');
    res.iterator1 = iteratorMatch[1].trim();
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim();
    }
  } else {
    res.alias = alias;
  }
  return res
}

function processIf (el) {
  var exp = getAndRemoveAttr(el, 'v-if');
  if (exp) {
    el.if = exp;
    addIfCondition(el, {
      exp: exp,
      block: el
    });
  } else {
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true;
    }
    var elseif = getAndRemoveAttr(el, 'v-else-if');
    if (elseif) {
      el.elseif = elseif;
    }
  }
}

function processIfConditions (el, parent) {
  var prev = findPrevElement(parent.children);
  if (prev && prev.if) {
    addIfCondition(prev, {
      exp: el.elseif,
      block: el
    });
  } else {
    warn$2(
      "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
      "used on element <" + (el.tag) + "> without corresponding v-if."
    );
  }
}

function findPrevElement (children) {
  var i = children.length;
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      if ("development" !== 'production' && children[i].text !== ' ') {
        warn$2(
          "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
          "will be ignored."
        );
      }
      children.pop();
    }
  }
}

function addIfCondition (el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = [];
  }
  el.ifConditions.push(condition);
}

function processOnce (el) {
  var once$$1 = getAndRemoveAttr(el, 'v-once');
  if (once$$1 != null) {
    el.once = true;
  }
}

function processSlot (el) {
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name');
    if ("development" !== 'production' && el.key) {
      warn$2(
        "`key` does not work on <slot> because slots are abstract outlets " +
        "and can possibly expand into multiple elements. " +
        "Use the key on a wrapping element instead."
      );
    }
  } else {
    var slotScope;
    if (el.tag === 'template') {
      slotScope = getAndRemoveAttr(el, 'scope');
      /* istanbul ignore if */
      if ("development" !== 'production' && slotScope) {
        warn$2(
          "the \"scope\" attribute for scoped slots have been deprecated and " +
          "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
          "can also be used on plain elements in addition to <template> to " +
          "denote scoped slots.",
          true
        );
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      /* istanbul ignore if */
      if ("development" !== 'production' && el.attrsMap['v-for']) {
        warn$2(
          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
          "(v-for takes higher priority). Use a wrapper <template> for the " +
          "scoped slot to make it clearer.",
          true
        );
      }
      el.slotScope = slotScope;
    }
    var slotTarget = getBindingAttr(el, 'slot');
    if (slotTarget) {
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== 'template' && !el.slotScope) {
        addAttr(el, 'slot', slotTarget);
      }
    }
  }
}

function processComponent (el) {
  var binding;
  if ((binding = getBindingAttr(el, 'is'))) {
    el.component = binding;
  }
  if (getAndRemoveAttr(el, 'inline-template') != null) {
    el.inlineTemplate = true;
  }
}

function processAttrs (el) {
  var list = el.attrsList;
  var i, l, name, rawName, value, modifiers, isProp;
  for (i = 0, l = list.length; i < l; i++) {
    name = rawName = list[i].name;
    value = list[i].value;
    if (dirRE.test(name)) {
      // mark element as dynamic
      el.hasBindings = true;
      // modifiers
      modifiers = parseModifiers(name);
      if (modifiers) {
        name = name.replace(modifierRE, '');
      }
      if (bindRE.test(name)) { // v-bind
        name = name.replace(bindRE, '');
        value = parseFilters(value);
        isProp = false;
        if (modifiers) {
          if (modifiers.prop) {
            isProp = true;
            name = camelize(name);
            if (name === 'innerHtml') { name = 'innerHTML'; }
          }
          if (modifiers.camel) {
            name = camelize(name);
          }
          if (modifiers.sync) {
            addHandler(
              el,
              ("update:" + (camelize(name))),
              genAssignmentCode(value, "$event")
            );
          }
        }
        if (isProp || (
          !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
        )) {
          addProp(el, name, value);
        } else {
          addAttr(el, name, value);
        }
      } else if (onRE.test(name)) { // v-on
        name = name.replace(onRE, '');
        addHandler(el, name, value, modifiers, false, warn$2);
      } else { // normal directives
        name = name.replace(dirRE, '');
        // parse arg
        var argMatch = name.match(argRE);
        var arg = argMatch && argMatch[1];
        if (arg) {
          name = name.slice(0, -(arg.length + 1));
        }
        addDirective(el, name, rawName, value, arg, modifiers);
        if ("development" !== 'production' && name === 'model') {
          checkForAliasModel(el, value);
        }
      }
    } else {
      // literal attribute
      {
        var res = parseText(value, delimiters);
        if (res) {
          warn$2(
            name + "=\"" + value + "\": " +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div id="{{ val }}">, use <div :id="val">.'
          );
        }
      }
      addAttr(el, name, JSON.stringify(value));
      // #6887 firefox doesn't update muted state if set via attribute
      // even immediately after element creation
      if (!el.component &&
          name === 'muted' &&
          platformMustUseProp(el.tag, el.attrsMap.type, name)) {
        addProp(el, name, 'true');
      }
    }
  }
}

function checkInFor (el) {
  var parent = el;
  while (parent) {
    if (parent.for !== undefined) {
      return true
    }
    parent = parent.parent;
  }
  return false
}

function parseModifiers (name) {
  var match = name.match(modifierRE);
  if (match) {
    var ret = {};
    match.forEach(function (m) { ret[m.slice(1)] = true; });
    return ret
  }
}

function makeAttrsMap (attrs) {
  var map = {};
  for (var i = 0, l = attrs.length; i < l; i++) {
    if (
      "development" !== 'production' &&
      map[attrs[i].name] && !isIE && !isEdge
    ) {
      warn$2('duplicate attribute: ' + attrs[i].name);
    }
    map[attrs[i].name] = attrs[i].value;
  }
  return map
}

// for script (e.g. type="x/template") or style, do not decode content
function isTextTag (el) {
  return el.tag === 'script' || el.tag === 'style'
}

function isForbiddenTag (el) {
  return (
    el.tag === 'style' ||
    (el.tag === 'script' && (
      !el.attrsMap.type ||
      el.attrsMap.type === 'text/javascript'
    ))
  )
}

var ieNSBug = /^xmlns:NS\d+/;
var ieNSPrefix = /^NS\d+:/;

/* istanbul ignore next */
function guardIESVGBug (attrs) {
  var res = [];
  for (var i = 0; i < attrs.length; i++) {
    var attr = attrs[i];
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '');
      res.push(attr);
    }
  }
  return res
}

function checkForAliasModel (el, value) {
  var _el = el;
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn$2(
        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
        "You are binding v-model directly to a v-for iteration alias. " +
        "This will not be able to modify the v-for source array because " +
        "writing to the alias is like modifying a function local variable. " +
        "Consider using an array of objects and use v-model on an object property instead."
      );
    }
    _el = _el.parent;
  }
}

/*  */

/**
 * Expand input[v-model] with dyanmic type bindings into v-if-else chains
 * Turn this:
 *   <input v-model="data[type]" :type="type">
 * into this:
 *   <input v-if="type === 'checkbox'" type="checkbox" v-model="data[type]">
 *   <input v-else-if="type === 'radio'" type="radio" v-model="data[type]">
 *   <input v-else :type="type" v-model="data[type]">
 */

function preTransformNode (el, options) {
  if (el.tag === 'input') {
    var map = el.attrsMap;
    if (!map['v-model']) {
      return
    }

    var typeBinding;
    if (map[':type'] || map['v-bind:type']) {
      typeBinding = getBindingAttr(el, 'type');
    }
    if (!map.type && !typeBinding && map['v-bind']) {
      typeBinding = "(" + (map['v-bind']) + ").type";
    }

    if (typeBinding) {
      var ifCondition = getAndRemoveAttr(el, 'v-if', true);
      var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
      var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
      var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
      // 1. checkbox
      var branch0 = cloneASTElement(el);
      // process for on the main node
      processFor(branch0);
      addRawAttr(branch0, 'type', 'checkbox');
      processElement(branch0, options);
      branch0.processed = true; // prevent it from double-processed
      branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
      addIfCondition(branch0, {
        exp: branch0.if,
        block: branch0
      });
      // 2. add radio else-if condition
      var branch1 = cloneASTElement(el);
      getAndRemoveAttr(branch1, 'v-for', true);
      addRawAttr(branch1, 'type', 'radio');
      processElement(branch1, options);
      addIfCondition(branch0, {
        exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
        block: branch1
      });
      // 3. other
      var branch2 = cloneASTElement(el);
      getAndRemoveAttr(branch2, 'v-for', true);
      addRawAttr(branch2, ':type', typeBinding);
      processElement(branch2, options);
      addIfCondition(branch0, {
        exp: ifCondition,
        block: branch2
      });

      if (hasElse) {
        branch0.else = true;
      } else if (elseIfCondition) {
        branch0.elseif = elseIfCondition;
      }

      return branch0
    }
  }
}

function cloneASTElement (el) {
  return createASTElement(el.tag, el.attrsList.slice(), el.parent)
}

var model$2 = {
  preTransformNode: preTransformNode
}

var modules$1 = [
  klass$1,
  style$1,
  model$2
]

/*  */

function text (el, dir) {
  if (dir.value) {
    addProp(el, 'textContent', ("_s(" + (dir.value) + ")"));
  }
}

/*  */

function html (el, dir) {
  if (dir.value) {
    addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"));
  }
}

var directives$1 = {
  model: model,
  text: text,
  html: html
}

/*  */

var baseOptions = {
  expectHTML: true,
  modules: modules$1,
  directives: directives$1,
  isPreTag: isPreTag,
  isUnaryTag: isUnaryTag,
  mustUseProp: mustUseProp,
  canBeLeftOpenTag: canBeLeftOpenTag,
  isReservedTag: isReservedTag,
  getTagNamespace: getTagNamespace,
  staticKeys: genStaticKeys(modules$1)
};

/*  */

var isStaticKey;
var isPlatformReservedTag;

var genStaticKeysCached = cached(genStaticKeys$1);

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */
function optimize (root, options) {
  if (!root) { return }
  isStaticKey = genStaticKeysCached(options.staticKeys || '');
  isPlatformReservedTag = options.isReservedTag || no;
  // first pass: mark all non-static nodes.
  markStatic$1(root);
  // second pass: mark static roots.
  markStaticRoots(root, false);
}

function genStaticKeys$1 (keys) {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs' +
    (keys ? ',' + keys : '')
  )
}

function markStatic$1 (node) {
  node.static = isStatic(node);
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return
    }
    for (var i = 0, l = node.children.length; i < l; i++) {
      var child = node.children[i];
      markStatic$1(child);
      if (!child.static) {
        node.static = false;
      }
    }
    if (node.ifConditions) {
      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
        var block = node.ifConditions[i$1].block;
        markStatic$1(block);
        if (!block.static) {
          node.static = false;
        }
      }
    }
  }
}

function markStaticRoots (node, isInFor) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor;
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      node.staticRoot = true;
      return
    } else {
      node.staticRoot = false;
    }
    if (node.children) {
      for (var i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for);
      }
    }
    if (node.ifConditions) {
      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
        markStaticRoots(node.ifConditions[i$1].block, isInFor);
      }
    }
  }
}

function isStatic (node) {
  if (node.type === 2) { // expression
    return false
  }
  if (node.type === 3) { // text
    return true
  }
  return !!(node.pre || (
    !node.hasBindings && // no dynamic bindings
    !node.if && !node.for && // not v-if or v-for or v-else
    !isBuiltInTag(node.tag) && // not a built-in
    isPlatformReservedTag(node.tag) && // not a component
    !isDirectChildOfTemplateFor(node) &&
    Object.keys(node).every(isStaticKey)
  ))
}

function isDirectChildOfTemplateFor (node) {
  while (node.parent) {
    node = node.parent;
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}

/*  */

var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function\s*\(/;
var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

// KeyboardEvent.keyCode aliases
var keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
};

// KeyboardEvent.key aliases
var keyNames = {
  esc: 'Escape',
  tab: 'Tab',
  enter: 'Enter',
  space: ' ',
  // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
  up: ['Up', 'ArrowUp'],
  left: ['Left', 'ArrowLeft'],
  right: ['Right', 'ArrowRight'],
  down: ['Down', 'ArrowDown'],
  'delete': ['Backspace', 'Delete']
};

// #4868: modifiers that prevent the execution of the listener
// need to explicitly return null so that we can determine whether to remove
// the listener for .once
var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

var modifierCode = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard("$event.target !== $event.currentTarget"),
  ctrl: genGuard("!$event.ctrlKey"),
  shift: genGuard("!$event.shiftKey"),
  alt: genGuard("!$event.altKey"),
  meta: genGuard("!$event.metaKey"),
  left: genGuard("'button' in $event && $event.button !== 0"),
  middle: genGuard("'button' in $event && $event.button !== 1"),
  right: genGuard("'button' in $event && $event.button !== 2")
};

function genHandlers (
  events,
  isNative,
  warn
) {
  var res = isNative ? 'nativeOn:{' : 'on:{';
  for (var name in events) {
    res += "\"" + name + "\":" + (genHandler(name, events[name])) + ",";
  }
  return res.slice(0, -1) + '}'
}

function genHandler (
  name,
  handler
) {
  if (!handler) {
    return 'function(){}'
  }

  if (Array.isArray(handler)) {
    return ("[" + (handler.map(function (handler) { return genHandler(name, handler); }).join(',')) + "]")
  }

  var isMethodPath = simplePathRE.test(handler.value);
  var isFunctionExpression = fnExpRE.test(handler.value);

  if (!handler.modifiers) {
    if (isMethodPath || isFunctionExpression) {
      return handler.value
    }
    /* istanbul ignore if */
    return ("function($event){" + (handler.value) + "}") // inline statement
  } else {
    var code = '';
    var genModifierCode = '';
    var keys = [];
    for (var key in handler.modifiers) {
      if (modifierCode[key]) {
        genModifierCode += modifierCode[key];
        // left/right
        if (keyCodes[key]) {
          keys.push(key);
        }
      } else if (key === 'exact') {
        var modifiers = (handler.modifiers);
        genModifierCode += genGuard(
          ['ctrl', 'shift', 'alt', 'meta']
            .filter(function (keyModifier) { return !modifiers[keyModifier]; })
            .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
            .join('||')
        );
      } else {
        keys.push(key);
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys);
    }
    // Make sure modifiers like prevent and stop get executed after key filtering
    if (genModifierCode) {
      code += genModifierCode;
    }
    var handlerCode = isMethodPath
      ? ("return " + (handler.value) + "($event)")
      : isFunctionExpression
        ? ("return (" + (handler.value) + ")($event)")
        : handler.value;
    /* istanbul ignore if */
    return ("function($event){" + code + handlerCode + "}")
  }
}

function genKeyFilter (keys) {
  return ("if(!('button' in $event)&&" + (keys.map(genFilterCode).join('&&')) + ")return null;")
}

function genFilterCode (key) {
  var keyVal = parseInt(key, 10);
  if (keyVal) {
    return ("$event.keyCode!==" + keyVal)
  }
  var keyCode = keyCodes[key];
  var keyName = keyNames[key];
  return (
    "_k($event.keyCode," +
    (JSON.stringify(key)) + "," +
    (JSON.stringify(keyCode)) + "," +
    "$event.key," +
    "" + (JSON.stringify(keyName)) +
    ")"
  )
}

/*  */

function on (el, dir) {
  if ("development" !== 'production' && dir.modifiers) {
    warn("v-on without argument does not support modifiers.");
  }
  el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
}

/*  */

function bind$1 (el, dir) {
  el.wrapData = function (code) {
    return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
  };
}

/*  */

var baseDirectives = {
  on: on,
  bind: bind$1,
  cloak: noop
}

/*  */

var CodegenState = function CodegenState (options) {
  this.options = options;
  this.warn = options.warn || baseWarn;
  this.transforms = pluckModuleFunction(options.modules, 'transformCode');
  this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
  this.directives = extend(extend({}, baseDirectives), options.directives);
  var isReservedTag = options.isReservedTag || no;
  this.maybeComponent = function (el) { return !isReservedTag(el.tag); };
  this.onceId = 0;
  this.staticRenderFns = [];
};



function generate (
  ast,
  options
) {
  var state = new CodegenState(options);
  var code = ast ? genElement(ast, state) : '_c("div")';
  return {
    render: ("with(this){return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
}

function genElement (el, state) {
  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget) {
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    return genSlot(el, state)
  } else {
    // component or element
    var code;
    if (el.component) {
      code = genComponent(el.component, el, state);
    } else {
      var data = el.plain ? undefined : genData$2(el, state);

      var children = el.inlineTemplate ? null : genChildren(el, state, true);
      code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
    }
    // module transforms
    for (var i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code);
    }
    return code
  }
}

// hoist static sub-trees out
function genStatic (el, state) {
  el.staticProcessed = true;
  state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
  return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
}

// v-once
function genOnce (el, state) {
  el.onceProcessed = true;
  if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.staticInFor) {
    var key = '';
    var parent = el.parent;
    while (parent) {
      if (parent.for) {
        key = parent.key;
        break
      }
      parent = parent.parent;
    }
    if (!key) {
      "development" !== 'production' && state.warn(
        "v-once can only be used inside v-for that is keyed. "
      );
      return genElement(el, state)
    }
    return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
  } else {
    return genStatic(el, state)
  }
}

function genIf (
  el,
  state,
  altGen,
  altEmpty
) {
  el.ifProcessed = true; // avoid recursion
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

function genIfConditions (
  conditions,
  state,
  altGen,
  altEmpty
) {
  if (!conditions.length) {
    return altEmpty || '_e()'
  }

  var condition = conditions.shift();
  if (condition.exp) {
    return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
  } else {
    return ("" + (genTernaryExp(condition.block)))
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp (el) {
    return altGen
      ? altGen(el, state)
      : el.once
        ? genOnce(el, state)
        : genElement(el, state)
  }
}

function genFor (
  el,
  state,
  altGen,
  altHelper
) {
  var exp = el.for;
  var alias = el.alias;
  var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
  var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

  if ("development" !== 'production' &&
    state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
      "v-for should have explicit keys. " +
      "See https://vuejs.org/guide/list.html#key for more info.",
      true /* tip */
    );
  }

  el.forProcessed = true; // avoid recursion
  return (altHelper || '_l') + "((" + exp + ")," +
    "function(" + alias + iterator1 + iterator2 + "){" +
      "return " + ((altGen || genElement)(el, state)) +
    '})'
}

function genData$2 (el, state) {
  var data = '{';

  // directives first.
  // directives may mutate the el's other properties before they are generated.
  var dirs = genDirectives(el, state);
  if (dirs) { data += dirs + ','; }

  // key
  if (el.key) {
    data += "key:" + (el.key) + ",";
  }
  // ref
  if (el.ref) {
    data += "ref:" + (el.ref) + ",";
  }
  if (el.refInFor) {
    data += "refInFor:true,";
  }
  // pre
  if (el.pre) {
    data += "pre:true,";
  }
  // record original tag name for components using "is" attribute
  if (el.component) {
    data += "tag:\"" + (el.tag) + "\",";
  }
  // module data generation functions
  for (var i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el);
  }
  // attributes
  if (el.attrs) {
    data += "attrs:{" + (genProps(el.attrs)) + "},";
  }
  // DOM props
  if (el.props) {
    data += "domProps:{" + (genProps(el.props)) + "},";
  }
  // event handlers
  if (el.events) {
    data += (genHandlers(el.events, false, state.warn)) + ",";
  }
  if (el.nativeEvents) {
    data += (genHandlers(el.nativeEvents, true, state.warn)) + ",";
  }
  // slot target
  // only for non-scoped slots
  if (el.slotTarget && !el.slotScope) {
    data += "slot:" + (el.slotTarget) + ",";
  }
  // scoped slots
  if (el.scopedSlots) {
    data += (genScopedSlots(el.scopedSlots, state)) + ",";
  }
  // component v-model
  if (el.model) {
    data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
  }
  // inline-template
  if (el.inlineTemplate) {
    var inlineTemplate = genInlineTemplate(el, state);
    if (inlineTemplate) {
      data += inlineTemplate + ",";
    }
  }
  data = data.replace(/,$/, '') + '}';
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data);
  }
  // v-on data wrap
  if (el.wrapListeners) {
    data = el.wrapListeners(data);
  }
  return data
}

function genDirectives (el, state) {
  var dirs = el.directives;
  if (!dirs) { return }
  var res = 'directives:[';
  var hasRuntime = false;
  var i, l, dir, needRuntime;
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i];
    needRuntime = true;
    var gen = state.directives[dir.name];
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn);
    }
    if (needRuntime) {
      hasRuntime = true;
      res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:\"" + (dir.arg) + "\"") : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate (el, state) {
  var ast = el.children[0];
  if ("development" !== 'production' && (
    el.children.length !== 1 || ast.type !== 1
  )) {
    state.warn('Inline-template components must have exactly one child element.');
  }
  if (ast.type === 1) {
    var inlineRenderFns = generate(ast, state.options);
    return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
  }
}

function genScopedSlots (
  slots,
  state
) {
  return ("scopedSlots:_u([" + (Object.keys(slots).map(function (key) {
      return genScopedSlot(key, slots[key], state)
    }).join(',')) + "])")
}

function genScopedSlot (
  key,
  el,
  state
) {
  if (el.for && !el.forProcessed) {
    return genForScopedSlot(key, el, state)
  }
  var fn = "function(" + (String(el.slotScope)) + "){" +
    "return " + (el.tag === 'template'
      ? el.if
        ? ((el.if) + "?" + (genChildren(el, state) || 'undefined') + ":undefined")
        : genChildren(el, state) || 'undefined'
      : genElement(el, state)) + "}";
  return ("{key:" + key + ",fn:" + fn + "}")
}

function genForScopedSlot (
  key,
  el,
  state
) {
  var exp = el.for;
  var alias = el.alias;
  var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
  var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';
  el.forProcessed = true; // avoid recursion
  return "_l((" + exp + ")," +
    "function(" + alias + iterator1 + iterator2 + "){" +
      "return " + (genScopedSlot(key, el, state)) +
    '})'
}

function genChildren (
  el,
  state,
  checkSkip,
  altGenElement,
  altGenNode
) {
  var children = el.children;
  if (children.length) {
    var el$1 = children[0];
    // optimize single v-for
    if (children.length === 1 &&
      el$1.for &&
      el$1.tag !== 'template' &&
      el$1.tag !== 'slot'
    ) {
      return (altGenElement || genElement)(el$1, state)
    }
    var normalizationType = checkSkip
      ? getNormalizationType(children, state.maybeComponent)
      : 0;
    var gen = altGenNode || genNode;
    return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType ? ("," + normalizationType) : ''))
  }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
function getNormalizationType (
  children,
  maybeComponent
) {
  var res = 0;
  for (var i = 0; i < children.length; i++) {
    var el = children[i];
    if (el.type !== 1) {
      continue
    }
    if (needsNormalization(el) ||
        (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
      res = 2;
      break
    }
    if (maybeComponent(el) ||
        (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
      res = 1;
    }
  }
  return res
}

function needsNormalization (el) {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode (node, state) {
  if (node.type === 1) {
    return genElement(node, state)
  } if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

function genText (text) {
  return ("_v(" + (text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
}

function genComment (comment) {
  return ("_e(" + (JSON.stringify(comment.text)) + ")")
}

function genSlot (el, state) {
  var slotName = el.slotName || '"default"';
  var children = genChildren(el, state);
  var res = "_t(" + slotName + (children ? ("," + children) : '');
  var attrs = el.attrs && ("{" + (el.attrs.map(function (a) { return ((camelize(a.name)) + ":" + (a.value)); }).join(',')) + "}");
  var bind$$1 = el.attrsMap['v-bind'];
  if ((attrs || bind$$1) && !children) {
    res += ",null";
  }
  if (attrs) {
    res += "," + attrs;
  }
  if (bind$$1) {
    res += (attrs ? '' : ',null') + "," + bind$$1;
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent (
  componentName,
  el,
  state
) {
  var children = el.inlineTemplate ? null : genChildren(el, state, true);
  return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
}

function genProps (props) {
  var res = '';
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    /* istanbul ignore if */
    {
      res += "\"" + (prop.name) + "\":" + (transformSpecialNewlines(prop.value)) + ",";
    }
  }
  return res.slice(0, -1)
}

// #3895, #4268
function transformSpecialNewlines (text) {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/*  */

// these keywords should not appear inside expressions, but operators like
// typeof, instanceof and in are allowed
var prohibitedKeywordRE = new RegExp('\\b' + (
  'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
  'super,throw,while,yield,delete,export,import,return,switch,default,' +
  'extends,finally,continue,debugger,function,arguments'
).split(',').join('\\b|\\b') + '\\b');

// these unary operators should not be used as property/method names
var unaryOperatorsRE = new RegExp('\\b' + (
  'delete,typeof,void'
).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

// strip strings in expressions
var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

// detect problematic expressions in a template
function detectErrors (ast) {
  var errors = [];
  if (ast) {
    checkNode(ast, errors);
  }
  return errors
}

function checkNode (node, errors) {
  if (node.type === 1) {
    for (var name in node.attrsMap) {
      if (dirRE.test(name)) {
        var value = node.attrsMap[name];
        if (value) {
          if (name === 'v-for') {
            checkFor(node, ("v-for=\"" + value + "\""), errors);
          } else if (onRE.test(name)) {
            checkEvent(value, (name + "=\"" + value + "\""), errors);
          } else {
            checkExpression(value, (name + "=\"" + value + "\""), errors);
          }
        }
      }
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        checkNode(node.children[i], errors);
      }
    }
  } else if (node.type === 2) {
    checkExpression(node.expression, node.text, errors);
  }
}

function checkEvent (exp, text, errors) {
  var stipped = exp.replace(stripStringRE, '');
  var keywordMatch = stipped.match(unaryOperatorsRE);
  if (keywordMatch && stipped.charAt(keywordMatch.index - 1) !== '$') {
    errors.push(
      "avoid using JavaScript unary operator as property name: " +
      "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim())
    );
  }
  checkExpression(exp, text, errors);
}

function checkFor (node, text, errors) {
  checkExpression(node.for || '', text, errors);
  checkIdentifier(node.alias, 'v-for alias', text, errors);
  checkIdentifier(node.iterator1, 'v-for iterator', text, errors);
  checkIdentifier(node.iterator2, 'v-for iterator', text, errors);
}

function checkIdentifier (
  ident,
  type,
  text,
  errors
) {
  if (typeof ident === 'string') {
    try {
      new Function(("var " + ident + "=_"));
    } catch (e) {
      errors.push(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())));
    }
  }
}

function checkExpression (exp, text, errors) {
  try {
    new Function(("return " + exp));
  } catch (e) {
    var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
    if (keywordMatch) {
      errors.push(
        "avoid using JavaScript keyword as property name: " +
        "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim())
      );
    } else {
      errors.push(
        "invalid expression: " + (e.message) + " in\n\n" +
        "    " + exp + "\n\n" +
        "  Raw expression: " + (text.trim()) + "\n"
      );
    }
  }
}

/*  */

function createFunction (code, errors) {
  try {
    return new Function(code)
  } catch (err) {
    errors.push({ err: err, code: code });
    return noop
  }
}

function createCompileToFunctionFn (compile) {
  var cache = Object.create(null);

  return function compileToFunctions (
    template,
    options,
    vm
  ) {
    options = extend({}, options);
    var warn$$1 = options.warn || warn;
    delete options.warn;

    /* istanbul ignore if */
    {
      // detect possible CSP restriction
      try {
        new Function('return 1');
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn$$1(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          );
        }
      }
    }

    // check cache
    var key = options.delimiters
      ? String(options.delimiters) + template
      : template;
    if (cache[key]) {
      return cache[key]
    }

    // compile
    var compiled = compile(template, options);

    // check compilation errors/tips
    {
      if (compiled.errors && compiled.errors.length) {
        warn$$1(
          "Error compiling template:\n\n" + template + "\n\n" +
          compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
          vm
        );
      }
      if (compiled.tips && compiled.tips.length) {
        compiled.tips.forEach(function (msg) { return tip(msg, vm); });
      }
    }

    // turn code into functions
    var res = {};
    var fnGenErrors = [];
    res.render = createFunction(compiled.render, fnGenErrors);
    res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
      return createFunction(code, fnGenErrors)
    });

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn$$1(
          "Failed to generate render function:\n\n" +
          fnGenErrors.map(function (ref) {
            var err = ref.err;
            var code = ref.code;

            return ((err.toString()) + " in\n\n" + code + "\n");
        }).join('\n'),
          vm
        );
      }
    }

    return (cache[key] = res)
  }
}

/*  */

function createCompilerCreator (baseCompile) {
  return function createCompiler (baseOptions) {
    function compile (
      template,
      options
    ) {
      var finalOptions = Object.create(baseOptions);
      var errors = [];
      var tips = [];
      finalOptions.warn = function (msg, tip) {
        (tip ? tips : errors).push(msg);
      };

      if (options) {
        // merge custom modules
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules);
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          );
        }
        // copy other options
        for (var key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key];
          }
        }
      }

      var compiled = baseCompile(template, finalOptions);
      {
        errors.push.apply(errors, detectErrors(compiled.ast));
      }
      compiled.errors = errors;
      compiled.tips = tips;
      return compiled
    }

    return {
      compile: compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}

/*  */

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
var createCompiler = createCompilerCreator(function baseCompile (
  template,
  options
) {
  var ast = parse(template.trim(), options);
  if (options.optimize !== false) {
    optimize(ast, options);
  }
  var code = generate(ast, options);
  return {
    ast: ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
});

/*  */

var ref$1 = createCompiler(baseOptions);
var compileToFunctions = ref$1.compileToFunctions;

/*  */

// check whether current browser encodes a char inside attribute values
var div;
function getShouldDecode (href) {
  div = div || document.createElement('div');
  div.innerHTML = href ? "<a href=\"\n\"/>" : "<div a=\"\n\"/>";
  return div.innerHTML.indexOf('&#10;') > 0
}

// #3663: IE encodes newlines inside attribute values while other browsers don't
var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
// #6828: chrome encodes content in a[href]
var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

/*  */

var idToTemplate = cached(function (id) {
  var el = query(id);
  return el && el.innerHTML
});

var mount = Vue.prototype.$mount;
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && query(el);

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    "development" !== 'production' && warn(
      "Do not mount Vue to <html> or <body> - mount to normal elements instead."
    );
    return this
  }

  var options = this.$options;
  // resolve template/el and convert to render function
  if (!options.render) {
    var template = options.template;
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template);
          /* istanbul ignore if */
          if ("development" !== 'production' && !template) {
            warn(
              ("Template element not found or is empty: " + (options.template)),
              this
            );
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML;
      } else {
        {
          warn('invalid template option:' + template, this);
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el);
    }
    if (template) {
      /* istanbul ignore if */
      if ("development" !== 'production' && config.performance && mark) {
        mark('compile');
      }

      var ref = compileToFunctions(template, {
        shouldDecodeNewlines: shouldDecodeNewlines,
        shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this);
      var render = ref.render;
      var staticRenderFns = ref.staticRenderFns;
      options.render = render;
      options.staticRenderFns = staticRenderFns;

      /* istanbul ignore if */
      if ("development" !== 'production' && config.performance && mark) {
        mark('compile end');
        measure(("vue " + (this._name) + " compile"), 'compile', 'compile end');
      }
    }
  }
  return mount.call(this, el, hydrating)
};

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el) {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    var container = document.createElement('div');
    container.appendChild(el.cloneNode(true));
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions;

return Vue;

})));


// @license Firebase v4.6.1 rev-53d7622
var firebase=function(){var e=void 0===e?self:e;return function(t){function r(e){if(o[e])return o[e].exports;var n=o[e]={i:e,l:!1,exports:{}};return t[e].call(n.exports,n,n.exports,r),n.l=!0,n.exports}var n=e.webpackJsonpFirebase;e.webpackJsonpFirebase=function(e,o,a){for(var c,s,u,f=0,l=[];f<e.length;f++)s=e[f],i[s]&&l.push(i[s][0]),i[s]=0;for(c in o)Object.prototype.hasOwnProperty.call(o,c)&&(t[c]=o[c]);for(n&&n(e,o,a);l.length;)l.shift()();if(a)for(f=0;f<a.length;f++)u=r(r.s=a[f]);return u};var o={},i={5:0};return r.e=function(e){function t(){c.onerror=c.onload=null,clearTimeout(s);var t=i[e];0!==t&&(t&&t[1](Error("Loading chunk "+e+" failed.")),i[e]=void 0)}var n=i[e];if(0===n)return new Promise(function(e){e()});if(n)return n[2];var o=new Promise(function(t,r){n=i[e]=[t,r]});n[2]=o;var a=document.getElementsByTagName("head")[0],c=document.createElement("script");c.type="text/javascript",c.charset="utf-8",c.async=!0,c.timeout=12e4,r.nc&&c.setAttribute("nonce",r.nc),c.src=r.p+""+e+".js";var s=setTimeout(t,12e4);return c.onerror=c.onload=t,a.appendChild(c),o},r.m=t,r.c=o,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:n})},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r.oe=function(e){throw console.error(e),e},r(r.s=57)}([function(e,t,r){"use strict";function n(e){for(var r in e)t.hasOwnProperty(r)||(t[r]=e[r])}Object.defineProperty(t,"__esModule",{value:!0}),n(r(28)),n(r(29)),n(r(20)),n(r(65)),n(r(66)),n(r(67)),n(r(68)),n(r(30)),n(r(69)),n(r(31)),n(r(70)),n(r(71)),n(r(73)),n(r(74)),n(r(75))},,,,,,function(e,t,r){"use strict";function n(){function e(e){h(d[e],"delete"),delete d[e]}function t(e){return e=e||c,a(d,e)||o("no-app",{name:e}),d[e]}function r(e,t){void 0===t?t=c:"string"==typeof t&&""!==t||o("bad-app-name",{name:t+""}),a(d,t)&&o("duplicate-app",{name:t});var r=new u(e,t,b);return d[t]=r,h(r,"create"),r}function s(){return Object.keys(d).map(function(e){return d[e]})}function f(e,r,n,a,c){v[e]&&o("duplicate-service",{name:e}),v[e]=r,a&&(y[e]=a,s().forEach(function(e){a("create",e)}));var f=function(r){return void 0===r&&(r=t()),"function"!=typeof r[e]&&o("invalid-app-argument",{name:e}),r[e]()};return void 0!==n&&Object(i.deepExtend)(f,n),b[e]=f,u.prototype[e]=function(){for(var t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];return this.t.bind(this,e).apply(this,c?t:[])},f}function l(e){Object(i.deepExtend)(b,e)}function h(e,t){Object.keys(v).forEach(function(r){var n=p(e,r);null!==n&&y[n]&&y[n](t,e)})}function p(e,t){if("serverAuth"===t)return null;var r=t;return e.options,r}var d={},v={},y={},b={__esModule:!0,initializeApp:r,app:t,apps:null,Promise:Promise,SDK_VERSION:"4.6.1",INTERNAL:{registerService:f,createFirebaseNamespace:n,extendNamespace:l,createSubscribe:i.createSubscribe,ErrorFactory:i.ErrorFactory,removeApp:e,factories:v,useAsService:p,Promise:Promise,deepExtend:i.deepExtend}};return Object(i.patchProperty)(b,"default",b),Object.defineProperty(b,"apps",{get:s}),Object(i.patchProperty)(t,"App",u),b}function o(e,t){throw l.create(e,t)}Object.defineProperty(t,"__esModule",{value:!0});var i=r(0),a=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},c="[DEFAULT]",s=[],u=function(){function e(e,t,r){this.r=r,this.a=!1,this.u={},this.f=t,this.h=Object(i.deepCopy)(e),this.INTERNAL={getUid:function(){return null},getToken:function(){return Promise.resolve(null)},addAuthTokenListener:function(e){s.push(e),setTimeout(function(){return e(null)},0)},removeAuthTokenListener:function(e){s=s.filter(function(t){return t!==e})}}}return Object.defineProperty(e.prototype,"name",{get:function(){return this.v(),this.f},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"options",{get:function(){return this.v(),this.h},enumerable:!0,configurable:!0}),e.prototype.delete=function(){var e=this;return new Promise(function(t){e.v(),t()}).then(function(){e.r.INTERNAL.removeApp(e.f);var t=[];return Object.keys(e.u).forEach(function(r){Object.keys(e.u[r]).forEach(function(n){t.push(e.u[r][n])})}),Promise.all(t.map(function(e){return e.INTERNAL.delete()}))}).then(function(){e.a=!0,e.u={}})},e.prototype.t=function(e,t){if(void 0===t&&(t=c),this.v(),this.u[e]||(this.u[e]={}),!this.u[e][t]){var r=t!==c?t:void 0,n=this.r.INTERNAL.factories[e](this,this.extendApp.bind(this),r);this.u[e][t]=n}return this.u[e][t]},e.prototype.extendApp=function(e){var t=this;Object(i.deepExtend)(this,e),e.INTERNAL&&e.INTERNAL.addAuthTokenListener&&(s.forEach(function(e){t.INTERNAL.addAuthTokenListener(e)}),s=[])},e.prototype.v=function(){this.a&&o("app-deleted",{name:this.f})},e}();u.prototype.name&&u.prototype.options||u.prototype.delete||console.log("dc");var f={"no-app":"No Firebase App '{$name}' has been created - call Firebase App.initializeApp()","bad-app-name":"Illegal App name: '{$name}","duplicate-app":"Firebase App named '{$name}' already exists","app-deleted":"Firebase App named '{$name}' already deleted","duplicate-service":"Firebase service named '{$name}' already registered","sa-not-supported":"Initializing the Firebase SDK with a service account is only allowed in a Node.js environment. On client devices, you should instead initialize the SDK with an api key and auth domain","invalid-app-argument":"firebase.{$name}() takes either no argument or a Firebase App instance."},l=new i.ErrorFactory("app","Firebase",f);r.d(t,"firebase",function(){return h});var h=n();t.default=h},,,,,,,,,,,,,function(t,r){var n;n=function(){return this}();try{n=n||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof e&&(n=e)}t.exports=n},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.CONSTANTS={NODE_CLIENT:!1,NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"}},,,,,,,function(e,t){function r(){throw Error("setTimeout has not been defined")}function n(){throw Error("clearTimeout has not been defined")}function o(e){if(f===setTimeout)return setTimeout(e,0);if((f===r||!f)&&setTimeout)return f=setTimeout,setTimeout(e,0);try{return f(e,0)}catch(t){try{return f.call(null,e,0)}catch(t){return f.call(this,e,0)}}}function i(e){if(l===clearTimeout)return clearTimeout(e);if((l===n||!l)&&clearTimeout)return l=clearTimeout,clearTimeout(e);try{return l(e)}catch(t){try{return l.call(null,e)}catch(t){return l.call(this,e)}}}function a(){v&&p&&(v=!1,p.length?d=p.concat(d):y=-1,d.length&&c())}function c(){if(!v){var e=o(a);v=!0;for(var t=d.length;t;){for(p=d,d=[];++y<t;)p&&p[y].run();y=-1,t=d.length}p=null,v=!1,i(e)}}function s(e,t){this.fun=e,this.array=t}function u(){}var f,l,h=e.exports={};!function(){try{f="function"==typeof setTimeout?setTimeout:r}catch(e){f=r}try{l="function"==typeof clearTimeout?clearTimeout:n}catch(e){l=n}}();var p,d=[],v=!1,y=-1;h.nextTick=function(e){var t=Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)t[r-1]=arguments[r];d.push(new s(e,t)),1!==d.length||v||o(c)},s.prototype.run=function(){this.fun.apply(null,this.array)},h.title="browser",h.browser=!0,h.env={},h.argv=[],h.version="",h.versions={},h.on=u,h.addListener=u,h.once=u,h.off=u,h.removeListener=u,h.removeAllListeners=u,h.emit=u,h.prependListener=u,h.prependOnceListener=u,h.listeners=function(e){return[]},h.binding=function(e){throw Error("process.binding is not supported")},h.cwd=function(){return"/"},h.chdir=function(e){throw Error("process.chdir is not supported")},h.umask=function(){return 0}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(20);t.assert=function(e,r){if(!e)throw t.assertionError(r)},t.assertionError=function(e){return Error("Firebase Database ("+n.CONSTANTS.SDK_VERSION+") INTERNAL ASSERT FAILED: "+e)}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(e){for(var t=[],r=0,n=0;n<e.length;n++){for(var o=e.charCodeAt(n);o>255;)t[r++]=255&o,o>>=8;t[r++]=o}return t},o=function(e){if(e.length<8192)return String.fromCharCode.apply(null,e);for(var t="",r=0;r<e.length;r+=8192){var n=e.slice(r,r+8192);t+=String.fromCharCode.apply(null,n)}return t};t.base64={y:null,b:null,_:null,g:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray:function(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.O();for(var r=t?this._:this.y,n=[],o=0;o<e.length;o+=3){var i=e[o],a=o+1<e.length,c=a?e[o+1]:0,s=o+2<e.length,u=s?e[o+2]:0,f=i>>2,l=(3&i)<<4|c>>4,h=(15&c)<<2|u>>6,p=63&u;s||(p=64,a||(h=64)),n.push(r[f],r[l],r[h],r[p])}return n.join("")},encodeString:function(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(n(e),t)},decodeString:function(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):o(this.decodeStringToByteArray(e,t))},decodeStringToByteArray:function(e,t){this.O();for(var r=t?this.g:this.b,n=[],o=0;o<e.length;){var i=r[e.charAt(o++)],a=o<e.length,c=a?r[e.charAt(o)]:0;++o;var s=o<e.length,u=s?r[e.charAt(o)]:64;++o;var f=o<e.length,l=f?r[e.charAt(o)]:64;if(++o,null==i||null==c||null==u||null==l)throw Error();var h=i<<2|c>>4;if(n.push(h),64!=u){var p=c<<4&240|u>>2;if(n.push(p),64!=l){var d=u<<6&192|l;n.push(d)}}}return n},O:function(){if(!this.y){this.y={},this.b={},this._={},this.g={};for(var e=0;e<this.ENCODED_VALS.length;e++)this.y[e]=this.ENCODED_VALS.charAt(e),this.b[this.y[e]]=e,this._[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.g[this._[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.b[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.g[this.ENCODED_VALS.charAt(e)]=e)}}},t.base64Encode=function(e){var r=n(e);return t.base64.encodeByteArray(r,!0)},t.base64Decode=function(e){try{return t.base64.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null}},function(e,t,r){"use strict";function n(e){return JSON.parse(e)}function o(e){return JSON.stringify(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.jsonEval=n,t.stringify=o},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.contains=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.safeGet=function(e,t){if(Object.prototype.hasOwnProperty.call(e,t))return e[t]},t.forEach=function(e,t){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t(r,e[r])},t.extend=function(e,r){return t.forEach(r,function(t,r){e[t]=r}),e},t.clone=function(e){return t.extend({},e)},t.isNonNullObject=function(e){return"object"==typeof e&&null!==e},t.isEmpty=function(e){for(var t in e)return!1;return!0},t.getCount=function(e){var t=0;for(var r in e)t++;return t},t.map=function(e,t,r){var n={};for(var o in e)n[o]=t.call(r,e[o],o,e);return n},t.findKey=function(e,t,r){for(var n in e)if(t.call(r,e[n],n,e))return n},t.findValue=function(e,r,n){var o=t.findKey(e,r,n);return o&&e[o]},t.getAnyKey=function(e){for(var t in e)return t},t.getValues=function(e){var t=[],r=0;for(var n in e)t[r++]=e[n];return t},t.every=function(e,t){for(var r in e)if(Object.prototype.hasOwnProperty.call(e,r)&&!t(r,e[r]))return!1;return!0}},,,,,,,,,,,,,,,,,,,,,,,,,,function(e,t,r){r(58),e.exports=r(6).default},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(59),o=(r.n(n),r(63)),i=(r.n(o),r(64));r.n(i)},function(t,r,n){(function(t){var r=function(){if(void 0!==t)return t;if(void 0!==e)return e;if("undefined"!=typeof self)return self;throw Error("unable to locate global object")}();"undefined"==typeof Promise&&(r.Promise=Promise=n(60))}).call(r,n(19))},function(e,t,r){(function(t){!function(r){function n(){}function o(e,t){return function(){e.apply(t,arguments)}}function i(e){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this.T=[],l(e,this)}function a(e,t){for(;3===e._state;)e=e._value;if(0===e._state)return void e.T.push(t);e._handled=!0,i.A(function(){var r=1===e._state?t.onFulfilled:t.onRejected;if(null===r)return void(1===e._state?c:s)(t.promise,e._value);var n;try{n=r(e._value)}catch(e){return void s(t.promise,e)}c(t.promise,n)})}function c(e,t){try{if(t===e)throw new TypeError("A promise cannot be resolved with itself.");if(t&&("object"==typeof t||"function"==typeof t)){var r=t.then;if(t instanceof i)return e._state=3,e._value=t,void u(e);if("function"==typeof r)return void l(o(r,t),e)}e._state=1,e._value=t,u(e)}catch(t){s(e,t)}}function s(e,t){e._state=2,e._value=t,u(e)}function u(e){2===e._state&&0===e.T.length&&i.A(function(){e._handled||i.j(e._value)});for(var t=0,r=e.T.length;t<r;t++)a(e,e.T[t]);e.T=null}function f(e,t,r){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof t?t:null,this.promise=r}function l(e,t){var r=!1;try{e(function(e){r||(r=!0,c(t,e))},function(e){r||(r=!0,s(t,e))})}catch(e){if(r)return;r=!0,s(t,e)}}var h=setTimeout;i.prototype.catch=function(e){return this.then(null,e)},i.prototype.then=function(e,t){var r=new this.constructor(n);return a(this,new f(e,t,r)),r},i.all=function(e){var t=Array.prototype.slice.call(e);return new i(function(e,r){function n(i,a){try{if(a&&("object"==typeof a||"function"==typeof a)){var c=a.then;if("function"==typeof c)return void c.call(a,function(e){n(i,e)},r)}t[i]=a,0==--o&&e(t)}catch(e){r(e)}}if(0===t.length)return e([]);for(var o=t.length,i=0;i<t.length;i++)n(i,t[i])})},i.resolve=function(e){return e&&"object"==typeof e&&e.constructor===i?e:new i(function(t){t(e)})},i.reject=function(e){return new i(function(t,r){r(e)})},i.race=function(e){return new i(function(t,r){for(var n=0,o=e.length;n<o;n++)e[n].then(t,r)})},i.A="function"==typeof t&&function(e){t(e)}||function(e){h(e,0)},i.j=function(e){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)},i.w=function(e){i.A=e},i.S=function(e){i.j=e},void 0!==e&&e.exports?e.exports=i:r.Promise||(r.Promise=i)}(this)}).call(t,r(61).setImmediate)},function(t,r,n){function o(e,t){this.P=e,this._clearFn=t}var i=Function.prototype.apply;r.setTimeout=function(){return new o(i.call(setTimeout,e,arguments),clearTimeout)},r.setInterval=function(){return new o(i.call(setInterval,e,arguments),clearInterval)},r.clearTimeout=r.clearInterval=function(e){e&&e.close()},o.prototype.unref=o.prototype.ref=function(){},o.prototype.close=function(){this._clearFn.call(e,this.P)},r.enroll=function(e,t){clearTimeout(e.N),e.C=t},r.unenroll=function(e){clearTimeout(e.N),e.C=-1},r.k=r.active=function(e){clearTimeout(e.N);var t=e.C;t>=0&&(e.N=setTimeout(function(){e.M&&e.M()},t))},n(62),r.setImmediate=setImmediate,r.clearImmediate=clearImmediate},function(e,t,r){(function(e,t){!function(e,r){"use strict";function n(e){"function"!=typeof e&&(e=Function(""+e));for(var t=Array(arguments.length-1),r=0;r<t.length;r++)t[r]=arguments[r+1];var n={callback:e,args:t};return u[s]=n,c(s),s++}function o(e){delete u[e]}function i(e){var t=e.callback,n=e.args;switch(n.length){case 0:t();break;case 1:t(n[0]);break;case 2:t(n[0],n[1]);break;case 3:t(n[0],n[1],n[2]);break;default:t.apply(r,n)}}function a(e){if(f)setTimeout(a,0,e);else{var t=u[e];if(t){f=!0;try{i(t)}finally{o(e),f=!1}}}}if(!e.setImmediate){var c,s=1,u={},f=!1,l=e.document,h=Object.getPrototypeOf&&Object.getPrototypeOf(e);h=h&&h.setTimeout?h:e,"[object process]"==={}.toString.call(e.process)?function(){c=function(e){t.nextTick(function(){a(e)})}}():function(){if(e.postMessage&&!e.importScripts){var t=!0,r=e.onmessage;return e.onmessage=function(){t=!1},e.postMessage("","*"),e.onmessage=r,t}}()?function(){var t="setImmediate$"+Math.random()+"$",r=function(r){r.source===e&&"string"==typeof r.data&&0===r.data.indexOf(t)&&a(+r.data.slice(t.length))};e.addEventListener?e.addEventListener("message",r,!1):e.attachEvent("onmessage",r),c=function(r){e.postMessage(t+r,"*")}}():e.MessageChannel?function(){var e=new MessageChannel;e.port1.onmessage=function(e){a(e.data)},c=function(t){e.port2.postMessage(t)}}():l&&"onreadystatechange"in l.createElement("script")?function(){var e=l.documentElement;c=function(t){var r=l.createElement("script");r.onreadystatechange=function(){a(t),r.onreadystatechange=null,e.removeChild(r),r=null},e.appendChild(r)}}():function(){c=function(e){setTimeout(a,0,e)}}(),h.setImmediate=n,h.clearImmediate=o}}("undefined"==typeof self?void 0===e?this:e:self)}).call(t,r(19),r(27))},function(e,t){Array.prototype.find||Object.defineProperty(Array.prototype,"find",{value:function(e){if(null==this)throw new TypeError('"this" is null or not defined');var t=Object(this),r=t.length>>>0;if("function"!=typeof e)throw new TypeError("predicate must be a function");for(var n=arguments[1],o=0;o<r;){var i=t[o];if(e.call(n,i,o,t))return i;o++}}})},function(e,t){Array.prototype.findIndex||Object.defineProperty(Array.prototype,"findIndex",{value:function(e){if(null==this)throw new TypeError('"this" is null or not defined');var t=Object(this),r=t.length>>>0;if("function"!=typeof e)throw new TypeError("predicate must be a function");for(var n=arguments[1],o=0;o<r;){var i=t[o];if(e.call(n,i,o,t))return o;o++}return-1}})},function(e,t,r){"use strict";function n(e){return o(void 0,e)}function o(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:var r=t;return new Date(r.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(var n in t)t.hasOwnProperty(n)&&(e[n]=o(e[n],t[n]));return e}function i(e,t,r){e[t]=r}Object.defineProperty(t,"__esModule",{value:!0}),t.deepCopy=n,t.deepExtend=o,t.patchProperty=i},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(){var e=this;this.promise=new Promise(function(t,r){e.resolve=t,e.reject=r})}return e.prototype.wrapCallback=function(e){var t=this;return function(r,n){r?t.reject(r):t.resolve(n),"function"==typeof e&&(t.promise.catch(function(){}),1===e.length?e(r):e(r,n))}},e}();t.Deferred=n},function(t,r,n){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var o=n(20);r.getUA=function(){return"undefined"!=typeof navigator&&"string"==typeof navigator.userAgent?navigator.userAgent:""},r.isMobileCordova=function(){return void 0!==e&&!!(e.cordova||e.phonegap||e.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(r.getUA())},r.isReactNative=function(){return"object"==typeof navigator&&"ReactNative"===navigator.product},r.isNodeSdk=function(){return!0===o.CONSTANTS.NODE_CLIENT||!0===o.CONSTANTS.NODE_ADMIN}},function(e,t,r){"use strict";function n(e){var t=i;return i=e,t}Object.defineProperty(t,"__esModule",{value:!0});var o="FirebaseError",i=Error.captureStackTrace;t.patchCapture=n;var a=function(){function e(e,t){if(this.code=e,this.message=t,i)i(this,c.prototype.create);else{var r=Error.apply(this,arguments);this.name=o,Object.defineProperty(this,"stack",{get:function(){return r.stack}})}}return e}();t.FirebaseError=a,a.prototype=Object.create(Error.prototype),a.prototype.constructor=a,a.prototype.name=o;var c=function(){function e(e,t,r){this.service=e,this.serviceName=t,this.errors=r,this.pattern=/\{\$([^}]+)}/g}return e.prototype.create=function(e,t){void 0===t&&(t={});var r,n=this.errors[e],o=this.service+"/"+e;r=void 0===n?"Error":n.replace(this.pattern,function(e,r){var n=t[r];return void 0!==n?""+n:"<"+r+"?>"}),r=this.serviceName+": "+r+" ("+o+").";var i=new a(o,r);for(var c in t)t.hasOwnProperty(c)&&"_"!==c.slice(-1)&&(i[c]=t[c]);return i},e}();t.ErrorFactory=c},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(29),o=r(30);t.decode=function(e){var t={},r={},i={},a="";try{var c=e.split(".");t=o.jsonEval(n.base64Decode(c[0])||""),r=o.jsonEval(n.base64Decode(c[1])||""),a=c[2],i=r.d||{},delete r.d}catch(e){}return{header:t,claims:r,data:i,signature:a}},t.isValidTimestamp=function(e){var r,n,o=t.decode(e).claims,i=Math.floor((new Date).getTime()/1e3);return"object"==typeof o&&(o.hasOwnProperty("nbf")?r=o.nbf:o.hasOwnProperty("iat")&&(r=o.iat),n=o.hasOwnProperty("exp")?o.exp:r+86400),i&&r&&n&&i>=r&&i<=n},t.issuedAtTime=function(e){var r=t.decode(e).claims;return"object"==typeof r&&r.hasOwnProperty("iat")?r.iat:null},t.isValidFormat=function(e){var r=t.decode(e),n=r.claims;return!!r.signature&&!!n&&"object"==typeof n&&n.hasOwnProperty("iat")},t.isAdmin=function(e){var r=t.decode(e).claims;return"object"==typeof r&&!0===r.admin}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(31);t.querystring=function(e){var t=[];return n.forEach(e,function(e,r){Array.isArray(r)?r.forEach(function(r){t.push(encodeURIComponent(e)+"="+encodeURIComponent(r))}):t.push(encodeURIComponent(e)+"="+encodeURIComponent(r))}),t.length?"&"+t.join("&"):""},t.querystringDecode=function(e){var t={};return e.replace(/^\?/,"").split("&").forEach(function(e){if(e){var r=e.split("=");t[r[0]]=r[1]}}),t}},function(e,t,r){"use strict";var n=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var r in t)t.hasOwnProperty(r)&&(e[r]=t[r])};return function(t,r){function n(){this.constructor=t}e(t,r),t.prototype=null===r?Object.create(r):(n.prototype=r.prototype,new n)}}();Object.defineProperty(t,"__esModule",{value:!0});var o=r(72),i=function(e){function t(){var t=e.call(this)||this;t.D=[],t.I=[],t.x=[],t.F=[],t.L=0,t.R=0,t.blockSize=64,t.F[0]=128;for(var r=1;r<t.blockSize;++r)t.F[r]=0;return t.reset(),t}return n(t,e),t.prototype.reset=function(){this.D[0]=1732584193,this.D[1]=4023233417,this.D[2]=2562383102,this.D[3]=271733878,this.D[4]=3285377520,this.L=0,this.R=0},t.prototype.B=function(e,t){t||(t=0);var r=this.x;if("string"==typeof e)for(var n=0;n<16;n++)r[n]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(var n=0;n<16;n++)r[n]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(var n=16;n<80;n++){var o=r[n-3]^r[n-8]^r[n-14]^r[n-16];r[n]=4294967295&(o<<1|o>>>31)}for(var i,a,c=this.D[0],s=this.D[1],u=this.D[2],f=this.D[3],l=this.D[4],n=0;n<80;n++){n<40?n<20?(i=f^s&(u^f),a=1518500249):(i=s^u^f,a=1859775393):n<60?(i=s&u|f&(s|u),a=2400959708):(i=s^u^f,a=3395469782);var o=(c<<5|c>>>27)+i+l+a+r[n]&4294967295;l=f,f=u,u=4294967295&(s<<30|s>>>2),s=c,c=o}this.D[0]=this.D[0]+c&4294967295,this.D[1]=this.D[1]+s&4294967295,this.D[2]=this.D[2]+u&4294967295,this.D[3]=this.D[3]+f&4294967295,this.D[4]=this.D[4]+l&4294967295},t.prototype.update=function(e,t){if(null!=e){void 0===t&&(t=e.length);for(var r=t-this.blockSize,n=0,o=this.I,i=this.L;n<t;){if(0==i)for(;n<=r;)this.B(e,n),n+=this.blockSize;if("string"==typeof e){for(;n<t;)if(o[i]=e.charCodeAt(n),++i,++n,i==this.blockSize){this.B(o),i=0;break}}else for(;n<t;)if(o[i]=e[n],++i,++n,i==this.blockSize){this.B(o),i=0;break}}this.L=i,this.R+=t}},t.prototype.digest=function(){var e=[],t=8*this.R;this.L<56?this.update(this.F,56-this.L):this.update(this.F,this.blockSize-(this.L-56));for(var r=this.blockSize-1;r>=56;r--)this.I[r]=255&t,t/=256;this.B(this.I);for(var n=0,r=0;r<5;r++)for(var o=24;o>=0;o-=8)e[n]=this.D[r]>>o&255,++n;return e},t}(o.Hash);t.Sha1=i},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){function e(){this.blockSize=-1}return e}();t.Hash=n},function(e,t,r){"use strict";function n(e,t){var r=new c(e,t);return r.subscribe.bind(r)}function o(e,t){return function(){for(var r=[],n=0;n<arguments.length;n++)r[n]=arguments[n];Promise.resolve(!0).then(function(){e.apply(void 0,r)}).catch(function(e){t&&t(e)})}}function i(e,t){if("object"!=typeof e||null===e)return!1;for(var r=0,n=t;r<n.length;r++){var o=n[r];if(o in e&&"function"==typeof e[o])return!0}return!1}function a(){}Object.defineProperty(t,"__esModule",{value:!0}),t.createSubscribe=n;var c=function(){function e(e,t){var r=this;this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(function(){e(r)}).catch(function(e){r.error(e)})}return e.prototype.next=function(e){this.forEachObserver(function(t){t.next(e)})},e.prototype.error=function(e){this.forEachObserver(function(t){t.error(e)}),this.close(e)},e.prototype.complete=function(){this.forEachObserver(function(e){e.complete()}),this.close()},e.prototype.subscribe=function(e,t,r){var n,o=this;if(void 0===e&&void 0===t&&void 0===r)throw Error("Missing Observer.");n=i(e,["next","error","complete"])?e:{next:e,error:t,complete:r},void 0===n.next&&(n.next=a),void 0===n.error&&(n.error=a),void 0===n.complete&&(n.complete=a);var c=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(function(){try{o.finalError?n.error(o.finalError):n.complete()}catch(e){}}),this.observers.push(n),c},e.prototype.unsubscribeOne=function(e){void 0!==this.observers&&void 0!==this.observers[e]&&(delete this.observers[e],this.observerCount-=1,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))},e.prototype.forEachObserver=function(e){if(!this.finalized)for(var t=0;t<this.observers.length;t++)this.sendOne(t,e)},e.prototype.sendOne=function(e,t){var r=this;this.task.then(function(){if(void 0!==r.observers&&void 0!==r.observers[e])try{t(r.observers[e])}catch(e){"undefined"!=typeof console&&console.error&&console.error(e)}})},e.prototype.close=function(e){var t=this;this.finalized||(this.finalized=!0,void 0!==e&&(this.finalError=e),this.task.then(function(){t.observers=void 0,t.onNoObservers=void 0}))},e}();t.async=o},function(e,t,r){"use strict";function n(e,t,r){var n="";switch(t){case 1:n=r?"first":"First";break;case 2:n=r?"second":"Second";break;case 3:n=r?"third":"Third";break;case 4:n=r?"fourth":"Fourth";break;default:throw Error("errorPrefix called with argumentNumber > 4.  Need to update it?")}var o=e+" failed: ";return o+=n+" argument "}function o(e,t,r,o){if((!o||r)&&"string"!=typeof r)throw Error(n(e,t,o)+"must be a valid firebase namespace.")}function i(e,t,r,o){if((!o||r)&&"function"!=typeof r)throw Error(n(e,t,o)+"must be a valid function.")}function a(e,t,r,o){if((!o||r)&&("object"!=typeof r||null===r))throw Error(n(e,t,o)+"must be a valid context object.")}Object.defineProperty(t,"__esModule",{value:!0}),t.validateArgCount=function(e,t,r,n){var o;if(n<t?o="at least "+t:n>r&&(o=0===r?"none":"no more than "+r),o){var i=e+" failed: Was called with "+n+(1===n?" argument.":" arguments.")+" Expects "+o+".";throw Error(i)}},t.errorPrefix=n,t.validateNamespace=o,t.validateCallback=i,t.validateContextObject=a},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=r(28);t.stringToByteArray=function(e){for(var t=[],r=0,o=0;o<e.length;o++){var i=e.charCodeAt(o);if(i>=55296&&i<=56319){var a=i-55296;o++,n.assert(o<e.length,"Surrogate pair missing trail surrogate."),i=65536+(a<<10)+(e.charCodeAt(o)-56320)}i<128?t[r++]=i:i<2048?(t[r++]=i>>6|192,t[r++]=63&i|128):i<65536?(t[r++]=i>>12|224,t[r++]=i>>6&63|128,t[r++]=63&i|128):(t[r++]=i>>18|240,t[r++]=i>>12&63|128,t[r++]=i>>6&63|128,t[r++]=63&i|128)}return t},t.stringLength=function(e){for(var t=0,r=0;r<e.length;r++){var n=e.charCodeAt(r);n<128?t++:n<2048?t+=2:n>=55296&&n<=56319?(t+=4,r++):t+=3}return t}}])}().default;

/*!
 * @license Firebase Auth v4.6.1
 */
if(!isApp){
    try{webpackJsonpFirebase([4],{76:function(t,n,e){e(77)},77:function(t,n,e){(function(t){(function(){function t(t){return"string"==typeof t}function n(t){return"boolean"==typeof t}function i(){}function r(t){var n=typeof t;if("object"==n){if(!t)return"null";if(t instanceof Array)return"array";if(t instanceof Object)return n;var e=Object.prototype.toString.call(t);if("[object Window]"==e)return"object";if("[object Array]"==e||"number"==typeof t.length&&void 0!==t.splice&&void 0!==t.propertyIsEnumerable&&!t.propertyIsEnumerable("splice"))return"array";if("[object Function]"==e||void 0!==t.call&&void 0!==t.propertyIsEnumerable&&!t.propertyIsEnumerable("call"))return"function"}else if("function"==n&&void 0===t.call)return"object";return n}function o(t){return null===t}function a(t){return"array"==r(t)}function s(t){var n=r(t);return"array"==n||"object"==n&&"number"==typeof t.length}function u(t){return"function"==r(t)}function c(t){var n=typeof t;return"object"==n&&null!=t||"function"==n}function h(t,n,e){return t.call.apply(t.bind,arguments)}function f(t,n,e){if(!t)throw Error();if(2<arguments.length){var i=Array.prototype.slice.call(arguments,2);return function(){var e=Array.prototype.slice.call(arguments);return Array.prototype.unshift.apply(e,i),t.apply(n,e)}}return function(){return t.apply(n,arguments)}}function l(t,n,e){return l=Function.prototype.bind&&-1!=(""+Function.prototype.bind).indexOf("native code")?h:f,l.apply(null,arguments)}function p(t,n){var e=Array.prototype.slice.call(arguments,1);return function(){var n=e.slice();return n.push.apply(n,arguments),t.apply(this,n)}}function d(t,n){function e(){}e.prototype=n.prototype,t.ib=n.prototype,t.prototype=new e,t.prototype.constructor=t,t.Nc=function(t,e,i){for(var r=Array(arguments.length-2),o=2;o<arguments.length;o++)r[o-2]=arguments[o];return n.prototype[e].apply(t,r)}}function v(t){if(Error.captureStackTrace)Error.captureStackTrace(this,v);else{var n=Error().stack;n&&(this.stack=n)}t&&(this.message=t+"")}function m(t,n){for(var e=t.split("%s"),i="",r=Array.prototype.slice.call(arguments,1);r.length&&1<e.length;)i+=e.shift()+r.shift();return i+e.join("%s")}function g(t){return mu.test(t)?(-1!=t.indexOf("&")&&(t=t.replace(hu,"&amp;")),-1!=t.indexOf("<")&&(t=t.replace(fu,"&lt;")),-1!=t.indexOf(">")&&(t=t.replace(lu,"&gt;")),-1!=t.indexOf('"')&&(t=t.replace(pu,"&quot;")),-1!=t.indexOf("'")&&(t=t.replace(du,"&#39;")),-1!=t.indexOf("\0")&&(t=t.replace(vu,"&#0;")),t):t}function b(t,n){return-1!=t.indexOf(n)}function w(t,n){return t<n?-1:t>n?1:0}function y(t,n){n.unshift(t),v.call(this,m.apply(null,n)),n.shift()}function I(t,n){throw new y("Failure"+(t?": "+t:""),Array.prototype.slice.call(arguments,1))}function T(n,e){var i=n.length,r=t(n)?n.split(""):n;for(--i;0<=i;--i)i in r&&e.call(void 0,r[i],i,n)}function k(n){t:{for(var e=ke,i=n.length,r=t(n)?n.split(""):n,o=0;o<i;o++)if(o in r&&e.call(void 0,r[o],o,n)){e=o;break t}e=-1}return 0>e?null:t(n)?n.charAt(e):n[e]}function A(t,n){return 0<=bu(t,n)}function E(t,n){n=bu(t,n);var e;return(e=0<=n)&&Array.prototype.splice.call(t,n,1),e}function N(t,n){var e=0;T(t,function(i,r){n.call(void 0,i,r,t)&&1==Array.prototype.splice.call(t,r,1).length&&e++})}function S(t){return Array.prototype.concat.apply([],arguments)}function O(t){var n=t.length;if(0<n){for(var e=Array(n),i=0;i<n;i++)e[i]=t[i];return e}return[]}function P(t){return b(gu,t)}function C(t,n){for(var e in t)n.call(void 0,t[e],e,t)}function _(t){var n,e=[],i=0;for(n in t)e[i++]=t[n];return e}function R(t){var n,e=[],i=0;for(n in t)e[i++]=n;return e}function D(t){for(var n in t)return!1;return!0}function L(t,n){for(var e in t)if(!(e in n)||t[e]!==n[e])return!1;for(e in n)if(!(e in t))return!1;return!0}function x(t){var n,e={};for(n in t)e[n]=t[n];return e}function j(t,n){for(var e,i,r=1;r<arguments.length;r++){i=arguments[r];for(e in i)t[e]=i[e];for(var o=0;o<Au.length;o++)e=Au[o],Object.prototype.hasOwnProperty.call(i,e)&&(t[e]=i[e])}}function U(t){return U[" "](t),t}function M(t,n){var e=ju;return Object.prototype.hasOwnProperty.call(e,t)?e[t]:e[t]=n(t)}function V(){var t=ou.document;return t?t.documentMode:void 0}function F(t){return M(t,function(){for(var n=0,e=cu(Eu+"").split("."),i=cu(t+"").split("."),r=Math.max(e.length,i.length),o=0;0==n&&o<r;o++){var a=e[o]||"",s=i[o]||"";do{if(a=/(\d*)(\D*)(.*)/.exec(a)||["","","",""],s=/(\d*)(\D*)(.*)/.exec(s)||["","","",""],0==a[0].length&&0==s[0].length)break;n=w(0==a[1].length?0:parseInt(a[1],10),0==s[1].length?0:parseInt(s[1],10))||w(0==a[2].length,0==s[2].length)||w(a[2],s[2]),a=a[3],s=s[3]}while(0==n)}return 0<=n})}function K(t){t.prototype.then=t.prototype.then,t.prototype.$goog_Thenable=!0}function q(t){if(!t)return!1;try{return!!t.$goog_Thenable}catch(t){return!1}}function X(t,n,e){this.f=e,this.c=t,this.g=n,this.b=0,this.a=null}function B(t,n){t.g(n),t.b<t.f&&(t.b++,n.next=t.a,t.a=n)}function H(){var t=qu,n=null;return t.a&&(n=t.a,t.a=t.a.next,t.a||(t.b=null),n.next=null),n}function W(){this.next=this.b=this.a=null}function G(t){ou.setTimeout(function(){throw t},0)}function z(){var t=ou.MessageChannel;if(void 0===t&&"undefined"!=typeof window&&window.postMessage&&window.addEventListener&&!P("Presto")&&(t=function(){var t=document.createElement("IFRAME");t.style.display="none",t.src="",document.documentElement.appendChild(t);var n=t.contentWindow;t=n.document,t.open(),t.write(""),t.close();var e="callImmediate"+Math.random(),i="file:"==n.location.protocol?"*":n.location.protocol+"//"+n.location.host;t=l(function(t){"*"!=i&&t.origin!=i||t.data!=e||this.port1.onmessage()},this),n.addEventListener("message",t,!1),this.port1={},this.port2={postMessage:function(){n.postMessage(e,i)}}}),void 0!==t&&!P("Trident")&&!P("MSIE")){var n=new t,e={},i=e;return n.port1.onmessage=function(){if(void 0!==e.next){e=e.next;var t=e.pb;e.pb=null,t()}},function(t){i.next={pb:t},i=i.next,n.port2.postMessage(0)}}return"undefined"!=typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?function(t){var n=document.createElement("SCRIPT");n.onreadystatechange=function(){n.onreadystatechange=null,n.parentNode.removeChild(n),n=null,t(),t=null},document.documentElement.appendChild(n)}:function(t){ou.setTimeout(t,0)}}function J(t,n){Fu||Y(),Ku||(Fu(),Ku=!0);var e=qu,i=Mu.get();i.set(t,n),e.b?e.b.next=i:e.a=i,e.b=i}function Y(){if(-1!=(ou.Promise+"").indexOf("[native code]")){var t=ou.Promise.resolve(void 0);Fu=function(){t.then($)}}else Fu=function(){var t=$;!u(ou.setImmediate)||ou.Window&&ou.Window.prototype&&!P("Edge")&&ou.Window.prototype.setImmediate==ou.setImmediate?(Vu||(Vu=z()),Vu(t)):ou.setImmediate(t)}}function $(){for(var t;t=H();){try{t.a.call(t.b)}catch(t){G(t)}B(Mu,t)}Ku=!1}function Z(t,n){if(this.a=Xu,this.i=void 0,this.f=this.b=this.c=null,this.g=this.h=!1,t!=i)try{var e=this;t.call(n,function(t){ht(e,Bu,t)},function(t){if(!(t instanceof bt))try{if(t instanceof Error)throw t;throw Error("Promise rejected.")}catch(t){}ht(e,Hu,t)})}catch(t){ht(this,Hu,t)}}function Q(){this.next=this.f=this.b=this.g=this.a=null,this.c=!1}function tt(t,n,e){var i=Wu.get();return i.g=t,i.b=n,i.f=e,i}function nt(t){if(t instanceof Z)return t;var n=new Z(i);return ht(n,Bu,t),n}function et(t){return new Z(function(n,e){e(t)})}function it(t,n,e){ft(t,n,e,null)||J(p(n,t))}function rt(t){return new Z(function(n,e){var i=t.length,r=[];if(i)for(var o,a=function(t,e){i--,r[t]=e,0==i&&n(r)},s=function(t){e(t)},u=0;u<t.length;u++)o=t[u],it(o,p(a,u),s);else n(r)})}function ot(t){return new Z(function(n){var e=t.length,i=[];if(e)for(var r,o=function(t,r,o){e--,i[t]=r?{Qb:!0,value:o}:{Qb:!1,reason:o},0==e&&n(i)},a=0;a<t.length;a++)r=t[a],it(r,p(o,a,!0),p(o,a,!1));else n(i)})}function at(t,n){return n=tt(n,n,void 0),n.c=!0,ut(t,n),t}function st(t,n){if(t.a==Xu)if(t.c){var e=t.c;if(e.b){for(var i=0,r=null,o=null,a=e.b;a&&(a.c||(i++,a.a==t&&(r=a),!(r&&1<i)));a=a.next)r||(o=a);r&&(e.a==Xu&&1==i?st(e,n):(o?(i=o,i.next==e.f&&(e.f=i),i.next=i.next.next):dt(e),vt(e,r,Hu,n)))}t.c=null}else ht(t,Hu,n)}function ut(t,n){t.b||t.a!=Bu&&t.a!=Hu||pt(t),t.f?t.f.next=n:t.b=n,t.f=n}function ct(t,n,e,i){var r=tt(null,null,null);return r.a=new Z(function(t,o){r.g=n?function(e){try{var r=n.call(i,e);t(r)}catch(t){o(t)}}:t,r.b=e?function(n){try{var r=e.call(i,n);void 0===r&&n instanceof bt?o(n):t(r)}catch(t){o(t)}}:o}),r.a.c=t,ut(t,r),r.a}function ht(t,n,e){t.a==Xu&&(t===e&&(n=Hu,e=new TypeError("Promise cannot resolve to itself")),t.a=1,ft(e,t.wc,t.xc,t)||(t.i=e,t.a=n,t.c=null,pt(t),n!=Hu||e instanceof bt||gt(t,e)))}function ft(t,n,e,r){if(t instanceof Z)return ut(t,tt(n||i,e||null,r)),!0;if(q(t))return t.then(n,e,r),!0;if(c(t))try{var o=t.then;if(u(o))return lt(t,o,n,e,r),!0}catch(t){return e.call(r,t),!0}return!1}function lt(t,n,e,i,r){function o(t){s||(s=!0,i.call(r,t))}function a(t){s||(s=!0,e.call(r,t))}var s=!1;try{n.call(t,a,o)}catch(t){o(t)}}function pt(t){t.h||(t.h=!0,J(t.Mb,t))}function dt(t){var n=null;return t.b&&(n=t.b,t.b=n.next,n.next=null),t.b||(t.f=null),n}function vt(t,n,e,i){if(e==Hu&&n.b&&!n.c)for(;t&&t.g;t=t.c)t.g=!1;if(n.a)n.a.c=null,mt(n,e,i);else try{n.c?n.g.call(n.f):mt(n,e,i)}catch(t){Gu.call(null,t)}B(Wu,n)}function mt(t,n,e){n==Bu?t.g.call(t.f,e):t.b&&t.b.call(t.f,e)}function gt(t,n){t.g=!0,J(function(){t.g&&Gu.call(null,n)})}function bt(t){v.call(this,t)}function wt(){this.a="",this.b=Ju}function yt(t){return t instanceof wt&&t.constructor===wt&&t.b===Ju?t.a:(I("expected object of type Const, got '"+t+"'"),"type_error:Const")}function It(t){var n=new wt;return n.a=t,n}function Tt(){this.a="",this.b=Zu}function kt(t){return t instanceof Tt&&t.constructor===Tt&&t.b===Zu?t.a:(I("expected object of type TrustedResourceUrl, got '"+t+"' of type "+r(t)),"type_error:TrustedResourceUrl")}function At(t,n){return t=Et(t,n),n=new Tt,n.a=t,n}function Et(t,n){var e=yt(t);if(!$u.test(e))throw Error("Invalid TrustedResourceUrl format: "+e);return e.replace(Yu,function(t,i){if(!Object.prototype.hasOwnProperty.call(n,i))throw Error('Found marker, "'+i+'", in format string, "'+e+'", but no valid label mapping found in args: '+JSON.stringify(n));return t=n[i],t instanceof wt?yt(t):encodeURIComponent(t+"")})}function Nt(){this.a="",this.b=tc}function St(t){return t instanceof Nt&&t.constructor===Nt&&t.b===tc?t.a:(I("expected object of type SafeUrl, got '"+t+"' of type "+r(t)),"type_error:SafeUrl")}function Ot(t){return t instanceof Nt?t:(t=t.la?t.ja():t+"",Qu.test(t)||(t="about:invalid#zClosurez"),Pt(t))}function Pt(t){var n=new Nt;return n.a=t,n}function Ct(){this.a="",this.b=nc}function _t(t){return t instanceof Ct&&t.constructor===Ct&&t.b===nc?t.a:(I("expected object of type SafeHtml, got '"+t+"' of type "+r(t)),"type_error:SafeHtml")}function Rt(t){var n=new Ct;return n.a=t,n}function Dt(n){var e=document;return t(n)?e.getElementById(n):n}function Lt(t,n){C(n,function(n,e){n&&n.la&&(n=n.ja()),"style"==e?t.style.cssText=n:"class"==e?t.className=n:"for"==e?t.htmlFor=n:ec.hasOwnProperty(e)?t.setAttribute(ec[e],n):0==e.lastIndexOf("aria-",0)||0==e.lastIndexOf("data-",0)?t.setAttribute(e,n):t[e]=n})}function xt(n,e,i){var r=arguments,o=document,s=r[0]+"",u=r[1];if(!zu&&u&&(u.name||u.type)){if(s=["<",s],u.name&&s.push(' name="',g(u.name),'"'),u.type){s.push(' type="',g(u.type),'"');var c={};j(c,u),delete c.type,u=c}s.push(">"),s=s.join("")}return s=o.createElement(s),u&&(t(u)?s.className=u:a(u)?s.className=u.join(" "):Lt(s,u)),2<r.length&&jt(o,s,r),s}function jt(n,e,i){function r(i){i&&e.appendChild(t(i)?n.createTextNode(i):i)}for(var o=2;o<i.length;o++){var a=i[o];!s(a)||c(a)&&0<a.nodeType?r(a):wu(Ut(a)?O(a):a,r)}}function Ut(t){if(t&&"number"==typeof t.length){if(c(t))return"function"==typeof t.item||"string"==typeof t.item;if(u(t))return"function"==typeof t.item}return!1}function Mt(t){var n=[];return Ft(new Vt,t,n),n.join("")}function Vt(){}function Ft(t,n,e){if(null==n)e.push("null");else{if("object"==typeof n){if(a(n)){var i=n;n=i.length,e.push("[");for(var r="",o=0;o<n;o++)e.push(r),Ft(t,i[o],e),r=",";return void e.push("]")}if(!(n instanceof String||n instanceof Number||n instanceof Boolean)){e.push("{"),r="";for(i in n)Object.prototype.hasOwnProperty.call(n,i)&&"function"!=typeof(o=n[i])&&(e.push(r),Kt(i,e),e.push(":"),Ft(t,o,e),r=",");return void e.push("}")}n=n.valueOf()}switch(typeof n){case"string":Kt(n,e);break;case"number":e.push(isFinite(n)&&!isNaN(n)?n+"":"null");break;case"boolean":e.push(n+"");break;case"function":e.push("null");break;default:throw Error("Unknown type: "+typeof n)}}}function Kt(t,n){n.push('"',t.replace(rc,function(t){var n=ic[t];return n||(n="\\u"+(65536|t.charCodeAt(0)).toString(16).substr(1),ic[t]=n),n}),'"')}function qt(){0!=oc&&(ac[this[au]||(this[au]=++su)]=this),this.oa=this.oa,this.Fa=this.Fa}function Xt(t){t.oa||(t.oa=!0,t.ta(),0!=oc&&(t=t[au]||(t[au]=++su),delete ac[t]))}function Bt(t,n){this.type=t,this.b=this.target=n,this.Ab=!0}function Ht(n,e){if(Bt.call(this,n?n.type:""),this.relatedTarget=this.b=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.pointerId=0,this.pointerType="",this.a=null,n){var i=this.type=n.type,r=n.changedTouches?n.changedTouches[0]:null;if(this.target=n.target||n.srcElement,this.b=e,e=n.relatedTarget){if(Cu){t:{try{U(e.nodeName);var o=!0;break t}catch(t){}o=!1}o||(e=null)}}else"mouseover"==i?e=n.fromElement:"mouseout"==i&&(e=n.toElement);this.relatedTarget=e,null===r?(this.clientX=void 0!==n.clientX?n.clientX:n.pageX,this.clientY=void 0!==n.clientY?n.clientY:n.pageY,this.screenX=n.screenX||0,this.screenY=n.screenY||0):(this.clientX=void 0!==r.clientX?r.clientX:r.pageX,this.clientY=void 0!==r.clientY?r.clientY:r.pageY,this.screenX=r.screenX||0,this.screenY=r.screenY||0),this.button=n.button,this.key=n.key||"",this.ctrlKey=n.ctrlKey,this.altKey=n.altKey,this.shiftKey=n.shiftKey,this.metaKey=n.metaKey,this.pointerId=n.pointerId||0,this.pointerType=t(n.pointerType)?n.pointerType:fc[n.pointerType]||"",this.a=n,n.defaultPrevented&&this.c()}}function Wt(t,n,e,i,r){this.listener=t,this.a=null,this.src=n,this.type=e,this.capture=!!i,this.La=r,this.key=++pc,this.ma=this.Ha=!1}function Gt(t){t.ma=!0,t.listener=null,t.a=null,t.src=null,t.La=null}function zt(t){this.src=t,this.a={},this.b=0}function Jt(t,n,e,i,r,o){var a=""+n;(n=t.a[a])||(n=t.a[a]=[],t.b++);var s=$t(n,e,r,o);return-1<s?(t=n[s],i||(t.Ha=!1)):(t=new Wt(e,t.src,a,!!r,o),t.Ha=i,n.push(t)),t}function Yt(t,n){var e=n.type;e in t.a&&E(t.a[e],n)&&(Gt(n),0==t.a[e].length&&(delete t.a[e],t.b--))}function $t(t,n,e,i){for(var r=0;r<t.length;++r){var o=t[r];if(!o.ma&&o.listener==n&&o.capture==!!e&&o.La==i)return r}return-1}function Zt(t,n,e,i,r){if(i&&i.once)nn(t,n,e,i,r);else if(a(n))for(var o=0;o<n.length;o++)Zt(t,n[o],e,i,r);else e=hn(e),t&&t[lc]?pn(t,n,e,c(i)?!!i.capture:!!i,r):Qt(t,n,e,!1,i,r)}function Qt(t,n,e,i,r,o){if(!n)throw Error("Invalid event type");var a=c(r)?!!r.capture:!!r,s=cn(t);if(s||(t[dc]=s=new zt(t)),e=Jt(s,n,e,i,a,o),!e.a){if(i=tn(),e.a=i,i.src=t,i.listener=e,t.addEventListener)hc||(r=a),void 0===r&&(r=!1),t.addEventListener(""+n,i,r);else{if(!t.attachEvent)throw Error("addEventListener and attachEvent are unavailable.");t.attachEvent(on(""+n),i)}mc++}}function tn(){var t=un,n=uc?function(e){return t.call(n.src,n.listener,e)}:function(e){if(!(e=t.call(n.src,n.listener,e)))return e};return n}function nn(t,n,e,i,r){if(a(n))for(var o=0;o<n.length;o++)nn(t,n[o],e,i,r);else e=hn(e),t&&t[lc]?dn(t,n,e,c(i)?!!i.capture:!!i,r):Qt(t,n,e,!0,i,r)}function en(t,n,e,i,r){if(a(n))for(var o=0;o<n.length;o++)en(t,n[o],e,i,r);else i=c(i)?!!i.capture:!!i,e=hn(e),t&&t[lc]?(t=t.u,(n+="")in t.a&&(o=t.a[n],-1<(e=$t(o,e,i,r))&&(Gt(o[e]),Array.prototype.splice.call(o,e,1),0==o.length&&(delete t.a[n],t.b--)))):t&&(t=cn(t))&&(n=t.a[""+n],t=-1,n&&(t=$t(n,e,i,r)),(e=-1<t?n[t]:null)&&rn(e))}function rn(t){if("number"!=typeof t&&t&&!t.ma){var n=t.src;if(n&&n[lc])Yt(n.u,t);else{var e=t.type,i=t.a;n.removeEventListener?n.removeEventListener(e,i,t.capture):n.detachEvent&&n.detachEvent(on(e),i),mc--,(e=cn(n))?(Yt(e,t),0==e.b&&(e.src=null,n[dc]=null)):Gt(t)}}}function on(t){return t in vc?vc[t]:vc[t]="on"+t}function an(t,n,e,i){var r=!0;if((t=cn(t))&&(n=t.a[""+n]))for(n=n.concat(),t=0;t<n.length;t++){var o=n[t];o&&o.capture==e&&!o.ma&&(o=sn(o,i),r=r&&!1!==o)}return r}function sn(t,n){var e=t.listener,i=t.La||t.src;return t.Ha&&rn(t),e.call(i,n)}function un(t,n){if(t.ma)return!0;if(!uc){if(!n)t:{n=["window","event"];for(var e=ou,i=0;i<n.length;i++)if(null==(e=e[n[i]])){n=null;break t}n=e}if(i=n,n=new Ht(i,this),e=!0,!(0>i.keyCode||void 0!=i.returnValue)){t:{var r=!1;if(0==i.keyCode)try{i.keyCode=-1;break t}catch(t){r=!0}(r||void 0==i.returnValue)&&(i.returnValue=!0)}for(i=[],r=n.b;r;r=r.parentNode)i.push(r);for(t=t.type,r=i.length-1;0<=r;r--){n.b=i[r];var o=an(i[r],t,!0,n);e=e&&o}for(r=0;r<i.length;r++)n.b=i[r],o=an(i[r],t,!1,n),e=e&&o}return e}return sn(t,new Ht(n,this))}function cn(t){return t=t[dc],t instanceof zt?t:null}function hn(t){return u(t)?t:(t[gc]||(t[gc]=function(n){return t.handleEvent(n)}),t[gc])}function fn(){qt.call(this),this.u=new zt(this),this.Eb=this,this.Ra=null}function ln(n,e){var i,r=n.Ra;if(r)for(i=[];r;r=r.Ra)i.push(r);if(n=n.Eb,r=e.type||e,t(e))e=new Bt(e,n);else if(e instanceof Bt)e.target=e.target||n;else{var o=e;e=new Bt(r,n),j(e,o)}if(o=!0,i)for(var a=i.length-1;0<=a;a--){var s=e.b=i[a];o=vn(s,r,!0,e)&&o}if(s=e.b=n,o=vn(s,r,!0,e)&&o,o=vn(s,r,!1,e)&&o,i)for(a=0;a<i.length;a++)s=e.b=i[a],o=vn(s,r,!1,e)&&o}function pn(t,n,e,i,r){Jt(t.u,n+"",e,!1,i,r)}function dn(t,n,e,i,r){Jt(t.u,n+"",e,!0,i,r)}function vn(t,n,e,i){if(!(n=t.u.a[n+""]))return!0;n=n.concat();for(var r=!0,o=0;o<n.length;++o){var a=n[o];if(a&&!a.ma&&a.capture==e){var s=a.listener,u=a.La||a.src;a.Ha&&Yt(t.u,a),r=!1!==s.call(u,i)&&r}}return r&&0!=i.Ab}function mn(t,n,e){if(u(t))e&&(t=l(t,e));else{if(!t||"function"!=typeof t.handleEvent)throw Error("Invalid listener argument");t=l(t.handleEvent,t)}return 2147483647<+n?-1:ou.setTimeout(t,n||0)}function gn(t){var n=null;return new Z(function(e,i){-1==(n=mn(function(){e(void 0)},t))&&i(Error("Failed to schedule timer."))}).s(function(t){throw ou.clearTimeout(n),t})}function bn(t,n,e,i,r){this.reset(t,n,e,i,r)}function wn(t){this.f=t,this.b=this.c=this.a=null}function yn(t,n){this.name=t,this.value=n}function In(t){return t.c?t.c:t.a?In(t.a):(I("Root logger has no level set."),null)}function Tn(t){kc||(kc=new wn(""),Tc[""]=kc,kc.c=yc);var n;if(!(n=Tc[t])){n=new wn(t);var e=t.lastIndexOf("."),i=t.substr(e+1);e=Tn(t.substr(0,e)),e.b||(e.b={}),e.b[i]=n,n.a=e,Tc[t]=n}return n}function kn(t,n){this.b={},this.a=[],this.c=0;var e=arguments.length;if(1<e){if(e%2)throw Error("Uneven number of arguments");for(var i=0;i<e;i+=2)this.set(arguments[i],arguments[i+1])}else if(t){t instanceof kn?(e=t.S(),i=t.P()):(e=R(t),i=_(t));for(var r=0;r<e.length;r++)this.set(e[r],i[r])}}function An(t){if(t.c!=t.a.length){for(var n=0,e=0;n<t.a.length;){var i=t.a[n];En(t.b,i)&&(t.a[e++]=i),n++}t.a.length=e}if(t.c!=t.a.length){var r={};for(e=n=0;n<t.a.length;)i=t.a[n],En(r,i)||(t.a[e++]=i,r[i]=1),n++;t.a.length=e}}function En(t,n){return Object.prototype.hasOwnProperty.call(t,n)}function Nn(t,n){t&&t.log(Ic,n,void 0)}function Sn(t){return yu(t,function(t){return t=t.toString(16),1<t.length?t:"0"+t}).join("")}function On(t){var n="";return Pn(t,function(t){n+=String.fromCharCode(t)}),n}function Pn(t,n){function e(n){for(;i<t.length;){var e=t.charAt(i++),r=Ec[e];if(null!=r)return r;if(!/^[\s\xa0]*$/.test(e))throw Error("Unknown base64 encoding at char: "+e)}return n}Cn();for(var i=0;;){var r=e(-1),o=e(0),a=e(64),s=e(64);if(64===s&&-1===r)break;n(r<<2|o>>4),64!=a&&(n(o<<4&240|a>>2),64!=s&&n(a<<6&192|s))}}function Cn(){if(!Ac){Ac={},Ec={};for(var t=0;65>t;t++)Ac[t]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(t),Ec[Ac[t]]=t,62<=t&&(Ec["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(t)]=t)}}function _n(t,n){this.g=[],this.v=t,this.o=n||null,this.f=this.a=!1,this.c=void 0,this.u=this.w=this.i=!1,this.h=0,this.b=null,this.l=0}function Rn(t,n,e){t.a=!0,t.c=e,t.f=!n,Un(t)}function Dn(t){if(t.a){if(!t.u)throw new Mn;t.u=!1}}function Ln(t,n){xn(t,null,n,void 0)}function xn(t,n,e,i){t.g.push([n,e,i]),t.a&&Un(t)}function jn(t){return Iu(t.g,function(t){return u(t[1])})}function Un(t){if(t.h&&t.a&&jn(t)){var n=t.h,e=Sc[n];e&&(ou.clearTimeout(e.a),delete Sc[n]),t.h=0}t.b&&(t.b.l--,delete t.b),n=t.c;for(var i=e=!1;t.g.length&&!t.i;){var r=t.g.shift(),o=r[0],a=r[1];if(r=r[2],o=t.f?a:o)try{var s=o.call(r||t.o,n);void 0!==s&&(t.f=t.f&&(s==n||s instanceof Error),t.c=n=s),(q(n)||"function"==typeof ou.Promise&&n instanceof ou.Promise)&&(i=!0,t.i=!0)}catch(i){n=i,t.f=!0,jn(t)||(e=!0)}}t.c=n,i&&(s=l(t.m,t,!0),i=l(t.m,t,!1),n instanceof _n?(xn(n,s,i),n.w=!0):n.then(s,i)),e&&(n=new Fn(n),Sc[n.a]=n,t.h=n.a)}function Mn(){v.call(this)}function Vn(){v.call(this)}function Fn(t){this.a=ou.setTimeout(l(this.c,this),0),this.b=t}function Kn(){this.b=-1}function qn(t,n){this.b=-1,this.b=Oc,this.f=ou.Uint8Array?new Uint8Array(this.b):Array(this.b),this.g=this.c=0,this.a=[],this.i=t,this.h=n,this.l=ou.Int32Array?new Int32Array(64):Array(64),Nc||(Nc=ou.Int32Array?new Int32Array(Dc):Dc),this.reset()}function Xn(t){for(var n=t.f,e=t.l,i=0,r=0;r<n.length;)e[i++]=n[r]<<24|n[r+1]<<16|n[r+2]<<8|n[r+3],r=4*i;for(n=16;64>n;n++){r=0|e[n-15],i=0|e[n-2];var o=(0|e[n-16])+((r>>>7|r<<25)^(r>>>18|r<<14)^r>>>3)|0,a=(0|e[n-7])+((i>>>17|i<<15)^(i>>>19|i<<13)^i>>>10)|0;e[n]=o+a|0}i=0|t.a[0],r=0|t.a[1];var s=0|t.a[2],u=0|t.a[3],c=0|t.a[4],h=0|t.a[5],f=0|t.a[6];for(o=0|t.a[7],n=0;64>n;n++){var l=((i>>>2|i<<30)^(i>>>13|i<<19)^(i>>>22|i<<10))+(i&r^i&s^r&s)|0;a=c&h^~c&f,o=o+((c>>>6|c<<26)^(c>>>11|c<<21)^(c>>>25|c<<7))|0,a=a+(0|Nc[n])|0,a=o+(a+(0|e[n])|0)|0,o=f,f=h,h=c,c=u+a|0,u=s,s=r,r=i,i=a+l|0}t.a[0]=t.a[0]+i|0,t.a[1]=t.a[1]+r|0,t.a[2]=t.a[2]+s|0,t.a[3]=t.a[3]+u|0,t.a[4]=t.a[4]+c|0,t.a[5]=t.a[5]+h|0,t.a[6]=t.a[6]+f|0,t.a[7]=t.a[7]+o|0}function Bn(n,e,i){void 0===i&&(i=e.length);var r=0,o=n.c;if(t(e))for(;r<i;)n.f[o++]=e.charCodeAt(r++),o==n.b&&(Xn(n),o=0);else{if(!s(e))throw Error("message must be string or array");for(;r<i;){var a=e[r++];if(!("number"==typeof a&&0<=a&&255>=a&&a==(0|a)))throw Error("message must be a byte array");n.f[o++]=a,o==n.b&&(Xn(n),o=0)}}n.c=o,n.g+=i}function Hn(){qn.call(this,8,Lc)}function Wn(n){if(n.P&&"function"==typeof n.P)return n.P();if(t(n))return n.split("");if(s(n)){for(var e=[],i=n.length,r=0;r<i;r++)e.push(n[r]);return e}return _(n)}function Gn(n){if(n.S&&"function"==typeof n.S)return n.S();if(!n.P||"function"!=typeof n.P){if(s(n)||t(n)){var e=[];n=n.length;for(var i=0;i<n;i++)e.push(i);return e}return R(n)}}function zn(n,e){if(n.forEach&&"function"==typeof n.forEach)n.forEach(e,void 0);else if(s(n)||t(n))wu(n,e,void 0);else for(var i=Gn(n),r=Wn(n),o=r.length,a=0;a<o;a++)e.call(void 0,r[a],i&&i[a],n)}function Jn(t,n){if(t){t=t.split("&");for(var e=0;e<t.length;e++){var i=t[e].indexOf("="),r=null;if(0<=i){var o=t[e].substring(0,i);r=t[e].substring(i+1)}else o=t[e];n(o,r?decodeURIComponent(r.replace(/\+/g," ")):"")}}}function Yn(t,n){if(this.b=this.l=this.c="",this.i=null,this.h=this.g="",this.f=!1,t instanceof Yn){this.f=void 0!==n?n:t.f,$n(this,t.c),this.l=t.l,this.b=t.b,Zn(this,t.i),this.g=t.g,n=t.a;var e=new se;e.c=n.c,n.a&&(e.a=new kn(n.a),e.b=n.b),Qn(this,e),this.h=t.h}else t&&(e=(t+"").match(xc))?(this.f=!!n,$n(this,e[1]||"",!0),this.l=re(e[2]||""),this.b=re(e[3]||"",!0),Zn(this,e[4]),this.g=re(e[5]||"",!0),Qn(this,e[6]||"",!0),this.h=re(e[7]||"")):(this.f=!!n,this.a=new se(null,0,this.f))}function $n(t,n,e){t.c=e?re(n,!0):n,t.c&&(t.c=t.c.replace(/:$/,""))}function Zn(t,n){if(n){if(n=+n,isNaN(n)||0>n)throw Error("Bad port number "+n);t.i=n}else t.i=null}function Qn(t,n,e){n instanceof se?(t.a=n,ve(t.a,t.f)):(e||(n=oe(n,Vc)),t.a=new se(n,0,t.f))}function te(t,n,e){t.a.set(n,e)}function ne(t,n){return t.a.get(n)}function ee(t){return t instanceof Yn?new Yn(t):new Yn(t,void 0)}function ie(t,n){var e=new Yn(null,void 0);return $n(e,"https"),t&&(e.b=t),n&&(e.g=n),e}function re(t,n){return t?n?decodeURI(t.replace(/%25/g,"%2525")):decodeURIComponent(t):""}function oe(n,e,i){return t(n)?(n=encodeURI(n).replace(e,ae),i&&(n=n.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),n):null}function ae(t){return t=t.charCodeAt(0),"%"+(t>>4&15).toString(16)+(15&t).toString(16)}function se(t,n,e){this.b=this.a=null,this.c=t||null,this.f=!!e}function ue(t){t.a||(t.a=new kn,t.b=0,t.c&&Jn(t.c,function(n,e){he(t,decodeURIComponent(n.replace(/\+/g," ")),e)}))}function ce(t){var n=Gn(t);if(void 0===n)throw Error("Keys are undefined");var e=new se(null,0,void 0);t=Wn(t);for(var i=0;i<n.length;i++){var r=n[i],o=t[i];a(o)?pe(e,r,o):he(e,r,o)}return e}function he(t,n,e){ue(t),t.c=null,n=de(t,n);var i=t.a.get(n);i||t.a.set(n,i=[]),i.push(e),t.b+=1}function fe(t,n){ue(t),n=de(t,n),En(t.a.b,n)&&(t.c=null,t.b-=t.a.get(n).length,t=t.a,En(t.b,n)&&(delete t.b[n],t.c--,t.a.length>2*t.c&&An(t)))}function le(t,n){return ue(t),n=de(t,n),En(t.a.b,n)}function pe(t,n,e){fe(t,n),0<e.length&&(t.c=null,t.a.set(de(t,n),O(e)),t.b+=e.length)}function de(t,n){return n+="",t.f&&(n=n.toLowerCase()),n}function ve(t,n){n&&!t.f&&(ue(t),t.c=null,t.a.forEach(function(t,n){var e=n.toLowerCase();n!=e&&(fe(this,n),pe(this,e,t))},t)),t.f=n}function me(){}function ge(t){return t.c||(t.c=t.b())}function be(){}function we(t){if(!t.f&&"undefined"==typeof XMLHttpRequest&&"undefined"!=typeof ActiveXObject){for(var n=["MSXML2.XMLHTTP.6.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"],e=0;e<4;e++){var i=n[e];try{return new ActiveXObject(i),t.f=i}catch(t){}}throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed")}return t.f}function ye(t){fn.call(this),this.headers=new kn,this.w=t||null,this.b=!1,this.v=this.a=null,this.g=this.I=this.i="",this.c=this.G=this.h=this.A=!1,this.f=0,this.m=null,this.l=qc,this.o=this.N=!1}function Ie(t,n,e,i,r){if(t.a)throw Error("[goog.net.XhrIo] Object is active with another request="+t.i+"; newUri="+n);e=e?e.toUpperCase():"GET",t.i=n,t.g="",t.I=e,t.A=!1,t.b=!0,t.a=t.w?t.w.a():Kc.a(),t.v=ge(t.w?t.w:Kc),t.a.onreadystatechange=l(t.zb,t);try{Nn(t.J,Re(t,"Opening Xhr")),t.G=!0,t.a.open(e,n+"",!0),t.G=!1}catch(n){return Nn(t.J,Re(t,"Error opening Xhr: "+n.message)),void Ae(t,n)}n=i||"";var o=new kn(t.headers);r&&zn(r,function(t,n){o.set(n,t)}),r=k(o.S()),i=ou.FormData&&n instanceof ou.FormData,!A(Wc,e)||r||i||o.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8"),o.forEach(function(t,n){this.a.setRequestHeader(n,t)},t),t.l&&(t.a.responseType=t.l),"withCredentials"in t.a&&t.a.withCredentials!==t.N&&(t.a.withCredentials=t.N);try{Oe(t),0<t.f&&(t.o=Te(t.a),Nn(t.J,Re(t,"Will abort after "+t.f+"ms if incomplete, xhr2 "+t.o)),t.o?(t.a.timeout=t.f,t.a.ontimeout=l(t.Ea,t)):t.m=mn(t.Ea,t.f,t)),Nn(t.J,Re(t,"Sending request")),t.h=!0,t.a.send(n),t.h=!1}catch(n){Nn(t.J,Re(t,"Send error: "+n.message)),Ae(t,n)}}function Te(t){return Su&&F(9)&&"number"==typeof t.timeout&&void 0!==t.ontimeout}function ke(t){return"content-type"==t.toLowerCase()}function Ae(t,n){t.b=!1,t.a&&(t.c=!0,t.a.abort(),t.c=!1),t.g=n,Ee(t),Se(t)}function Ee(t){t.A||(t.A=!0,ln(t,"complete"),ln(t,"error"))}function Ne(t){if(t.b&&void 0!==ru)if(t.v[1]&&4==Pe(t)&&2==Ce(t))Nn(t.J,Re(t,"Local request error detected and ignored"));else if(t.h&&4==Pe(t))mn(t.zb,0,t);else if(ln(t,"readystatechange"),4==Pe(t)){Nn(t.J,Re(t,"Request complete")),t.b=!1;try{var n=Ce(t);t:switch(n){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var e=!0;break t;default:e=!1}var i;if(!(i=e)){var r;if(r=0===n){var o=(t.i+"").match(xc)[1]||null;if(!o&&ou.self&&ou.self.location){var a=ou.self.location.protocol;o=a.substr(0,a.length-1)}r=!Hc.test(o?o.toLowerCase():"")}i=r}if(i)ln(t,"complete"),ln(t,"success");else{try{var s=2<Pe(t)?t.a.statusText:""}catch(n){Nn(t.J,"Can not get status: "+n.message),s=""}t.g=s+" ["+Ce(t)+"]",Ee(t)}}finally{Se(t)}}}function Se(t,n){if(t.a){Oe(t);var e=t.a,r=t.v[0]?i:null;t.a=null,t.v=null,n||ln(t,"ready");try{e.onreadystatechange=r}catch(n){(t=t.J)&&t.log(wc,"Problem encountered resetting onreadystatechange: "+n.message,void 0)}}}function Oe(t){t.a&&t.o&&(t.a.ontimeout=null),"number"==typeof t.m&&(ou.clearTimeout(t.m),t.m=null)}function Pe(t){return t.a?t.a.readyState:0}function Ce(t){try{return 2<Pe(t)?t.a.status:-1}catch(t){return-1}}function _e(t){try{return t.a?t.a.responseText:""}catch(n){return Nn(t.J,"Can not get responseText: "+n.message),""}}function Re(t,n){return n+" ["+t.I+" "+t.i+" "+Ce(t)+"]"}function De(t){var n={},e=n.document||document,i=kt(t),r=document.createElement("SCRIPT"),o={Bb:r,Ea:void 0},a=new _n(xe,o),s=null,u=null!=n.timeout?n.timeout:5e3;return 0<u&&(s=window.setTimeout(function(){je(r,!0);var t=new Ue(Jc,"Timeout reached for loading script "+i);Dn(a),Rn(a,!1,t)},u),o.Ea=s),r.onload=r.onreadystatechange=function(){r.readyState&&"loaded"!=r.readyState&&"complete"!=r.readyState||(je(r,n.Oc||!1,s),a.A(null))},r.onerror=function(){je(r,!0,s);var t=new Ue(zc,"Error while loading script "+i);Dn(a),Rn(a,!1,t)},o=n.attributes||{},j(o,{type:"text/javascript",charset:"UTF-8"}),Lt(r,o),r.src=kt(t),Le(e).appendChild(r),a}function Le(t){var n;return(n=(t||document).getElementsByTagName("HEAD"))&&0!=n.length?n[0]:t.documentElement}function xe(){if(this&&this.Bb){var t=this.Bb;t&&"SCRIPT"==t.tagName&&je(t,!0,this.Ea)}}function je(t,n,e){null!=e&&ou.clearTimeout(e),t.onload=i,t.onerror=i,t.onreadystatechange=i,n&&window.setTimeout(function(){t&&t.parentNode&&t.parentNode.removeChild(t)},0)}function Ue(t,n){var e="Jsloader error (code #"+t+")";n&&(e+=": "+n),v.call(this,e),this.code=t}function Me(){}function Ve(){this.a=new XDomainRequest,this.readyState=0,this.onreadystatechange=null,this.responseText="",this.status=-1,this.statusText=this.responseXML=null,this.a.onload=l(this.Sb,this),this.a.onerror=l(this.wb,this),this.a.onprogress=l(this.Tb,this),this.a.ontimeout=l(this.Ub,this)}function Fe(t,n){t.readyState=n,t.onreadystatechange&&t.onreadystatechange()}function Ke(){var t=ri();return Su&&!!xu&&11==xu||/Edge\/\d+/.test(t)}function qe(){return ou.window&&ou.window.location.href||""}function Xe(t,n){n=n||ou.window;var e="about:blank";t&&(e=St(Ot(t))),n.location.href=e}function Be(t,n){var e,i=[];for(e in t)e in n?typeof t[e]!=typeof n[e]?i.push(e):a(t[e])?L(t[e],n[e])||i.push(e):"object"==typeof t[e]&&null!=t[e]&&null!=n[e]?0<Be(t[e],n[e]).length&&i.push(e):t[e]!==n[e]&&i.push(e):i.push(e);for(e in n)e in t||i.push(e);return i}function He(){var t=ri();return!((t=ei(t)!=Zc?null:(t=t.match(/\sChrome\/(\d+)/i))&&2==t.length?parseInt(t[1],10):null)&&30>t||Su&&xu&&!(9<xu))}function We(t){return t=(t||ri()).toLowerCase(),!!(t.match(/android/)||t.match(/webos/)||t.match(/iphone|ipad|ipod/)||t.match(/blackberry/)||t.match(/windows phone/)||t.match(/iemobile/))}function Ge(t){t=t||ou.window;try{t.close()}catch(t){}}function ze(t,n,e){var i=""+Math.floor(1e9*Math.random());n=n||500,e=e||600;var r=(window.screen.availHeight-e)/2,o=(window.screen.availWidth-n)/2;n={width:n,height:e,top:0<r?r:0,left:0<o?o:0,location:!0,resizable:!0,statusbar:!0,toolbar:!1},e=ri().toLowerCase(),i&&(n.target=i,b(e,"crios/")&&(n.target="_blank")),ei(ri())==$c&&(t=t||"http://localhost",n.scrollbars=!0),e=t||"",(i=n)||(i={}),t=window,n=e instanceof Nt?e:Ot(void 0!==e.href?e.href:e+""),e=i.target||e.target,r=[];for(a in i)switch(a){case"width":case"height":case"top":case"left":r.push(a+"="+i[a]);break;case"target":case"noreferrer":break;default:r.push(a+"="+(i[a]?1:0))}var a=r.join(",");if((P("iPhone")&&!P("iPod")&&!P("iPad")||P("iPad")||P("iPod"))&&t.navigator&&t.navigator.standalone&&e&&"_self"!=e?(a=t.document.createElement("A"),n instanceof Nt||n instanceof Nt||(n=n.la?n.ja():n+"",Qu.test(n)||(n="about:invalid#zClosurez"),n=Pt(n)),a.href=St(n),a.setAttribute("target",e),i.noreferrer&&a.setAttribute("rel","noreferrer"),i=document.createEvent("MouseEvent"),i.initMouseEvent("click",!0,!0,t,1),a.dispatchEvent(i),a={}):i.noreferrer?(a=t.open("",e,a),t=St(n),a&&(Pu&&b(t,";")&&(t="'"+t.replace(/'/g,"%27")+"'"),a.opener=null,It("b/12014412, meta tag with sanitized URL"),t='<META HTTP-EQUIV="refresh" content="0; url='+g(t)+'">',t=Rt(t),a.document.write(_t(t)),a.document.close())):a=t.open(St(n),e,a),a)try{a.focus()}catch(t){}return a}function Je(t){return new Z(function(n){function e(){gn(2e3).then(function(){if(t&&!t.closed)return e();n()})}return e()})}function Ye(){var t=null;return new Z(function(n){"complete"==ou.document.readyState?n():(t=function(){n()},nn(window,"load",t))}).s(function(n){throw en(window,"load",t),n})}function $e(){return Ze(void 0)?Ye().then(function(){return new Z(function(t,n){var e=ou.document,i=setTimeout(function(){n(Error("Cordova framework is not ready."))},1e3);e.addEventListener("deviceready",function(){clearTimeout(i),t()},!1)})}):et(Error("Cordova must run in an Android or iOS file scheme."))}function Ze(t){return t=t||ri(),!("file:"!==ci()||!t.toLowerCase().match(/iphone|ipad|ipod|android/))}function Qe(){var t=ou.window;try{return!(!t||t==t.top)}catch(t){return!1}}function ti(){return iu.INTERNAL.hasOwnProperty("reactNative")?"ReactNative":iu.INTERNAL.hasOwnProperty("node")?"Node":"Browser"}function ni(){var t=ti();return"ReactNative"===t||"Node"===t}function ei(t){var n=t.toLowerCase();return b(n,"opera/")||b(n,"opr/")||b(n,"opios/")?"Opera":b(n,"iemobile")?"IEMobile":b(n,"msie")||b(n,"trident/")?"IE":b(n,"edge/")?"Edge":b(n,"firefox/")?$c:b(n,"silk/")?"Silk":b(n,"blackberry")?"Blackberry":b(n,"webos")?"Webos":!b(n,"safari/")||b(n,"chrome/")||b(n,"crios/")||b(n,"android")?!b(n,"chrome/")&&!b(n,"crios/")||b(n,"edge/")?b(n,"android")?"Android":(t=t.match(/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/))&&2==t.length?t[1]:"Other":Zc:"Safari"}function ii(t,n){n=n||[];var e,i=[],r={};for(e in Qc)r[Qc[e]]=!0;for(e=0;e<n.length;e++)void 0!==r[n[e]]&&(delete r[n[e]],i.push(n[e]));return i.sort(),n=i,n.length||(n=["FirebaseCore-web"]),i=ti(),r="",(r="Browser"===i?ei(ri()):i)+"/JsCore/"+t+"/"+n.join(",")}function ri(){return ou.navigator&&ou.navigator.userAgent||""}function oi(t,n){t=t.split("."),n=n||ou;for(var e=0;e<t.length&&"object"==typeof n&&null!=n;e++)n=n[t[e]];return e!=t.length&&(n=void 0),n}function ai(){try{var t=ou.localStorage,n=di();if(t)return t.setItem(n,"1"),t.removeItem(n),!Ke()||!!ou.indexedDB}catch(t){}return!1}function si(){return(ui()||"chrome-extension:"===ci()||Ze())&&!ni()&&ai()}function ui(){return"http:"===ci()||"https:"===ci()}function ci(){return ou.location&&ou.location.protocol||null}function hi(t){return t=t||ri(),!We(t)&&ei(t)!=$c}function fi(t){return void 0===t?null:Mt(t)}function li(t){var n,e={};for(n in t)t.hasOwnProperty(n)&&null!==t[n]&&void 0!==t[n]&&(e[n]=t[n]);return e}function pi(t){if(null!==t)return JSON.parse(t)}function di(t){return t||""+Math.floor(1e9*Math.random())}function vi(t){return t=t||ri(),"Safari"!=ei(t)&&!t.toLowerCase().match(/iphone|ipad|ipod/)}function mi(){var t=ou.___jsl;if(t&&t.H)for(var n in t.H)if(t.H[n].r=t.H[n].r||[],t.H[n].L=t.H[n].L||[],t.H[n].r=t.H[n].L.concat(),t.CP)for(var e=0;e<t.CP.length;e++)t.CP[e]=null}function gi(){var t=ou.navigator;return!t||"boolean"!=typeof t.onLine||!ui()&&"chrome-extension:"!==ci()&&void 0===t.connection||t.onLine}function bi(t,n,e,i){if(t>n)throw Error("Short delay should be less than long delay!");this.c=t,this.b=n,t=e||ri(),i=i||ti(),this.a=We(t)||"ReactNative"===i}function wi(){var t=ou.document;return!t||void 0===t.visibilityState||"visible"==t.visibilityState}function yi(){var t=ou.document,n=null;return wi()||!t?nt():new Z(function(e){n=function(){wi()&&(t.removeEventListener("visibilitychange",n,!1),e())},t.addEventListener("visibilitychange",n,!1)}).s(function(e){throw t.removeEventListener("visibilitychange",n,!1),e})}function Ii(t){try{var n=new Date(parseInt(t,10));if(!isNaN(n.getTime())&&!/[^0-9]/.test(t))return n.toUTCString()}catch(t){}return null}function Ti(t,n,e){th?Object.defineProperty(t,n,{configurable:!0,enumerable:!0,value:e}):t[n]=e}function ki(t,n){if(n)for(var e in n)n.hasOwnProperty(e)&&Ti(t,e,n[e])}function Ai(t){var n={};return ki(n,t),n}function Ei(t){var n,e={};for(n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}function Ni(t,n){if(!n||!n.length)return!0;if(!t)return!1;for(var e=0;e<n.length;e++){var i=t[n[e]];if(void 0===i||null===i||""===i)return!1}return!0}function Si(t){var n=t;if("object"==typeof t&&null!=t){n="length"in t?[]:{};for(var e in t)Ti(n,e,Si(t[e]))}return n}function Oi(t){var n={},e=t[ih],i=t[rh];if(t=t[oh],!e||!t)throw Error("Invalid provider user info!");n[sh]=i||null,n[ah]=e,Ti(this,ch,t),Ti(this,uh,Si(n))}function Pi(t,n){this.code=hh+t,this.message=n||fh[t]||""}function Ci(t){var n=t&&t.code;return n?new Pi(n.substring(hh.length),t.message):null}function _i(t){var n=t[vh];if(void 0===n)throw new Pi("missing-continue-uri");if("string"!=typeof n||"string"==typeof n&&!n.length)throw new Pi("invalid-continue-uri");this.h=n,this.c=this.a=null,this.g=!1;var e=t[lh];if(e&&"object"==typeof e){n=e[bh];var i=e[mh];if(e=e[gh],"string"==typeof n&&n.length){if(this.a=n,void 0!==i&&"boolean"!=typeof i)throw new Pi("argument-error",mh+" property must be a boolean when specified.");if(this.g=!!i,void 0!==e&&("string"!=typeof e||"string"==typeof e&&!e.length))throw new Pi("argument-error",gh+" property must be a non empty string when specified.");this.c=e||null}else{if(void 0!==n)throw new Pi("argument-error",bh+" property must be a non empty string when specified.");if(void 0!==i||void 0!==e)throw new Pi("missing-android-pkg-name")}}else if(void 0!==e)throw new Pi("argument-error",lh+" property must be a non null object when specified.");if(this.b=null,(n=t[dh])&&"object"==typeof n){if("string"==typeof(n=n[wh])&&n.length)this.b=n;else if(void 0!==n)throw new Pi("argument-error",wh+" property must be a non empty string when specified.")}else if(void 0!==n)throw new Pi("argument-error",dh+" property must be a non null object when specified.");if(void 0!==(t=t[ph])&&"boolean"!=typeof t)throw new Pi("argument-error",ph+" property must be a boolean when specified.");if((this.f=!!t)&&!this.b&&!this.a)throw new Pi("argument-error",ph+" property can't be true when no mobile application is provided.")}function Ri(t){var n={};n.continueUrl=t.h,n.canHandleCodeInApp=t.f,(n.androidPackageName=t.a)&&(n.androidMinimumVersion=t.c,n.androidInstallApp=t.g),n.iOSBundleId=t.b;for(var e in n)null===n[e]&&delete n[e];return n}function Di(t){this.b=t.sub,uu(),this.a=t.provider_id||t.firebase&&t.firebase.sign_in_provider||null}function Li(t){if(t=t.split("."),3!=t.length)return null;t=t[1];for(var n=(4-t.length%4)%4,e=0;e<n;e++)t+=".";try{var i=JSON.parse(On(t));if(i.sub&&i.iss&&i.aud&&i.exp)return new Di(i)}catch(t){}return null}function xi(t){for(var n in Th)if(Th[n].Na==t)return Th[n];return null}function ji(t){var n={};n["facebook.com"]=Vi,n["google.com"]=Ki,n["github.com"]=Fi,n["twitter.com"]=qi;var e=t&&t[Ah];try{if(e)return n[e]?new n[e](t):new Mi(t);if(void 0!==t[kh])return new Ui(t)}catch(t){}return null}function Ui(t){var n=t[Ah];if(!n&&t[kh]){var e=Li(t[kh]);e&&e.a&&(n=e.a)}if(!n)throw Error("Invalid additional user info!");t=!!t.isNewUser,Ti(this,"providerId",n),Ti(this,"isNewUser",t)}function Mi(t){Ui.call(this,t),t=pi(t.rawUserInfo||"{}"),Ti(this,"profile",Si(t||{}))}function Vi(t){if(Mi.call(this,t),"facebook.com"!=this.providerId)throw Error("Invalid provider ID!")}function Fi(t){if(Mi.call(this,t),"github.com"!=this.providerId)throw Error("Invalid provider ID!");Ti(this,"username",this.profile&&this.profile.login||null)}function Ki(t){if(Mi.call(this,t),"google.com"!=this.providerId)throw Error("Invalid provider ID!")}function qi(t){if(Mi.call(this,t),"twitter.com"!=this.providerId)throw Error("Invalid provider ID!");Ti(this,"username",t.screenName||null)}function Xi(t,n){return t.then(function(t){if(t[Nh]){var e=Li(t[Nh]);if(!e||n!=e.b)throw new Pi("user-mismatch");return t}throw new Pi("user-mismatch")}).s(function(t){throw t&&t.code&&t.code==hh+"user-not-found"?new Pi("user-mismatch"):t})}function Bi(t,n){if(n.idToken||n.accessToken)n.idToken&&Ti(this,"idToken",n.idToken),n.accessToken&&Ti(this,"accessToken",n.accessToken);else{if(!n.oauthToken||!n.oauthTokenSecret)throw new Pi("internal-error","failed to construct a credential");Ti(this,"accessToken",n.oauthToken),Ti(this,"secret",n.oauthTokenSecret)}Ti(this,"providerId",t)}function Hi(t){var n={};return t.idToken&&(n.id_token=t.idToken),t.accessToken&&(n.access_token=t.accessToken),t.secret&&(n.oauth_token_secret=t.secret),n.providerId=t.providerId,{postBody:""+ce(n),requestUri:"http://localhost"}}function Wi(t,n){this.nc=n||[],ki(this,{providerId:t,isOAuthProvider:!0}),this.qb={},this.Wa=(xi(t)||{}).Ma||null,this.Ua=null}function Gi(t){Wi.call(this,t,Ih),this.a=[]}function zi(){Gi.call(this,"facebook.com")}function Ji(t){if(!t)throw new Pi("argument-error","credential failed: expected 1 argument (the OAuth access token).");var n=t;return c(t)&&(n=t.accessToken),(new zi).credential(null,n)}function Yi(){Gi.call(this,"github.com")}function $i(t){if(!t)throw new Pi("argument-error","credential failed: expected 1 argument (the OAuth access token).");var n=t;return c(t)&&(n=t.accessToken),(new Yi).credential(null,n)}function Zi(){Gi.call(this,"google.com"),this.sa("profile")}function Qi(t,n){var e=t;return c(t)&&(e=t.idToken,n=t.accessToken),(new Zi).credential(e,n)}function tr(){Wi.call(this,"twitter.com",yh)}function nr(t,n){var e=t;if(c(e)||(e={oauthToken:t,oauthTokenSecret:n}),!e.oauthToken||!e.oauthTokenSecret)throw new Pi("argument-error","credential failed: expected 2 arguments (the OAuth access token and secret).");return new Bi("twitter.com",e)}function er(t,n){this.a=t,this.f=n,Ti(this,"providerId","password")}function ir(){ki(this,{providerId:"password",isOAuthProvider:!1})}function rr(t){if(!(t.Pa&&t.Oa||t.Da&&t.Y))throw new Pi("internal-error");this.a=t,Ti(this,"providerId","phone")}function or(t){return t.a.Da&&t.a.Y?{temporaryProof:t.a.Da,phoneNumber:t.a.Y}:{sessionInfo:t.a.Pa,code:t.a.Oa}}function ar(t){try{this.a=t||iu.auth()}catch(t){throw new Pi("argument-error","Either an instance of firebase.auth.Auth must be passed as an argument to the firebase.auth.PhoneAuthProvider constructor, or the default firebase App instance must be initialized via firebase.initializeApp().")}ki(this,{providerId:"phone",isOAuthProvider:!1})}function sr(t,n){if(!t)throw new Pi("missing-verification-id");if(!n)throw new Pi("missing-verification-code");return new rr({Pa:t,Oa:n})}function ur(t){if(t.temporaryProof&&t.phoneNumber)return new rr({Da:t.temporaryProof,Y:t.phoneNumber});var n=t&&t.providerId;if(!n||"password"===n)return null;var e=t&&t.oauthAccessToken,i=t&&t.oauthTokenSecret;t=t&&t.oauthIdToken;try{switch(n){case"google.com":return Qi(t,e);case"facebook.com":return Ji(e);case"github.com":return $i(e);case"twitter.com":return nr(e,i);default:return new Gi(n).credential(t,e)}}catch(t){return null}}function cr(t){if(!t.isOAuthProvider)throw new Pi("invalid-oauth-provider")}function hr(t,n,e,i,r){if(this.b=t,this.c=n||null,this.f=e||null,this.g=i||null,this.a=r||null,!this.f&&!this.a)throw new Pi("invalid-auth-event");if(this.f&&this.a)throw new Pi("invalid-auth-event");if(this.f&&!this.g)throw new Pi("invalid-auth-event")}function fr(t){return t=t||{},t.type?new hr(t.type,t.eventId,t.urlResponse,t.sessionId,t.error&&Ci(t.error)):null}function lr(t){var n="unauthorized-domain",e=void 0,i=ee(t);t=i.b,i=i.c,"chrome-extension"==i?e=m("This chrome extension ID (chrome-extension://%s) is not authorized to run this operation. Add it to the OAuth redirect domains list in the Firebase console -> Auth section -> Sign in method tab.",t):"http"==i||"https"==i?e=m("This domain (%s) is not authorized to run this operation. Add it to the OAuth redirect domains list in the Firebase console -> Auth section -> Sign in method tab.",t):n="operation-not-supported-in-this-environment",Pi.call(this,n,e)}function pr(t,n,e){Pi.call(this,t,e),t=n||{},t.rb&&Ti(this,"email",t.rb),t.Y&&Ti(this,"phoneNumber",t.Y),t.credential&&Ti(this,"credential",t.credential)}function dr(t){if(t.code){var n=t.code||"";0==n.indexOf(hh)&&(n=n.substring(hh.length));var e={credential:ur(t)};if(t.email)e.rb=t.email;else{if(!t.phoneNumber)return new Pi(n,t.message||void 0);e.Y=t.phoneNumber}return new pr(n,e,t.message)}return null}function vr(t){this.f=t}function mr(t,n,e){var i="Node"==ti();if(!(i=ou.XMLHttpRequest||i&&iu.INTERNAL.node&&iu.INTERNAL.node.XMLHttpRequest))throw new Pi("internal-error","The XMLHttpRequest compatibility library was not found.");this.b=t,t=n||{},this.i=t.secureTokenEndpoint||"https://securetoken.googleapis.com/v1/token",this.l=t.secureTokenTimeout||Sh,this.c=x(t.secureTokenHeaders||Oh),this.g=t.firebaseEndpoint||"https://www.googleapis.com/identitytoolkit/v3/relyingparty/",this.h=t.firebaseTimeout||Ph,this.a=x(t.firebaseHeaders||Ch),e&&(this.a["X-Client-Version"]=e,this.c["X-Client-Version"]=e),this.f=new Me,this.o=new vr(i)}function gr(t,n){n?t.a["X-Firebase-Locale"]=n:delete t.a["X-Firebase-Locale"]}function br(t,n){n?(t.a["X-Client-Version"]=n,t.c["X-Client-Version"]=n):(delete t.a["X-Client-Version"],delete t.c["X-Client-Version"])}function wr(t,n,e,i,r,o,a){gi()?(He()?t=l(t.m,t):(Eh||(Eh=new Z(function(t,n){yr(t,n)})),t=l(t.u,t)),t(n,e,i,r,o,a)):e&&e(null)}function yr(t,n){((window.gapi||{}).client||{}).request?t():(ou[Rh]=function(){((window.gapi||{}).client||{}).request?t():n(Error("CORS_UNSUPPORTED"))},Ln(De(At(_h,{onload:Rh})),function(){n(Error("CORS_UNSUPPORTED"))}))}function Ir(t,n){return new Z(function(e,i){"refresh_token"==n.grant_type&&n.refresh_token||"authorization_code"==n.grant_type&&n.code?wr(t,t.i+"?key="+encodeURIComponent(t.b),function(t){t?t.error?i(Mr(t)):t.access_token&&t.refresh_token?e(t):i(new Pi("internal-error")):i(new Pi("network-request-failed"))},"POST",""+ce(n),t.c,t.l.get()):i(new Pi("internal-error"))})}function Tr(t,n,e,i,r,o){var a=ee(t.g+n);te(a,"key",t.b),o&&te(a,"cb",""+uu());var s="GET"==e;if(s)for(var u in i)i.hasOwnProperty(u)&&te(a,u,i[u]);return new Z(function(n,o){wr(t,""+a,function(t){t?t.error?o(Mr(t,r||{})):n(t):o(new Pi("network-request-failed"))},e,s?void 0:Mt(li(i)),t.a,t.h.get())})}function kr(t){if(!Gc.test(t.email))throw new Pi("invalid-email")}function Ar(t){"email"in t&&kr(t)}function Er(t,n){return Ur(t,Mh,{identifier:n,continueUri:ui()?qe():"http://localhost"}).then(function(t){return t.allProviders||[]})}function Nr(t){return Ur(t,Bh,{}).then(function(t){return t.authorizedDomains||[]})}function Sr(t){if(!t[Nh])throw new Pi("internal-error")}function Or(t){if(t.phoneNumber||t.temporaryProof){if(!t.phoneNumber||!t.temporaryProof)throw new Pi("internal-error")}else{if(!t.sessionInfo)throw new Pi("missing-verification-id");if(!t.code)throw new Pi("missing-verification-code")}}function Pr(t,n){return Ur(t,Gh,n)}function Cr(t,n,e){return Ur(t,Fh,{idToken:n,deleteProvider:e})}function _r(t){if(!t.requestUri||!t.sessionId&&!t.postBody)throw new Pi("internal-error")}function Rr(t){var n=null;if(t.needConfirmation?(t.code="account-exists-with-different-credential",n=dr(t)):"FEDERATED_USER_ID_ALREADY_LINKED"==t.errorMessage?(t.code="credential-already-in-use",n=dr(t)):"EMAIL_EXISTS"==t.errorMessage&&(t.code="email-already-in-use",n=dr(t)),n)throw n;if(!t[Nh])throw new Pi("internal-error")}function Dr(t,n){return n.returnIdpCredential=!0,Ur(t,$h,n)}function Lr(t,n){return n.returnIdpCredential=!0,Ur(t,Qh,n)}function xr(t,n){return n.returnIdpCredential=!0,n.autoCreate=!1,Ur(t,Zh,n)}function jr(t){if(!t.oobCode)throw new Pi("invalid-action-code")}function Ur(t,n,e){if(!Ni(e,n.ea))return et(new Pi("internal-error"));var i,r=n.yb||"POST";return nt(e).then(n.D).then(function(){return n.T&&(e.returnSecureToken=!0),Tr(t,n.endpoint,r,e,n.Lb,n.nb||!1)}).then(function(t){return i=t}).then(n.O).then(function(){if(!n.ga)return i;if(!(n.ga in i))throw new Pi("internal-error");return i[n.ga]})}function Mr(t,n){var e=(t.error&&t.error.errors&&t.error.errors[0]||{}).reason||"",i={keyInvalid:"invalid-api-key",ipRefererBlocked:"app-not-authorized"};if(e=i[e]?new Pi(i[e]):null)return e;e=t.error&&t.error.message||"",i={INVALID_CUSTOM_TOKEN:"invalid-custom-token",CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_EMAIL:"invalid-email",INVALID_PASSWORD:"wrong-password",USER_DISABLED:"user-disabled",MISSING_PASSWORD:"internal-error",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",INVALID_MESSAGE_PAYLOAD:"invalid-message-payload",INVALID_RECIPIENT_EMAIL:"invalid-recipient-email",INVALID_SENDER:"invalid-sender",EMAIL_NOT_FOUND:"user-not-found",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",CORS_UNSUPPORTED:"cors-unsupported",DYNAMIC_LINK_NOT_ACTIVATED:"dynamic-link-not-activated",INVALID_APP_ID:"invalid-app-id",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",WEAK_PASSWORD:"weak-password",OPERATION_NOT_ALLOWED:"operation-not-allowed",USER_CANCELLED:"user-cancelled",CAPTCHA_CHECK_FAILED:"captcha-check-failed",INVALID_APP_CREDENTIAL:"invalid-app-credential",INVALID_CODE:"invalid-verification-code",INVALID_PHONE_NUMBER:"invalid-phone-number",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_APP_CREDENTIAL:"missing-app-credential",MISSING_CODE:"missing-verification-code",MISSING_PHONE_NUMBER:"missing-phone-number",MISSING_SESSION_INFO:"missing-verification-id",QUOTA_EXCEEDED:"quota-exceeded",SESSION_EXPIRED:"code-expired",INVALID_CONTINUE_URI:"invalid-continue-uri",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",MISSING_IOS_BUNDLE_ID:"missing-ios-bundle-id",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",INVALID_CERT_HASH:"invalid-cert-hash"},j(i,n||{}),n=(n=e.match(/^[^\s]+\s*:\s*(.*)$/))&&1<n.length?n[1]:void 0;for(var r in i)if(0===e.indexOf(r))return new Pi(i[r],n);return!n&&t&&(n=fi(t)),new Pi("internal-error",n)}function Vr(t){for(var n in af)if(af[n].id===t)return t=af[n],{firebaseEndpoint:t.Va,secureTokenEndpoint:t.ab};return null}function Fr(t){this.b=t,this.a=null,this.Ya=Kr(this)}function Kr(t){return Br().then(function(){return new Z(function(n,e){oi("gapi.iframes.getContext")().open({where:document.body,url:t.b,messageHandlersFilter:oi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"),attributes:{style:{position:"absolute",top:"-100px",width:"1px",height:"1px"}},dontclear:!0},function(i){function r(){clearTimeout(o),n()}t.a=i,t.a.restyle({setHideOnLeave:!1});var o=setTimeout(function(){e(Error("Network Error"))},cf.get());i.ping(r).then(r,function(){e(Error("Network Error"))})})})})}function qr(t,n){return t.Ya.then(function(){return new Z(function(e){t.a.send(n.type,n,e,oi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"))})})}function Xr(t,n){t.Ya.then(function(){t.a.register("authEvent",n,oi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"))})}function Br(){return hf||(hf=new Z(function(t,n){if(gi()){var e=function(){mi(),oi("gapi.load")("gapi.iframes",{callback:t,ontimeout:function(){mi(),n(Error("Network Error"))},timeout:uf.get()})};if(oi("gapi.iframes.Iframe"))t();else if(oi("gapi.load"))e();else{var i="__iframefcb"+Math.floor(1e6*Math.random());ou[i]=function(){oi("gapi.load")?e():n(Error("Network Error"))},i=At(sf,{onload:i}),nt(De(i)).s(function(){n(Error("Network Error"))})}}else n(Error("Network Error"))}).s(function(t){throw hf=null,t}))}function Hr(t,n,e){this.i=t,this.g=n,this.h=e,this.f=null,this.a=ie(this.i,"/__/auth/iframe"),te(this.a,"apiKey",this.g),te(this.a,"appName",this.h),this.b=null,this.c=[]}function Wr(t,n,e,i,r){this.m=t,this.u=n,this.c=e,this.l=i,this.i=this.g=this.h=null,this.a=r,this.f=null}function Gr(t){try{return iu.app(t).auth().Ka()}catch(t){return[]}}function zr(t,n,e,i,r){this.u=t,this.f=n,this.b=e,this.c=i||null,this.h=r||null,this.m=this.o=this.v=null,this.g=[],this.l=this.a=null}function Jr(t){var n=qe();return Nr(t).then(function(t){t:{var e=ee(n),i=e.c;e=e.b;for(var r=0;r<t.length;r++){var o=t[r],a=e,s=i;if(0==o.indexOf("chrome-extension://")?a=ee(o).b==a&&"chrome-extension"==s:"http"!=s&&"https"!=s?a=!1:Yc.test(o)?a=a==o:(o=o.split(".").join("\\."),a=RegExp("^(.+\\."+o+"|"+o+")$","i").test(a)),a){t=!0;break t}}t=!1}if(!t)throw new lr(qe())})}function Yr(t){return t.l?t.l:(t.l=Ye().then(function(){if(!t.o){var n=t.c,e=t.h,i=Gr(t.b),r=new Hr(t.u,t.f,t.b);r.f=n,r.b=e,r.c=O(i||[]),t.o=""+r}t.i=new Fr(t.o),Qr(t)}),t.l)}function $r(t){return t.m||(t.v=t.c?ii(t.c,Gr(t.b)):null,t.m=new mr(t.f,Vr(t.h),t.v)),t.m}function Zr(t,n,e,i,r,o,a,s,u,c){return t=new Wr(t,n,e,i,r),t.h=o,t.g=a,t.i=s,t.b=x(u||null),t.f=c,""+t}function Qr(t){if(!t.i)throw Error("IfcHandler must be initialized!");Xr(t.i,function(n){var e={};if(n&&n.authEvent){var i=!1;for(n=fr(n.authEvent),e=0;e<t.g.length;e++)i=t.g[e](n)||i;return e={},e.status=i?"ACK":"ERROR",nt(e)}return e.status="ERROR",nt(e)})}function to(t){var n={type:"webStorageSupport"};return Yr(t).then(function(){return qr(t.i,n)}).then(function(t){if(t&&t.length&&void 0!==t[0].webStorageSupport)return t[0].webStorageSupport;throw Error()})}function no(t){if(this.a=t||iu.INTERNAL.reactNative&&iu.INTERNAL.reactNative.AsyncStorage,!this.a)throw new Pi("internal-error","The React Native compatibility library was not found.")}function eo(){this.a={}}function io(t,n,e,i,r,o){if(!window.indexedDB)throw new Pi("web-storage-unsupported");this.u=t,this.h=n,this.g=e,this.l=i,this.m=r,this.f={},this.c=[],this.a=0,this.o=o||ou.indexedDB}function ro(t){return new Z(function(n,e){var i=t.o.open(t.u,t.m);i.onerror=function(t){e(Error(t.target.errorCode))},i.onupgradeneeded=function(n){n=n.target.result;try{n.createObjectStore(t.h,{keyPath:t.g})}catch(t){e(t)}},i.onsuccess=function(t){n(t.target.result)}})}function oo(t){return t.i||(t.i=ro(t)),t.i}function ao(t,n){return n.objectStore(t.h)}function so(t,n,e){return n.transaction([t.h],e?"readwrite":"readonly")}function uo(t){return new Z(function(n,e){t.onsuccess=function(t){t&&t.target?n(t.target.result):n()},t.onerror=function(t){e(Error(t.target.errorCode))}})}function co(t){function n(){return t.b=gn(800).then(l(t.vc,t)).then(function(n){0<n.length&&wu(t.c,function(t){t(n)})}).then(n).s(function(t){"STOP_EVENT"!=t.message&&n()}),t.b}t.b&&t.b.cancel("STOP_EVENT"),n()}function ho(){if(!fo()){if("Node"==ti())throw new Pi("internal-error","The LocalStorage compatibility library was not found.");throw new Pi("web-storage-unsupported")}this.a=ou.localStorage||iu.INTERNAL.node.localStorage}function fo(){var t="Node"==ti();if(!(t=ou.localStorage||t&&iu.INTERNAL.node&&iu.INTERNAL.node.localStorage))return!1;try{return t.setItem("__sak","1"),t.removeItem("__sak"),!0}catch(t){return!1}}function lo(){}function po(){if(!vo()){if("Node"==ti())throw new Pi("internal-error","The SessionStorage compatibility library was not found.");throw new Pi("web-storage-unsupported")}this.a=ou.sessionStorage||iu.INTERNAL.node.sessionStorage}function vo(){var t="Node"==ti();if(!(t=ou.sessionStorage||t&&iu.INTERNAL.node&&iu.INTERNAL.node.sessionStorage))return!1;try{return t.setItem("__sak","1"),t.removeItem("__sak"),!0}catch(t){return!1}}function mo(){var t={};t.Browser=df,t.Node=vf,t.ReactNative=mf,this.a=t[ti()]}function go(t){var n=new Pi("invalid-persistence-type"),e=new Pi("unsupported-persistence-type");t:{for(i in gf)if(gf[i]==t){var i=!0;break t}i=!1}if(!i||"string"!=typeof t)throw n;switch(ti()){case"ReactNative":if("session"===t)throw e;break;case"Node":if("none"!==t)throw e;break;default:if(!ai()&&"none"!==t)throw e}}function bo(t,n,e,i){this.i=t,this.g=n,this.w=e,this.u=i,this.a={},lf||(lf=new mo),t=lf;try{if(Ke()){ff||(ff=new io("firebaseLocalStorageDb","firebaseLocalStorage","fbase_key","value",1));var r=ff}else r=new t.a.C;this.l=r}catch(t){this.l=new eo,this.u=!0}try{this.o=new t.a.jb}catch(t){this.o=new eo}this.v=new eo,this.h=l(this.m,this),this.b={}}function wo(){return pf||(pf=new bo("firebase",":",!(vi(ri())||!Qe()),hi())),pf}function yo(t,n){switch(n){case"session":return t.o;case"none":return t.v;default:return t.l}}function Io(t,n,e){return t.i+t.g+n.name+(e?t.g+e:"")}function To(t,n,e){return e=Io(t,n,e),"local"==n.C&&(t.b[e]=null),yo(t,n.C).X(e)}function ko(t,n,e,i){n=Io(t,n,e),void 0!==ou.localStorage&&"function"==typeof ou.localStorage.getItem&&(t.b[n]=ou.localStorage.getItem(n)),D(t.a)&&(yo(t,"local").ia(t.h),t.u||Ke()||Eo(t)),t.a[n]||(t.a[n]=[]),t.a[n].push(i)}function Ao(t,n,e){n=Io(t,as("local"),n),t.a[n]&&(N(t.a[n],function(t){return t==e}),0==t.a[n].length&&delete t.a[n]),D(t.a)&&So(t)}function Eo(t){No(t),t.f=setInterval(function(){for(var n in t.a){var e=ou.localStorage.getItem(n),i=t.b[n];e!=i&&(t.b[n]=e,e=new Ht({type:"storage",key:n,target:window,oldValue:i,newValue:e,a:!0}),t.m(e))}},1e3)}function No(t){t.f&&(clearInterval(t.f),t.f=null)}function So(t){yo(t,"local").da(t.h),No(t)}function Oo(t){this.a=t,this.b=wo()}function Po(t){return t.b.get(bf,t.a).then(function(t){return fr(t)})}function Co(){this.a=wo()}function _o(t,n,e,i,r,o,a){this.u=t,this.i=n,this.l=e,this.m=i||null,this.o=a||null,this.h=n+":"+e,this.A=new Co,this.g=new Oo(this.h),this.f=null,this.b=[],this.v=r||500,this.w=o||2e3,this.a=this.c=null}function Ro(t){return new Pi("invalid-cordova-configuration",t)}function Do(){for(var t=20,n=[];0<t;)n.push("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(62*Math.random()))),t--;return n.join("")}function Lo(t){var n=new Hn;Bn(n,t),t=[];var e=8*n.g;56>n.c?Bn(n,Rc,56-n.c):Bn(n,Rc,n.b-(n.c-56));for(var i=63;56<=i;i--)n.f[i]=255&e,e/=256;for(Xn(n),i=e=0;i<n.i;i++)for(var r=24;0<=r;r-=8)t[e++]=n.a[i]>>r&255;return Sn(t)}function xo(t,n,e,i){var r=Do(),o=new hr(n,i,null,r,new Pi("no-auth-event")),a=oi("BuildInfo.packageName",ou);if("string"!=typeof a)throw new Pi("invalid-cordova-configuration");var s=oi("BuildInfo.displayName",ou),u={};if(ri().toLowerCase().match(/iphone|ipad|ipod/))u.ibi=a;else{if(!ri().toLowerCase().match(/android/))return et(new Pi("operation-not-supported-in-this-environment"));u.apn=a}s&&(u.appDisplayName=s),r=Lo(r),u.sessionId=r;var c=Zr(t.u,t.i,t.l,n,e,null,i,t.m,u,t.o);return t.ba().then(function(){var n=t.h;return t.A.a.set(bf,o.B(),n)}).then(function(){var n=oi("cordova.plugins.browsertab.isAvailable",ou);if("function"!=typeof n)throw new Pi("invalid-cordova-configuration");var e=null;n(function(n){if(n){if("function"!=typeof(e=oi("cordova.plugins.browsertab.openUrl",ou)))throw new Pi("invalid-cordova-configuration");e(c)}else{if("function"!=typeof(e=oi("cordova.InAppBrowser.open",ou)))throw new Pi("invalid-cordova-configuration");n=ri(),n=!(!n.match(/(iPad|iPhone|iPod).*OS 7_\d/i)&&!n.match(/(iPad|iPhone|iPod).*OS 8_\d/i)),t.a=e(c,n?"_blank":"_system","location=yes")}})})}function jo(t,n){for(var e=0;e<t.b.length;e++)try{t.b[e](n)}catch(t){}}function Uo(t){return t.f||(t.f=t.ba().then(function(){return new Z(function(n){function e(i){return n(i),t.Ja(e),!1}t.ua(e),Vo(t)})})),t.f}function Mo(t){var n=null;return Po(t.g).then(function(e){return n=e,e=t.g,To(e.b,bf,e.a)}).then(function(){return n})}function Vo(t){function n(n){r=!0,o&&o.cancel(),Mo(t).then(function(e){var r=i;if(e&&n&&n.url){r=null;var o=n.url,a=ee(o),s=ne(a,"link"),u=ne(ee(s),"link");a=ne(a,"deep_link_id"),o=ne(ee(a),"link")||a||u||s||o,-1!=o.indexOf("/__/auth/callback")&&(r=ee(o),r=pi(ne(r,"firebaseError")||null),r=(r="object"==typeof r?Ci(r):null)?new hr(e.b,e.c,null,null,r):new hr(e.b,e.c,o,e.g)),r=r||i}jo(t,r)})}var e=oi("universalLinks.subscribe",ou);if("function"!=typeof e)throw new Pi("invalid-cordova-configuration");var i=new hr("unknown",null,null,null,new Pi("no-auth-event")),r=!1,o=gn(t.v).then(function(){return Mo(t).then(function(){r||jo(t,i)})}),a=ou.handleOpenURL;ou.handleOpenURL=function(t){if(0==t.toLowerCase().indexOf(oi("BuildInfo.packageName",ou).toLowerCase()+"://")&&n({url:t}),"function"==typeof a)try{a(t)}catch(t){console.error(t)}},e(null,n)}function Fo(t){this.a=t,this.b=wo()}function Ko(t){return t.b.set(wf,"pending",t.a)}function qo(t){return To(t.b,wf,t.a)}function Xo(t){return t.b.get(wf,t.a).then(function(t){return"pending"==t})}function Bo(t,n,e){this.v=t,this.l=n,this.u=e,this.h=[],this.f=!1,this.i=l(this.m,this),this.c=new $o,this.o=new ra,this.g=new Fo(this.l+":"+this.u),this.b={},this.b.unknown=this.c,this.b.signInViaRedirect=this.c,this.b.linkViaRedirect=this.c,this.b.reauthViaRedirect=this.c,this.b.signInViaPopup=this.o,this.b.linkViaPopup=this.o,this.b.reauthViaPopup=this.o,this.a=Ho(this.v,this.l,this.u,Lh)}function Ho(t,n,e,i){var r=iu.SDK_VERSION||null;return Ze()?new _o(t,n,e,r,void 0,void 0,i):new zr(t,n,e,r,i)}function Wo(t){t.f||(t.f=!0,t.a.ua(t.i));var n=t.a;return t.a.ba().s(function(e){throw t.a==n&&t.reset(),e})}function Go(t){t.a.Cb()&&Wo(t).s(function(n){var e=new hr("unknown",null,null,null,new Pi("operation-not-supported-in-this-environment"));Jo(n)&&t.m(e)}),t.a.xb()||Zo(t.c)}function zo(t,n,e,i,r,o){return t.a.ub(n,e,i,function(){t.f||(t.f=!0,t.a.ua(t.i))},function(){t.reset()},r,o)}function Jo(t){return!(!t||"auth/cordova-not-ready"!=t.code)}function Yo(t,n,e){var i=n+":"+e;return Tf[i]||(Tf[i]=new Bo(t,n,e)),Tf[i]}function $o(){this.b=null,this.f=[],this.c=[],this.a=null,this.g=!1}function Zo(t){t.g||(t.g=!0,ea(t,!1,null,null))}function Qo(t,n,e){e=e.va(n.b,n.c);var i=n.f,r=n.g,o=!!n.b.match(/Redirect$/);return e(i,r).then(function(n){ea(t,o,n,null)}).s(function(n){ea(t,o,null,n)})}function ta(t,n){if(t.b=function(){return et(n)},t.c.length)for(var e=0;e<t.c.length;e++)t.c[e](n)}function na(t,n){if(t.b=function(){return nt(n)},t.f.length)for(var e=0;e<t.f.length;e++)t.f[e](n)}function ea(t,n,e,i){n?i?ta(t,i):na(t,e):na(t,{user:null}),t.f=[],t.c=[]}function ia(t){var n=new Pi("timeout");t.a&&t.a.cancel(),t.a=gn(If.get()).then(function(){t.b||ea(t,!0,null,n)})}function ra(){}function oa(t,n){var e=t.c,i=t.b;return n.va(i,e)(t.f,t.g).then(function(t){n.fa(i,t,null,e)}).s(function(t){n.fa(i,null,t,e)})}function aa(t,n){this.a=n,Ti(this,"verificationId",t)}function sa(t,n,e,i){return new ar(t).Qa(n,e).then(function(t){return new aa(t,i)})}function ua(t,n,e,i,r,o){if(this.h=t,this.i=n,this.g=e,this.c=i,this.f=r,this.l=!!o,this.b=null,this.a=this.c,this.f<this.c)throw Error("Proactive refresh lower bound greater than upper bound!")}function ca(t,n){return n?(t.a=t.c,t.g()):(n=t.a,t.a*=2,t.a>t.f&&(t.a=t.f),n)}function ha(t,n){fa(t),t.b=gn(ca(t,n)).then(function(){return t.l?nt():yi()}).then(function(){return t.h()}).then(function(){ha(t,!0)}).s(function(n){t.i(n)&&ha(t,!1)})}function fa(t){t.b&&(t.b.cancel(),t.b=null)}function la(t){this.f=t,this.b=this.a=null,this.c=0}function pa(t,n){var e=n[Nh],i=n.refreshToken;n=da(n.expiresIn),t.b=e,t.c=n,t.a=i}function da(t){return uu()+1e3*parseInt(t,10)}function va(t,n){return Ir(t.f,n).then(function(n){return t.b=n.access_token,t.c=da(n.expires_in),t.a=n.refresh_token,{accessToken:t.b,expirationTime:t.c,refreshToken:t.a}}).s(function(n){throw"auth/user-token-expired"==n.code&&(t.a=null),n})}function ma(t,n){this.a=t||null,this.b=n||null,ki(this,{lastSignInTime:Ii(n||null),creationTime:Ii(t||null)})}function ga(t){return new ma(t.a,t.b)}function ba(t,n,e,i,r,o){ki(this,{uid:t,displayName:i||null,photoURL:r||null,email:e||null,phoneNumber:o||null,providerId:n})}function wa(t,n){Bt.call(this,t);for(var e in n)this[e]=n[e]}function ya(t,n,e){this.A=[],this.G=t.apiKey,this.o=t.appName,this.w=t.authDomain||null,t=iu.SDK_VERSION?ii(iu.SDK_VERSION):null,this.c=new mr(this.G,Vr(Lh),t),this.h=new la(this.c),Oa(this,n[Nh]),pa(this.h,n),Ti(this,"refreshToken",this.h.a),Ra(this,e||{}),fn.call(this),this.I=!1,this.w&&si()&&(this.a=Yo(this.w,this.G,this.o)),this.N=[],this.i=null,this.l=Ea(this),this.U=l(this.Ga,this);var i=this;this.ha=null,this.ra=function(t){i.na(t.h)},this.W=null,this.R=[],this.qa=function(t){Ta(i,t.f)},this.V=null}function Ia(t,n){t.W&&en(t.W,"languageCodeChanged",t.ra),(t.W=n)&&Zt(n,"languageCodeChanged",t.ra)}function Ta(t,n){t.R=n,br(t.c,iu.SDK_VERSION?ii(iu.SDK_VERSION,t.R):null)}function ka(t,n){t.V&&en(t.V,"frameworkChanged",t.qa),(t.V=n)&&Zt(n,"frameworkChanged",t.qa)}function Aa(t){try{return iu.app(t.o).auth()}catch(n){throw new Pi("internal-error","No firebase.auth.Auth instance is available for the Firebase App '"+t.o+"'!")}}function Ea(t){return new ua(function(){return t.F(!0)},function(t){return!(!t||"auth/network-request-failed"!=t.code)},function(){var n=t.h.c-uu()-3e5;return 0<n?n:0},3e4,96e4,!1)}function Na(t){t.m||t.l.b||(t.l.start(),en(t,"tokenChanged",t.U),Zt(t,"tokenChanged",t.U))}function Sa(t){en(t,"tokenChanged",t.U),fa(t.l)}function Oa(t,n){t.pa=n,Ti(t,"_lat",n)}function Pa(t,n){N(t.N,function(t){return t==n})}function Ca(t){for(var n=[],e=0;e<t.N.length;e++)n.push(t.N[e](t));return ot(n).then(function(){return t})}function _a(t){t.a&&!t.I&&(t.I=!0,t.a.subscribe(t))}function Ra(t,n){ki(t,{uid:n.uid,displayName:n.displayName||null,photoURL:n.photoURL||null,email:n.email||null,emailVerified:n.emailVerified||!1,phoneNumber:n.phoneNumber||null,isAnonymous:n.isAnonymous||!1,metadata:new ma(n.createdAt,n.lastLoginAt),providerData:[]})}function Da(){}function La(t){return nt().then(function(){if(t.m)throw new Pi("app-deleted")})}function xa(t){return yu(t.providerData,function(t){return t.providerId})}function ja(t,n){n&&(Ua(t,n.providerId),t.providerData.push(n))}function Ua(t,n){N(t.providerData,function(t){return t.providerId==n})}function Ma(t,n,e){("uid"!=n||e)&&t.hasOwnProperty(n)&&Ti(t,n,e)}function Va(t,n){t!=n&&(ki(t,{uid:n.uid,displayName:n.displayName,photoURL:n.photoURL,email:n.email,emailVerified:n.emailVerified,phoneNumber:n.phoneNumber,isAnonymous:n.isAnonymous,providerData:[]}),n.metadata?Ti(t,"metadata",ga(n.metadata)):Ti(t,"metadata",new ma),wu(n.providerData,function(n){ja(t,n)}),t.h=n.h,Ti(t,"refreshToken",t.h.a))}function Fa(t){return t.F().then(function(n){var e=t.isAnonymous;return qa(t,n).then(function(){return e||Ma(t,"isAnonymous",!1),n})})}function Ka(t,n){n[Nh]&&t.pa!=n[Nh]&&(pa(t.h,n),ln(t,new wa("tokenChanged")),Oa(t,n[Nh]),Ma(t,"refreshToken",t.h.a))}function qa(t,n){return Ur(t.c,Kh,{idToken:n}).then(l(t.gc,t))}function Xa(t){return(t=t.providerUserInfo)&&t.length?yu(t,function(t){return new ba(t.rawId,t.providerId,t.email,t.displayName,t.photoUrl,t.phoneNumber)}):[]}function Ba(t,n){return Fa(t).then(function(){if(A(xa(t),n))return Ca(t).then(function(){throw new Pi("provider-already-linked")})})}function Ha(t,n,e){var i=ur(n);return n=ji(n),Ai({user:t,credential:i,additionalUserInfo:n,operationType:e})}function Wa(t,n){return Ka(t,n),t.reload().then(function(){return t})}function Ga(t,n,e,i,r){if(!si())return et(new Pi("operation-not-supported-in-this-environment"));if(t.i&&!r)return et(t.i);var o=xi(e.providerId),a=di(t.uid+":::"),s=null;(!hi()||Qe())&&t.w&&e.isOAuthProvider&&(s=Zr(t.w,t.G,t.o,n,e,null,a,iu.SDK_VERSION||null));var u=ze(s,o&&o.za,o&&o.ya);return i=i().then(function(){if(Ja(t),!r)return t.F().then(function(){})}).then(function(){return zo(t.a,u,n,e,a,!!s)}).then(function(){return new Z(function(e,i){t.fa(n,null,new Pi("cancelled-popup-request"),t.g||null),t.f=e,t.v=i,t.g=a,t.b=t.a.Ca(t,n,u,a)})}).then(function(t){return u&&Ge(u),t?Ai(t):null}).s(function(t){throw u&&Ge(u),t}),Ya(t,i,r)}function za(t,n,e,i,r){if(!si())return et(new Pi("operation-not-supported-in-this-environment"));if(t.i&&!r)return et(t.i);var o=null,a=di(t.uid+":::");return i=i().then(function(){if(Ja(t),!r)return t.F().then(function(){})}).then(function(){return t.Z=a,Ca(t)}).then(function(n){return t.ca&&(n=t.ca,n=n.b.set(kf,t.B(),n.a)),n}).then(function(){return t.a.Aa(n,e,a)}).s(function(n){if(o=n,t.ca)return ns(t.ca);throw o}).then(function(){if(o)throw o}),Ya(t,i,r)}function Ja(t){if(!t.a||!t.I){if(t.a&&!t.I)throw new Pi("internal-error");throw new Pi("auth-domain-config-required")}}function Ya(t,n,e){var i=$a(t,n,e);return t.A.push(i),at(i,function(){E(t.A,i)}),i}function $a(t,n,e){return t.i&&!e?(n.cancel(),et(t.i)):n.s(function(n){throw!n||"auth/user-disabled"!=n.code&&"auth/user-token-expired"!=n.code||(t.i||ln(t,new wa("userInvalidated")),t.i=n),n})}function Za(t){if(!t.apiKey)return null;var n={apiKey:t.apiKey,authDomain:t.authDomain,appName:t.appName},e={};if(!(t.stsTokenManager&&t.stsTokenManager.accessToken&&t.stsTokenManager.expirationTime))return null;e[Nh]=t.stsTokenManager.accessToken,e.refreshToken=t.stsTokenManager.refreshToken||null,e.expiresIn=(t.stsTokenManager.expirationTime-uu())/1e3;var i=new ya(n,e,t);return t.providerData&&wu(t.providerData,function(t){t&&ja(i,Ai(t))}),t.redirectEventId&&(i.Z=t.redirectEventId),i}function Qa(t,n,e,i){var r=new ya(t,n);return e&&(r.ca=e),i&&Ta(r,i),r.reload().then(function(){return r})}function ts(t){this.a=t,this.b=wo()}function ns(t){return To(t.b,kf,t.a)}function es(t,n){return t.b.get(kf,t.a).then(function(t){return t&&n&&(t.authDomain=n),Za(t||{})})}function is(t,n){this.a=t,this.b=n||wo(),this.c=null,this.f=os(this),ko(this.b,as("local"),this.a,l(this.g,this))}function rs(t,n){var e,i=[];for(e in gf)gf[e]!==n&&i.push(To(t.b,as(gf[e]),t.a));return i.push(To(t.b,Af,t.a)),rt(i)}function os(t){var n=as("local"),e=as("session"),i=as("none");return t.b.get(e,t.a).then(function(r){return r?e:t.b.get(i,t.a).then(function(e){return e?i:t.b.get(n,t.a).then(function(e){return e?n:t.b.get(Af,t.a).then(function(t){return t?as(t):n})})})}).then(function(n){return t.c=n,rs(t,n.C)}).s(function(){t.c||(t.c=n)})}function as(t){return{name:"authUser",C:t}}function ss(t){return fs(t,function(){return t.b.set(Af,t.c.C,t.a)})}function us(t,n){return fs(t,function(){return t.b.set(t.c,n.B(),t.a)})}function cs(t){return fs(t,function(){return To(t.b,t.c,t.a)})}function hs(t,n){return fs(t,function(){return t.b.get(t.c,t.a).then(function(t){return t&&n&&(t.authDomain=n),Za(t||{})})})}function fs(t,n){return t.f=t.f.then(n,n),t.f}function ls(t){if(this.l=!1,Ti(this,"app",t),!As(this).options||!As(this).options.apiKey)throw new Pi("invalid-api-key");t=iu.SDK_VERSION?ii(iu.SDK_VERSION):null,this.c=new mr(As(this).options&&As(this).options.apiKey,Vr(Lh),t),this.N=[],this.m=[],this.I=[],this.Gb=iu.INTERNAL.createSubscribe(l(this.Xb,this)),this.R=void 0,this.Hb=iu.INTERNAL.createSubscribe(l(this.Yb,this)),ws(this,null),this.h=new is(As(this).options.apiKey+":"+As(this).name),this.G=new ts(As(this).options.apiKey+":"+As(this).name),this.U=Ps(this,Is(this)),this.i=Ps(this,Ts(this)),this.W=!1,this.ha=l(this.uc,this),this.Ga=l(this.ka,this),this.pa=l(this.Pb,this),this.qa=l(this.Vb,this),this.ra=l(this.Wb,this),gs(this),this.INTERNAL={},this.INTERNAL.delete=l(this.delete,this),this.INTERNAL.logFramework=l(this.cc,this),this.o=0,fn.call(this),vs(this),this.A=[]}function ps(t){Bt.call(this,"languageCodeChanged"),this.h=t}function ds(t){Bt.call(this,"frameworkChanged"),this.f=t}function vs(t){Object.defineProperty(t,"lc",{get:function(){return this.$()},set:function(t){this.na(t)},enumerable:!1}),t.V=null}function ms(t){return t.Fb||et(new Pi("auth-domain-config-required"))}function gs(t){var n=As(t).options.authDomain,e=As(t).options.apiKey;n&&si()&&(t.Fb=t.U.then(function(){if(!t.l){if(t.a=Yo(n,e,As(t).name),t.a.subscribe(t),Es(t)&&_a(Es(t)),t.w){_a(t.w);var i=t.w;i.na(t.$()),Ia(i,t),i=t.w,Ta(i,t.A),ka(i,t),t.w=null}return t.a}}))}function bs(t,n){var e={};return e.apiKey=As(t).options.apiKey,e.authDomain=As(t).options.authDomain,e.appName=As(t).name,t.U.then(function(){return Qa(e,n,t.G,t.Ka())}).then(function(n){return Es(t)&&n.uid==Es(t).uid?(Va(Es(t),n),t.ka(n)):(ws(t,n),_a(n),t.ka(n))}).then(function(){Ss(t)})}function ws(t,n){Es(t)&&(Pa(Es(t),t.Ga),en(Es(t),"tokenChanged",t.pa),en(Es(t),"userDeleted",t.qa),en(Es(t),"userInvalidated",t.ra),Sa(Es(t))),n&&(n.N.push(t.Ga),Zt(n,"tokenChanged",t.pa),Zt(n,"userDeleted",t.qa),Zt(n,"userInvalidated",t.ra),0<t.o&&Na(n)),Ti(t,"currentUser",n),n&&(n.na(t.$()),Ia(n,t),Ta(n,t.A),ka(n,t))}function ys(t){var n=es(t.G,As(t).options.authDomain).then(function(n){return(t.w=n)&&(n.ca=t.G),ns(t.G)});return Ps(t,n)}function Is(t){var n=As(t).options.authDomain,e=ys(t).then(function(){return hs(t.h,n)}).then(function(n){return n?(n.ca=t.G,t.w&&(t.w.Z||null)==(n.Z||null)?n:n.reload().then(function(){return us(t.h,n).then(function(){return n})}).s(function(e){return"auth/network-request-failed"==e.code?n:cs(t.h)})):null}).then(function(n){ws(t,n||null)});return Ps(t,e)}function Ts(t){return t.U.then(function(){return t.aa()}).s(function(){}).then(function(){if(!t.l)return t.ha()}).s(function(){}).then(function(){if(!t.l){t.W=!0;var n=t.h;ko(n.b,as("local"),n.a,t.ha)}})}function ks(t,n){var e=null,i=null;return Ps(t,n.then(function(n){return e=ur(n),i=ji(n),bs(t,n)}).then(function(){return Ai({user:Es(t),credential:e,additionalUserInfo:i,operationType:"signIn"})}))}function As(t){return t.app}function Es(t){return t.currentUser}function Ns(t){return Es(t)&&Es(t)._lat||null}function Ss(t){if(t.W){for(var n=0;n<t.m.length;n++)t.m[n]&&t.m[n](Ns(t));if(t.R!==t.getUid()&&t.I.length)for(t.R=t.getUid(),n=0;n<t.I.length;n++)t.I[n]&&t.I[n](Ns(t))}}function Os(t,n){t.I.push(n),Ps(t,t.i.then(function(){!t.l&&A(t.I,n)&&t.R!==t.getUid()&&(t.R=t.getUid(),n(Ns(t)))}))}function Ps(t,n){return t.N.push(n),at(n,function(){E(t.N,n)}),n}function Cs(t,n,e,i){t:{e=Array.prototype.slice.call(e);for(var r=0,o=!1,a=0;a<n.length;a++)if(n[a].optional)o=!0;else{if(o)throw new Pi("internal-error","Argument validator encountered a required argument after an optional argument.");r++}if(o=n.length,e.length<r||o<e.length)i="Expected "+(r==o?1==r?"1 argument":r+" arguments":r+"-"+o+" arguments")+" but got "+e.length+".";else{for(r=0;r<e.length;r++)if(o=n[r].optional&&void 0===e[r],!n[r].M(e[r])&&!o){if(n=n[r],0>r||r>=Ef.length)throw new Pi("internal-error","Argument validator received an unsupported number of arguments.");e=Ef[r],i=(i?"":e+" argument ")+(n.name?'"'+n.name+'" ':"")+"must be "+n.K+".";break t}i=null}}if(i)throw new Pi("argument-error",t+" failed: "+i)}function _s(n,e){return{name:n||"",K:"a valid string",optional:!!e,M:t}}function Rs(){return{name:"opt_forceRefresh",K:"a boolean",optional:!0,M:n}}function Ds(t,n){return{name:t||"",K:"a valid object",optional:!!n,M:c}}function Ls(t,n){return{name:t||"",K:"a function",optional:!!n,M:u}}function xs(t,n){return{name:t||"",K:"null",optional:!!n,M:o}}function js(){return{name:"",K:"an HTML element",optional:!1,M:function(t){return!!(t&&t instanceof Element)}}}function Us(){return{name:"auth",K:"an instance of Firebase Auth",optional:!0,M:function(t){return!!(t&&t instanceof ls)}}}function Ms(){return{name:"app",K:"an instance of Firebase App",optional:!0,M:function(t){return!!(t&&t instanceof iu.app.App)}}}function Vs(t){return{name:t?t+"Credential":"credential",K:t?"a valid "+t+" credential":"a valid credential",optional:!1,M:function(n){if(!n)return!1;var e=!t||n.providerId===t;return!(!n.wa||!e)}}}function Fs(){return{name:"authProvider",K:"a valid Auth provider",optional:!1,M:function(t){return!!(t&&t.providerId&&t.hasOwnProperty&&t.hasOwnProperty("isOAuthProvider"))}}}function Ks(){return{name:"applicationVerifier",K:"an implementation of firebase.auth.ApplicationVerifier",optional:!1,M:function(n){return!!(n&&t(n.type)&&u(n.verify))}}}function qs(t,n,e,i){return{name:e||"",K:t.K+" or "+n.K,optional:!!i,M:function(e){return t.M(e)||n.M(e)}}}function Xs(t,n,e,i,r,o){if(Ti(this,"type","recaptcha"),this.b=this.c=null,this.m=!1,this.l=n,this.a=e||{theme:"light",type:"image"},this.g=[],this.a[Of])throw new Pi("argument-error","sitekey should not be provided for reCAPTCHA as one is automatically provisioned for the current project.");if(this.h="invisible"===this.a[Pf],!Dt(n)||!this.h&&Dt(n).hasChildNodes())throw new Pi("argument-error","reCAPTCHA container is either not found or already contains inner elements!");this.u=new mr(t,o||null,r||null),this.o=i||function(){return null};var a=this;this.i=[];var s=this.a[Nf];this.a[Nf]=function(t){if(Bs(a,t),"function"==typeof s)s(t);else if("string"==typeof s){var n=oi(s,ou);"function"==typeof n&&n(t)}};var u=this.a[Sf];this.a[Sf]=function(){if(Bs(a,null),"function"==typeof u)u();else if("string"==typeof u){var t=oi(u,ou);"function"==typeof t&&t()}}}function Bs(t,n){for(var e=0;e<t.i.length;e++)try{t.i[e](n)}catch(t){}}function Hs(t,n){N(t.i,function(t){return t==n})}function Ws(t,n){return t.g.push(n),at(n,function(){E(t.g,n)}),n}function Gs(t){if(t.m)throw new Pi("internal-error","RecaptchaVerifier instance has been destroyed.")}function zs(){this.b=ou.grecaptcha?1/0:0,this.c=null,this.a="__rcb"+Math.floor(1e6*Math.random())}function Js(t,n){return new Z(function(e,i){if(gi())if(!ou.grecaptcha||n!==t.c&&!t.b){ou[t.a]=function(){if(ou.grecaptcha){t.c=n;var r=ou.grecaptcha.render;ou.grecaptcha.render=function(n,e){return n=r(n,e),t.b++,n},e()}else i(new Pi("internal-error"));delete ou[t.a]};var r=At(Cf,{onload:t.a,hl:n||""});nt(De(r)).s(function(){i(new Pi("internal-error","Unable to load external reCAPTCHA dependencies!"))})}else e();else i(new Pi("network-request-failed"))})}function Ys(){return _f||(_f=new zs),_f}function $s(t,n,e){try{this.f=e||iu.app()}catch(t){throw new Pi("argument-error","No firebase.app.App instance is currently initialized.")}if(!this.f.options||!this.f.options.apiKey)throw new Pi("invalid-api-key");e=this.f.options.apiKey;var i=this,r=null;try{r=this.f.auth().Ka()}catch(t){}r=iu.SDK_VERSION?ii(iu.SDK_VERSION,r):null,Xs.call(this,e,t,n,function(){try{var t=i.f.auth().$()}catch(n){t=null}return t},r,Vr(Lh))}function Zs(t,n){for(var e in n){var i=n[e].name;t[i]=tu(i,t[e],n[e].j)}}function Qs(t,n,e,i){t[n]=tu(n,e,i)}function tu(t,n,e){function i(){var t=Array.prototype.slice.call(arguments);return Cs(o,e,t),n.apply(this,t)}if(!e)return n;var r,o=nu(t);for(r in n)i[r]=n[r];for(r in n.prototype)i.prototype[r]=n.prototype[r];return i}function nu(t){return t=t.split("."),t[t.length-1]}var eu,iu=e(6).default,ru=ru||{},ou=this,au="closure_uid_"+(1e9*Math.random()>>>0),su=0,uu=Date.now||function(){return+new Date};d(v,Error),v.prototype.name="CustomError";var cu=String.prototype.trim?function(t){return t.trim()}:function(t){return t.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")},hu=/&/g,fu=/</g,lu=/>/g,pu=/"/g,du=/'/g,vu=/\x00/g,mu=/[\x00&<>"']/;d(y,v),y.prototype.name="AssertionError";var gu,bu=Array.prototype.indexOf?function(t,n,e){return Array.prototype.indexOf.call(t,n,e)}:function(n,e,i){if(i=null==i?0:0>i?Math.max(0,n.length+i):i,t(n))return t(e)&&1==e.length?n.indexOf(e,i):-1;for(;i<n.length;i++)if(i in n&&n[i]===e)return i;return-1},wu=Array.prototype.forEach?function(t,n,e){Array.prototype.forEach.call(t,n,e)}:function(n,e,i){for(var r=n.length,o=t(n)?n.split(""):n,a=0;a<r;a++)a in o&&e.call(i,o[a],a,n)},yu=Array.prototype.map?function(t,n,e){return Array.prototype.map.call(t,n,e)}:function(n,e,i){for(var r=n.length,o=Array(r),a=t(n)?n.split(""):n,s=0;s<r;s++)s in a&&(o[s]=e.call(i,a[s],s,n));return o},Iu=Array.prototype.some?function(t,n,e){return Array.prototype.some.call(t,n,e)}:function(n,e,i){for(var r=n.length,o=t(n)?n.split(""):n,a=0;a<r;a++)if(a in o&&e.call(i,o[a],a,n))return!0;return!1};t:{var Tu=ou.navigator;if(Tu){var ku=Tu.userAgent;if(ku){gu=ku;break t}}gu=""}var Au="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");U[" "]=i;var Eu,Nu=P("Opera"),Su=P("Trident")||P("MSIE"),Ou=P("Edge"),Pu=Ou||Su,Cu=P("Gecko")&&!(b(gu.toLowerCase(),"webkit")&&!P("Edge"))&&!(P("Trident")||P("MSIE"))&&!P("Edge"),_u=b(gu.toLowerCase(),"webkit")&&!P("Edge");t:{var Ru="",Du=function(){var t=gu;return Cu?/rv\:([^\);]+)(\)|;)/.exec(t):Ou?/Edge\/([\d\.]+)/.exec(t):Su?/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(t):_u?/WebKit\/(\S+)/.exec(t):Nu?/(?:Version)[ \/]?(\S+)/.exec(t):void 0}();if(Du&&(Ru=Du?Du[1]:""),Su){var Lu=V();if(null!=Lu&&Lu>parseFloat(Ru)){Eu=Lu+"";break t}}Eu=Ru}var xu,ju={},Uu=ou.document;xu=Uu&&Su?V()||("CSS1Compat"==Uu.compatMode?parseInt(Eu,10):5):void 0,X.prototype.get=function(){if(0<this.b){this.b--;var t=this.a;this.a=t.next,t.next=null}else t=this.c();return t};var Mu=new X(function(){return new W},function(t){t.reset()},100);W.prototype.set=function(t,n){this.a=t,this.b=n,this.next=null},W.prototype.reset=function(){this.next=this.b=this.a=null};var Vu,Fu,Ku=!1,qu=new function(){this.b=this.a=null},Xu=0,Bu=2,Hu=3;Q.prototype.reset=function(){this.f=this.b=this.g=this.a=null,this.c=!1};var Wu=new X(function(){return new Q},function(t){t.reset()},100);Z.prototype.then=function(t,n,e){return ct(this,u(t)?t:null,u(n)?n:null,e)},K(Z),eu=Z.prototype,eu.s=function(t,n){return ct(this,null,t,n)},eu.cancel=function(t){this.a==Xu&&J(function(){st(this,new bt(t))},this)},eu.wc=function(t){this.a=Xu,ht(this,Bu,t)},eu.xc=function(t){this.a=Xu,ht(this,Hu,t)},eu.Mb=function(){for(var t;t=dt(this);)vt(this,t,this.a,this.i);this.h=!1};var Gu=G;d(bt,v),bt.prototype.name="cancel";var zu=!Su||9<=+xu;wt.prototype.la=!0,wt.prototype.ja=function(){return this.a},wt.prototype.toString=function(){return"Const{"+this.a+"}"};var Ju={};It(""),Tt.prototype.la=!0,Tt.prototype.ja=function(){return this.a},Tt.prototype.toString=function(){return"TrustedResourceUrl{"+this.a+"}"};var Yu=/%{(\w+)}/g,$u=/^(?:https:)?\/\/[0-9a-z.:[\]-]+\/|^\/[^\/\\]|^about:blank(#|$)/i,Zu={};Nt.prototype.la=!0,Nt.prototype.ja=function(){return this.a},Nt.prototype.toString=function(){return"SafeUrl{"+this.a+"}"};var Qu=/^(?:(?:https?|mailto|ftp):|[^:\/?#]*(?:[\/?#]|$))/i,tc={};Pt("about:blank"),Ct.prototype.la=!0,Ct.prototype.ja=function(){return this.a},Ct.prototype.toString=function(){return"SafeHtml{"+this.a+"}"};var nc={};Rt("<!DOCTYPE html>"),Rt(""),Rt("<br>");var ec={cellpadding:"cellPadding",cellspacing:"cellSpacing",colspan:"colSpan",frameborder:"frameBorder",height:"height",maxlength:"maxLength",nonce:"nonce",role:"role",rowspan:"rowSpan",type:"type",usemap:"useMap",valign:"vAlign",width:"width"},ic={'"':'\\"',"\\":"\\\\","/":"\\/","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\v":"\\u000b"},rc=/\uffff/.test("￿")?/[\\\"\x00-\x1f\x7f-\uffff]/g:/[\\\"\x00-\x1f\x7f-\xff]/g,oc=0,ac={};qt.prototype.oa=!1,qt.prototype.ta=function(){if(this.Fa)for(;this.Fa.length;)this.Fa.shift()()};var sc=Object.freeze||function(t){return t},uc=!Su||9<=+xu,cc=Su&&!F("9"),hc=function(){if(!ou.addEventListener||!Object.defineProperty)return!1;var t=!1,n=Object.defineProperty({},"passive",{get:function(){t=!0}});return ou.addEventListener("test",i,n),ou.removeEventListener("test",i,n),t}();Bt.prototype.c=function(){this.Ab=!1},d(Ht,Bt);var fc=sc({2:"touch",3:"pen",4:"mouse"});Ht.prototype.c=function(){Ht.ib.c.call(this);var t=this.a;if(t.preventDefault)t.preventDefault();else if(t.returnValue=!1,cc)try{(t.ctrlKey||112<=t.keyCode&&123>=t.keyCode)&&(t.keyCode=-1)}catch(t){}},Ht.prototype.g=function(){return this.a};var lc="closure_listenable_"+(1e6*Math.random()|0),pc=0,dc="closure_lm_"+(1e6*Math.random()|0),vc={},mc=0,gc="__closure_events_fn_"+(1e9*Math.random()>>>0);d(fn,qt),fn.prototype[lc]=!0,fn.prototype.removeEventListener=function(t,n,e,i){en(this,t,n,e,i)},fn.prototype.ta=function(){if(fn.ib.ta.call(this),this.u){var t,n=this.u,e=0;for(t in n.a){for(var i=n.a[t],r=0;r<i.length;r++)++e,Gt(i[r]);delete n.a[t],n.b--}}this.Ra=null},bn.prototype.a=null;var bc=0;bn.prototype.reset=function(t,n,e,i,r){"number"==typeof r||bc++,i||uu(),this.b=n,delete this.a},yn.prototype.toString=function(){return this.name};var wc=new yn("SEVERE",1e3),yc=new yn("CONFIG",700),Ic=new yn("FINE",500);wn.prototype.log=function(t,n,e){if(t.value>=In(this).value)for(u(n)&&(n=n()),t=new bn(t,n+"",this.f),e&&(t.a=e),e="log:"+t.b,(t=ou.console)&&t.timeStamp&&t.timeStamp(e),(t=ou.msWriteProfilerMark)&&t(e),e=this;e;)e=e.a};var Tc={},kc=null;eu=kn.prototype,eu.P=function(){An(this);for(var t=[],n=0;n<this.a.length;n++)t.push(this.b[this.a[n]]);return t},eu.S=function(){return An(this),this.a.concat()},eu.clear=function(){this.b={},this.c=this.a.length=0},eu.get=function(t,n){return En(this.b,t)?this.b[t]:n},eu.set=function(t,n){En(this.b,t)||(this.c++,this.a.push(t)),this.b[t]=n},eu.forEach=function(t,n){for(var e=this.S(),i=0;i<e.length;i++){var r=e[i],o=this.get(r);t.call(n,o,r,this)}};var Ac=null,Ec=null;_n.prototype.cancel=function(t){if(this.a)this.c instanceof _n&&this.c.cancel();else{if(this.b){var n=this.b;delete this.b,t?n.cancel(t):0>=--n.l&&n.cancel()}this.v?this.v.call(this.o,this):this.u=!0,this.a||(t=new Vn,Dn(this),Rn(this,!1,t))}},_n.prototype.m=function(t,n){this.i=!1,Rn(this,t,n)},_n.prototype.A=function(t){Dn(this),Rn(this,!0,t)},_n.prototype.then=function(t,n,e){var i,r,o=new Z(function(t,n){i=t,r=n});return xn(this,i,function(t){t instanceof Vn?o.cancel():r(t)}),o.then(t,n,e)},K(_n),d(Mn,v),Mn.prototype.message="Deferred has already fired",Mn.prototype.name="AlreadyCalledError",d(Vn,v),Vn.prototype.message="Deferred was canceled",Vn.prototype.name="CanceledError",Fn.prototype.c=function(){throw delete Sc[this.a],this.b};var Nc,Sc={};d(qn,Kn);for(var Oc=64,Pc=Oc-1,Cc=[],_c=0;_c<Pc;_c++)Cc[_c]=0;var Rc=S(128,Cc);qn.prototype.reset=function(){this.g=this.c=0,this.a=ou.Int32Array?new Int32Array(this.h):O(this.h)};var Dc=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];d(Hn,qn);var Lc=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],xc=/^(?:([^:\/?#.]+):)?(?:\/\/(?:([^\/?#]*)@)?([^\/#?]*?)(?::([0-9]+))?(?=[\/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;Yn.prototype.toString=function(){var t=[],n=this.c;n&&t.push(oe(n,jc,!0),":");var e=this.b;return(e||"file"==n)&&(t.push("//"),(n=this.l)&&t.push(oe(n,jc,!0),"@"),t.push(encodeURIComponent(e+"").replace(/%25([0-9a-fA-F]{2})/g,"%$1")),null!=(e=this.i)&&t.push(":",e+"")),(e=this.g)&&(this.b&&"/"!=e.charAt(0)&&t.push("/"),t.push(oe(e,"/"==e.charAt(0)?Mc:Uc,!0))),(e=""+this.a)&&t.push("?",e),(e=this.h)&&t.push("#",oe(e,Fc)),t.join("")};var jc=/[#\/\?@]/g,Uc=/[\#\?:]/g,Mc=/[\#\?]/g,Vc=/[\#\?@]/g,Fc=/#/g;eu=se.prototype,eu.clear=function(){this.a=this.c=null,this.b=0},eu.forEach=function(t,n){ue(this),this.a.forEach(function(e,i){wu(e,function(e){t.call(n,e,i,this)},this)},this)},eu.S=function(){ue(this);for(var t=this.a.P(),n=this.a.S(),e=[],i=0;i<n.length;i++)for(var r=t[i],o=0;o<r.length;o++)e.push(n[i]);return e},eu.P=function(n){ue(this);var e=[];if(t(n))le(this,n)&&(e=S(e,this.a.get(de(this,n))));else{n=this.a.P();for(var i=0;i<n.length;i++)e=S(e,n[i])}return e},eu.set=function(t,n){return ue(this),this.c=null,t=de(this,t),le(this,t)&&(this.b-=this.a.get(t).length),this.a.set(t,[n]),this.b+=1,this},eu.get=function(t,n){return t=t?this.P(t):[],0<t.length?t[0]+"":n},eu.toString=function(){if(this.c)return this.c;if(!this.a)return"";for(var t=[],n=this.a.S(),e=0;e<n.length;e++){var i=n[e],r=encodeURIComponent(i+"");i=this.P(i);for(var o=0;o<i.length;o++){var a=r;""!==i[o]&&(a+="="+encodeURIComponent(i[o]+"")),t.push(a)}}return this.c=t.join("&")},me.prototype.c=null;var Kc;d(be,me),be.prototype.a=function(){var t=we(this);return t?new ActiveXObject(t):new XMLHttpRequest},be.prototype.b=function(){var t={};return we(this)&&(t[0]=!0,t[1]=!0),t},Kc=new be,d(ye,fn);var qc="",Xc=ye.prototype,Bc=Tn("goog.net.XhrIo");Xc.J=Bc;var Hc=/^https?$/i,Wc=["POST","PUT"];eu=ye.prototype,eu.Ea=function(){void 0!==ru&&this.a&&(this.g="Timed out after "+this.f+"ms, aborting",Nn(this.J,Re(this,this.g)),ln(this,"timeout"),this.abort(8))},eu.abort=function(){this.a&&this.b&&(Nn(this.J,Re(this,"Aborting")),this.b=!1,this.c=!0,this.a.abort(),this.c=!1,ln(this,"complete"),ln(this,"abort"),Se(this))},eu.ta=function(){this.a&&(this.b&&(this.b=!1,this.c=!0,this.a.abort(),this.c=!1),Se(this,!0)),ye.ib.ta.call(this)},eu.zb=function(){this.oa||(this.G||this.h||this.c?Ne(this):this.fc())},eu.fc=function(){Ne(this)},eu.getResponse=function(){try{if(!this.a)return null;if("response"in this.a)return this.a.response;switch(this.l){case qc:case"text":return this.a.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in this.a)return this.a.mozResponseArrayBuffer}var t=this.J;return t&&t.log(wc,"Response type "+this.l+" is not supported on this browser",void 0),null}catch(t){return Nn(this.J,"Can not get response: "+t.message),null}};var Gc=/^[+a-zA-Z0-9_.!#$%&'*\/=?^`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,63}$/,zc=0,Jc=1;d(Ue,v),d(Me,me),Me.prototype.a=function(){var t=new XMLHttpRequest;if("withCredentials"in t)return t;if("undefined"!=typeof XDomainRequest)return new Ve;throw Error("Unsupported browser")},Me.prototype.b=function(){return{}},eu=Ve.prototype,eu.open=function(t,n,e){if(null!=e&&!e)throw Error("Only async requests are supported.");this.a.open(t,n)},eu.send=function(t){if(t){if("string"!=typeof t)throw Error("Only string data is supported");this.a.send(t)}else this.a.send()},eu.abort=function(){this.a.abort()},eu.setRequestHeader=function(){},eu.getResponseHeader=function(t){return"content-type"==t.toLowerCase()?this.a.contentType:""},eu.Sb=function(){this.status=200,this.responseText=this.a.responseText,Fe(this,4)},eu.wb=function(){this.status=500,this.responseText="",Fe(this,4)},eu.Ub=function(){this.wb()},eu.Tb=function(){this.status=200,Fe(this,1)},eu.getAllResponseHeaders=function(){return"content-type: "+this.a.contentType};var Yc=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,$c="Firefox",Zc="Chrome",Qc={Cc:"FirebaseCore-web",Ec:"FirebaseUI-web"};bi.prototype.get=function(){return this.a?this.b:this.c};var th,nh={};try{var eh={};Object.defineProperty(eh,"abcd",{configurable:!0,enumerable:!0,value:1}),Object.defineProperty(eh,"abcd",{configurable:!0,enumerable:!0,value:2}),th=2==eh.abcd}catch(t){th=!1}var ih="email",rh="newEmail",oh="requestType",ah="email",sh="fromEmail",uh="data",ch="operation";d(Pi,Error),Pi.prototype.B=function(){return{code:this.code,message:this.message}},Pi.prototype.toJSON=function(){return this.B()};var hh="auth/",fh={"argument-error":"","app-not-authorized":"This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.","app-not-installed":"The requested mobile application corresponding to the identifier (Android package name or iOS bundle ID) provided is not installed on this device.","captcha-check-failed":"The reCAPTCHA response token provided is either invalid, expired, already used or the domain associated with it does not match the list of whitelisted domains.","code-expired":"The SMS code has expired. Please re-send the verification code to try again.","cordova-not-ready":"Cordova framework is not ready.","cors-unsupported":"This browser is not supported.","credential-already-in-use":"This credential is already associated with a different user account.","custom-token-mismatch":"The custom token corresponds to a different audience.","requires-recent-login":"This operation is sensitive and requires recent authentication. Log in again before retrying this request.","dynamic-link-not-activated":"Please activate Dynamic Links in the Firebase Console and agree to the terms and conditions.","email-already-in-use":"The email address is already in use by another account.","expired-action-code":"The action code has expired. ","cancelled-popup-request":"This operation has been cancelled due to another conflicting popup being opened.","internal-error":"An internal error has occurred.","invalid-app-credential":"The phone verification request contains an invalid application verifier. The reCAPTCHA token response is either invalid or expired.","invalid-app-id":"The mobile app identifier is not registed for the current project.","invalid-user-token":"The user's credential is no longer valid. The user must sign in again.","invalid-auth-event":"An internal error has occurred.","invalid-verification-code":"The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure use the verification code provided by the user.","invalid-continue-uri":"The continue URL provided in the request is invalid.","invalid-cordova-configuration":"The following Cordova plugins must be installed to enable OAuth sign-in: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser and cordova-plugin-customurlscheme.","invalid-custom-token":"The custom token format is incorrect. Please check the documentation.","invalid-email":"The email address is badly formatted.","invalid-api-key":"Your API key is invalid, please check you have copied it correctly.","invalid-cert-hash":"The SHA-1 certificate hash provided is invalid.","invalid-credential":"The supplied auth credential is malformed or has expired.","invalid-persistence-type":"The specified persistence type is invalid. It can only be local, session or none.","invalid-message-payload":"The email template corresponding to this action contains invalid characters in its message. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-oauth-provider":"EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.","invalid-oauth-client-id":"The OAuth client ID provided is either invalid or does not match the specified API key.","unauthorized-domain":"This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.","invalid-action-code":"The action code is invalid. This can happen if the code is malformed, expired, or has already been used.","wrong-password":"The password is invalid or the user does not have a password.","invalid-phone-number":"The format of the phone number provided is incorrect. Please enter the phone number in a format that can be parsed into E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number including area code].","invalid-recipient-email":"The email corresponding to this action failed to send as the provided recipient email address is invalid.","invalid-sender":"The email template corresponding to this action contains an invalid sender email or name. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-verification-id":"The verification ID used to create the phone auth credential is invalid.","missing-android-pkg-name":"An Android Package Name must be provided if the Android App is required to be installed.","auth-domain-config-required":"Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.","missing-app-credential":"The phone verification request is missing an application verifier assertion. A reCAPTCHA response token needs to be provided.","missing-verification-code":"The phone auth credential was created with an empty SMS verification code.","missing-continue-uri":"A continue URL must be provided in the request.","missing-iframe-start":"An internal error has occurred.","missing-ios-bundle-id":"An iOS Bundle ID must be provided if an App Store ID is provided.","missing-phone-number":"To send verification codes, provide a phone number for the recipient.","missing-verification-id":"The phone auth credential was created with an empty verification ID.","app-deleted":"This instance of FirebaseApp has been deleted.","account-exists-with-different-credential":"An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.","network-request-failed":"A network error (such as timeout, interrupted connection or unreachable host) has occurred.","no-auth-event":"An internal error has occurred.","no-such-provider":"User was not linked to an account with the given provider.","operation-not-allowed":"The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.","operation-not-supported-in-this-environment":'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.',"popup-blocked":"Unable to establish a connection with the popup. It may have been blocked by the browser.","popup-closed-by-user":"The popup has been closed by the user before finalizing the operation.","provider-already-linked":"User can only be linked to one identity for the given provider.","quota-exceeded":"The project's quota for this operation has been exceeded.","redirect-cancelled-by-user":"The redirect operation has been cancelled by the user before finalizing.","redirect-operation-pending":"A redirect sign-in operation is already pending.",timeout:"The operation has timed out.","user-token-expired":"The user's credential is no longer valid. The user must sign in again.","too-many-requests":"We have blocked all requests from this device due to unusual activity. Try again later.","unauthorized-continue-uri":"The domain of the continue URL is not whitelisted.  Please whitelist the domain in the Firebase console.","unsupported-persistence-type":"The current environment does not support the specified persistence type.","user-cancelled":"User did not grant your application the permissions it requested.","user-not-found":"There is no user record corresponding to this identifier. The user may have been deleted.","user-disabled":"The user account has been disabled by an administrator.","user-mismatch":"The supplied credentials do not correspond to the previously signed in user.","user-signed-out":"","weak-password":"The password must be 6 characters long or more.","web-storage-unsupported":"This browser is not supported or 3rd party cookies and data may be disabled."},lh="android",ph="handleCodeInApp",dh="iOS",vh="url",mh="installApp",gh="minimumVersion",bh="packageName",wh="bundleId",yh="oauth_consumer_key oauth_nonce oauth_signature oauth_signature_method oauth_timestamp oauth_token oauth_version".split(" "),Ih=["client_id","response_type","scope","redirect_uri","state"],Th={Dc:{Ma:"locale",za:500,ya:600,Na:"facebook.com",$a:Ih},Fc:{Ma:null,za:500,ya:620,Na:"github.com",$a:Ih},Gc:{Ma:"hl",za:515,ya:680,Na:"google.com",$a:Ih},Mc:{Ma:"lang",za:485,ya:705,Na:"twitter.com",$a:yh}},kh="idToken",Ah="providerId";d(Mi,Ui),d(Vi,Mi),d(Fi,Mi),d(Ki,Mi),d(qi,Mi),Bi.prototype.wa=function(t){return Dr(t,Hi(this))},Bi.prototype.b=function(t,n){var e=Hi(this);return e.idToken=n,Lr(t,e)},Bi.prototype.c=function(t,n){return Xi(xr(t,Hi(this)),n)},Bi.prototype.B=function(){var t={providerId:this.providerId};return this.idToken&&(t.oauthIdToken=this.idToken),this.accessToken&&(t.oauthAccessToken=this.accessToken),this.secret&&(t.oauthTokenSecret=this.secret),t},Wi.prototype.Ba=function(t){return this.qb=x(t),this},d(Gi,Wi),Gi.prototype.sa=function(t){return A(this.a,t)||this.a.push(t),this},Gi.prototype.vb=function(){return O(this.a)},Gi.prototype.credential=function(t,n){if(!t&&!n)throw new Pi("argument-error","credential failed: must provide the ID token and/or the access token.");return new Bi(this.providerId,{idToken:t||null,accessToken:n||null})},d(zi,Gi),Ti(zi,"PROVIDER_ID","facebook.com"),d(Yi,Gi),Ti(Yi,"PROVIDER_ID","github.com"),d(Zi,Gi),Ti(Zi,"PROVIDER_ID","google.com"),d(tr,Wi),Ti(tr,"PROVIDER_ID","twitter.com"),er.prototype.wa=function(t){return Ur(t,nf,{email:this.a,password:this.f})},er.prototype.b=function(t,n){return Ur(t,Jh,{idToken:n,email:this.a,password:this.f})},er.prototype.c=function(t,n){return Xi(this.wa(t),n)},er.prototype.B=function(){return{email:this.a,password:this.f}},ki(ir,{PROVIDER_ID:"password"}),rr.prototype.wa=function(t){return t.Qa(or(this))},rr.prototype.b=function(t,n){var e=or(this);return e.idToken=n,Ur(t,rf,e)},rr.prototype.c=function(t,n){var e=or(this);return e.operation="REAUTH",t=Ur(t,of,e),Xi(t,n)},rr.prototype.B=function(){var t={providerId:"phone"};return this.a.Pa&&(t.verificationId=this.a.Pa),this.a.Oa&&(t.verificationCode=this.a.Oa),this.a.Da&&(t.temporaryProof=this.a.Da),this.a.Y&&(t.phoneNumber=this.a.Y),t},ar.prototype.Qa=function(n,e){var i=this.a.c;return nt(e.verify()).then(function(r){if(!t(r))throw new Pi("argument-error","An implementation of firebase.auth.ApplicationVerifier.prototype.verify() must return a firebase.Promise that resolves with a string.");switch(e.type){case"recaptcha":return Pr(i,{phoneNumber:n,recaptchaToken:r}).then(function(t){return"function"==typeof e.reset&&e.reset(),t},function(t){throw"function"==typeof e.reset&&e.reset(),t});default:throw new Pi("argument-error",'Only firebase.auth.ApplicationVerifiers with type="recaptcha" are currently supported.')}})},ki(ar,{PROVIDER_ID:"phone"}),hr.prototype.B=function(){return{type:this.b,eventId:this.c,urlResponse:this.f,sessionId:this.g,error:this.a&&this.a.B()}},d(lr,Pi),d(pr,Pi),pr.prototype.B=function(){var t={code:this.code,message:this.message};this.email&&(t.email=this.email),this.phoneNumber&&(t.phoneNumber=this.phoneNumber);var n=this.credential&&this.credential.B();return n&&j(t,n),t},pr.prototype.toJSON=function(){return this.B()},d(vr,me),vr.prototype.a=function(){return new this.f},vr.prototype.b=function(){return{}};var Eh,Nh="idToken",Sh=new bi(3e4,6e4),Oh={"Content-Type":"application/x-www-form-urlencoded"},Ph=new bi(3e4,6e4),Ch={"Content-Type":"application/json"};mr.prototype.m=function(t,n,e,i,r,o){var a="Node"==ti(),s=ni()?a?new ye(this.o):new ye:new ye(this.f);if(o){s.f=Math.max(0,o);var u=setTimeout(function(){ln(s,"timeout")},o)}pn(s,"complete",function(){u&&clearTimeout(u);var t=null;try{t=JSON.parse(_e(this))||null}catch(n){t=null}n&&n(t)}),dn(s,"ready",function(){u&&clearTimeout(u),Xt(this)}),dn(s,"timeout",function(){u&&clearTimeout(u),Xt(this),n&&n(null)}),Ie(s,t,e,i,r)};var _h=It("https://apis.google.com/js/client.js?onload=%{onload}"),Rh="__fcb"+Math.floor(1e6*Math.random());mr.prototype.u=function(t,n,e,i,r){var o=this;Eh.then(function(){window.gapi.client.setApiKey(o.b);var a=window.gapi.auth.getToken();window.gapi.auth.setToken(null),window.gapi.client.request({path:t,method:e,body:i,headers:r,authType:"none",callback:function(t){window.gapi.auth.setToken(a),n&&n(t)}})}).s(function(t){n&&n({error:{message:t&&t.message||"CORS_UNSUPPORTED"}})})},mr.prototype.gb=function(){return Ur(this,Yh,{})},mr.prototype.kb=function(t,n){return Ur(this,zh,{idToken:t,email:n})},mr.prototype.lb=function(t,n){return Ur(this,Jh,{idToken:t,password:n})};var Dh={displayName:"DISPLAY_NAME",photoUrl:"PHOTO_URL"};eu=mr.prototype,eu.mb=function(t,n){var e={idToken:t},i=[];return C(Dh,function(t,r){var o=n[r];null===o?i.push(t):r in n&&(e[r]=o)}),i.length&&(e.deleteAttribute=i),Ur(this,zh,e)},eu.cb=function(t,n){return t={requestType:"PASSWORD_RESET",email:t},j(t,n),Ur(this,Xh,t)},eu.bb=function(t,n){return t={requestType:"VERIFY_EMAIL",idToken:t},j(t,n),Ur(this,qh,t)},eu.Qa=function(t){return Ur(this,ef,t)},eu.Ta=function(t,n){return Ur(this,Wh,{oobCode:t,newPassword:n})},eu.Ia=function(t){return Ur(this,jh,{oobCode:t})},eu.Sa=function(t){return Ur(this,xh,{oobCode:t})};var Lh,xh={endpoint:"setAccountInfo",D:jr,ga:"email"},jh={endpoint:"resetPassword",D:jr,O:function(t){if(!t.email||!t.requestType)throw new Pi("internal-error")}},Uh={endpoint:"signupNewUser",D:function(t){if(kr(t),!t.password)throw new Pi("weak-password")},O:Sr,T:!0},Mh={endpoint:"createAuthUri"},Vh={endpoint:"deleteAccount",ea:["idToken"]},Fh={endpoint:"setAccountInfo",ea:["idToken","deleteProvider"],D:function(t){if(!a(t.deleteProvider))throw new Pi("internal-error")}},Kh={endpoint:"getAccountInfo"},qh={endpoint:"getOobConfirmationCode",ea:["idToken","requestType"],D:function(t){if("VERIFY_EMAIL"!=t.requestType)throw new Pi("internal-error")},ga:"email"},Xh={endpoint:"getOobConfirmationCode",ea:["requestType"],D:function(t){if("PASSWORD_RESET"!=t.requestType)throw new Pi("internal-error");kr(t)},ga:"email"},Bh={nb:!0,endpoint:"getProjectConfig",yb:"GET"},Hh={nb:!0,endpoint:"getRecaptchaParam",yb:"GET",O:function(t){if(!t.recaptchaSiteKey)throw new Pi("internal-error")}},Wh={endpoint:"resetPassword",D:jr,ga:"email"},Gh={endpoint:"sendVerificationCode",ea:["phoneNumber","recaptchaToken"],ga:"sessionInfo"},zh={endpoint:"setAccountInfo",ea:["idToken"],D:Ar,T:!0},Jh={endpoint:"setAccountInfo",ea:["idToken"],D:function(t){if(Ar(t),!t.password)throw new Pi("weak-password")},O:Sr,T:!0},Yh={endpoint:"signupNewUser",O:Sr,T:!0},$h={endpoint:"verifyAssertion",D:_r,O:Rr,T:!0},Zh={endpoint:"verifyAssertion",D:_r,O:function(t){if(t.errorMessage&&"USER_NOT_FOUND"==t.errorMessage)throw new Pi("user-not-found");if(!t[Nh])throw new Pi("internal-error")},T:!0},Qh={endpoint:"verifyAssertion",D:function(t){if(_r(t),!t.idToken)throw new Pi("internal-error")},O:Rr,T:!0},tf={endpoint:"verifyCustomToken",D:function(t){if(!t.token)throw new Pi("invalid-custom-token")},O:Sr,T:!0},nf={endpoint:"verifyPassword",D:function(t){if(kr(t),!t.password)throw new Pi("wrong-password")},O:Sr,T:!0},ef={endpoint:"verifyPhoneNumber",D:Or,O:Sr},rf={endpoint:"verifyPhoneNumber",D:function(t){if(!t.idToken)throw new Pi("internal-error");Or(t)},O:function(t){if(t.temporaryProof)throw t.code="credential-already-in-use",dr(t);Sr(t)}},of={Lb:{USER_NOT_FOUND:"user-not-found"},endpoint:"verifyPhoneNumber",D:Or,O:Sr},af={Ic:{Va:"https://www.googleapis.com/identitytoolkit/v3/relyingparty/",ab:"https://securetoken.googleapis.com/v1/token",id:"p"},Kc:{Va:"https://staging-www.sandbox.googleapis.com/identitytoolkit/v3/relyingparty/",ab:"https://staging-securetoken.sandbox.googleapis.com/v1/token",id:"s"},Lc:{Va:"https://www-googleapis-test.sandbox.google.com/identitytoolkit/v3/relyingparty/",ab:"https://test-securetoken.sandbox.googleapis.com/v1/token",id:"t"}};Lh=Vr("__EID__")?"__EID__":void 0;var sf=It("https://apis.google.com/js/api.js?onload=%{onload}"),uf=new bi(3e4,6e4),cf=new bi(5e3,15e3),hf=null;Hr.prototype.toString=function(){return this.f?te(this.a,"v",this.f):fe(this.a.a,"v"),this.b?te(this.a,"eid",this.b):fe(this.a.a,"eid"),this.c.length?te(this.a,"fw",this.c.join(",")):fe(this.a.a,"fw"),""+this.a},Wr.prototype.toString=function(){var t=ie(this.m,"/__/auth/handler");if(te(t,"apiKey",this.u),te(t,"appName",this.c),te(t,"authType",this.l),this.a.isOAuthProvider){var n=this.a;try{var e=iu.app(this.c).auth().$()}catch(t){e=null}n.Ua=e,te(t,"providerId",this.a.providerId),n=this.a,e=li(n.qb);for(var i in e)e[i]=""+e[i];i=n.nc,e=x(e);for(var r=0;r<i.length;r++){var o=i[r];o in e&&delete e[o]}n.Wa&&n.Ua&&!e[n.Wa]&&(e[n.Wa]=n.Ua),D(e)||te(t,"customParameters",fi(e))}if("function"==typeof this.a.vb&&(n=this.a.vb(),n.length&&te(t,"scopes",n.join(","))),this.h?te(t,"redirectUrl",this.h):fe(t.a,"redirectUrl"),this.g?te(t,"eventId",this.g):fe(t.a,"eventId"),this.i?te(t,"v",this.i):fe(t.a,"v"),this.b)for(var a in this.b)this.b.hasOwnProperty(a)&&!ne(t,a)&&te(t,a,this.b[a]);return this.f?te(t,"eid",this.f):fe(t.a,"eid"),a=Gr(this.c),a.length&&te(t,"fw",a.join(",")),""+t},eu=zr.prototype,eu.Ca=function(t,n,e){var i=new Pi("popup-closed-by-user"),r=new Pi("web-storage-unsupported"),o=this,a=!1;return this.ba().then(function(){to(o).then(function(e){e||(t&&Ge(t),n(r),a=!0)})}).s(function(){}).then(function(){if(!a)return Je(t)}).then(function(){if(!a)return gn(e).then(function(){n(i)})})},eu.Cb=function(){var t=ri();return!hi(t)&&!vi(t)},eu.xb=function(){return!1},eu.ub=function(t,n,e,i,r,o,a){if(!t)return et(new Pi("popup-blocked"));if(a&&!hi())return this.ba().s(function(n){Ge(t),r(n)}),i(),nt();this.a||(this.a=Jr($r(this)));var s=this;return this.a.then(function(){var n=s.ba().s(function(n){throw Ge(t),r(n),n});return i(),n}).then(function(){cr(e),a||Xe(Zr(s.u,s.f,s.b,n,e,null,o,s.c,void 0,s.h),t)}).s(function(t){throw"auth/network-request-failed"==t.code&&(s.a=null),t})},eu.Aa=function(t,n,e){this.a||(this.a=Jr($r(this)));var i=this;return this.a.then(function(){cr(n),Xe(Zr(i.u,i.f,i.b,t,n,qe(),e,i.c,void 0,i.h))}).s(function(t){throw"auth/network-request-failed"==t.code&&(i.a=null),t})},eu.ba=function(){var t=this;return Yr(this).then(function(){return t.i.Ya}).s(function(){throw t.a=null,new Pi("network-request-failed")})},eu.Db=function(){return!0},eu.ua=function(t){this.g.push(t)},eu.Ja=function(t){N(this.g,function(n){return n==t})},eu=no.prototype,eu.get=function(t){return nt(this.a.getItem(t)).then(function(t){return t&&pi(t)})},eu.set=function(t,n){return nt(this.a.setItem(t,fi(n)))},eu.X=function(t){return nt(this.a.removeItem(t))},eu.ia=function(){},eu.da=function(){},eu=eo.prototype,eu.get=function(t){return nt(this.a[t])},eu.set=function(t,n){return this.a[t]=n,nt()},eu.X=function(t){return delete this.a[t],nt()},eu.ia=function(){},eu.da=function(){};var ff;eu=io.prototype,eu.set=function(t,n){var e,i=!1,r=this;return at(oo(this).then(function(n){return e=n,n=ao(r,so(r,e,!0)),uo(n.get(t))}).then(function(o){var a=ao(r,so(r,e,!0));return o?(o.value=n,uo(a.put(o))):(r.a++,i=!0,o={},o[r.g]=t,o[r.l]=n,uo(a.add(o)))}).then(function(){r.f[t]=n}),function(){i&&r.a--})},eu.get=function(t){var n=this;return oo(this).then(function(e){return uo(ao(n,so(n,e,!1)).get(t))}).then(function(t){return t&&t.value})},eu.X=function(t){var n=!1,e=this;return at(oo(this).then(function(i){return n=!0,e.a++,uo(ao(e,so(e,i,!0)).delete(t))}).then(function(){delete e.f[t]}),function(){n&&e.a--})},eu.vc=function(){var t=this;return oo(this).then(function(n){var e=ao(t,so(t,n,!1));return e.getAll?uo(e.getAll()):new Z(function(t,n){var i=[],r=e.openCursor();r.onsuccess=function(n){(n=n.target.result)?(i.push(n.value),n.continue()):t(i)},r.onerror=function(t){n(Error(t.target.errorCode))}})}).then(function(n){var e={},i=[];if(0==t.a){for(i=0;i<n.length;i++)e[n[i][t.g]]=n[i][t.l];i=Be(t.f,e),t.f=e}return i})},eu.ia=function(t){0==this.c.length&&co(this),this.c.push(t)},eu.da=function(t){N(this.c,function(n){return n==t}),0==this.c.length&&this.b&&this.b.cancel("STOP_EVENT")},eu=ho.prototype,eu.get=function(t){var n=this;return nt().then(function(){return pi(n.a.getItem(t))})},eu.set=function(t,n){var e=this;return nt().then(function(){var i=fi(n);null===i?e.X(t):e.a.setItem(t,i)})},eu.X=function(t){var n=this;return nt().then(function(){n.a.removeItem(t)})},eu.ia=function(t){ou.window&&Zt(ou.window,"storage",t)},eu.da=function(t){ou.window&&en(ou.window,"storage",t)},eu=lo.prototype,eu.get=function(){return nt(null)},eu.set=function(){return nt()},eu.X=function(){return nt()},eu.ia=function(){},eu.da=function(){},eu=po.prototype,eu.get=function(t){var n=this;return nt().then(function(){return pi(n.a.getItem(t))})},eu.set=function(t,n){var e=this;return nt().then(function(){var i=fi(n);null===i?e.X(t):e.a.setItem(t,i)})},eu.X=function(t){var n=this;return nt().then(function(){n.a.removeItem(t)})},eu.ia=function(){},eu.da=function(){};var lf,pf,df={C:ho,jb:po},vf={C:ho,jb:po},mf={C:no,jb:lo},gf={Hc:"local",NONE:"none",Jc:"session"};bo.prototype.get=function(t,n){return yo(this,t.C).get(Io(this,t,n))},bo.prototype.set=function(t,n,e){var i=Io(this,t,e),r=this,o=yo(this,t.C);return o.set(i,n).then(function(){return o.get(i)}).then(function(n){"local"==t.C&&(r.b[i]=n)})},bo.prototype.m=function(t){if(t&&t.g){var n=t.a.key;if(null==n)for(var e in this.a){var i=this.b[e];void 0===i&&(i=null);var r=ou.localStorage.getItem(e);r!==i&&(this.b[e]=r,this.c(e))}else if(0==n.indexOf(this.i+this.g)&&this.a[n]){if(void 0!==t.a.a?yo(this,"local").da(this.h):No(this),this.w)if(e=ou.localStorage.getItem(n),(i=t.a.newValue)!==e)null!==i?ou.localStorage.setItem(n,i):ou.localStorage.removeItem(n);else if(this.b[n]===i&&void 0===t.a.a)return;var o=this;e=function(){void 0===t.a.a&&o.b[n]===ou.localStorage.getItem(n)||(o.b[n]=ou.localStorage.getItem(n),o.c(n))},Su&&xu&&10==xu&&ou.localStorage.getItem(n)!==t.a.newValue&&t.a.newValue!==t.a.oldValue?setTimeout(e,10):e()}}else wu(t,l(this.c,this))},bo.prototype.c=function(t){this.a[t]&&wu(this.a[t],function(t){t()})};var bf={name:"authEvent",C:"local"};eu=_o.prototype,eu.ba=function(){return this.xa?this.xa:this.xa=$e().then(function(){if("function"!=typeof oi("universalLinks.subscribe",ou))throw Ro("cordova-universal-links-plugin is not installed");if(void 0===oi("BuildInfo.packageName",ou))throw Ro("cordova-plugin-buildinfo is not installed");if("function"!=typeof oi("cordova.plugins.browsertab.openUrl",ou))throw Ro("cordova-plugin-browsertab is not installed");if("function"!=typeof oi("cordova.InAppBrowser.open",ou))throw Ro("cordova-plugin-inappbrowser is not installed")},function(){throw new Pi("cordova-not-ready")})},eu.Ca=function(t,n){return n(new Pi("operation-not-supported-in-this-environment")),nt()},eu.ub=function(){return et(new Pi("operation-not-supported-in-this-environment"))},eu.Db=function(){return!1},eu.Cb=function(){return!0},eu.xb=function(){return!0},eu.Aa=function(t,n,e){if(this.c)return et(new Pi("redirect-operation-pending"));var i=this,r=ou.document,o=null,a=null,s=null,u=null;return this.c=at(nt().then(function(){return cr(n),Uo(i)}).then(function(){return xo(i,t,n,e)}).then(function(){return new Z(function(t,n){a=function(){var n=oi("cordova.plugins.browsertab.close",ou);return t(),"function"==typeof n&&n(),i.a&&"function"==typeof i.a.close&&(i.a.close(),i.a=null),!1},i.ua(a),s=function(){o||(o=gn(i.w).then(function(){n(new Pi("redirect-cancelled-by-user"))}))},u=function(){wi()&&s()},r.addEventListener("resume",s,!1),ri().toLowerCase().match(/android/)||r.addEventListener("visibilitychange",u,!1)}).s(function(t){return Mo(i).then(function(){throw t})})}),function(){s&&r.removeEventListener("resume",s,!1),u&&r.removeEventListener("visibilitychange",u,!1),o&&o.cancel(),a&&i.Ja(a),i.c=null})},eu.ua=function(t){this.b.push(t),Uo(this).s(function(n){"auth/invalid-cordova-configuration"===n.code&&(n=new hr("unknown",null,null,null,new Pi("no-auth-event")),t(n))})},eu.Ja=function(t){N(this.b,function(n){return n==t})};var wf={name:"pendingRedirect",C:"session"};Bo.prototype.reset=function(){this.f=!1,this.a.Ja(this.i),this.a=Ho(this.v,this.l,this.u)},Bo.prototype.subscribe=function(t){if(A(this.h,t)||this.h.push(t),!this.f){var n=this;Xo(this.g).then(function(t){t?qo(n.g).then(function(){Wo(n).s(function(t){var e=new hr("unknown",null,null,null,new Pi("operation-not-supported-in-this-environment"));Jo(t)&&n.m(e)})}):Go(n)}).s(function(){Go(n)})}},Bo.prototype.unsubscribe=function(t){N(this.h,function(n){return n==t})},Bo.prototype.m=function(t){if(!t)throw new Pi("invalid-auth-event");for(var n=!1,e=0;e<this.h.length;e++){var i=this.h[e];if(i.ob(t.b,t.c)){(n=this.b[t.b])&&n.h(t,i),n=!0;break}}return Zo(this.c),n};var yf=new bi(2e3,1e4),If=new bi(3e4,6e4);Bo.prototype.aa=function(){return this.c.aa()},Bo.prototype.Aa=function(t,n,e){var i,r=this;return Ko(this.g).then(function(){return r.a.Aa(t,n,e).s(function(t){if(Jo(t))throw new Pi("operation-not-supported-in-this-environment");return i=t,qo(r.g).then(function(){throw i})}).then(function(){return r.a.Db()?new Z(function(){}):qo(r.g).then(function(){return r.aa()}).then(function(){}).s(function(){})})})},Bo.prototype.Ca=function(t,n,e,i){return this.a.Ca(e,function(e){t.fa(n,null,e,i)},yf.get())};var Tf={};$o.prototype.reset=function(){this.b=null,this.a&&(this.a.cancel(),this.a=null)},$o.prototype.h=function(t,n){if(!t)return et(new Pi("invalid-auth-event"));this.reset(),this.g=!0;var e=t.b,i=t.c,r=t.a&&"auth/web-storage-unsupported"==t.a.code,o=t.a&&"auth/operation-not-supported-in-this-environment"==t.a.code;return"unknown"!=e||r||o?t.a?(ea(this,!0,null,t.a),t=nt()):t=n.va(e,i)?Qo(this,t,n):et(new Pi("invalid-auth-event")):(ea(this,!1,null,null),t=nt()),t},$o.prototype.aa=function(){var t=this;return new Z(function(n,e){t.b?t.b().then(n,e):(t.f.push(n),t.c.push(e),ia(t))})},ra.prototype.h=function(t,n){if(!t)return et(new Pi("invalid-auth-event"));var e=t.b,i=t.c;return t.a?(n.fa(t.b,null,t.a,t.c),t=nt()):t=n.va(e,i)?oa(t,n):et(new Pi("invalid-auth-event")),t},aa.prototype.confirm=function(t){return t=sr(this.verificationId,t),this.a(t)},ua.prototype.start=function(){this.a=this.c,ha(this,!0)},la.prototype.B=function(){return{apiKey:this.f.b,refreshToken:this.a,accessToken:this.b,expirationTime:this.c}},la.prototype.getToken=function(t){return t=!!t,this.b&&!this.a?et(new Pi("user-token-expired")):t||!this.b||uu()>this.c-3e4?this.a?va(this,{grant_type:"refresh_token",refresh_token:this.a}):nt(null):nt({accessToken:this.b,expirationTime:this.c,refreshToken:this.a})},ma.prototype.B=function(){return{lastLoginAt:this.b,createdAt:this.a}},d(wa,Bt),d(ya,fn),ya.prototype.na=function(t){this.ha=t,gr(this.c,t)},ya.prototype.$=function(){return this.ha},ya.prototype.Ka=function(){return O(this.R)},ya.prototype.Ga=function(){this.l.b&&(fa(this.l),this.l.start())},Ti(ya.prototype,"providerId","firebase"),eu=ya.prototype,eu.reload=function(){var t=this;return Ya(this,La(this).then(function(){return Fa(t).then(function(){return Ca(t)}).then(Da)}))},eu.F=function(t){var n=this;return Ya(this,La(this).then(function(){return n.h.getToken(t)}).then(function(t){if(!t)throw new Pi("internal-error");return t.accessToken!=n.pa&&(Oa(n,t.accessToken),ln(n,new wa("tokenChanged"))),Ma(n,"refreshToken",t.refreshToken),t.accessToken}))},eu.getToken=function(t){return nh["firebase.User.prototype.getToken is deprecated. Please use firebase.User.prototype.getIdToken instead."]||(nh["firebase.User.prototype.getToken is deprecated. Please use firebase.User.prototype.getIdToken instead."]=!0,"undefined"!=typeof console&&"function"==typeof console.warn&&console.warn("firebase.User.prototype.getToken is deprecated. Please use firebase.User.prototype.getIdToken instead.")),this.F(t)},eu.gc=function(t){if(!(t=t.users)||!t.length)throw new Pi("internal-error");t=t[0],Ra(this,{uid:t.localId,displayName:t.displayName,photoURL:t.photoUrl,email:t.email,emailVerified:!!t.emailVerified,phoneNumber:t.phoneNumber,lastLoginAt:t.lastLoginAt,createdAt:t.createdAt});for(var n=Xa(t),e=0;e<n.length;e++)ja(this,n[e]);Ma(this,"isAnonymous",!(this.email&&t.passwordHash||this.providerData&&this.providerData.length))},eu.Za=function(t){var n=this,e=null;return Ya(this,t.c(this.c,this.uid).then(function(t){return Ka(n,t),e=Ha(n,t,"reauthenticate"),n.i=null,n.reload()}).then(function(){return e}),!0)},eu.hc=function(t){return this.Za(t).then(function(){})},eu.Xa=function(t){var n=this,e=null;return Ya(this,Ba(this,t.providerId).then(function(){return n.F()}).then(function(e){return t.b(n.c,e)}).then(function(t){return e=Ha(n,t,"link"),Wa(n,t)}).then(function(){return e}))},eu.Zb=function(t){return this.Xa(t).then(function(t){return t.user})},eu.$b=function(t,n){var e=this;return Ya(this,Ba(this,"phone").then(function(){return sa(Aa(e),t,n,l(e.Xa,e))}))},eu.ic=function(t,n){var e=this;return Ya(this,nt().then(function(){return sa(Aa(e),t,n,l(e.Za,e))}),!0)},eu.kb=function(t){var n=this;return Ya(this,this.F().then(function(e){return n.c.kb(e,t)}).then(function(t){return Ka(n,t),n.reload()}))},eu.zc=function(t){var n=this;return Ya(this,this.F().then(function(e){return t.b(n.c,e)}).then(function(t){return Ka(n,t),n.reload()}))},eu.lb=function(t){var n=this;return Ya(this,this.F().then(function(e){return n.c.lb(e,t)}).then(function(t){return Ka(n,t),n.reload()}))},eu.mb=function(t){if(void 0===t.displayName&&void 0===t.photoURL)return La(this);var n=this;return Ya(this,this.F().then(function(e){return n.c.mb(e,{displayName:t.displayName,photoUrl:t.photoURL})}).then(function(t){return Ka(n,t),Ma(n,"displayName",t.displayName||null),Ma(n,"photoURL",t.photoUrl||null),wu(n.providerData,function(t){"password"===t.providerId&&(Ti(t,"displayName",n.displayName),Ti(t,"photoURL",n.photoURL))}),Ca(n)}).then(Da))},eu.yc=function(t){var n=this;return Ya(this,Fa(this).then(function(e){return A(xa(n),t)?Cr(n.c,e,[t]).then(function(t){var e={};return wu(t.providerUserInfo||[],function(t){e[t.providerId]=!0}),wu(xa(n),function(t){e[t]||Ua(n,t)}),e[ar.PROVIDER_ID]||Ti(n,"phoneNumber",null),Ca(n)}):Ca(n).then(function(){throw new Pi("no-such-provider")})}))},eu.delete=function(){var t=this;return Ya(this,this.F().then(function(n){return Ur(t.c,Vh,{idToken:n})}).then(function(){ln(t,new wa("userDeleted"))})).then(function(){for(var n=0;n<t.A.length;n++)t.A[n].cancel("app-deleted");Ia(t,null),ka(t,null),t.A=[],t.m=!0,Sa(t),Ti(t,"refreshToken",null),t.a&&t.a.unsubscribe(t)})},eu.ob=function(t,n){return!!("linkViaPopup"==t&&(this.g||null)==n&&this.f||"reauthViaPopup"==t&&(this.g||null)==n&&this.f||"linkViaRedirect"==t&&(this.Z||null)==n||"reauthViaRedirect"==t&&(this.Z||null)==n)},eu.fa=function(t,n,e,i){"linkViaPopup"!=t&&"reauthViaPopup"!=t||i!=(this.g||null)||(e&&this.v?this.v(e):n&&!e&&this.f&&this.f(n),this.b&&(this.b.cancel(),this.b=null),delete this.f,delete this.v)},eu.va=function(t,n){return"linkViaPopup"==t&&n==(this.g||null)?l(this.sb,this):"reauthViaPopup"==t&&n==(this.g||null)?l(this.tb,this):"linkViaRedirect"==t&&(this.Z||null)==n?l(this.sb,this):"reauthViaRedirect"==t&&(this.Z||null)==n?l(this.tb,this):null},eu.ac=function(t){var n=this;return Ga(this,"linkViaPopup",t,function(){return Ba(n,t.providerId).then(function(){return Ca(n)})},!1)},eu.jc=function(t){return Ga(this,"reauthViaPopup",t,function(){return nt()},!0)},eu.bc=function(t){var n=this;return za(this,"linkViaRedirect",t,function(){return Ba(n,t.providerId)},!1)},eu.kc=function(t){return za(this,"reauthViaRedirect",t,function(){return nt()},!0)},eu.sb=function(t,n){var e=this;this.b&&(this.b.cancel(),this.b=null);var i=null;return Ya(this,this.F().then(function(i){return Lr(e.c,{requestUri:t,sessionId:n,idToken:i})}).then(function(t){return i=Ha(e,t,"link"),Wa(e,t)}).then(function(){return i}))},eu.tb=function(t,n){var e=this;this.b&&(this.b.cancel(),this.b=null);var i=null;return Ya(this,nt().then(function(){return Xi(xr(e.c,{requestUri:t,sessionId:n}),e.uid)}).then(function(t){return i=Ha(e,t,"reauthenticate"),Ka(e,t),e.i=null,e.reload()}).then(function(){return i}),!0)},eu.bb=function(t){var n=this,e=null;return Ya(this,this.F().then(function(n){return e=n,void 0===t||D(t)?{}:Ri(new _i(t))}).then(function(t){return n.c.bb(e,t)}).then(function(t){if(n.email!=t)return n.reload()}).then(function(){}))},eu.toJSON=function(){return this.B()},eu.B=function(){var t={uid:this.uid,displayName:this.displayName,photoURL:this.photoURL,email:this.email,emailVerified:this.emailVerified,phoneNumber:this.phoneNumber,isAnonymous:this.isAnonymous,providerData:[],apiKey:this.G,appName:this.o,authDomain:this.w,stsTokenManager:this.h.B(),redirectEventId:this.Z||null};return this.metadata&&j(t,this.metadata.B()),wu(this.providerData,function(n){t.providerData.push(Ei(n))}),t};var kf={name:"redirectUser",C:"session"};is.prototype.g=function(){var t=this,n=as("local");fs(this,function(){return nt().then(function(){return t.c&&"local"!=t.c.C?t.b.get(n,t.a):null}).then(function(e){if(e)return rs(t,"local").then(function(){t.c=n})})})};var Af={name:"persistence",C:"session"};is.prototype.eb=function(t){var n=null,e=this;return go(t),fs(this,function(){return t!=e.c.C?e.b.get(e.c,e.a).then(function(i){return n=i,rs(e,t)}).then(function(){if(e.c=as(t),n)return e.b.set(e.c,n,e.a)}):nt()})},d(ls,fn),d(ps,Bt),d(ds,Bt),eu=ls.prototype,eu.eb=function(t){return t=this.h.eb(t),Ps(this,t)},eu.na=function(t){this.V===t||this.l||(this.V=t,gr(this.c,this.V),ln(this,new ps(this.$())))},eu.$=function(){return this.V},eu.Ac=function(){var t=ou.navigator;this.na(t?t.languages&&t.languages[0]||t.language||t.userLanguage||null:null)},eu.cc=function(t){this.A.push(t),br(this.c,iu.SDK_VERSION?ii(iu.SDK_VERSION,this.A):null),ln(this,new ds(this.A))},eu.Ka=function(){return O(this.A)},eu.toJSON=function(){return{apiKey:As(this).options.apiKey,authDomain:As(this).options.authDomain,appName:As(this).name,currentUser:Es(this)&&Es(this).B()}},eu.ob=function(t,n){switch(t){case"unknown":case"signInViaRedirect":return!0;case"signInViaPopup":return this.g==n&&!!this.f;default:return!1}},eu.fa=function(t,n,e,i){"signInViaPopup"==t&&this.g==i&&(e&&this.v?this.v(e):n&&!e&&this.f&&this.f(n),this.b&&(this.b.cancel(),this.b=null),delete this.f,delete this.v)},eu.va=function(t,n){return"signInViaRedirect"==t||"signInViaPopup"==t&&this.g==n&&this.f?l(this.Ob,this):null},eu.Ob=function(t,n){var e=this;t={requestUri:t,sessionId:n},this.b&&(this.b.cancel(),this.b=null);var i=null,r=null,o=Dr(e.c,t).then(function(t){return i=ur(t),r=ji(t),t});return t=e.U.then(function(){return o}).then(function(t){return bs(e,t)}).then(function(){return Ai({user:Es(e),credential:i,additionalUserInfo:r,operationType:"signIn"})}),Ps(this,t)},eu.sc=function(t){if(!si())return et(new Pi("operation-not-supported-in-this-environment"));var n=this,e=xi(t.providerId),i=di(),r=null;(!hi()||Qe())&&As(this).options.authDomain&&t.isOAuthProvider&&(r=Zr(As(this).options.authDomain,As(this).options.apiKey,As(this).name,"signInViaPopup",t,null,i,iu.SDK_VERSION||null));var o=ze(r,e&&e.za,e&&e.ya);return e=ms(this).then(function(n){return zo(n,o,"signInViaPopup",t,i,!!r)}).then(function(){return new Z(function(t,e){n.fa("signInViaPopup",null,new Pi("cancelled-popup-request"),n.g),n.f=t,n.v=e,n.g=i,n.b=n.a.Ca(n,"signInViaPopup",o,i)})}).then(function(t){return o&&Ge(o),t?Ai(t):null}).s(function(t){throw o&&Ge(o),t}),Ps(this,e)},eu.tc=function(t){if(!si())return et(new Pi("operation-not-supported-in-this-environment"));var n=this;return Ps(this,ms(this).then(function(){return ss(n.h)}).then(function(){return n.a.Aa("signInViaRedirect",t)}))},eu.aa=function(){if(!si())return et(new Pi("operation-not-supported-in-this-environment"));var t=this;return Ps(this,ms(this).then(function(){return t.a.aa()}).then(function(t){return t?Ai(t):null}))},eu.hb=function(){var t=this;return Ps(this,this.i.then(function(){return Es(t)?(ws(t,null),cs(t.h).then(function(){Ss(t)})):nt()}))},eu.uc=function(){var t=this;return hs(this.h,As(this).options.authDomain).then(function(n){if(!t.l){var e;if(e=Es(t)&&n){e=Es(t).uid;var i=n.uid;e=void 0!==e&&null!==e&&""!==e&&void 0!==i&&null!==i&&""!==i&&e==i}if(e)return Va(Es(t),n),Es(t).F();(Es(t)||n)&&(ws(t,n),n&&(_a(n),n.ca=t.G),t.a&&t.a.subscribe(t),Ss(t))}})},eu.ka=function(t){return us(this.h,t)},eu.Pb=function(){Ss(this),this.ka(Es(this))},eu.Vb=function(){this.hb()},eu.Wb=function(){this.hb()},eu.Xb=function(t){var n=this;this.addAuthTokenListener(function(){t.next(Es(n))})},eu.Yb=function(t){var n=this;Os(this,function(){t.next(Es(n))})},eu.ec=function(t,n,e){var i=this;return this.W&&iu.Promise.resolve().then(function(){u(t)?t(Es(i)):u(t.next)&&t.next(Es(i))}),this.Gb(t,n,e)},eu.dc=function(t,n,e){var i=this;return this.W&&iu.Promise.resolve().then(function(){i.R=i.getUid(),u(t)?t(Es(i)):u(t.next)&&t.next(Es(i))}),this.Hb(t,n,e)},eu.Rb=function(t){var n=this;return Ps(this,this.i.then(function(){return Es(n)?Es(n).F(t).then(function(t){return{accessToken:t}}):null}))},eu.pc=function(t){var n=this;return this.i.then(function(){return ks(n,Ur(n.c,tf,{token:t}))}).then(function(t){return t=t.user,Ma(t,"isAnonymous",!1),n.ka(t)}).then(function(){return Es(n)})},eu.qc=function(t,n){var e=this;return this.i.then(function(){return ks(e,Ur(e.c,nf,{email:t,password:n}))}).then(function(t){return t.user})},eu.Kb=function(t,n){var e=this;return this.i.then(function(){return ks(e,Ur(e.c,Uh,{email:t,password:n}))}).then(function(t){return t.user})},eu.oc=function(t){return this.fb(t).then(function(t){return t.user})},eu.fb=function(t){var n=this;return this.i.then(function(){return ks(n,t.wa(n.c))})},eu.gb=function(){var t=this;return this.i.then(function(){var n=Es(t);return n&&n.isAnonymous?n:ks(t,t.c.gb()).then(function(n){return n=n.user,Ma(n,"isAnonymous",!0),t.ka(n)}).then(function(){return Es(t)})})},eu.getUid=function(){return Es(this)&&Es(this).uid||null},eu.Ib=function(t){this.addAuthTokenListener(t),0<++this.o&&Es(this)&&Na(Es(this))},eu.mc=function(t){var n=this;wu(this.m,function(e){e==t&&n.o--}),0>this.o&&(this.o=0),0==this.o&&Es(this)&&Sa(Es(this)),this.removeAuthTokenListener(t)},eu.addAuthTokenListener=function(t){var n=this;this.m.push(t),Ps(this,this.i.then(function(){n.l||A(n.m,t)&&t(Ns(n))}))},eu.removeAuthTokenListener=function(t){N(this.m,function(n){return n==t})},eu.delete=function(){this.l=!0;for(var t=0;t<this.N.length;t++)this.N[t].cancel("app-deleted");return this.N=[],this.h&&(t=this.h,Ao(t.b,t.a,this.ha)),this.a&&this.a.unsubscribe(this),iu.Promise.resolve()},eu.Nb=function(t){return Ps(this,Er(this.c,t))},eu.Bc=function(t){return this.Ia(t).then(function(t){return t.data.email})},eu.Ta=function(t,n){return Ps(this,this.c.Ta(t,n).then(function(){}))},eu.Ia=function(t){return Ps(this,this.c.Ia(t).then(function(t){return new Oi(t)}))},eu.Sa=function(t){return Ps(this,this.c.Sa(t).then(function(){}))},eu.cb=function(t,n){var e=this;return Ps(this,nt().then(function(){return void 0===n||D(n)?{}:Ri(new _i(n))}).then(function(n){return e.c.cb(t,n)}).then(function(){}))},eu.rc=function(t,n){return Ps(this,sa(this,t,n,l(this.fb,this)))};var Ef="First Second Third Fourth Fifth Sixth Seventh Eighth Ninth".split(" "),Nf="callback",Sf="expired-callback",Of="sitekey",Pf="size";eu=Xs.prototype,eu.xa=function(){var t=this;return this.c?this.c:this.c=Ws(this,nt().then(function(){if(ui())return Ye();throw new Pi("operation-not-supported-in-this-environment","RecaptchaVerifier is only supported in a browser HTTP/HTTPS environment.")}).then(function(){return Js(Ys(),t.o())}).then(function(){return Ur(t.u,Hh,{})}).then(function(n){t.a[Of]=n.recaptchaSiteKey}).s(function(n){throw t.c=null,n}))},eu.render=function(){Gs(this);var t=this;return Ws(this,this.xa().then(function(){if(null===t.b){var n=t.l;if(!t.h){var e=Dt(n);n=xt("DIV"),e.appendChild(n)}t.b=grecaptcha.render(n,t.a)}return t.b}))},eu.verify=function(){Gs(this);var t=this;return Ws(this,this.render().then(function(n){return new Z(function(e){var i=grecaptcha.getResponse(n);if(i)e(i);else{var r=function(n){n&&(Hs(t,r),e(n))};t.i.push(r),t.h&&grecaptcha.execute(t.b)}})}))},eu.reset=function(){Gs(this),null!==this.b&&grecaptcha.reset(this.b)},eu.clear=function(){Gs(this),this.m=!0,Ys().b--;for(var t=0;t<this.g.length;t++)this.g[t].cancel("RecaptchaVerifier instance has been destroyed.");if(!this.h){t=Dt(this.l);for(var n;n=t.firstChild;)t.removeChild(n)}};var Cf=It("https://www.google.com/recaptcha/api.js?onload=%{onload}&render=explicit&hl=%{hl}"),_f=null;d($s,Xs),Zs(ls.prototype,{Sa:{name:"applyActionCode",j:[_s("code")]},Ia:{name:"checkActionCode",j:[_s("code")]},Ta:{name:"confirmPasswordReset",j:[_s("code"),_s("newPassword")]},Kb:{name:"createUserWithEmailAndPassword",j:[_s("email"),_s("password")]},Nb:{name:"fetchProvidersForEmail",j:[_s("email")]},aa:{name:"getRedirectResult",j:[]},dc:{name:"onAuthStateChanged",j:[qs(Ds(),Ls(),"nextOrObserver"),Ls("opt_error",!0),Ls("opt_completed",!0)]},ec:{name:"onIdTokenChanged",j:[qs(Ds(),Ls(),"nextOrObserver"),Ls("opt_error",!0),Ls("opt_completed",!0)]},cb:{name:"sendPasswordResetEmail",j:[_s("email"),qs(Ds("opt_actionCodeSettings",!0),xs(null,!0),"opt_actionCodeSettings",!0)]},eb:{name:"setPersistence",j:[_s("persistence")]},fb:{name:"signInAndRetrieveDataWithCredential",j:[Vs()]},gb:{name:"signInAnonymously",j:[]},oc:{name:"signInWithCredential",j:[Vs()]},pc:{name:"signInWithCustomToken",j:[_s("token")]},qc:{name:"signInWithEmailAndPassword",j:[_s("email"),_s("password")]},rc:{name:"signInWithPhoneNumber",j:[_s("phoneNumber"),Ks()]},sc:{name:"signInWithPopup",j:[Fs()]},tc:{name:"signInWithRedirect",j:[Fs()]},hb:{name:"signOut",j:[]},toJSON:{name:"toJSON",j:[_s(null,!0)]},Ac:{name:"useDeviceLanguage",j:[]},Bc:{name:"verifyPasswordResetCode",j:[_s("code")]}}),function(t,n){for(var e in n){var i=n[e].name;if(i!==e){var r=n[e].Jb;Object.defineProperty(t,i,{get:function(){return this[e]},set:function(t){Cs(i,[r],[t],!0),this[e]=t},enumerable:!0})}}}(ls.prototype,{lc:{name:"languageCode",Jb:qs(_s(),xs(),"languageCode")}}),ls.Persistence=gf,ls.Persistence.LOCAL="local",ls.Persistence.SESSION="session",ls.Persistence.NONE="none",Zs(ya.prototype,{delete:{name:"delete",j:[]},F:{name:"getIdToken",j:[Rs()]},getToken:{name:"getToken",j:[Rs()]},Xa:{name:"linkAndRetrieveDataWithCredential",j:[Vs()]},Zb:{name:"linkWithCredential",j:[Vs()]},$b:{name:"linkWithPhoneNumber",j:[_s("phoneNumber"),Ks()]},ac:{name:"linkWithPopup",j:[Fs()]},bc:{name:"linkWithRedirect",j:[Fs()]},Za:{name:"reauthenticateAndRetrieveDataWithCredential",j:[Vs()]},hc:{name:"reauthenticateWithCredential",j:[Vs()]},ic:{name:"reauthenticateWithPhoneNumber",j:[_s("phoneNumber"),Ks()]},jc:{name:"reauthenticateWithPopup",j:[Fs()]},kc:{name:"reauthenticateWithRedirect",j:[Fs()]},reload:{name:"reload",j:[]},bb:{name:"sendEmailVerification",j:[qs(Ds("opt_actionCodeSettings",!0),xs(null,!0),"opt_actionCodeSettings",!0)]},toJSON:{name:"toJSON",j:[_s(null,!0)]},yc:{name:"unlink",j:[_s("provider")]},kb:{name:"updateEmail",j:[_s("email")]},lb:{name:"updatePassword",j:[_s("password")]},zc:{name:"updatePhoneNumber",j:[Vs("phone")]},mb:{name:"updateProfile",j:[Ds("profile")]}}),Zs(Z.prototype,{s:{name:"catch"},then:{name:"then"}}),Zs(aa.prototype,{confirm:{name:"confirm",j:[_s("verificationCode")]}}),Qs(ir,"credential",function(t,n){return new er(t,n)},[_s("email"),_s("password")]),Zs(zi.prototype,{sa:{name:"addScope",j:[_s("scope")]},Ba:{name:"setCustomParameters",j:[Ds("customOAuthParameters")]}}),Qs(zi,"credential",Ji,[qs(_s(),Ds(),"token")]),Zs(Yi.prototype,{sa:{name:"addScope",j:[_s("scope")]},Ba:{name:"setCustomParameters",j:[Ds("customOAuthParameters")]}}),Qs(Yi,"credential",$i,[qs(_s(),Ds(),"token")]),Zs(Zi.prototype,{sa:{name:"addScope",j:[_s("scope")]},Ba:{name:"setCustomParameters",j:[Ds("customOAuthParameters")]}}),Qs(Zi,"credential",Qi,[qs(_s(),qs(Ds(),xs()),"idToken"),qs(_s(),xs(),"accessToken",!0)]),Zs(tr.prototype,{Ba:{name:"setCustomParameters",j:[Ds("customOAuthParameters")]}}),Qs(tr,"credential",nr,[qs(_s(),Ds(),"token"),_s("secret",!0)]),Zs(Gi.prototype,{sa:{name:"addScope",j:[_s("scope")]},credential:{name:"credential",j:[qs(_s(),xs(),"idToken",!0),qs(_s(),xs(),"accessToken",!0)]},Ba:{name:"setCustomParameters",j:[Ds("customOAuthParameters")]}}),Qs(ar,"credential",sr,[_s("verificationId"),_s("verificationCode")]),Zs(ar.prototype,{Qa:{name:"verifyPhoneNumber",j:[_s("phoneNumber"),Ks()]}}),Zs(Pi.prototype,{toJSON:{name:"toJSON",j:[_s(null,!0)]}}),Zs(pr.prototype,{toJSON:{name:"toJSON",j:[_s(null,!0)]}}),Zs(lr.prototype,{toJSON:{name:"toJSON",j:[_s(null,!0)]}}),Zs($s.prototype,{clear:{name:"clear",j:[]},render:{name:"render",j:[]},verify:{name:"verify",j:[]}}),function(){if(void 0===iu||!iu.INTERNAL||!iu.INTERNAL.registerService)throw Error("Cannot find the firebase namespace; be sure to include firebase-app.js before this library.");var t={Auth:ls,Error:Pi};Qs(t,"EmailAuthProvider",ir,[]),Qs(t,"FacebookAuthProvider",zi,[]),Qs(t,"GithubAuthProvider",Yi,[]),Qs(t,"GoogleAuthProvider",Zi,[]),Qs(t,"TwitterAuthProvider",tr,[]),Qs(t,"OAuthProvider",Gi,[_s("providerId")]),Qs(t,"PhoneAuthProvider",ar,[Us()]),Qs(t,"RecaptchaVerifier",$s,[qs(_s(),js(),"recaptchaContainer"),Ds("recaptchaParameters",!0),Ms()]),iu.INTERNAL.registerService("auth",function(t,n){return t=new ls(t),n({INTERNAL:{getUid:l(t.getUid,t),getToken:l(t.Rb,t),addAuthTokenListener:l(t.Ib,t),removeAuthTokenListener:l(t.mc,t)}}),t},t,function(t,n){if("create"===t)try{n.auth()}catch(t){}}),iu.INTERNAL.extendNamespace({User:ya})}()}).call(void 0!==t?t:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})}).call(n,e(19))}},[76])}catch(t){throw Error("Cannot instantiate firebase-auth.js - be sure to load firebase-app.js first.")}
}


// @license Firebase v4.6.1 rev-53d7622
try{webpackJsonpFirebase([0],[,function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(0),o=n(0),a=n(0),s=n(0),u=n(0),l=n(12),h=n(0);t.LUIDGenerator=function(){var e=1;return function(){return e++}}(),t.sha1=function(e){var t=s.stringToByteArray(e),n=new a.Sha1;n.update(t);var r=n.digest();return o.base64.encodeByteArray(r)};var c=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];for(var n="",r=0;r<e.length;r++)Array.isArray(e[r])||e[r]&&"object"==typeof e[r]&&"number"==typeof e[r].length?n+=c.apply(null,e[r]):"object"==typeof e[r]?n+=u.stringify(e[r]):n+=e[r],n+=" ";return n};t.logger=null;var p=!0;t.enableLogging=function(e,n){r.assert(!n||!0===e||!1===e,"Can't turn on custom loggers persistently."),!0===e?("undefined"!=typeof console&&("function"==typeof console.log?t.logger=console.log.bind(console):"object"==typeof console.log&&(t.logger=function(e){console.log(e)})),n&&l.SessionStorage.set("logging_enabled",!0)):"function"==typeof e?t.logger=e:(t.logger=null,l.SessionStorage.remove("logging_enabled"))},t.log=function(){for(var e=[],n=0;n<arguments.length;n++)e[n]=arguments[n];if(!0===p&&(p=!1,null===t.logger&&!0===l.SessionStorage.get("logging_enabled")&&t.enableLogging(!0)),t.logger){var r=c.apply(null,e);t.logger(r)}},t.logWrapper=function(e){return function(){for(var n=[],r=0;r<arguments.length;r++)n[r]=arguments[r];t.log.apply(void 0,[e].concat(n))}},t.error=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];if("undefined"!=typeof console){var n="FIREBASE INTERNAL ERROR: "+c.apply(void 0,e);void 0!==console.error?console.error(n):console.log(n)}},t.fatal=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=c.apply(void 0,e);throw Error("FIREBASE FATAL ERROR: "+n)},t.warn=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];if("undefined"!=typeof console){var n="FIREBASE WARNING: "+c.apply(void 0,e);void 0!==console.warn?console.warn(n):console.log(n)}},t.warnIfPageIsSecure=function(){"undefined"!=typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf("https:")&&t.warn("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},t.warnAboutUnsupportedMethod=function(e){t.warn(e+" is unsupported and will likely change soon.  Please do not use.")},t.isInvalidJSONNumber=function(e){return"number"==typeof e&&(e!=e||e==Number.POSITIVE_INFINITY||e==Number.NEGATIVE_INFINITY)},t.executeWhenDOMReady=function(e){if(h.isNodeSdk()||"complete"===document.readyState)e();else{var t=!1,n=function(){if(!document.body)return void setTimeout(n,Math.floor(10));t||(t=!0,e())};document.addEventListener?(document.addEventListener("DOMContentLoaded",n,!1),window.addEventListener("load",n,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",function(){"complete"===document.readyState&&n()}),window.attachEvent("onload",n))}},t.MIN_NAME="[MIN_NAME]",t.MAX_NAME="[MAX_NAME]",t.nameCompare=function(e,n){if(e===n)return 0;if(e===t.MIN_NAME||n===t.MAX_NAME)return-1;if(n===t.MIN_NAME||e===t.MAX_NAME)return 1;var r=t.tryParseInt(e),i=t.tryParseInt(n);return null!==r?null!==i?r-i==0?e.length-n.length:r-i:-1:null!==i?1:e<n?-1:1},t.stringCompare=function(e,t){return e===t?0:e<t?-1:1},t.requireKey=function(e,t){if(t&&e in t)return t[e];throw Error("Missing required key ("+e+") in object: "+u.stringify(t))},t.ObjectToUniqueKey=function(e){if("object"!=typeof e||null===e)return u.stringify(e);var n=[];for(var r in e)n.push(r);n.sort();for(var i="{",o=0;o<n.length;o++)0!==o&&(i+=","),i+=u.stringify(n[o]),i+=":",i+=t.ObjectToUniqueKey(e[n[o]]);return i+="}"},t.splitStringBySize=function(e,t){var n=e.length;if(n<=t)return[e];for(var r=[],i=0;i<n;i+=t)i+t>n?r.push(e.substring(i,n)):r.push(e.substring(i,i+t));return r},t.each=function(e,t){if(Array.isArray(e))for(var n=0;n<e.length;++n)t(n,e[n]);else i.forEach(e,function(e,n){return t(n,e)})},t.bindCallback=function(e,t){return t?e.bind(t):e},t.doubleToIEEE754String=function(e){r.assert(!t.isInvalidJSONNumber(e),"Invalid JSON number");var n,i,o,a,s,u,l;for(0===e?(i=0,o=0,n=1/e==-1/0?1:0):(n=e<0,e=Math.abs(e),e>=Math.pow(2,-1022)?(a=Math.min(Math.floor(Math.log(e)/Math.LN2),1023),i=a+1023,o=Math.round(e*Math.pow(2,52-a)-Math.pow(2,52))):(i=0,o=Math.round(e/Math.pow(2,-1074)))),u=[],s=52;s;s-=1)u.push(o%2?1:0),o=Math.floor(o/2);for(s=11;s;s-=1)u.push(i%2?1:0),i=Math.floor(i/2);u.push(n?1:0),u.reverse(),l=u.join("");var h="";for(s=0;s<64;s+=8){var c=parseInt(l.substr(s,8),2).toString(16);1===c.length&&(c="0"+c),h+=c}return h.toLowerCase()},t.isChromeExtensionContentScript=function(){return!("object"!=typeof window||!window.chrome||!window.chrome.extension||/^chrome/.test(window.location.href))},t.isWindowsStoreApp=function(){return"object"==typeof Windows&&"object"==typeof Windows.UI},t.errorForServerCode=function(e,t){var n="Unknown Error";"too_big"===e?n="The data requested exceeds the maximum size that can be accessed with a single request.":"permission_denied"==e?n="Client doesn't have permission to access the desired data.":"unavailable"==e&&(n="The service is unavailable");var r=Error(e+" at "+t.path+": "+n);return r.code=e.toUpperCase(),r},t.e=RegExp("^-?\\d{1,10}$"),t.tryParseInt=function(e){if(t.e.test(e)){var n=+e;if(n>=-2147483648&&n<=2147483647)return n}return null},t.exceptionGuard=function(e){try{e()}catch(e){setTimeout(function(){var n=e.stack||"";throw t.warn("Exception was thrown by user callback.",n),e},Math.floor(0))}},t.callUserCallback=function(e){for(var n=[],r=1;r<arguments.length;r++)n[r-1]=arguments[r];"function"==typeof e&&t.exceptionGuard(function(){e.apply(void 0,n)})},t.beingCrawled=function(){return("object"==typeof window&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},t.exportPropGetter=function(e,t,n){Object.defineProperty(e,t,{get:n})},t.setTimeoutNonBlocking=function(e,t){var n=setTimeout(e,t);return"object"==typeof n&&n.unref&&n.unref(),n}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),i=n(0),o=function(){function e(e,t){if(void 0===t){this.n=e.split("/");for(var n=0,r=0;r<this.n.length;r++)this.n[r].length>0&&(this.n[n]=this.n[r],n++);this.n.length=n,this.i=0}else this.n=e,this.i=t}return Object.defineProperty(e,"Empty",{get:function(){return new e("")},enumerable:!0,configurable:!0}),e.prototype.getFront=function(){return this.i>=this.n.length?null:this.n[this.i]},e.prototype.getLength=function(){return this.n.length-this.i},e.prototype.popFront=function(){var t=this.i;return t<this.n.length&&t++,new e(this.n,t)},e.prototype.getBack=function(){return this.i<this.n.length?this.n[this.n.length-1]:null},e.prototype.toString=function(){for(var e="",t=this.i;t<this.n.length;t++)""!==this.n[t]&&(e+="/"+this.n[t]);return e||"/"},e.prototype.toUrlEncodedString=function(){for(var e="",t=this.i;t<this.n.length;t++)""!==this.n[t]&&(e+="/"+encodeURIComponent(this.n[t]+""));return e||"/"},e.prototype.slice=function(e){return void 0===e&&(e=0),this.n.slice(this.i+e)},e.prototype.parent=function(){if(this.i>=this.n.length)return null;for(var t=[],n=this.i;n<this.n.length-1;n++)t.push(this.n[n]);return new e(t,0)},e.prototype.child=function(t){for(var n=[],r=this.i;r<this.n.length;r++)n.push(this.n[r]);if(t instanceof e)for(var r=t.i;r<t.n.length;r++)n.push(t.n[r]);else for(var i=t.split("/"),r=0;r<i.length;r++)i[r].length>0&&n.push(i[r]);return new e(n,0)},e.prototype.isEmpty=function(){return this.i>=this.n.length},e.relativePath=function(t,n){var r=t.getFront(),i=n.getFront();if(null===r)return n;if(r===i)return e.relativePath(t.popFront(),n.popFront());throw Error("INTERNAL ERROR: innerPath ("+n+") is not within outerPath ("+t+")")},e.comparePaths=function(e,t){for(var n=e.slice(),i=t.slice(),o=0;o<n.length&&o<i.length;o++){var a=r.nameCompare(n[o],i[o]);if(0!==a)return a}return n.length===i.length?0:n.length<i.length?-1:1},e.prototype.equals=function(e){if(this.getLength()!==e.getLength())return!1;for(var t=this.i,n=e.i;t<=this.n.length;t++,n++)if(this.n[t]!==e.n[n])return!1;return!0},e.prototype.contains=function(e){var t=this.i,n=e.i;if(this.getLength()>e.getLength())return!1;for(;t<this.n.length;){if(this.n[t]!==e.n[n])return!1;++t,++n}return!0},e}();t.Path=o;var a=function(){function e(e,t){this.o=t,this.u=e.slice(),this.l=Math.max(1,this.u.length);for(var n=0;n<this.u.length;n++)this.l+=i.stringLength(this.u[n]);this.f()}return Object.defineProperty(e,"MAX_PATH_DEPTH",{get:function(){return 32},enumerable:!0,configurable:!0}),Object.defineProperty(e,"MAX_PATH_LENGTH_BYTES",{get:function(){return 768},enumerable:!0,configurable:!0}),e.prototype.push=function(e){this.u.length>0&&(this.l+=1),this.u.push(e),this.l+=i.stringLength(e),this.f()},e.prototype.pop=function(){var e=this.u.pop();this.l-=i.stringLength(e),this.u.length>0&&(this.l-=1)},e.prototype.f=function(){if(this.l>e.MAX_PATH_LENGTH_BYTES)throw Error(this.o+"has a key path longer than "+e.MAX_PATH_LENGTH_BYTES+" bytes ("+this.l+").");if(this.u.length>e.MAX_PATH_DEPTH)throw Error(this.o+"path specified exceeds the maximum depth that can be written ("+e.MAX_PATH_DEPTH+") or object contains a cycle "+this.toErrorString())},e.prototype.toErrorString=function(){return 0==this.u.length?"":"in property '"+this.u.join(".")+"'"},e}();t.ValidationPath=a},function(e,t,n){"use strict";function r(e){a=e}function i(e){s=e}var o=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var a,s,u=n(14),l=n(1),h=n(5),c=n(15);t.setNodeFromJSON=r,t.setMaxNode=i;var p=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return o(t,e),t.prototype.compare=function(e,t){var n=e.node.getPriority(),r=t.node.getPriority(),i=n.compareTo(r);return 0===i?l.nameCompare(e.name,t.name):i},t.prototype.isDefinedOn=function(e){return!e.getPriority().isEmpty()},t.prototype.indexedValueChanged=function(e,t){return!e.getPriority().equals(t.getPriority())},t.prototype.minPost=function(){return h.NamedNode.MIN},t.prototype.maxPost=function(){return new h.NamedNode(l.MAX_NAME,new c.LeafNode("[PRIORITY-POST]",s))},t.prototype.makePost=function(e,t){var n=a(e);return new h.NamedNode(t,new c.LeafNode("[PRIORITY-POST]",n))},t.prototype.toString=function(){return".priority"},t}(u.Index);t.PriorityIndex=p,t.PRIORITY_INDEX=new p},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i,o=n(0),a=n(1),s=n(16),u=n(5),l=n(37),h=n(3),c=n(10),p=n(39),d=n(15),f=n(41),_=function(){function e(e,t,n){this._=e,this.y=t,this.g=n,this.m=null,this.y&&l.validatePriorityNode(this.y),this._.isEmpty()&&o.assert(!this.y||this.y.isEmpty(),"An empty node cannot have a priority")}return Object.defineProperty(e,"EMPTY_NODE",{get:function(){return i||(i=new e(new s.SortedMap(f.NAME_COMPARATOR),null,p.IndexMap.Default))},enumerable:!0,configurable:!0}),e.prototype.isLeafNode=function(){return!1},e.prototype.getPriority=function(){return this.y||i},e.prototype.updatePriority=function(t){return this._.isEmpty()?this:new e(this._,t,this.g)},e.prototype.getImmediateChild=function(e){if(".priority"===e)return this.getPriority();var t=this._.get(e);return null===t?i:t},e.prototype.getChild=function(e){var t=e.getFront();return null===t?this:this.getImmediateChild(t).getChild(e.popFront())},e.prototype.hasChild=function(e){return null!==this._.get(e)},e.prototype.updateImmediateChild=function(t,n){if(o.assert(n,"We should always be passing snapshot nodes"),".priority"===t)return this.updatePriority(n);var r=new u.NamedNode(t,n),a=void 0,s=void 0,l=void 0;return n.isEmpty()?(a=this._.remove(t),s=this.g.removeFromIndexes(r,this._)):(a=this._.insert(t,n),s=this.g.addToIndexes(r,this._)),l=a.isEmpty()?i:this.y,new e(a,l,s)},e.prototype.updateChild=function(e,t){var n=e.getFront();if(null===n)return t;o.assert(".priority"!==e.getFront()||1===e.getLength(),".priority must be the last token in a path");var r=this.getImmediateChild(n).updateChild(e.popFront(),t);return this.updateImmediateChild(n,r)},e.prototype.isEmpty=function(){return this._.isEmpty()},e.prototype.numChildren=function(){return this._.count()},e.prototype.val=function(t){if(this.isEmpty())return null;var n={},r=0,i=0,o=!0;if(this.forEachChild(h.PRIORITY_INDEX,function(a,s){n[a]=s.val(t),r++,o&&e.e.test(a)?i=Math.max(i,+a):o=!1}),!t&&o&&i<2*r){var a=[];for(var s in n)a[s]=n[s];return a}return t&&!this.getPriority().isEmpty()&&(n[".priority"]=this.getPriority().val()),n},e.prototype.hash=function(){if(null===this.m){var e="";this.getPriority().isEmpty()||(e+="priority:"+l.priorityHashText(this.getPriority().val())+":"),this.forEachChild(h.PRIORITY_INDEX,function(t,n){var r=n.hash();""!==r&&(e+=":"+t+":"+r)}),this.m=""===e?"":a.sha1(e)}return this.m},e.prototype.getPredecessorChildName=function(e,t,n){var r=this.C(n);if(r){var i=r.getPredecessorKey(new u.NamedNode(e,t));return i?i.name:null}return this._.getPredecessorKey(e)},e.prototype.getFirstChildName=function(e){var t=this.C(e);if(t){var n=t.minKey();return n&&n.name}return this._.minKey()},e.prototype.getFirstChild=function(e){var t=this.getFirstChildName(e);return t?new u.NamedNode(t,this._.get(t)):null},e.prototype.getLastChildName=function(e){var t=this.C(e);if(t){var n=t.maxKey();return n&&n.name}return this._.maxKey()},e.prototype.getLastChild=function(e){var t=this.getLastChildName(e);return t?new u.NamedNode(t,this._.get(t)):null},e.prototype.forEachChild=function(e,t){var n=this.C(e);return n?n.inorderTraversal(function(e){return t(e.name,e.node)}):this._.inorderTraversal(t)},e.prototype.getIterator=function(e){return this.getIteratorFrom(e.minPost(),e)},e.prototype.getIteratorFrom=function(e,t){var n=this.C(t);if(n)return n.getIteratorFrom(e,function(e){return e});for(var r=this._.getIteratorFrom(e.name,u.NamedNode.Wrap),i=r.peek();null!=i&&t.compare(i,e)<0;)r.getNext(),i=r.peek();return r},e.prototype.getReverseIterator=function(e){return this.getReverseIteratorFrom(e.maxPost(),e)},e.prototype.getReverseIteratorFrom=function(e,t){var n=this.C(t);if(n)return n.getReverseIteratorFrom(e,function(e){return e});for(var r=this._.getReverseIteratorFrom(e.name,u.NamedNode.Wrap),i=r.peek();null!=i&&t.compare(i,e)>0;)r.getNext(),i=r.peek();return r},e.prototype.compareTo=function(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===t.MAX_NODE?-1:0},e.prototype.withIndex=function(t){if(t===c.KEY_INDEX||this.g.hasIndex(t))return this;var n=this.g.addIndex(t,this._);return new e(this._,this.y,n)},e.prototype.isIndexed=function(e){return e===c.KEY_INDEX||this.g.hasIndex(e)},e.prototype.equals=function(e){if(e===this)return!0;if(e.isLeafNode())return!1;var t=e;if(this.getPriority().equals(t.getPriority())){if(this._.count()===t._.count()){for(var n=this.getIterator(h.PRIORITY_INDEX),r=t.getIterator(h.PRIORITY_INDEX),i=n.getNext(),o=r.getNext();i&&o;){if(i.name!==o.name||!i.node.equals(o.node))return!1;i=n.getNext(),o=r.getNext()}return null===i&&null===o}return!1}return!1},e.prototype.C=function(e){return e===c.KEY_INDEX?null:this.g.get(""+e)},e.e=/^(0|[1-9]\d*)$/,e}();t.ChildrenNode=_;var y=function(e){function t(){return e.call(this,new s.SortedMap(f.NAME_COMPARATOR),_.EMPTY_NODE,p.IndexMap.Default)||this}return r(t,e),t.prototype.compareTo=function(e){return e===this?0:1},t.prototype.equals=function(e){return e===this},t.prototype.getPriority=function(){return this},t.prototype.getImmediateChild=function(e){return _.EMPTY_NODE},t.prototype.isEmpty=function(){return!1},t}(_);t.MaxNode=y,t.MAX_NODE=new y,Object.defineProperties(u.NamedNode,{MIN:{value:new u.NamedNode(a.MIN_NAME,_.EMPTY_NODE)},MAX:{value:new u.NamedNode(a.MAX_NAME,t.MAX_NODE)}}),c.KeyIndex.__EMPTY_NODE=_.EMPTY_NODE,d.LeafNode.__childrenNodeConstructor=_,l.setMaxNode(t.MAX_NODE),h.setMaxNode(t.MAX_NODE)},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){this.name=e,this.node=t}return e.Wrap=function(t,n){return new e(t,n)},e}();t.NamedNode=r},,function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(2),i=n(0),o=n(1),a=n(0),s=n(0);t.N=/[\[\].#$\/\u0000-\u001F\u007F]/,t.P=/[\[\].#$\u0000-\u001F\u007F]/,t.S=10485760,t.isValidKey=function(e){return"string"==typeof e&&0!==e.length&&!t.N.test(e)},t.isValidPathString=function(e){return"string"==typeof e&&0!==e.length&&!t.P.test(e)},t.isValidRootPathString=function(e){return e&&(e=e.replace(/^\/*\.info(\/|$)/,"/")),t.isValidPathString(e)},t.isValidPriority=function(e){return null===e||"string"==typeof e||"number"==typeof e&&!o.isInvalidJSONNumber(e)||e&&"object"==typeof e&&i.contains(e,".sv")},t.validateFirebaseDataArg=function(e,n,r,i,o){o&&void 0===r||t.validateFirebaseData(a.errorPrefix(e,n,o),r,i)},t.validateFirebaseData=function(e,n,a){var u=a instanceof r.Path?new r.ValidationPath(a,e):a;if(void 0===n)throw Error(e+"contains undefined "+u.toErrorString());if("function"==typeof n)throw Error(e+"contains a function "+u.toErrorString()+" with contents = "+n);if(o.isInvalidJSONNumber(n))throw Error(e+"contains "+n+" "+u.toErrorString());if("string"==typeof n&&n.length>t.S/3&&s.stringLength(n)>t.S)throw Error(e+"contains a string greater than "+t.S+" utf8 bytes "+u.toErrorString()+" ('"+n.substring(0,50)+"...')");if(n&&"object"==typeof n){var l=!1,h=!1;if(i.forEach(n,function(n,r){if(".value"===n)l=!0;else if(".priority"!==n&&".sv"!==n&&(h=!0,!t.isValidKey(n)))throw Error(e+" contains an invalid key ("+n+") "+u.toErrorString()+'.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');u.push(n),t.validateFirebaseData(e,r,u),u.pop()}),l&&h)throw Error(e+' contains ".value" child '+u.toErrorString()+" in addition to actual children.")}},t.validateFirebaseMergePaths=function(e,n){var i,o;for(i=0;i<n.length;i++){o=n[i];for(var a=o.slice(),s=0;s<a.length;s++)if(".priority"===a[s]&&s===a.length-1);else if(!t.isValidKey(a[s]))throw Error(e+"contains an invalid key ("+a[s]+") in path "+o+'. Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"')}n.sort(r.Path.comparePaths);var u=null;for(i=0;i<n.length;i++){if(o=n[i],null!==u&&u.contains(o))throw Error(e+"contains a path "+u+" that is ancestor of another path "+o);u=o}},t.validateFirebaseMergeDataArg=function(e,n,o,s,u){if(!u||void 0!==o){var l=a.errorPrefix(e,n,u);if(!o||"object"!=typeof o||Array.isArray(o))throw Error(l+" must be an object containing the children to replace.");var h=[];i.forEach(o,function(e,n){var i=new r.Path(e);if(t.validateFirebaseData(l,n,s.child(i)),".priority"===i.getBack()&&!t.isValidPriority(n))throw Error(l+"contains an invalid value for '"+i+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");h.push(i)}),t.validateFirebaseMergePaths(l,h)}},t.validatePriority=function(e,n,r,i){if(!i||void 0!==r){if(o.isInvalidJSONNumber(r))throw Error(a.errorPrefix(e,n,i)+"is "+r+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!t.isValidPriority(r))throw Error(a.errorPrefix(e,n,i)+"must be a valid Firebase priority (a string, finite number, server value, or null).")}},t.validateEventType=function(e,t,n,r){if(!r||void 0!==n)switch(n){case"value":case"child_added":case"child_removed":case"child_changed":case"child_moved":break;default:throw Error(a.errorPrefix(e,t,r)+'must be a valid event type = "value", "child_added", "child_removed", "child_changed", or "child_moved".')}},t.validateKey=function(e,n,r,i){if(!(i&&void 0===r||t.isValidKey(r)))throw Error(a.errorPrefix(e,n,i)+'was an invalid key = "'+r+'".  Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]").')},t.validatePathString=function(e,n,r,i){if(!(i&&void 0===r||t.isValidPathString(r)))throw Error(a.errorPrefix(e,n,i)+'was an invalid path = "'+r+'". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"')},t.validateRootPathString=function(e,n,r,i){r&&(r=r.replace(/^\/*\.info(\/|$)/,"/")),t.validatePathString(e,n,r,i)},t.validateWritablePath=function(e,t){if(".info"===t.getFront())throw Error(e+" failed = Can't modify data under /.info/")},t.validateUrl=function(e,n,r){var i=""+r.path;if("string"!=typeof r.repoInfo.host||0===r.repoInfo.host.length||!t.isValidKey(r.repoInfo.namespace)||0!==i.length&&!t.isValidRootPathString(i))throw Error(a.errorPrefix(e,n,!1)+'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".')},t.validateCredential=function(e,t,n,r){if((!r||void 0!==n)&&"string"!=typeof n)throw Error(a.errorPrefix(e,t,r)+"must be a valid credential (a string).")},t.validateBoolean=function(e,t,n,r){if((!r||void 0!==n)&&"boolean"!=typeof n)throw Error(a.errorPrefix(e,t,r)+"must be a boolean.")},t.validateString=function(e,t,n,r){if((!r||void 0!==n)&&"string"!=typeof n)throw Error(a.errorPrefix(e,t,r)+"must be a valid string.")},t.validateObject=function(e,t,n,r){if(!(r&&void 0===n||n&&"object"==typeof n&&null!==n))throw Error(a.errorPrefix(e,t,r)+"must be a valid object.")},t.validateObjectContainsKey=function(e,t,n,r,o,s){if(!n||"object"!=typeof n||!i.contains(n,r)){if(o)return;throw Error(a.errorPrefix(e,t,o)+'must contain the key "'+r+'"')}if(s){var u=i.safeGet(n,r);if("number"===s&&"number"!=typeof u||"string"===s&&"string"!=typeof u||"boolean"===s&&"boolean"!=typeof u||"function"===s&&"function"!=typeof u||"object"===s&&"object"!=typeof u&&u)throw o?Error(a.errorPrefix(e,t,o)+'contains invalid value for key "'+r+'" (must be of type "'+s+'")'):Error(a.errorPrefix(e,t,o)+'must contain the key "'+r+'" with type "'+s+'"')}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0);!function(e){e[e.OVERWRITE=0]="OVERWRITE",e[e.MERGE=1]="MERGE",e[e.ACK_USER_WRITE=2]="ACK_USER_WRITE",e[e.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"}(t.OperationType||(t.OperationType={}));var i=function(){function e(e,t,n,i){this.fromUser=e,this.fromServer=t,this.queryId=n,this.tagged=i,r.assert(!i||t,"Tagged queries must be from server.")}return e.User=new e(!0,!1,null,!1),e.Server=new e(!1,!0,null,!1),e.forServerTaggedQuery=function(t){return new e(!1,!0,t,!0)},e}();t.OperationSource=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t,n,r,i){this.type=e,this.snapshotNode=t,this.childName=n,this.oldSnap=r,this.prevName=i}return e.valueChange=function(t){return new e(e.VALUE,t)},e.childAddedChange=function(t,n){return new e(e.CHILD_ADDED,n,t)},e.childRemovedChange=function(t,n){return new e(e.CHILD_REMOVED,n,t)},e.childChangedChange=function(t,n,r){return new e(e.CHILD_CHANGED,n,t,r)},e.childMovedChange=function(t,n){return new e(e.CHILD_MOVED,n,t)},e.CHILD_ADDED="child_added",e.CHILD_REMOVED="child_removed",e.CHILD_CHANGED="child_changed",e.CHILD_MOVED="child_moved",e.VALUE="value",e}();t.Change=r},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i,o=n(14),a=n(5),s=n(1),u=n(0),l=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return r(t,e),Object.defineProperty(t,"__EMPTY_NODE",{get:function(){return i},set:function(e){i=e},enumerable:!0,configurable:!0}),t.prototype.compare=function(e,t){return s.nameCompare(e.name,t.name)},t.prototype.isDefinedOn=function(e){throw u.assertionError("KeyIndex.isDefinedOn not expected to be called.")},t.prototype.indexedValueChanged=function(e,t){return!1},t.prototype.minPost=function(){return a.NamedNode.MIN},t.prototype.maxPost=function(){return new a.NamedNode(s.MAX_NAME,i)},t.prototype.makePost=function(e,t){return u.assert("string"==typeof e,"KeyIndex indexValue must always be a string."),new a.NamedNode(e,i)},t.prototype.toString=function(){return".key"},t}(o.Index);t.KeyIndex=l,t.KEY_INDEX=new l},function(e,t,n){"use strict";function r(e,t){if(void 0===t&&(t=null),null===e)return i.ChildrenNode.EMPTY_NODE;if("object"==typeof e&&".priority"in e&&(t=e[".priority"]),u.assert(null===t||"string"==typeof t||"number"==typeof t||"object"==typeof t&&".sv"in t,"Invalid priority type found: "+typeof t),"object"==typeof e&&".value"in e&&null!==e[".value"]&&(e=e[".value"]),"object"!=typeof e||".sv"in e){var n=e;return new o.LeafNode(n,r(t))}if(e instanceof Array||!d){var f=i.ChildrenNode.EMPTY_NODE,_=e;return s.forEach(_,function(e,t){if(s.contains(_,e)&&"."!==e.substring(0,1)){var n=r(t);!n.isLeafNode()&&n.isEmpty()||(f=f.updateImmediateChild(e,n))}}),f.updatePriority(r(t))}var y=[],v=!1,g=e;if(s.forEach(g,function(e,t){if("string"!=typeof e||"."!==e.substring(0,1)){var n=r(g[e]);n.isEmpty()||(v=v||!n.getPriority().isEmpty(),y.push(new a.NamedNode(e,n)))}}),0==y.length)return i.ChildrenNode.EMPTY_NODE;var m=l.buildChildSet(y,h.NAME_ONLY_COMPARATOR,function(e){return e.name},h.NAME_COMPARATOR);if(v){var C=l.buildChildSet(y,p.PRIORITY_INDEX.getCompare());return new i.ChildrenNode(m,r(t),new c.IndexMap({".priority":C},{".priority":p.PRIORITY_INDEX}))}return new i.ChildrenNode(m,r(t),c.IndexMap.Default)}Object.defineProperty(t,"__esModule",{value:!0});var i=n(4),o=n(15),a=n(5),s=n(0),u=n(0),l=n(40),h=n(41),c=n(39),p=n(3),d=!0;t.nodeFromJSON=r,p.setNodeFromJSON(r)},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(80),i=n(81),o=function(e){try{if("undefined"!=typeof window&&void 0!==window[e]){var t=window[e];return t.setItem("firebase:sentinel","cache"),t.removeItem("firebase:sentinel"),new r.DOMStorageWrapper(t)}}catch(e){}return new i.MemoryStorage};t.PersistentStorage=o("localStorage"),t.SessionStorage=o("sessionStorage")},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.PROTOCOL_VERSION="5",t.VERSION_PARAM="v",t.TRANSPORT_SESSION_PARAM="s",t.REFERER_PARAM="r",t.FORGE_REF="f",t.FORGE_DOMAIN="firebaseio.com",t.LAST_SESSION_PARAM="ls",t.WEBSOCKET="websocket",t.LONG_POLLING="long_polling"},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(5),i=n(1),o=function(){function e(){}return e.prototype.getCompare=function(){return this.compare.bind(this)},e.prototype.indexedValueChanged=function(e,t){var n=new r.NamedNode(i.MIN_NAME,e),o=new r.NamedNode(i.MIN_NAME,t);return 0!==this.compare(n,o)},e.prototype.minPost=function(){return r.NamedNode.MIN},e}();t.Index=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r,i=n(0),o=n(1),a=n(37),s=function(){function e(t,n){void 0===n&&(n=e.__childrenNodeConstructor.EMPTY_NODE),this.T=t,this.y=n,this.m=null,i.assert(void 0!==this.T&&null!==this.T,"LeafNode shouldn't be created with null/undefined value."),a.validatePriorityNode(this.y)}return Object.defineProperty(e,"__childrenNodeConstructor",{get:function(){return r},set:function(e){r=e},enumerable:!0,configurable:!0}),e.prototype.isLeafNode=function(){return!0},e.prototype.getPriority=function(){return this.y},e.prototype.updatePriority=function(t){return new e(this.T,t)},e.prototype.getImmediateChild=function(t){return".priority"===t?this.y:e.__childrenNodeConstructor.EMPTY_NODE},e.prototype.getChild=function(t){return t.isEmpty()?this:".priority"===t.getFront()?this.y:e.__childrenNodeConstructor.EMPTY_NODE},e.prototype.hasChild=function(){return!1},e.prototype.getPredecessorChildName=function(e,t){return null},e.prototype.updateImmediateChild=function(t,n){return".priority"===t?this.updatePriority(n):n.isEmpty()&&".priority"!==t?this:e.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(t,n).updatePriority(this.y)},e.prototype.updateChild=function(t,n){var r=t.getFront();return null===r?n:n.isEmpty()&&".priority"!==r?this:(i.assert(".priority"!==r||1===t.getLength(),".priority must be the last token in a path"),this.updateImmediateChild(r,e.__childrenNodeConstructor.EMPTY_NODE.updateChild(t.popFront(),n)))},e.prototype.isEmpty=function(){return!1},e.prototype.numChildren=function(){return 0},e.prototype.forEachChild=function(e,t){return!1},e.prototype.val=function(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()},e.prototype.hash=function(){if(null===this.m){var e="";this.y.isEmpty()||(e+="priority:"+a.priorityHashText(this.y.val())+":");var t=typeof this.T;e+=t+":",e+="number"===t?o.doubleToIEEE754String(this.T):this.T,this.m=o.sha1(e)}return this.m},e.prototype.getValue=function(){return this.T},e.prototype.compareTo=function(t){return t===e.__childrenNodeConstructor.EMPTY_NODE?1:t instanceof e.__childrenNodeConstructor?-1:(i.assert(t.isLeafNode(),"Unknown node type"),this.w(t))},e.prototype.w=function(t){var n=typeof t.T,r=typeof this.T,o=e.VALUE_TYPE_ORDER.indexOf(n),a=e.VALUE_TYPE_ORDER.indexOf(r);return i.assert(o>=0,"Unknown leaf type: "+n),i.assert(a>=0,"Unknown leaf type: "+r),o===a?"object"===r?0:this.T<t.T?-1:this.T===t.T?0:1:a-o},e.prototype.withIndex=function(){return this},e.prototype.isIndexed=function(){return!0},e.prototype.equals=function(e){if(e===this)return!0;if(e.isLeafNode()){var t=e;return this.T===t.T&&this.y.equals(t.y)}return!1},e.VALUE_TYPE_ORDER=["object","boolean","number","string"],e}();t.LeafNode=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t,n,r,i){void 0===i&&(i=null),this.I=r,this.R=i,this.O=[];for(var o=1;!e.isEmpty();)if(e=e,o=t?n(e.key,t):1,r&&(o*=-1),o<0)e=this.I?e.left:e.right;else{if(0===o){this.O.push(e);break}this.O.push(e),e=this.I?e.right:e.left}}return e.prototype.getNext=function(){if(0===this.O.length)return null;var e,t=this.O.pop();if(e=this.R?this.R(t.key,t.value):{key:t.key,value:t.value},this.I)for(t=t.left;!t.isEmpty();)this.O.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.O.push(t),t=t.left;return e},e.prototype.hasNext=function(){return this.O.length>0},e.prototype.peek=function(){if(0===this.O.length)return null;var e=this.O[this.O.length-1];return this.R?this.R(e.key,e.value):{key:e.key,value:e.value}},e}();t.SortedMapIterator=r;var i=function(){function e(t,n,r,i,o){this.key=t,this.value=n,this.color=null!=r?r:e.RED,this.left=null!=i?i:a.EMPTY_NODE,this.right=null!=o?o:a.EMPTY_NODE}return e.prototype.copy=function(t,n,r,i,o){return new e(null!=t?t:this.key,null!=n?n:this.value,null!=r?r:this.color,null!=i?i:this.left,null!=o?o:this.right)},e.prototype.count=function(){return this.left.count()+1+this.right.count()},e.prototype.isEmpty=function(){return!1},e.prototype.inorderTraversal=function(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)},e.prototype.reverseTraversal=function(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)},e.prototype.A=function(){return this.left.isEmpty()?this:this.left.A()},e.prototype.minKey=function(){return this.A().key},e.prototype.maxKey=function(){return this.right.isEmpty()?this.key:this.right.maxKey()},e.prototype.insert=function(e,t,n){var r,i;return i=this,r=n(e,i.key),i=r<0?i.copy(null,null,null,i.left.insert(e,t,n),null):0===r?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,n)),i.D()},e.prototype.M=function(){if(this.left.isEmpty())return a.EMPTY_NODE;var e=this;return e.left.L()||e.left.left.L()||(e=e.F()),e=e.copy(null,null,null,e.left.M(),null),e.D()},e.prototype.remove=function(e,t){var n,r;if(n=this,t(e,n.key)<0)n.left.isEmpty()||n.left.L()||n.left.left.L()||(n=n.F()),n=n.copy(null,null,null,n.left.remove(e,t),null);else{if(n.left.L()&&(n=n.x()),n.right.isEmpty()||n.right.L()||n.right.left.L()||(n=n.k()),0===t(e,n.key)){if(n.right.isEmpty())return a.EMPTY_NODE;r=n.right.A(),n=n.copy(r.key,r.value,null,null,n.right.M())}n=n.copy(null,null,null,null,n.right.remove(e,t))}return n.D()},e.prototype.L=function(){return this.color},e.prototype.D=function(){var e=this;return e.right.L()&&!e.left.L()&&(e=e.W()),e.left.L()&&e.left.left.L()&&(e=e.x()),e.left.L()&&e.right.L()&&(e=e.j()),e},e.prototype.F=function(){var e=this.j();return e.right.left.L()&&(e=e.copy(null,null,null,null,e.right.x()),e=e.W(),e=e.j()),e},e.prototype.k=function(){var e=this.j();return e.left.left.L()&&(e=e.x(),e=e.j()),e},e.prototype.W=function(){var t=this.copy(null,null,e.RED,null,this.right.left);return this.right.copy(null,null,this.color,t,null)},e.prototype.x=function(){var t=this.copy(null,null,e.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,t)},e.prototype.j=function(){var e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)},e.prototype.V=function(){var e=this.Q();return Math.pow(2,e)<=this.count()+1},e.prototype.Q=function(){var e;if(this.L()&&this.left.L())throw Error("Red node has red child("+this.key+","+this.value+")");if(this.right.L())throw Error("Right child of ("+this.key+","+this.value+") is red");if((e=this.left.Q())!==this.right.Q())throw Error("Black depths differ");return e+(this.L()?0:1)},e.RED=!0,e.BLACK=!1,e}();t.LLRBNode=i;var o=function(){function e(){}return e.prototype.copy=function(e,t,n,r,i){return this},e.prototype.insert=function(e,t,n){return new i(e,t,null)},e.prototype.remove=function(e,t){return this},e.prototype.count=function(){return 0},e.prototype.isEmpty=function(){return!0},e.prototype.inorderTraversal=function(e){return!1},e.prototype.reverseTraversal=function(e){return!1},e.prototype.minKey=function(){return null},e.prototype.maxKey=function(){return null},e.prototype.Q=function(){return 0},e.prototype.L=function(){return!1},e}();t.LLRBEmptyNode=o;var a=function(){function e(t,n){void 0===n&&(n=e.EMPTY_NODE),this.U=t,this.B=n}return e.prototype.insert=function(t,n){return new e(this.U,this.B.insert(t,n,this.U).copy(null,null,i.BLACK,null,null))},e.prototype.remove=function(t){return new e(this.U,this.B.remove(t,this.U).copy(null,null,i.BLACK,null,null))},e.prototype.get=function(e){for(var t,n=this.B;!n.isEmpty();){if(0===(t=this.U(e,n.key)))return n.value;t<0?n=n.left:t>0&&(n=n.right)}return null},e.prototype.getPredecessorKey=function(e){for(var t,n=this.B,r=null;!n.isEmpty();){if(0===(t=this.U(e,n.key))){if(n.left.isEmpty())return r?r.key:null;for(n=n.left;!n.right.isEmpty();)n=n.right;return n.key}t<0?n=n.left:t>0&&(r=n,n=n.right)}throw Error("Attempted to find predecessor key for a nonexistent key.  What gives?")},e.prototype.isEmpty=function(){return this.B.isEmpty()},e.prototype.count=function(){return this.B.count()},e.prototype.minKey=function(){return this.B.minKey()},e.prototype.maxKey=function(){return this.B.maxKey()},e.prototype.inorderTraversal=function(e){return this.B.inorderTraversal(e)},e.prototype.reverseTraversal=function(e){return this.B.reverseTraversal(e)},e.prototype.getIterator=function(e){return new r(this.B,null,this.U,!1,e)},e.prototype.getIteratorFrom=function(e,t){return new r(this.B,e,this.U,!1,t)},e.prototype.getReverseIteratorFrom=function(e,t){return new r(this.B,e,this.U,!0,t)},e.prototype.getReverseIterator=function(e){return new r(this.B,null,this.U,!0,e)},e.EMPTY_NODE=new o,e}();t.SortedMap=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(43),i=n(11),o=n(2),a=n(44),s=n(86),u=n(97),l=n(0),h=n(1),c=n(0),p=n(98),d=n(25),f=n(100),_=n(49),y=n(101),v=n(50),g=n(106),m=n(32),C=function(){function e(e,t,n){var r=this;this.H=e,this.app=n,this.dataUpdateCount=0,this.G=null,this.K=new y.EventQueue,this.Y=1,this.X=null,this.z=new a.SparseSnapshotTree,this.J=null;var i=new p.AuthTokenProvider(n);if(this.$=d.StatsManager.getCollection(e),t||h.beingCrawled())this.Z=new g.ReadonlyRestClient(this.H,this.ee.bind(this),i),setTimeout(this.te.bind(this,!0),0);else{var o=n.options.databaseAuthVariableOverride;if(void 0!==o&&null!==o){if("object"!=typeof o)throw Error("Only objects are supported for option databaseAuthVariableOverride");try{l.stringify(o)}catch(e){throw Error("Invalid authOverride provided: "+e)}}this.J=new v.PersistentConnection(this.H,this.ee.bind(this),this.te.bind(this),this.ne.bind(this),i,o),this.Z=this.J}i.addTokenChangeListener(function(e){r.Z.refreshAuthToken(e)}),this.re=d.StatsManager.getOrCreateReporter(e,function(){return new f.StatsReporter(r.$,r.Z)}),this.ie(),this.oe=new u.SnapshotHolder,this.ae=new s.SyncTree({startListening:function(e,t,n,i){var o=[],a=r.oe.getNode(e.path);return a.isEmpty()||(o=r.ae.applyServerOverwrite(e.path,a),setTimeout(function(){i("ok")},0)),o},stopListening:function(){}}),this.se("connected",!1),this.ue=new s.SyncTree({startListening:function(e,t,n,i){return r.Z.listen(e,n,t,function(t,n){var o=i(t,n);r.K.raiseEventsForChangedPath(e.path,o)}),[]},stopListening:function(e,t){r.Z.unlisten(e,t)}})}return e.prototype.toString=function(){return(this.H.secure?"https://":"http://")+this.H.host},e.prototype.name=function(){return this.H.namespace},e.prototype.serverTime=function(){var e=this.oe.getNode(new o.Path(".info/serverTimeOffset")),t=e.val()||0;return(new Date).getTime()+t},e.prototype.generateServerValues=function(){return r.generateWithValues({timestamp:this.serverTime()})},e.prototype.ee=function(e,t,n,r){this.dataUpdateCount++;var a=new o.Path(e);t=this.X?this.X(e,t):t;var s=[];if(r)if(n){var u=c.map(t,function(e){return i.nodeFromJSON(e)});s=this.ue.applyTaggedQueryMerge(a,u,r)}else{var l=i.nodeFromJSON(t);s=this.ue.applyTaggedQueryOverwrite(a,l,r)}else if(n){var h=c.map(t,function(e){return i.nodeFromJSON(e)});s=this.ue.applyServerMerge(a,h)}else{var p=i.nodeFromJSON(t);s=this.ue.applyServerOverwrite(a,p)}var d=a;s.length>0&&(d=this.le(a)),this.K.raiseEventsForChangedPath(d,s)},e.prototype.he=function(e){this.X=e},e.prototype.te=function(e){this.se("connected",e),!1===e&&this.ce()},e.prototype.ne=function(e){var t=this;h.each(e,function(e,n){t.se(n,e)})},e.prototype.se=function(e,t){var n=new o.Path("/.info/"+e),r=i.nodeFromJSON(t);this.oe.updateSnapshot(n,r);var a=this.ae.applyServerOverwrite(n,r);this.K.raiseEventsForChangedPath(n,a)},e.prototype.pe=function(){return this.Y++},e.prototype.setWithPriority=function(e,t,n,o){var a=this;this.de("set",{path:""+e,value:t,priority:n});var s=this.generateServerValues(),u=i.nodeFromJSON(t,n),l=r.resolveDeferredValueSnapshot(u,s),c=this.pe(),p=this.ue.applyUserOverwrite(e,l,c,!0);this.K.queueEvents(p),this.Z.put(""+e,u.val(!0),function(t,n){var r="ok"===t;r||h.warn("set at "+e+" failed: "+t);var i=a.ue.ackUserWrite(c,!r);a.K.raiseEventsForChangedPath(e,i),a.callOnCompleteCallback(o,t,n)});var d=this.fe(e);this.le(d),this.K.raiseEventsForChangedPath(d,[])},e.prototype.update=function(e,t,n){var o=this;this.de("update",{path:""+e,value:t});var a=!0,s=this.generateServerValues(),u={};if(c.forEach(t,function(e,t){a=!1;var n=i.nodeFromJSON(t);u[e]=r.resolveDeferredValueSnapshot(n,s)}),a)h.log("update() called with empty data.  Don't do anything."),this.callOnCompleteCallback(n,"ok");else{var l=this.pe(),p=this.ue.applyUserMerge(e,u,l);this.K.queueEvents(p),this.Z.merge(""+e,t,function(t,r){var i="ok"===t;i||h.warn("update at "+e+" failed: "+t);var a=o.ue.ackUserWrite(l,!i),s=a.length>0?o.le(e):e;o.K.raiseEventsForChangedPath(s,a),o.callOnCompleteCallback(n,t,r)}),c.forEach(t,function(t){var n=o.fe(e.child(t));o.le(n)}),this.K.raiseEventsForChangedPath(e,[])}},e.prototype.ce=function(){var e=this;this.de("onDisconnectEvents");var t=this.generateServerValues(),n=r.resolveDeferredValueTree(this.z,t),i=[];n.forEachTree(o.Path.Empty,function(t,n){i=i.concat(e.ue.applyServerOverwrite(t,n));var r=e.fe(t);e.le(r)}),this.z=new a.SparseSnapshotTree,this.K.raiseEventsForChangedPath(o.Path.Empty,i)},e.prototype.onDisconnectCancel=function(e,t){var n=this;this.Z.onDisconnectCancel(""+e,function(r,i){"ok"===r&&n.z.forget(e),n.callOnCompleteCallback(t,r,i)})},e.prototype.onDisconnectSet=function(e,t,n){var r=this,o=i.nodeFromJSON(t);this.Z.onDisconnectPut(""+e,o.val(!0),function(t,i){"ok"===t&&r.z.remember(e,o),r.callOnCompleteCallback(n,t,i)})},e.prototype.onDisconnectSetWithPriority=function(e,t,n,r){var o=this,a=i.nodeFromJSON(t,n);this.Z.onDisconnectPut(""+e,a.val(!0),function(t,n){"ok"===t&&o.z.remember(e,a),o.callOnCompleteCallback(r,t,n)})},e.prototype.onDisconnectUpdate=function(e,t,n){var r=this;if(c.isEmpty(t))return h.log("onDisconnect().update() called with empty data.  Don't do anything."),void this.callOnCompleteCallback(n,"ok");this.Z.onDisconnectMerge(""+e,t,function(o,a){"ok"===o&&c.forEach(t,function(t,n){var o=i.nodeFromJSON(n);r.z.remember(e.child(t),o)}),r.callOnCompleteCallback(n,o,a)})},e.prototype.addEventCallbackForQuery=function(e,t){var n;n=".info"===e.path.getFront()?this.ae.addEventRegistration(e,t):this.ue.addEventRegistration(e,t),this.K.raiseEventsAtPath(e.path,n)},e.prototype.removeEventCallbackForQuery=function(e,t){var n;n=".info"===e.path.getFront()?this.ae.removeEventRegistration(e,t):this.ue.removeEventRegistration(e,t),this.K.raiseEventsAtPath(e.path,n)},e.prototype.interrupt=function(){this.J&&this.J.interrupt("repo_interrupt")},e.prototype.resume=function(){this.J&&this.J.resume("repo_interrupt")},e.prototype.stats=function(e){if(void 0===e&&(e=!1),"undefined"!=typeof console){var t;e?(this.G||(this.G=new _.StatsListener(this.$)),t=this.G.get()):t=this.$.get();var n=Object.keys(t).reduce(function(e,t){return Math.max(t.length,e)},0);c.forEach(t,function(e,t){for(var r=e.length;r<n+2;r++)e+=" ";console.log(e+t)})}},e.prototype.statsIncrementCounter=function(e){this.$.incrementCounter(e),this.re.includeStat(e)},e.prototype.de=function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n="";this.J&&(n=this.J.id+":"),h.log.apply(void 0,[n].concat(e))},e.prototype.callOnCompleteCallback=function(e,t,n){e&&h.exceptionGuard(function(){if("ok"==t)e(null);else{var r=(t||"error").toUpperCase(),i=r;n&&(i+=": "+n);var o=Error(i);o.code=r,e(o)}})},Object.defineProperty(e.prototype,"database",{get:function(){return this.__database||(this.__database=new m.Database(this))},enumerable:!0,configurable:!0}),e}();t.Repo=C},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t,n){this._e=e,this.ye=t,this.ve=n}return e.prototype.isFullyInitialized=function(){return this.ye},e.prototype.isFiltered=function(){return this.ve},e.prototype.isCompleteForPath=function(e){if(e.isEmpty())return this.isFullyInitialized()&&!this.ve;var t=e.getFront();return this.isCompleteForChild(t)},e.prototype.isCompleteForChild=function(e){return this.isFullyInitialized()&&!this.ve||this._e.hasChild(e)},e.prototype.getNode=function(){return this._e},e}();t.CacheNode=r},,,function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i=n(35),o=n(82),a=n(1),s=n(83),u=n(36),l=n(17),h=n(2),c=n(107),p=n(7),d=n(0),f=n(0),_=n(47),y=function(e){function t(t,n){if(!(t instanceof l.Repo))throw Error("new Reference() no longer supported - use app.database().");return e.call(this,t,n,c.QueryParams.DEFAULT,!1)||this}return r(t,e),t.prototype.getKey=function(){return d.validateArgCount("Reference.key",0,0,arguments.length),this.path.isEmpty()?null:this.path.getBack()},t.prototype.child=function(e){return d.validateArgCount("Reference.child",1,1,arguments.length),"number"==typeof e?e+="":e instanceof h.Path||(null===this.path.getFront()?p.validateRootPathString("Reference.child",1,e,!1):p.validatePathString("Reference.child",1,e,!1)),new t(this.repo,this.path.child(e))},t.prototype.getParent=function(){d.validateArgCount("Reference.parent",0,0,arguments.length);var e=this.path.parent();return null===e?null:new t(this.repo,e)},t.prototype.getRoot=function(){d.validateArgCount("Reference.root",0,0,arguments.length);for(var e=this;null!==e.getParent();)e=e.getParent();return e},t.prototype.databaseProp=function(){return this.repo.database},t.prototype.set=function(e,t){d.validateArgCount("Reference.set",1,2,arguments.length),p.validateWritablePath("Reference.set",this.path),p.validateFirebaseDataArg("Reference.set",1,e,this.path,!1),d.validateCallback("Reference.set",2,t,!0);var n=new f.Deferred;return this.repo.setWithPriority(this.path,e,null,n.wrapCallback(t)),n.promise},t.prototype.update=function(e,t){if(d.validateArgCount("Reference.update",1,2,arguments.length),p.validateWritablePath("Reference.update",this.path),Array.isArray(e)){for(var n={},r=0;r<e.length;++r)n[""+r]=e[r];e=n,a.warn("Passing an Array to Firebase.update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}p.validateFirebaseMergeDataArg("Reference.update",1,e,this.path,!1),d.validateCallback("Reference.update",2,t,!0);var i=new f.Deferred;return this.repo.update(this.path,e,i.wrapCallback(t)),i.promise},t.prototype.setWithPriority=function(e,t,n){if(d.validateArgCount("Reference.setWithPriority",2,3,arguments.length),p.validateWritablePath("Reference.setWithPriority",this.path),p.validateFirebaseDataArg("Reference.setWithPriority",1,e,this.path,!1),p.validatePriority("Reference.setWithPriority",2,t,!1),d.validateCallback("Reference.setWithPriority",3,n,!0),".length"===this.getKey()||".keys"===this.getKey())throw"Reference.setWithPriority failed: "+this.getKey()+" is a read-only object.";var r=new f.Deferred;return this.repo.setWithPriority(this.path,e,t,r.wrapCallback(n)),r.promise},t.prototype.remove=function(e){return d.validateArgCount("Reference.remove",0,1,arguments.length),p.validateWritablePath("Reference.remove",this.path),d.validateCallback("Reference.remove",1,e,!0),this.set(null,e)},t.prototype.transaction=function(e,t,n){if(d.validateArgCount("Reference.transaction",1,3,arguments.length),p.validateWritablePath("Reference.transaction",this.path),d.validateCallback("Reference.transaction",1,e,!1),d.validateCallback("Reference.transaction",2,t,!0),p.validateBoolean("Reference.transaction",3,n,!0),".length"===this.getKey()||".keys"===this.getKey())throw"Reference.transaction failed: "+this.getKey()+" is a read-only object.";void 0===n&&(n=!0);var r=new f.Deferred;"function"==typeof t&&r.promise.catch(function(){});var i=function(e,n,i){e?r.reject(e):r.resolve(new o.TransactionResult(n,i)),"function"==typeof t&&t(e,n,i)};return this.repo.startTransaction(this.path,e,i,n),r.promise},t.prototype.setPriority=function(e,t){d.validateArgCount("Reference.setPriority",1,2,arguments.length),p.validateWritablePath("Reference.setPriority",this.path),p.validatePriority("Reference.setPriority",1,e,!1),d.validateCallback("Reference.setPriority",2,t,!0);var n=new f.Deferred;return this.repo.setWithPriority(this.path.child(".priority"),e,null,n.wrapCallback(t)),n.promise},t.prototype.push=function(e,t){d.validateArgCount("Reference.push",0,2,arguments.length),p.validateWritablePath("Reference.push",this.path),p.validateFirebaseDataArg("Reference.push",1,e,this.path,!0),d.validateCallback("Reference.push",2,t,!0);var n,r=this.repo.serverTime(),i=s.nextPushId(r),o=this.child(i),a=this.child(i);return n=null!=e?o.set(e,t).then(function(){return a}):Promise.resolve(a),o.then=n.then.bind(n),o.catch=n.then.bind(n,void 0),"function"==typeof t&&n.catch(function(){}),o},t.prototype.onDisconnect=function(){return p.validateWritablePath("Reference.onDisconnect",this.path),new i.OnDisconnect(this.repo,this.path)},Object.defineProperty(t.prototype,"database",{get:function(){return this.databaseProp()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"key",{get:function(){return this.getKey()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"parent",{get:function(){return this.getParent()},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"root",{get:function(){return this.getRoot()},enumerable:!0,configurable:!0}),t}(u.Query);t.Reference=y,u.Query.__referenceConstructor=y,_.SyncPoint.__referenceConstructor=y},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(7),o=n(2),a=n(3),s=function(){function e(e,t,n){this._e=e,this.ge=t,this.me=n}return e.prototype.val=function(){return r.validateArgCount("DataSnapshot.val",0,0,arguments.length),this._e.val()},e.prototype.exportVal=function(){return r.validateArgCount("DataSnapshot.exportVal",0,0,arguments.length),this._e.val(!0)},e.prototype.toJSON=function(){return r.validateArgCount("DataSnapshot.toJSON",0,1,arguments.length),this.exportVal()},e.prototype.exists=function(){return r.validateArgCount("DataSnapshot.exists",0,0,arguments.length),!this._e.isEmpty()},e.prototype.child=function(t){r.validateArgCount("DataSnapshot.child",0,1,arguments.length),t+="",i.validatePathString("DataSnapshot.child",1,t,!1);var n=new o.Path(t),s=this.ge.child(n);return new e(this._e.getChild(n),s,a.PRIORITY_INDEX)},e.prototype.hasChild=function(e){r.validateArgCount("DataSnapshot.hasChild",1,1,arguments.length),i.validatePathString("DataSnapshot.hasChild",1,e,!1);var t=new o.Path(e);return!this._e.getChild(t).isEmpty()},e.prototype.getPriority=function(){return r.validateArgCount("DataSnapshot.getPriority",0,0,arguments.length),this._e.getPriority().val()},e.prototype.forEach=function(t){var n=this;return r.validateArgCount("DataSnapshot.forEach",1,1,arguments.length),r.validateCallback("DataSnapshot.forEach",1,t,!1),!this._e.isLeafNode()&&!!this._e.forEachChild(this.me,function(r,i){return t(new e(i,n.ge.child(r),a.PRIORITY_INDEX))})},e.prototype.hasChildren=function(){return r.validateArgCount("DataSnapshot.hasChildren",0,0,arguments.length),!this._e.isLeafNode()&&!this._e.isEmpty()},Object.defineProperty(e.prototype,"key",{get:function(){return this.ge.getKey()},enumerable:!0,configurable:!0}),e.prototype.numChildren=function(){return r.validateArgCount("DataSnapshot.numChildren",0,0,arguments.length),this._e.numChildren()},e.prototype.getRef=function(){return r.validateArgCount("DataSnapshot.ref",0,0,arguments.length),this.ge},Object.defineProperty(e.prototype,"ref",{get:function(){return this.getRef()},enumerable:!0,configurable:!0}),e}();t.DataSnapshot=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r,i=n(16),o=n(2),a=n(1),s=n(0),u=function(){return r||(r=new i.SortedMap(a.stringCompare)),r},l=function(){function e(e,t){void 0===t&&(t=u()),this.value=e,this.children=t}return e.fromObject=function(t){var n=e.Empty;return s.forEach(t,function(e,t){n=n.set(new o.Path(e),t)}),n},e.prototype.isEmpty=function(){return null===this.value&&this.children.isEmpty()},e.prototype.findRootMostMatchingPathAndValue=function(e,t){if(null!=this.value&&t(this.value))return{path:o.Path.Empty,value:this.value};if(e.isEmpty())return null;var n=e.getFront(),r=this.children.get(n);if(null!==r){var i=r.findRootMostMatchingPathAndValue(e.popFront(),t);return null!=i?{path:new o.Path(n).child(i.path),value:i.value}:null}return null},e.prototype.findRootMostValueAndPath=function(e){return this.findRootMostMatchingPathAndValue(e,function(){return!0})},e.prototype.subtree=function(t){if(t.isEmpty())return this;var n=t.getFront(),r=this.children.get(n);return null!==r?r.subtree(t.popFront()):e.Empty},e.prototype.set=function(t,n){if(t.isEmpty())return new e(n,this.children);var r=t.getFront(),i=this.children.get(r)||e.Empty,o=i.set(t.popFront(),n),a=this.children.insert(r,o);return new e(this.value,a)},e.prototype.remove=function(t){if(t.isEmpty())return this.children.isEmpty()?e.Empty:new e(null,this.children);var n=t.getFront(),r=this.children.get(n);if(r){var i=r.remove(t.popFront()),o=void 0;return o=i.isEmpty()?this.children.remove(n):this.children.insert(n,i),null===this.value&&o.isEmpty()?e.Empty:new e(this.value,o)}return this},e.prototype.get=function(e){if(e.isEmpty())return this.value;var t=e.getFront(),n=this.children.get(t);return n?n.get(e.popFront()):null},e.prototype.setTree=function(t,n){if(t.isEmpty())return n;var r=t.getFront(),i=this.children.get(r)||e.Empty,o=i.setTree(t.popFront(),n),a=void 0;return a=o.isEmpty()?this.children.remove(r):this.children.insert(r,o),new e(this.value,a)},e.prototype.fold=function(e){return this.Ce(o.Path.Empty,e)},e.prototype.Ce=function(e,t){var n={};return this.children.inorderTraversal(function(r,i){n[r]=i.Ce(e.child(r),t)}),t(e,this.value,n)},e.prototype.findOnPath=function(e,t){return this.Ee(e,o.Path.Empty,t)},e.prototype.Ee=function(e,t,n){var r=!!this.value&&n(t,this.value);if(r)return r;if(e.isEmpty())return null;var i=e.getFront(),o=this.children.get(i);return o?o.Ee(e.popFront(),t.child(i),n):null},e.prototype.foreachOnPath=function(e,t){return this.Ne(e,o.Path.Empty,t)},e.prototype.Ne=function(t,n,r){if(t.isEmpty())return this;this.value&&r(n,this.value);var i=t.getFront(),o=this.children.get(i);return o?o.Ne(t.popFront(),n.child(i),r):e.Empty},e.prototype.foreach=function(e){this.Pe(o.Path.Empty,e)},e.prototype.Pe=function(e,t){this.children.inorderTraversal(function(n,r){r.Pe(e.child(n),t)}),this.value&&t(e,this.value)},e.prototype.foreachChild=function(e){this.children.inorderTraversal(function(t,n){n.value&&e(t,n.value)})},e.Empty=new e(null),e}();t.ImmutableTree=l},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(9),o=n(4),a=n(3),s=function(){function e(e){this.me=e}return e.prototype.updateChild=function(e,t,n,o,a,s){r.assert(e.isIndexed(this.me),"A node must be indexed if only a child is updated");var u=e.getImmediateChild(t);return u.getChild(o).equals(n.getChild(o))&&u.isEmpty()==n.isEmpty()?e:(null!=s&&(n.isEmpty()?e.hasChild(t)?s.trackChildChange(i.Change.childRemovedChange(t,u)):r.assert(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):u.isEmpty()?s.trackChildChange(i.Change.childAddedChange(t,n)):s.trackChildChange(i.Change.childChangedChange(t,n,u))),e.isLeafNode()&&n.isEmpty()?e:e.updateImmediateChild(t,n).withIndex(this.me))},e.prototype.updateFullNode=function(e,t,n){return null!=n&&(e.isLeafNode()||e.forEachChild(a.PRIORITY_INDEX,function(e,r){t.hasChild(e)||n.trackChildChange(i.Change.childRemovedChange(e,r))}),t.isLeafNode()||t.forEachChild(a.PRIORITY_INDEX,function(t,r){if(e.hasChild(t)){var o=e.getImmediateChild(t);o.equals(r)||n.trackChildChange(i.Change.childChangedChange(t,r,o))}else n.trackChildChange(i.Change.childAddedChange(t,r))})),t.withIndex(this.me)},e.prototype.updatePriority=function(e,t){return e.isEmpty()?o.ChildrenNode.EMPTY_NODE:e.updatePriority(t)},e.prototype.filtersNodes=function(){return!1},e.prototype.getIndexedFilter=function(){return this},e.prototype.getIndex=function(){return this.me},e}();t.IndexedFilter=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(99),i=function(){function e(){}return e.getCollection=function(e){var t=""+e;return this.be[t]||(this.be[t]=new r.StatsCollection),this.be[t]},e.getOrCreateReporter=function(e,t){var n=""+e;return this.Se[n]||(this.Se[n]=t()),this.Se[n]},e.be={},e.Se={},e}();t.StatsManager=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(17),o=n(1),a=n(33),s=n(7);n(109);var u,l=function(){function e(){this.Te={},this.we=!1}return e.getInstance=function(){return u||(u=new e),u},e.prototype.interrupt=function(){for(var e in this.Te)for(var t in this.Te[e])this.Te[e][t].interrupt()},e.prototype.resume=function(){for(var e in this.Te)for(var t in this.Te[e])this.Te[e][t].resume()},e.prototype.databaseFromApp=function(e,t){var n=t||e.options.databaseURL;void 0===n&&o.fatal("Can't determine Firebase Database URL.  Be sure to include databaseURL option when calling firebase.intializeApp().");var r=a.parseRepoInfo(n),i=r.repoInfo;return s.validateUrl("Invalid Firebase Database URL",1,r),r.path.isEmpty()||o.fatal("Database URL must point to the root of a Firebase Database (not including a child path)."),this.createRepo(i,e).database},e.prototype.deleteRepo=function(e){var t=r.safeGet(this.Te,e.app.name);t&&r.safeGet(t,e.H.toURLString())===e||o.fatal("Database "+e.app.name+"("+e.H+") has already been deleted."),e.interrupt(),delete t[e.H.toURLString()]},e.prototype.createRepo=function(e,t){var n=r.safeGet(this.Te,t.name);n||(n={},this.Te[t.name]=n);var a=r.safeGet(n,e.toURLString());return a&&o.fatal("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),a=new i.Repo(e,this.we,t),n[e.toURLString()]=a,a},e.prototype.forceRestClient=function(e){this.we=e},e}();t.RepoManager=l},,,,,,function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),i=n(33),o=n(2),a=n(21),s=n(17),u=n(26),l=n(0),h=n(7),c=function(){function e(e){this.Ie=e,e instanceof s.Repo||r.fatal("Don't call new Database() directly - please use firebase.database()."),this.B=new a.Reference(e,o.Path.Empty),this.INTERNAL=new p(this)}return Object.defineProperty(e.prototype,"app",{get:function(){return this.Ie.app},enumerable:!0,configurable:!0}),e.prototype.ref=function(e){return this.Re("ref"),l.validateArgCount("database.ref",0,1,arguments.length),void 0!==e?this.B.child(e):this.B},e.prototype.refFromURL=function(e){var t="database.refFromURL";this.Re(t),l.validateArgCount(t,1,1,arguments.length);var n=i.parseRepoInfo(e);h.validateUrl(t,1,n);var o=n.repoInfo;return o.host!==this.Ie.H.host&&r.fatal(t+": Host name does not match the current database: (found "+o.host+" but expected "+this.Ie.H.host+")"),this.ref(""+n.path)},e.prototype.Re=function(e){null===this.Ie&&r.fatal("Cannot call "+e+" on a deleted database.")},e.prototype.goOffline=function(){l.validateArgCount("database.goOffline",0,0,arguments.length),this.Re("goOffline"),this.Ie.interrupt()},e.prototype.goOnline=function(){l.validateArgCount("database.goOnline",0,0,arguments.length),this.Re("goOnline"),this.Ie.resume()},e.ServerValue={TIMESTAMP:{".sv":"timestamp"}},e}();t.Database=c;var p=function(){function e(e){this.database=e}return e.prototype.delete=function(){return this.database.Re("delete"),u.RepoManager.getInstance().deleteRepo(this.database.Ie),this.database.Ie=null,this.database.B=null,this.database.INTERNAL=null,this.database=null,Promise.resolve()},e}();t.DatabaseInternals=p},function(e,t,n){"use strict";function r(e){for(var t="",n=e.split("/"),r=0;r<n.length;r++)if(n[r].length>0){var i=n[r];try{i=decodeURIComponent(i.replace(/\+/g," "))}catch(e){}t+="/"+i}return t}Object.defineProperty(t,"__esModule",{value:!0});var i=n(2),o=n(34),a=n(1);t.parseRepoInfo=function(e){var n=t.parseURL(e),r=n.subdomain;"firebase"===n.domain&&a.fatal(n.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),r&&"undefined"!=r||a.fatal("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),n.secure||a.warnIfPageIsSecure();var s="ws"===n.scheme||"wss"===n.scheme;return{repoInfo:new o.RepoInfo(n.host,n.secure,r,s),path:new i.Path(n.pathString)}},t.parseURL=function(e){var t="",n="",i="",o="",a=!0,s="https",u=443;if("string"==typeof e){var l=e.indexOf("//");l>=0&&(s=e.substring(0,l-1),e=e.substring(l+2));var h=e.indexOf("/");-1===h&&(h=e.length),t=e.substring(0,h),o=r(e.substring(h));var c=t.split(".");3===c.length?(n=c[1],i=c[0].toLowerCase()):2===c.length&&(n=c[0]),(l=t.indexOf(":"))>=0&&(a="https"===s||"wss"===s,u=parseInt(t.substring(l+1),10))}return{host:t,port:u,domain:n,subdomain:i,secure:a,scheme:s,pathString:o}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(0),o=n(12),a=n(13),s=function(){function e(e,t,n,r,i){void 0===i&&(i=""),this.secure=t,this.namespace=n,this.webSocketOnly=r,this.persistenceKey=i,this.host=e.toLowerCase(),this.domain=this.host.substr(this.host.indexOf(".")+1),this.internalHost=o.PersistentStorage.get("host:"+e)||this.host}return e.prototype.needsQueryParam=function(){return this.host!==this.internalHost},e.prototype.isCacheableHost=function(){return"s-"===this.internalHost.substr(0,2)},e.prototype.isDemoHost=function(){return"firebaseio-demo.com"===this.domain},e.prototype.isCustomHost=function(){return"firebaseio.com"!==this.domain&&"firebaseio-demo.com"!==this.domain},e.prototype.updateHost=function(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&o.PersistentStorage.set("host:"+this.host,this.internalHost))},e.prototype.connectionURL=function(e,t){r.assert("string"==typeof e,"typeof type must == string"),r.assert("object"==typeof t,"typeof params must == object");var n;if(e===a.WEBSOCKET)n=(this.secure?"wss://":"ws://")+this.internalHost+"/.ws?";else{if(e!==a.LONG_POLLING)throw Error("Unknown connection type: "+e);n=(this.secure?"https://":"http://")+this.internalHost+"/.lp?"}this.needsQueryParam()&&(t.ns=this.namespace);var o=[];return i.forEach(t,function(e,t){o.push(e+"="+t)}),n+o.join("&")},e.prototype.toString=function(){var e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e},e.prototype.toURLString=function(){return(this.secure?"https://":"http://")+this.host},e}();t.RepoInfo=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(7),o=n(1),a=n(0),s=function(){function e(e,t){this.Ie=e,this.Oe=t}return e.prototype.cancel=function(e){r.validateArgCount("OnDisconnect.cancel",0,1,arguments.length),r.validateCallback("OnDisconnect.cancel",1,e,!0);var t=new a.Deferred;return this.Ie.onDisconnectCancel(this.Oe,t.wrapCallback(e)),t.promise},e.prototype.remove=function(e){r.validateArgCount("OnDisconnect.remove",0,1,arguments.length),i.validateWritablePath("OnDisconnect.remove",this.Oe),r.validateCallback("OnDisconnect.remove",1,e,!0);var t=new a.Deferred;return this.Ie.onDisconnectSet(this.Oe,null,t.wrapCallback(e)),t.promise},e.prototype.set=function(e,t){r.validateArgCount("OnDisconnect.set",1,2,arguments.length),i.validateWritablePath("OnDisconnect.set",this.Oe),i.validateFirebaseDataArg("OnDisconnect.set",1,e,this.Oe,!1),r.validateCallback("OnDisconnect.set",2,t,!0);var n=new a.Deferred;return this.Ie.onDisconnectSet(this.Oe,e,n.wrapCallback(t)),n.promise},e.prototype.setWithPriority=function(e,t,n){r.validateArgCount("OnDisconnect.setWithPriority",2,3,arguments.length),i.validateWritablePath("OnDisconnect.setWithPriority",this.Oe),i.validateFirebaseDataArg("OnDisconnect.setWithPriority",1,e,this.Oe,!1),i.validatePriority("OnDisconnect.setWithPriority",2,t,!1),r.validateCallback("OnDisconnect.setWithPriority",3,n,!0);var o=new a.Deferred;return this.Ie.onDisconnectSetWithPriority(this.Oe,e,t,o.wrapCallback(n)),o.promise},e.prototype.update=function(e,t){if(r.validateArgCount("OnDisconnect.update",1,2,arguments.length),i.validateWritablePath("OnDisconnect.update",this.Oe),Array.isArray(e)){for(var n={},s=0;s<e.length;++s)n[""+s]=e[s];e=n,o.warn("Passing an Array to firebase.database.onDisconnect().update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.")}i.validateFirebaseMergeDataArg("OnDisconnect.update",1,e,this.Oe,!1),r.validateCallback("OnDisconnect.update",2,t,!0);var u=new a.Deferred;return this.Ie.onDisconnectUpdate(this.Oe,e,u.wrapCallback(t)),u.promise},e}();t.OnDisconnect=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r,i=n(0),o=n(10),a=n(3),s=n(38),u=n(42),l=n(1),h=n(2),c=n(7),p=n(0),d=n(84),f=n(0),_=function(){function e(e,t,n,r){this.repo=e,this.path=t,this.Ae=n,this.De=r}return Object.defineProperty(e,"__referenceConstructor",{get:function(){return i.assert(r,"Reference.ts has not been loaded"),r},set:function(e){r=e},enumerable:!0,configurable:!0}),e.Me=function(e){var t=null,n=null;if(e.hasStart()&&(t=e.getIndexStartValue()),e.hasEnd()&&(n=e.getIndexEndValue()),e.getIndex()===o.KEY_INDEX){var r="Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().",h="Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.";if(e.hasStart()){if(e.getIndexStartName()!=l.MIN_NAME)throw Error(r);if("string"!=typeof t)throw Error(h)}if(e.hasEnd()){if(e.getIndexEndName()!=l.MAX_NAME)throw Error(r);if("string"!=typeof n)throw Error(h)}}else if(e.getIndex()===a.PRIORITY_INDEX){if(null!=t&&!c.isValidPriority(t)||null!=n&&!c.isValidPriority(n))throw Error("Query: When ordering by priority, the first argument passed to startAt(), endAt(), or equalTo() must be a valid priority value (null, a number, or a string).")}else if(i.assert(e.getIndex()instanceof u.PathIndex||e.getIndex()===s.VALUE_INDEX,"unknown index type."),null!=t&&"object"==typeof t||null!=n&&"object"==typeof n)throw Error("Query: First argument passed to startAt(), endAt(), or equalTo() cannot be an object.")},e.Le=function(e){if(e.hasStart()&&e.hasEnd()&&e.hasLimit()&&!e.hasAnchoredLimit())throw Error("Query: Can't combine startAt(), endAt(), and limit(). Use limitToFirst() or limitToLast() instead.")},e.prototype.Fe=function(e){if(!0===this.De)throw Error(e+": You can't combine multiple orderBy calls.")},e.prototype.getQueryParams=function(){return this.Ae},e.prototype.getRef=function(){return p.validateArgCount("Query.ref",0,0,arguments.length),new e.__referenceConstructor(this.repo,this.path)},e.prototype.on=function(t,n,r,i){p.validateArgCount("Query.on",2,4,arguments.length),c.validateEventType("Query.on",1,t,!1),p.validateCallback("Query.on",2,n,!1);var o=e.xe("Query.on",r,i);if("value"===t)this.onValueEvent(n,o.cancel,o.context);else{var a={};a[t]=n,this.onChildEvent(a,o.cancel,o.context)}return n},e.prototype.onValueEvent=function(e,t,n){var r=new d.ValueEventRegistration(e,t||null,n||null);this.repo.addEventCallbackForQuery(this,r)},e.prototype.onChildEvent=function(e,t,n){var r=new d.ChildEventRegistration(e,t,n);this.repo.addEventCallbackForQuery(this,r)},e.prototype.off=function(e,t,n){p.validateArgCount("Query.off",0,3,arguments.length),c.validateEventType("Query.off",1,e,!0),p.validateCallback("Query.off",2,t,!0),p.validateContextObject("Query.off",3,n,!0);var r=null,i=null;if("value"===e){var o=t||null;r=new d.ValueEventRegistration(o,null,n||null)}else e&&(t&&(i={},i[e]=t),r=new d.ChildEventRegistration(i,null,n||null));this.repo.removeEventCallbackForQuery(this,r)},e.prototype.once=function(t,n,r,i){var o=this;p.validateArgCount("Query.once",1,4,arguments.length),c.validateEventType("Query.once",1,t,!1),p.validateCallback("Query.once",2,n,!0);var a=e.xe("Query.once",r,i),s=!0,u=new f.Deferred;u.promise.catch(function(){});var l=function(e){s&&(s=!1,o.off(t,l),n&&n.bind(a.context)(e),u.resolve(e))};return this.on(t,l,function(e){o.off(t,l),a.cancel&&a.cancel.bind(a.context)(e),u.reject(e)}),u.promise},e.prototype.limitToFirst=function(t){if(p.validateArgCount("Query.limitToFirst",1,1,arguments.length),"number"!=typeof t||Math.floor(t)!==t||t<=0)throw Error("Query.limitToFirst: First argument must be a positive integer.");if(this.Ae.hasLimit())throw Error("Query.limitToFirst: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");return new e(this.repo,this.path,this.Ae.limitToFirst(t),this.De)},e.prototype.limitToLast=function(t){if(p.validateArgCount("Query.limitToLast",1,1,arguments.length),"number"!=typeof t||Math.floor(t)!==t||t<=0)throw Error("Query.limitToLast: First argument must be a positive integer.");if(this.Ae.hasLimit())throw Error("Query.limitToLast: Limit was already set (by another call to limit, limitToFirst, or limitToLast).");return new e(this.repo,this.path,this.Ae.limitToLast(t),this.De)},e.prototype.orderByChild=function(t){if(p.validateArgCount("Query.orderByChild",1,1,arguments.length),"$key"===t)throw Error('Query.orderByChild: "$key" is invalid.  Use Query.orderByKey() instead.');if("$priority"===t)throw Error('Query.orderByChild: "$priority" is invalid.  Use Query.orderByPriority() instead.');if("$value"===t)throw Error('Query.orderByChild: "$value" is invalid.  Use Query.orderByValue() instead.');c.validatePathString("Query.orderByChild",1,t,!1),this.Fe("Query.orderByChild");var n=new h.Path(t);if(n.isEmpty())throw Error("Query.orderByChild: cannot pass in empty path.  Use Query.orderByValue() instead.");var r=new u.PathIndex(n),i=this.Ae.orderBy(r);return e.Me(i),new e(this.repo,this.path,i,!0)},e.prototype.orderByKey=function(){p.validateArgCount("Query.orderByKey",0,0,arguments.length),this.Fe("Query.orderByKey");var t=this.Ae.orderBy(o.KEY_INDEX);return e.Me(t),new e(this.repo,this.path,t,!0)},e.prototype.orderByPriority=function(){p.validateArgCount("Query.orderByPriority",0,0,arguments.length),this.Fe("Query.orderByPriority");var t=this.Ae.orderBy(a.PRIORITY_INDEX);return e.Me(t),new e(this.repo,this.path,t,!0)},e.prototype.orderByValue=function(){p.validateArgCount("Query.orderByValue",0,0,arguments.length),this.Fe("Query.orderByValue");var t=this.Ae.orderBy(s.VALUE_INDEX);return e.Me(t),new e(this.repo,this.path,t,!0)},e.prototype.startAt=function(t,n){void 0===t&&(t=null),p.validateArgCount("Query.startAt",0,2,arguments.length),c.validateFirebaseDataArg("Query.startAt",1,t,this.path,!0),c.validateKey("Query.startAt",2,n,!0);var r=this.Ae.startAt(t,n);if(e.Le(r),e.Me(r),this.Ae.hasStart())throw Error("Query.startAt: Starting point was already set (by another call to startAt or equalTo).");return void 0===t&&(t=null,n=null),new e(this.repo,this.path,r,this.De)},e.prototype.endAt=function(t,n){void 0===t&&(t=null),p.validateArgCount("Query.endAt",0,2,arguments.length),c.validateFirebaseDataArg("Query.endAt",1,t,this.path,!0),c.validateKey("Query.endAt",2,n,!0);var r=this.Ae.endAt(t,n);if(e.Le(r),e.Me(r),this.Ae.hasEnd())throw Error("Query.endAt: Ending point was already set (by another call to endAt or equalTo).");return new e(this.repo,this.path,r,this.De)},e.prototype.equalTo=function(e,t){if(p.validateArgCount("Query.equalTo",1,2,arguments.length),c.validateFirebaseDataArg("Query.equalTo",1,e,this.path,!1),c.validateKey("Query.equalTo",2,t,!0),this.Ae.hasStart())throw Error("Query.equalTo: Starting point was already set (by another call to startAt or equalTo).");if(this.Ae.hasEnd())throw Error("Query.equalTo: Ending point was already set (by another call to endAt or equalTo).");return this.startAt(e,t).endAt(e,t)},e.prototype.toString=function(){return p.validateArgCount("Query.toString",0,0,arguments.length),""+this.repo+this.path.toUrlEncodedString()},e.prototype.toJSON=function(){return p.validateArgCount("Query.toJSON",0,1,arguments.length),""+this},e.prototype.queryObject=function(){return this.Ae.getQueryObject()},e.prototype.queryIdentifier=function(){var e=this.queryObject(),t=l.ObjectToUniqueKey(e);return"{}"===t?"default":t},e.prototype.isEqual=function(t){if(p.validateArgCount("Query.isEqual",1,1,arguments.length),!(t instanceof e))throw Error("Query.isEqual failed: First argument must be an instance of firebase.database.Query.");var n=this.repo===t.repo,r=this.path.equals(t.path),i=this.queryIdentifier()===t.queryIdentifier();return n&&r&&i},e.xe=function(e,t,n){var r={cancel:null,context:null};if(t&&n)r.cancel=t,p.validateCallback(e,3,r.cancel,!0),r.context=n,p.validateContextObject(e,4,r.context,!0);else if(t)if("object"==typeof t&&null!==t)r.context=t;else{if("function"!=typeof t)throw Error(p.errorPrefix(e,3,!0)+" must either be a cancel callback or a context object.");r.cancel=t}return r},Object.defineProperty(e.prototype,"ref",{get:function(){return this.getRef()},enumerable:!0,configurable:!0}),e}();t.Query=_},function(e,t,n){"use strict";function r(e){i=e}Object.defineProperty(t,"__esModule",{value:!0});var i,o=n(0),a=n(1),s=n(0);t.setMaxNode=r,t.priorityHashText=function(e){return"number"==typeof e?"number:"+a.doubleToIEEE754String(e):"string:"+e},t.validatePriorityNode=function(e){if(e.isLeafNode()){var t=e.val();o.assert("string"==typeof t||"number"==typeof t||"object"==typeof t&&s.contains(t,".sv"),"Priority must be a string or number.")}else o.assert(e===i||e.isEmpty(),"priority of unexpected type.");o.assert(e===i||e.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")}},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i=n(14),o=n(5),a=n(1),s=n(11),u=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return r(t,e),t.prototype.compare=function(e,t){var n=e.node.compareTo(t.node);return 0===n?a.nameCompare(e.name,t.name):n},t.prototype.isDefinedOn=function(e){return!0},t.prototype.indexedValueChanged=function(e,t){return!e.equals(t)},t.prototype.minPost=function(){return o.NamedNode.MIN},t.prototype.maxPost=function(){return o.NamedNode.MAX},t.prototype.makePost=function(e,t){var n=s.nodeFromJSON(e);return new o.NamedNode(t,n)},t.prototype.toString=function(){return".value"},t}(i.Index);t.ValueIndex=u,t.VALUE_INDEX=new u},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r,i=n(0),o=n(40),a=n(0),s=n(5),u=n(3),l=n(10),h={},c=function(){function e(e,t){this.ke=e,this.We=t}return Object.defineProperty(e,"Default",{get:function(){return i.assert(h&&u.PRIORITY_INDEX,"ChildrenNode.ts has not been loaded"),r=r||new e({".priority":h},{".priority":u.PRIORITY_INDEX})},enumerable:!0,configurable:!0}),e.prototype.get=function(e){var t=a.safeGet(this.ke,e);if(!t)throw Error("No index defined for "+e);return t===h?null:t},e.prototype.hasIndex=function(e){return a.contains(this.We,""+e)},e.prototype.addIndex=function(t,n){i.assert(t!==l.KEY_INDEX,"KeyIndex always exists and isn't meant to be added to the IndexMap.");for(var r=[],u=!1,c=n.getIterator(s.NamedNode.Wrap),p=c.getNext();p;)u=u||t.isDefinedOn(p.node),r.push(p),p=c.getNext();var d;d=u?o.buildChildSet(r,t.getCompare()):h;var f=""+t,_=a.clone(this.We);_[f]=t;var y=a.clone(this.ke);return y[f]=d,new e(y,_)},e.prototype.addToIndexes=function(t,n){var r=this;return new e(a.map(this.ke,function(e,u){var l=a.safeGet(r.We,u);if(i.assert(l,"Missing index implementation for "+u),e===h){if(l.isDefinedOn(t.node)){for(var c=[],p=n.getIterator(s.NamedNode.Wrap),d=p.getNext();d;)d.name!=t.name&&c.push(d),d=p.getNext();return c.push(t),o.buildChildSet(c,l.getCompare())}return h}var f=n.get(t.name),_=e;return f&&(_=_.remove(new s.NamedNode(t.name,f))),_.insert(t,t.node)}),this.We)},e.prototype.removeFromIndexes=function(t,n){return new e(a.map(this.ke,function(e){if(e===h)return e;var r=n.get(t.name);return r?e.remove(new s.NamedNode(t.name,r)):e}),this.We)},e}();t.IndexMap=c},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(16),i=n(16),o=Math.log(2),a=function(){function e(e){this.count=function(e){return parseInt(Math.log(e)/o,10)}(e+1),this.je=this.count-1;var t=function(e){return parseInt(Array(e+1).join("1"),2)}(this.count);this.Ve=e+1&t}return e.prototype.nextBitIsOne=function(){var e=!(this.Ve&1<<this.je);return this.je--,e},e}();t.buildChildSet=function(e,t,n,o){e.sort(t);var s=function(t,i){var o,a,u=i-t;if(0==u)return null;if(1==u)return o=e[t],a=n?n(o):o,new r.LLRBNode(a,o.node,r.LLRBNode.BLACK,null,null);var l=parseInt(u/2,10)+t,h=s(t,l),c=s(l+1,i);return o=e[l],a=n?n(o):o,new r.LLRBNode(a,o.node,r.LLRBNode.BLACK,h,c)},u=new a(e.length),l=function(t){for(var i=null,o=null,a=e.length,u=function(t,i){var o=a-t,u=a;a-=t;var h=s(o+1,u),c=e[o],p=n?n(c):c;l(new r.LLRBNode(p,c.node,i,null,h))},l=function(e){i?(i.left=e,i=e):(o=e,i=e)},h=0;h<t.count;++h){var c=t.nextBitIsOne(),p=Math.pow(2,t.count-(h+1));c?u(p,r.LLRBNode.BLACK):(u(p,r.LLRBNode.BLACK),u(p,r.LLRBNode.RED))}return o}(u);return new i.SortedMap(o||t,l)}},function(e,t,n){"use strict";function r(e,t){return o.nameCompare(e.name,t.name)}function i(e,t){return o.nameCompare(e,t)}Object.defineProperty(t,"__esModule",{value:!0});var o=n(1);t.NAME_ONLY_COMPARATOR=r,t.NAME_COMPARATOR=i},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i=n(0),o=n(1),a=n(14),s=n(4),u=n(5),l=n(11),h=function(e){function t(t){var n=e.call(this)||this;return n.Qe=t,i.assert(!t.isEmpty()&&".priority"!==t.getFront(),"Can't create PathIndex with empty path or .priority key"),n}return r(t,e),t.prototype.extractChild=function(e){return e.getChild(this.Qe)},t.prototype.isDefinedOn=function(e){return!e.getChild(this.Qe).isEmpty()},t.prototype.compare=function(e,t){var n=this.extractChild(e.node),r=this.extractChild(t.node),i=n.compareTo(r);return 0===i?o.nameCompare(e.name,t.name):i},t.prototype.makePost=function(e,t){var n=l.nodeFromJSON(e),r=s.ChildrenNode.EMPTY_NODE.updateChild(this.Qe,n);return new u.NamedNode(t,r)},t.prototype.maxPost=function(){var e=s.ChildrenNode.EMPTY_NODE.updateChild(this.Qe,s.MAX_NODE);return new u.NamedNode(o.MAX_NAME,e)},t.prototype.toString=function(){return this.Qe.slice().join("/")},t}(a.Index);t.PathIndex=h},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(2),o=n(44),a=n(15),s=n(11),u=n(3);t.generateWithValues=function(e){return e=e||{},e.timestamp=e.timestamp||(new Date).getTime(),e},t.resolveDeferredValue=function(e,t){return e&&"object"==typeof e?(r.assert(".sv"in e,"Unexpected leaf node or priority contents"),t[e[".sv"]]):e},t.resolveDeferredValueTree=function(e,n){var r=new o.SparseSnapshotTree;return e.forEachTree(new i.Path(""),function(e,i){r.remember(e,t.resolveDeferredValueSnapshot(i,n))}),r},t.resolveDeferredValueSnapshot=function(e,n){var r,i=e.getPriority().val(),o=t.resolveDeferredValue(i,n);if(e.isLeafNode()){var l=e,h=t.resolveDeferredValue(l.getValue(),n);return h!==l.getValue()||o!==l.getPriority().val()?new a.LeafNode(h,s.nodeFromJSON(o)):e}var c=e;return r=c,o!==c.getPriority().val()&&(r=r.updatePriority(new a.LeafNode(o))),c.forEachChild(u.PRIORITY_INDEX,function(e,i){var o=t.resolveDeferredValueSnapshot(i,n);o!==i&&(r=r.updateImmediateChild(e,o))}),r}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(2),i=n(3),o=n(45),a=function(){function e(){this.T=null,this._=null}return e.prototype.find=function(e){if(null!=this.T)return this.T.getChild(e);if(e.isEmpty()||null==this._)return null;var t=e.getFront();return e=e.popFront(),this._.contains(t)?this._.get(t).find(e):null},e.prototype.remember=function(t,n){if(t.isEmpty())this.T=n,this._=null;else if(null!==this.T)this.T=this.T.updateChild(t,n);else{null==this._&&(this._=new o.CountedSet);var r=t.getFront();this._.contains(r)||this._.add(r,new e);var i=this._.get(r);t=t.popFront(),i.remember(t,n)}},e.prototype.forget=function(e){if(e.isEmpty())return this.T=null,this._=null,!0;if(null!==this.T){if(this.T.isLeafNode())return!1;var t=this.T;this.T=null;var n=this;return t.forEachChild(i.PRIORITY_INDEX,function(e,t){n.remember(new r.Path(e),t)}),this.forget(e)}if(null!==this._){var o=e.getFront();return e=e.popFront(),this._.contains(o)&&this._.get(o).forget(e)&&this._.remove(o),!!this._.isEmpty()&&(this._=null,!0)}return!0},e.prototype.forEachTree=function(e,t){null!==this.T?t(e,this.T):this.forEachChild(function(n,i){var o=new r.Path(e+"/"+n);i.forEachTree(o,t)})},e.prototype.forEachChild=function(e){null!==this._&&this._.each(function(t,n){e(t,n)})},e}();t.SparseSnapshotTree=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=function(){function e(){this.set={}}return e.prototype.add=function(e,t){this.set[e]=null===t||t},e.prototype.contains=function(e){return r.contains(this.set,e)},e.prototype.get=function(e){return this.contains(e)?this.set[e]:void 0},e.prototype.remove=function(e){delete this.set[e]},e.prototype.clear=function(){this.set={}},e.prototype.isEmpty=function(){return r.isEmpty(this.set)},e.prototype.count=function(){return r.getCount(this.set)},e.prototype.each=function(e){r.forEach(this.set,function(t,n){return e(t,n)})},e.prototype.keys=function(){var e=[];return r.forEach(this.set,function(t){e.push(t)}),e},e}();t.CountedSet=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(8),i=n(2),o=function(){function e(e,t,n){this.source=e,this.path=t,this.snap=n,this.type=r.OperationType.OVERWRITE}return e.prototype.operationForChild=function(t){return this.path.isEmpty()?new e(this.source,i.Path.Empty,this.snap.getImmediateChild(t)):new e(this.source,this.path.popFront(),this.snap)},e}();t.Overwrite=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r,i=n(18),o=n(4),a=n(0),s=n(0),u=n(48),l=n(90),h=function(){function e(){this.qe={}}return Object.defineProperty(e,"__referenceConstructor",{get:function(){return a.assert(r,"Reference.ts has not been loaded"),r},set:function(e){a.assert(!r,"__referenceConstructor has already been defined"),r=e},enumerable:!0,configurable:!0}),e.prototype.isEmpty=function(){return s.isEmpty(this.qe)},e.prototype.applyOperation=function(e,t,n){var r=e.source.queryId;if(null!==r){var i=s.safeGet(this.qe,r);return a.assert(null!=i,"SyncTree gave us an op for an invalid query."),i.applyOperation(e,t,n)}var o=[];return s.forEach(this.qe,function(r,i){o=o.concat(i.applyOperation(e,t,n))}),o},e.prototype.addEventRegistration=function(e,t,n,r,a){var h=e.queryIdentifier(),c=s.safeGet(this.qe,h);if(!c){var p=n.calcCompleteEventCache(a?r:null),d=!1;p?d=!0:r instanceof o.ChildrenNode?(p=n.calcCompleteEventChildren(r),d=!1):(p=o.ChildrenNode.EMPTY_NODE,d=!1);var f=new u.ViewCache(new i.CacheNode(p,d,!1),new i.CacheNode(r,a,!1));c=new l.View(e,f),this.qe[h]=c}return c.addEventRegistration(t),c.getInitialEvents(t)},e.prototype.removeEventRegistration=function(t,n,r){var i=t.queryIdentifier(),o=[],a=[],u=this.hasCompleteView();if("default"===i){var l=this;s.forEach(this.qe,function(e,t){a=a.concat(t.removeEventRegistration(n,r)),t.isEmpty()&&(delete l.qe[e],t.getQuery().getQueryParams().loadsAllData()||o.push(t.getQuery()))})}else{var h=s.safeGet(this.qe,i);h&&(a=a.concat(h.removeEventRegistration(n,r)),h.isEmpty()&&(delete this.qe[i],h.getQuery().getQueryParams().loadsAllData()||o.push(h.getQuery())))}return u&&!this.hasCompleteView()&&o.push(new e.__referenceConstructor(t.repo,t.path)),{removed:o,events:a}},e.prototype.getQueryViews=function(){var e=this;return Object.keys(this.qe).map(function(t){return e.qe[t]}).filter(function(e){return!e.getQuery().getQueryParams().loadsAllData()})},e.prototype.getCompleteServerCache=function(e){var t=null;return s.forEach(this.qe,function(n,r){t=t||r.getCompleteServerCache(e)}),t},e.prototype.viewForQuery=function(e){if(e.getQueryParams().loadsAllData())return this.getCompleteView();var t=e.queryIdentifier();return s.safeGet(this.qe,t)},e.prototype.viewExistsForQuery=function(e){return null!=this.viewForQuery(e)},e.prototype.hasCompleteView=function(){return null!=this.getCompleteView()},e.prototype.getCompleteView=function(){return s.findValue(this.qe,function(e){return e.getQuery().getQueryParams().loadsAllData()})||null},e}();t.SyncPoint=h},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(4),i=n(18),o=function(){function e(e,t){this.Ue=e,this.Be=t}return e.prototype.updateEventSnap=function(t,n,r){return new e(new i.CacheNode(t,n,r),this.Be)},e.prototype.updateServerSnap=function(t,n,r){return new e(this.Ue,new i.CacheNode(t,n,r))},e.prototype.getEventCache=function(){return this.Ue},e.prototype.getCompleteEventSnap=function(){return this.Ue.isFullyInitialized()?this.Ue.getNode():null},e.prototype.getServerCache=function(){return this.Be},e.prototype.getCompleteServerSnap=function(){return this.Be.isFullyInitialized()?this.Be.getNode():null},e.Empty=new e(new i.CacheNode(r.ChildrenNode.EMPTY_NODE,!1,!1),new i.CacheNode(r.ChildrenNode.EMPTY_NODE,!1,!1)),e}();t.ViewCache=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=function(){function e(e){this.He=e,this.Ge=null}return e.prototype.get=function(){var e=this.He.get(),t=r.clone(e);return this.Ge&&r.forEach(this.Ge,function(e,n){t[e]=t[e]-n}),this.Ge=e,t},e}();t.StatsListener=i},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i=n(6),o=n(0),a=n(0),s=n(0),u=n(1),l=n(2),h=n(102),c=n(103),p=n(0),d=n(52),f=n(0),_=n(0),y=n(55),v=1e3,g=3e5,m=function(e){function t(n,r,i,o,a,s){var l=e.call(this)||this;if(l.H=n,l.ee=r,l.te=i,l.ne=o,l.Ke=a,l.Ye=s,l.id=t.Xe++,l.de=u.logWrapper("p:"+l.id+":"),l.ze={},l.Je={},l.$e=[],l.Ze=0,l.et=[],l.tt=!1,l.nt=v,l.rt=g,l.it=null,l.lastSessionId=null,l.ot=null,l.at=!1,l.st={},l.ut=0,l.lt=null,l.ht=null,l.ct=!1,l.pt=0,l.dt=!0,l.ft=null,l._t=null,s&&!_.isNodeSdk())throw Error("Auth override specified in options, but not supported on non Node.js platforms");return l.yt(0),h.VisibilityMonitor.getInstance().on("visible",l.vt,l),-1===n.host.indexOf("fblocal")&&c.OnlineMonitor.getInstance().on("online",l.gt,l),l}return r(t,e),t.prototype.sendRequest=function(e,t,n){var r=++this.ut,i={r:r,a:e,b:t};this.de(a.stringify(i)),s.assert(this.tt,"sendRequest call when we're not connected not allowed."),this.lt.sendRequest(i),n&&(this.st[r]=n)},t.prototype.listen=function(e,t,n,r){var i=e.queryIdentifier(),o=""+e.path;this.de("Listen called for "+o+" "+i),this.Je[o]=this.Je[o]||{},s.assert(e.getQueryParams().isDefault()||!e.getQueryParams().loadsAllData(),"listen() called for non-default but complete query"),s.assert(!this.Je[o][i],"listen() called twice for same path/queryId.");var a={onComplete:r,hashFn:t,query:e,tag:n};this.Je[o][i]=a,this.tt&&this.mt(a)},t.prototype.mt=function(e){var n=this,r=e.query,i=""+r.path,o=r.queryIdentifier();this.de("Listen on "+i+" for "+o);var a={p:i};e.tag&&(a.q=r.queryObject(),a.t=e.tag),a.h=e.hashFn(),this.sendRequest("q",a,function(a){var s=a.d,u=a.s;t.Ct(s,r),(n.Je[i]&&n.Je[i][o])===e&&(n.de("listen response",a),"ok"!==u&&n.Et(i,o),e.onComplete&&e.onComplete(u,s))})},t.Ct=function(e,t){if(e&&"object"==typeof e&&o.contains(e,"w")){var n=o.safeGet(e,"w");if(Array.isArray(n)&&~n.indexOf("no_index")){var r='".indexOn": "'+t.getQueryParams().getIndex()+'"',i=""+t.path;u.warn("Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding "+r+" at "+i+" to your security rules for better performance.")}}},t.prototype.refreshAuthToken=function(e){this.ht=e,this.de("Auth token refreshed"),this.ht?this.tryAuth():this.tt&&this.sendRequest("unauth",{},function(){}),this.Nt(e)},t.prototype.Nt=function(e){(e&&40===e.length||p.isAdmin(e))&&(this.de("Admin auth credential detected.  Reducing max reconnect time."),this.rt=3e4)},t.prototype.tryAuth=function(){var e=this;if(this.tt&&this.ht){var t=this.ht,n=p.isValidFormat(t)?"auth":"gauth",r={cred:t};null===this.Ye?r.noauth=!0:"object"==typeof this.Ye&&(r.authvar=this.Ye),this.sendRequest(n,r,function(n){var r=n.s,i=n.d||"error";e.ht===t&&("ok"===r?e.pt=0:e.Pt(r,i))})}},t.prototype.unlisten=function(e,t){var n=""+e.path,r=e.queryIdentifier();this.de("Unlisten called for "+n+" "+r),s.assert(e.getQueryParams().isDefault()||!e.getQueryParams().loadsAllData(),"unlisten() called for non-default but complete query"),this.Et(n,r)&&this.tt&&this.bt(n,r,e.queryObject(),t)},t.prototype.bt=function(e,t,n,r){this.de("Unlisten on "+e+" for "+t);var i={p:e};r&&(i.q=n,i.t=r),this.sendRequest("n",i)},t.prototype.onDisconnectPut=function(e,t,n){this.tt?this.St("o",e,t,n):this.et.push({pathString:e,action:"o",data:t,onComplete:n})},t.prototype.onDisconnectMerge=function(e,t,n){this.tt?this.St("om",e,t,n):this.et.push({pathString:e,action:"om",data:t,onComplete:n})},t.prototype.onDisconnectCancel=function(e,t){this.tt?this.St("oc",e,null,t):this.et.push({pathString:e,action:"oc",data:null,onComplete:t})},t.prototype.St=function(e,t,n,r){var i={p:t,d:n};this.de("onDisconnect "+e,i),this.sendRequest(e,i,function(e){r&&setTimeout(function(){r(e.s,e.d)},Math.floor(0))})},t.prototype.put=function(e,t,n,r){this.putInternal("p",e,t,n,r)},t.prototype.merge=function(e,t,n,r){this.putInternal("m",e,t,n,r)},t.prototype.putInternal=function(e,t,n,r,i){var o={p:t,d:n};void 0!==i&&(o.h=i),this.$e.push({action:e,request:o,onComplete:r}),this.Ze++;var a=this.$e.length-1;this.tt?this.Tt(a):this.de("Buffering put: "+t)},t.prototype.Tt=function(e){var t=this,n=this.$e[e].action,r=this.$e[e].request,i=this.$e[e].onComplete;this.$e[e].queued=this.tt,this.sendRequest(n,r,function(r){t.de(n+" response",r),delete t.$e[e],t.Ze--,0===t.Ze&&(t.$e=[]),i&&i(r.s,r.d)})},t.prototype.reportStats=function(e){var t=this;if(this.tt){var n={c:e};this.de("reportStats",n),this.sendRequest("s",n,function(e){if("ok"!==e.s){var n=e.d;t.de("reportStats","Error sending stats: "+n)}})}},t.prototype.wt=function(e){if("r"in e){this.de("from server: "+a.stringify(e));var t=e.r,n=this.st[t];n&&(delete this.st[t],n(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.It(e.a,e.b)}},t.prototype.It=function(e,t){this.de("handleServerMessage",e,t),"d"===e?this.ee(t.p,t.d,!1,t.t):"m"===e?this.ee(t.p,t.d,!0,t.t):"c"===e?this.Rt(t.p,t.q):"ac"===e?this.Pt(t.s,t.d):"sd"===e?this.Ot(t):u.error("Unrecognized action received from server: "+a.stringify(e)+"\nAre you using the latest client?")},t.prototype.At=function(e,t){this.de("connection ready"),this.tt=!0,this._t=(new Date).getTime(),this.Dt(e),this.lastSessionId=t,this.dt&&this.Mt(),this.Lt(),this.dt=!1,this.te(!0)},t.prototype.yt=function(e){var t=this;s.assert(!this.lt,"Scheduling a connect when we're already connected/ing?"),this.ot&&clearTimeout(this.ot),this.ot=setTimeout(function(){t.ot=null,t.Ft()},Math.floor(e))},t.prototype.vt=function(e){e&&!this.at&&this.nt===this.rt&&(this.de("Window became visible.  Reducing delay."),this.nt=v,this.lt||this.yt(0)),this.at=e},t.prototype.gt=function(e){e?(this.de("Browser went online."),this.nt=v,this.lt||this.yt(0)):(this.de("Browser went offline.  Killing connection."),this.lt&&this.lt.close())},t.prototype.xt=function(){if(this.de("data client disconnected"),this.tt=!1,this.lt=null,this.kt(),this.st={},this.Wt()){if(this.at){if(this._t){var e=(new Date).getTime()-this._t;e>3e4&&(this.nt=v),this._t=null}}else this.de("Window isn't visible.  Delaying reconnect."),this.nt=this.rt,this.ft=(new Date).getTime();var t=(new Date).getTime()-this.ft,n=Math.max(0,this.nt-t);n=Math.random()*n,this.de("Trying to reconnect in "+n+"ms"),this.yt(n),this.nt=Math.min(this.rt,1.3*this.nt)}this.te(!1)},t.prototype.Ft=function(){if(this.Wt()){this.de("Making a connection attempt"),this.ft=(new Date).getTime(),this._t=null;var e=this.wt.bind(this),n=this.At.bind(this),r=this.xt.bind(this),i=this.id+":"+t.jt++,o=this,a=this.lastSessionId,l=!1,h=null,c=function(){h?h.close():(l=!0,r())},p=function(e){s.assert(h,"sendRequest call when we're not connected not allowed."),h.sendRequest(e)};this.lt={close:c,sendRequest:p};var _=this.ct;this.ct=!1,this.Ke.getToken(_).then(function(t){l?u.log("getToken() completed but was canceled"):(u.log("getToken() completed. Creating connection."),o.ht=t&&t.accessToken,h=new d.Connection(i,o.H,e,n,r,function(e){u.warn(e+" ("+o.H+")"),o.interrupt("server_kill")},a))}).then(null,function(e){o.de("Failed to get token: "+e),l||(f.CONSTANTS.NODE_ADMIN&&u.warn(e),c())})}},t.prototype.interrupt=function(e){u.log("Interrupting connection for reason: "+e),this.ze[e]=!0,this.lt?this.lt.close():(this.ot&&(clearTimeout(this.ot),this.ot=null),this.tt&&this.xt())},t.prototype.resume=function(e){u.log("Resuming connection for reason: "+e),delete this.ze[e],o.isEmpty(this.ze)&&(this.nt=v,this.lt||this.yt(0))},t.prototype.Dt=function(e){var t=e-(new Date).getTime();this.ne({serverTimeOffset:t})},t.prototype.kt=function(){for(var e=0;e<this.$e.length;e++){var t=this.$e[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.$e[e],this.Ze--)}0===this.Ze&&(this.$e=[])},t.prototype.Rt=function(e,t){var n;n=t?t.map(function(e){return u.ObjectToUniqueKey(e)}).join("$"):"default";var r=this.Et(e,n);r&&r.onComplete&&r.onComplete("permission_denied")},t.prototype.Et=function(e,t){var n,r=""+new l.Path(e);return void 0!==this.Je[r]?(n=this.Je[r][t],delete this.Je[r][t],0===o.getCount(this.Je[r])&&delete this.Je[r]):n=void 0,n},t.prototype.Pt=function(e,t){u.log("Auth token revoked: "+e+"/"+t),this.ht=null,this.ct=!0,this.lt.close(),"invalid_token"!==e&&"permission_denied"!==e||++this.pt>=3&&(this.nt=3e4,this.Ke.notifyForInvalidToken())},t.prototype.Ot=function(e){this.it?this.it(e):"msg"in e&&"undefined"!=typeof console&&console.log("FIREBASE: "+e.msg.replace("\n","\nFIREBASE: "))},t.prototype.Lt=function(){var e=this;this.tryAuth(),o.forEach(this.Je,function(t,n){o.forEach(n,function(t,n){e.mt(n)})});for(var t=0;t<this.$e.length;t++)this.$e[t]&&this.Tt(t);for(;this.et.length;){var n=this.et.shift();this.St(n.action,n.pathString,n.data,n.onComplete)}},t.prototype.Mt=function(){var e={},t="js";f.CONSTANTS.NODE_ADMIN?t="admin_node":f.CONSTANTS.NODE_CLIENT&&(t="node"),e["sdk."+t+"."+i.default.SDK_VERSION.replace(/\./g,"-")]=1,_.isMobileCordova()?e["framework.cordova"]=1:_.isReactNative()&&(e["framework.reactnative"]=1),this.reportStats(e)},t.prototype.Wt=function(){var e=c.OnlineMonitor.getInstance().currentlyOnline();return o.isEmpty(this.ze)&&e},t.Xe=0,t.jt=0,t}(y.ServerActions);t.PersistentConnection=m},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=function(){function e(e){this.Vt=e,this.Qt={},r.assert(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}return e.prototype.trigger=function(e){for(var t=[],n=1;n<arguments.length;n++)t[n-1]=arguments[n];if(Array.isArray(this.Qt[e]))for(var r=this.Qt[e].slice(),i=0;i<r.length;i++)r[i].callback.apply(r[i].context,t)},e.prototype.on=function(e,t,n){this.qt(e),this.Qt[e]=this.Qt[e]||[],this.Qt[e].push({callback:t,context:n});var r=this.getInitialEvent(e);r&&t.apply(n,r)},e.prototype.off=function(e,t,n){this.qt(e);for(var r=this.Qt[e]||[],i=0;i<r.length;i++)if(r[i].callback===t&&(!n||n===r[i].context))return void r.splice(i,1)},e.prototype.qt=function(e){r.assert(this.Vt.find(function(t){return t===e}),"Unknown event: "+e)},e}();t.EventEmitter=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),i=n(12),o=n(13),a=n(104),s=function(){function e(e,t,n,i,o,s,u){this.id=e,this.H=t,this.Ut=n,this.At=i,this.z=o,this.Bt=s,this.lastSessionId=u,this.connectionCount=0,this.pendingDataMessages=[],this.Ht=0,this.de=r.logWrapper("c:"+this.id+":"),this.Gt=new a.TransportManager(t),this.de("Connection created"),this.Kt()}return e.prototype.Kt=function(){var e=this,t=this.Gt.initialTransport();this.Yt=new t(this.Xt(),this.H,void 0,this.lastSessionId),this.zt=t.responsesRequiredToBeHealthy||0;var n=this.Jt(this.Yt),i=this.$t(this.Yt);this.Zt=this.Yt,this.en=this.Yt,this.tn=null,this.nn=!1,setTimeout(function(){e.Yt&&e.Yt.open(n,i)},Math.floor(0));var o=t.healthyTimeout||0;o>0&&(this.rn=r.setTimeoutNonBlocking(function(){e.rn=null,e.nn||(e.Yt&&e.Yt.bytesReceived>102400?(e.de("Connection exceeded healthy timeout but has received "+e.Yt.bytesReceived+" bytes.  Marking connection healthy."),e.nn=!0,e.Yt.markConnectionHealthy()):e.Yt&&e.Yt.bytesSent>10240?e.de("Connection exceeded healthy timeout but has sent "+e.Yt.bytesSent+" bytes.  Leaving connection alive."):(e.de("Closing unhealthy connection after timeout."),e.close()))},Math.floor(o)))},e.prototype.Xt=function(){return"c:"+this.id+":"+this.connectionCount++},e.prototype.$t=function(e){var t=this;return function(n){e===t.Yt?t.in(n):e===t.tn?(t.de("Secondary connection lost."),t.an()):t.de("closing an old connection")}},e.prototype.Jt=function(e){var t=this;return function(n){2!=t.Ht&&(e===t.en?t.sn(n):e===t.tn?t.un(n):t.de("message on old connection"))}},e.prototype.sendRequest=function(e){var t={t:"d",d:e};this.ln(t)},e.prototype.tryCleanupConnection=function(){this.Zt===this.tn&&this.en===this.tn&&(this.de("cleaning up and promoting a connection: "+this.tn.connId),this.Yt=this.tn,this.tn=null)},e.prototype.hn=function(e){if("t"in e){var t=e.t;"a"===t?this.cn():"r"===t?(this.de("Got a reset on secondary, closing it"),this.tn.close(),this.Zt!==this.tn&&this.en!==this.tn||this.close()):"o"===t&&(this.de("got pong on secondary."),this.pn--,this.cn())}},e.prototype.un=function(e){var t=r.requireKey("t",e),n=r.requireKey("d",e);if("c"==t)this.hn(n);else{if("d"!=t)throw Error("Unknown protocol layer: "+t);this.pendingDataMessages.push(n)}},e.prototype.cn=function(){this.pn<=0?(this.de("Secondary connection is healthy."),this.nn=!0,this.tn.markConnectionHealthy(),this.dn()):(this.de("sending ping on secondary."),this.tn.send({t:"c",d:{t:"p",d:{}}}))},e.prototype.dn=function(){this.tn.start(),this.de("sending client ack on secondary"),this.tn.send({t:"c",d:{t:"a",d:{}}}),this.de("Ending transmission on primary"),this.Yt.send({t:"c",d:{t:"n",d:{}}}),this.Zt=this.tn,this.tryCleanupConnection()},e.prototype.sn=function(e){var t=r.requireKey("t",e),n=r.requireKey("d",e);"c"==t?this.fn(n):"d"==t&&this.wt(n)},e.prototype.wt=function(e){this._n(),this.Ut(e)},e.prototype._n=function(){this.nn||--this.zt<=0&&(this.de("Primary connection is healthy."),this.nn=!0,this.Yt.markConnectionHealthy())},e.prototype.fn=function(e){var t=r.requireKey("t",e);if("d"in e){var n=e.d;if("h"===t)this.yn(n);else if("n"===t){this.de("recvd end transmission on primary"),this.en=this.tn;for(var i=0;i<this.pendingDataMessages.length;++i)this.wt(this.pendingDataMessages[i]);this.pendingDataMessages=[],this.tryCleanupConnection()}else"s"===t?this.vn(n):"r"===t?this.gn(n):"e"===t?r.error("Server Error: "+n):"o"===t?(this.de("got pong on primary."),this._n(),this.mn()):r.error("Unknown control packet command: "+t)}},e.prototype.yn=function(e){var t=e.ts,n=e.v,i=e.h;this.sessionId=e.s,this.H.updateHost(i),0==this.Ht&&(this.Yt.start(),this.Cn(this.Yt,t),o.PROTOCOL_VERSION!==n&&r.warn("Protocol version mismatch detected"),this.En())},e.prototype.En=function(){var e=this.Gt.upgradeTransport();e&&this.Nn(e)},e.prototype.Nn=function(e){var t=this;this.tn=new e(this.Xt(),this.H,this.sessionId),this.pn=e.responsesRequiredToBeHealthy||0;var n=this.Jt(this.tn),i=this.$t(this.tn);this.tn.open(n,i),r.setTimeoutNonBlocking(function(){t.tn&&(t.de("Timed out trying to upgrade."),t.tn.close())},Math.floor(6e4))},e.prototype.gn=function(e){this.de("Reset packet received.  New host: "+e),this.H.updateHost(e),1===this.Ht?this.close():(this.Pn(),this.Kt())},e.prototype.Cn=function(e,t){var n=this;this.de("Realtime connection established."),this.Yt=e,this.Ht=1,this.At&&(this.At(t,this.sessionId),this.At=null),0===this.zt?(this.de("Primary connection is healthy."),this.nn=!0):r.setTimeoutNonBlocking(function(){n.mn()},Math.floor(5e3))},e.prototype.mn=function(){this.nn||1!==this.Ht||(this.de("sending ping on primary."),this.ln({t:"c",d:{t:"p",d:{}}}))},e.prototype.an=function(){var e=this.tn;this.tn=null,this.Zt!==e&&this.en!==e||this.close()},e.prototype.in=function(e){this.Yt=null,e||0!==this.Ht?1===this.Ht&&this.de("Realtime connection lost."):(this.de("Realtime connection failed."),this.H.isCacheableHost()&&(i.PersistentStorage.remove("host:"+this.H.host),this.H.internalHost=this.H.host)),this.close()},e.prototype.vn=function(e){this.de("Connection shutdown command received. Shutting down..."),this.Bt&&(this.Bt(e),this.Bt=null),this.z=null,this.close()},e.prototype.ln=function(e){if(1!==this.Ht)throw"Connection is not connected";this.Zt.send(e)},e.prototype.close=function(){2!==this.Ht&&(this.de("Closing realtime connection."),this.Ht=2,this.Pn(),this.z&&(this.z(),this.z=null))},e.prototype.Pn=function(){this.de("Shutting down all connections"),this.Yt&&(this.Yt.close(),this.Yt=null),this.tn&&(this.tn.close(),this.tn=null),this.rn&&(clearTimeout(this.rn),this.rn=null)},e}();t.Connection=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),i=n(45),o=n(25),a=n(105),s=n(13),u=n(0),l=n(0);t.FIREBASE_LONGPOLL_START_PARAM="start",t.FIREBASE_LONGPOLL_CLOSE_COMMAND="close",t.FIREBASE_LONGPOLL_COMMAND_CB_NAME="pLPCommand",t.FIREBASE_LONGPOLL_DATA_CB_NAME="pRTLPCB",t.FIREBASE_LONGPOLL_ID_PARAM="id",t.FIREBASE_LONGPOLL_PW_PARAM="pw",t.FIREBASE_LONGPOLL_SERIAL_PARAM="ser",t.FIREBASE_LONGPOLL_CALLBACK_ID_PARAM="cb",t.FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM="seg",t.FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET="ts",t.FIREBASE_LONGPOLL_DATA_PARAM="d",t.FIREBASE_LONGPOLL_DISCONN_FRAME_PARAM="disconn",t.FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM="dframe";var h=function(){function e(e,t,n,i){this.connId=e,this.repoInfo=t,this.transportSessionId=n,this.lastSessionId=i,this.bytesSent=0,this.bytesReceived=0,this.bn=!1,this.de=r.logWrapper(e),this.$=o.StatsManager.getCollection(t),this.urlFn=function(e){return t.connectionURL(s.LONG_POLLING,e)}}return e.prototype.open=function(e,n){var i=this;this.curSegmentNum=0,this.z=n,this.myPacketOrderer=new a.PacketReceiver(e),this.Sn=!1,this.Tn=setTimeout(function(){i.de("Timed out trying to connect."),i.wn(),i.Tn=null},Math.floor(3e4)),r.executeWhenDOMReady(function(){if(!i.Sn){i.scriptTagHolder=new c(function(){for(var e=[],n=0;n<arguments.length;n++)e[n]=arguments[n];var r=e[0],o=e[1],a=e[2];if(e[3],e[4],i.In(e),i.scriptTagHolder)if(i.Tn&&(clearTimeout(i.Tn),i.Tn=null),i.bn=!0,r==t.FIREBASE_LONGPOLL_START_PARAM)i.id=o,i.password=a;else{if(r!==t.FIREBASE_LONGPOLL_CLOSE_COMMAND)throw Error("Unrecognized command received: "+r);o?(i.scriptTagHolder.sendNewPolls=!1,i.myPacketOrderer.closeAfter(o,function(){i.wn()})):i.wn()}},function(){for(var e=[],t=0;t<arguments.length;t++)e[t]=arguments[t];var n=e[0],r=e[1];i.In(e),i.myPacketOrderer.handleResponse(n,r)},function(){i.wn()},i.urlFn);var e={};e[t.FIREBASE_LONGPOLL_START_PARAM]="t",e[t.FIREBASE_LONGPOLL_SERIAL_PARAM]=Math.floor(1e8*Math.random()),i.scriptTagHolder.uniqueCallbackIdentifier&&(e[t.FIREBASE_LONGPOLL_CALLBACK_ID_PARAM]=i.scriptTagHolder.uniqueCallbackIdentifier),e[s.VERSION_PARAM]=s.PROTOCOL_VERSION,i.transportSessionId&&(e[s.TRANSPORT_SESSION_PARAM]=i.transportSessionId),i.lastSessionId&&(e[s.LAST_SESSION_PARAM]=i.lastSessionId),!l.isNodeSdk()&&"undefined"!=typeof location&&location.href&&-1!==location.href.indexOf(s.FORGE_DOMAIN)&&(e[s.REFERER_PARAM]=s.FORGE_REF);var n=i.urlFn(e);i.de("Connecting via long-poll to "+n),i.scriptTagHolder.addTag(n,function(){})}})},e.prototype.start=function(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)},e.forceAllow=function(){e.Rn=!0},e.forceDisallow=function(){e.On=!0},e.isAvailable=function(){return e.Rn||!e.On&&"undefined"!=typeof document&&null!=document.createElement&&!r.isChromeExtensionContentScript()&&!r.isWindowsStoreApp()&&!l.isNodeSdk()},e.prototype.markConnectionHealthy=function(){},e.prototype.An=function(){this.Sn=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.Tn&&(clearTimeout(this.Tn),this.Tn=null)},e.prototype.wn=function(){this.Sn||(this.de("Longpoll is closing itself"),this.An(),this.z&&(this.z(this.bn),this.z=null))},e.prototype.close=function(){this.Sn||(this.de("Longpoll is being closed."),this.An())},e.prototype.send=function(e){var t=u.stringify(e);this.bytesSent+=t.length,this.$.incrementCounter("bytes_sent",t.length);for(var n=u.base64Encode(t),i=r.splitStringBySize(n,1840),o=0;o<i.length;o++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[o]),this.curSegmentNum++},e.prototype.addDisconnectPingFrame=function(e,n){if(!l.isNodeSdk()){this.myDisconnFrame=document.createElement("iframe");var r={};r[t.FIREBASE_LONGPOLL_DISCONN_FRAME_REQUEST_PARAM]="t",r[t.FIREBASE_LONGPOLL_ID_PARAM]=e,r[t.FIREBASE_LONGPOLL_PW_PARAM]=n,this.myDisconnFrame.src=this.urlFn(r),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}},e.prototype.In=function(e){var t=u.stringify(e).length;this.bytesReceived+=t,this.$.incrementCounter("bytes_received",t)},e}();t.BrowserPollConnection=h;var c=function(){function e(n,o,a,s){if(this.onDisconnect=a,this.urlFn=s,this.outstandingRequests=new i.CountedSet,this.pendingSegs=[],this.currentSerial=Math.floor(1e8*Math.random()),this.sendNewPolls=!0,l.isNodeSdk())this.commandCB=n,this.onMessageCB=o;else{this.uniqueCallbackIdentifier=r.LUIDGenerator(),window[t.FIREBASE_LONGPOLL_COMMAND_CB_NAME+this.uniqueCallbackIdentifier]=n,window[t.FIREBASE_LONGPOLL_DATA_CB_NAME+this.uniqueCallbackIdentifier]=o,this.myIFrame=e.Dn();var u="";this.myIFrame.src&&"javascript:"===this.myIFrame.src.substr(0,11)&&(u='<script>document.domain="'+document.domain+'";<\/script>');var h="<html><body>"+u+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(h),this.myIFrame.doc.close()}catch(e){r.log("frame writing exception"),e.stack&&r.log(e.stack),r.log(e)}}}return e.Dn=function(){var e=document.createElement("iframe");if(e.style.display="none",!document.body)throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";document.body.appendChild(e);try{e.contentWindow.document||r.log("No IE domain setting required")}catch(n){var t=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+t+"';document.close();})())"}return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e},e.prototype.close=function(){var n=this;if(this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.innerHTML="",setTimeout(function(){null!==n.myIFrame&&(document.body.removeChild(n.myIFrame),n.myIFrame=null)},Math.floor(0))),l.isNodeSdk()&&this.myID){var r={};r[t.FIREBASE_LONGPOLL_DISCONN_FRAME_PARAM]="t",r[t.FIREBASE_LONGPOLL_ID_PARAM]=this.myID,r[t.FIREBASE_LONGPOLL_PW_PARAM]=this.myPW;var i=this.urlFn(r);e.nodeRestRequest(i)}var o=this.onDisconnect;o&&(this.onDisconnect=null,o())},e.prototype.startLongPoll=function(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.Mn(););},e.prototype.Mn=function(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.count()<(this.pendingSegs.length>0?2:1)){this.currentSerial++;var e={};e[t.FIREBASE_LONGPOLL_ID_PARAM]=this.myID,e[t.FIREBASE_LONGPOLL_PW_PARAM]=this.myPW,e[t.FIREBASE_LONGPOLL_SERIAL_PARAM]=this.currentSerial;for(var n=this.urlFn(e),r="",i=0;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+30+r.length<=1870;){var o=this.pendingSegs.shift();r=r+"&"+t.FIREBASE_LONGPOLL_SEGMENT_NUM_PARAM+i+"="+o.seg+"&"+t.FIREBASE_LONGPOLL_SEGMENTS_IN_PACKET+i+"="+o.ts+"&"+t.FIREBASE_LONGPOLL_DATA_PARAM+i+"="+o.d,i++}return n+=r,this.Ln(n,this.currentSerial),!0}return!1},e.prototype.enqueueSegment=function(e,t,n){this.pendingSegs.push({seg:e,ts:t,d:n}),this.alive&&this.Mn()},e.prototype.Ln=function(e,t){var n=this;this.outstandingRequests.add(t,1);var r=function(){n.outstandingRequests.remove(t),n.Mn()},i=setTimeout(r,Math.floor(25e3)),o=function(){clearTimeout(i),r()};this.addTag(e,o)},e.prototype.addTag=function(e,t){var n=this;l.isNodeSdk()?this.doNodeLongPoll(e,t):setTimeout(function(){try{if(!n.sendNewPolls)return;var i=n.myIFrame.doc.createElement("script");i.type="text/javascript",i.async=!0,i.src=e,i.onload=i.onreadystatechange=function(){var e=i.readyState;e&&"loaded"!==e&&"complete"!==e||(i.onload=i.onreadystatechange=null,i.parentNode&&i.parentNode.removeChild(i),t())},i.onerror=function(){r.log("Long-poll script failed to load: "+e),n.sendNewPolls=!1,n.close()},n.myIFrame.doc.body.appendChild(i)}catch(e){}},Math.floor(1))},e}();t.FirebaseIFrameScriptHolder=c},function(e,t,n){"use strict";(function(e){function r(e){d=e}Object.defineProperty(t,"__esModule",{value:!0});var i=n(6),o=n(0),a=n(1),s=n(25),u=n(13),l=n(0),h=n(12),c=n(0),p=n(0),d=null;"undefined"!=typeof MozWebSocket?d=MozWebSocket:"undefined"!=typeof WebSocket&&(d=WebSocket),t.setWebSocketImpl=r;var f=function(){function t(e,n,r,i){this.connId=e,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.de=a.logWrapper(this.connId),this.$=s.StatsManager.getCollection(n),this.connURL=t.Fn(n,r,i)}return t.Fn=function(e,t,n){var r={};return r[u.VERSION_PARAM]=u.PROTOCOL_VERSION,!p.isNodeSdk()&&"undefined"!=typeof location&&location.href&&-1!==location.href.indexOf(u.FORGE_DOMAIN)&&(r[u.REFERER_PARAM]=u.FORGE_REF),t&&(r[u.TRANSPORT_SESSION_PARAM]=t),n&&(r[u.LAST_SESSION_PARAM]=n),e.connectionURL(u.WEBSOCKET,r)},t.prototype.open=function(t,n){var r=this;this.onDisconnect=n,this.onMessage=t,this.de("Websocket connecting to "+this.connURL),this.bn=!1,h.PersistentStorage.set("previous_websocket_failure",!0);try{if(p.isNodeSdk()){var o=l.CONSTANTS.NODE_ADMIN?"AdminNode":"Node",a={headers:{"User-Agent":"Firebase/"+u.PROTOCOL_VERSION+"/"+i.default.SDK_VERSION+"/"+e.platform+"/"+o}},s=e.env,c=0==this.connURL.indexOf("wss://")?s.HTTPS_PROXY||s.https_proxy:s.HTTP_PROXY||s.http_proxy;c&&(a.proxy={origin:c}),this.mySock=new d(this.connURL,[],a)}else this.mySock=new d(this.connURL)}catch(e){this.de("Error instantiating WebSocket.");var f=e.message||e.data;return f&&this.de(f),void this.wn()}this.mySock.onopen=function(){r.de("Websocket connected."),r.bn=!0},this.mySock.onclose=function(){r.de("Websocket connection was disconnected."),r.mySock=null,r.wn()},this.mySock.onmessage=function(e){r.handleIncomingFrame(e)},this.mySock.onerror=function(e){r.de("WebSocket error.  Closing connection.");var t=e.message||e.data;t&&r.de(t),r.wn()}},t.prototype.start=function(){},t.forceDisallow=function(){t.On=!0},t.isAvailable=function(){var e=!1;if("undefined"!=typeof navigator&&navigator.userAgent){var n=/Android ([0-9]{0,}\.[0-9]{0,})/,r=navigator.userAgent.match(n);r&&r.length>1&&parseFloat(r[1])<4.4&&(e=!0)}return!e&&null!==d&&!t.On},t.previouslyFailed=function(){return h.PersistentStorage.isInMemoryStorage||!0===h.PersistentStorage.get("previous_websocket_failure")},t.prototype.markConnectionHealthy=function(){h.PersistentStorage.remove("previous_websocket_failure")},t.prototype.xn=function(e){if(this.frames.push(e),this.frames.length==this.totalFrames){var t=this.frames.join("");this.frames=null;var n=c.jsonEval(t);this.onMessage(n)}},t.prototype.kn=function(e){this.totalFrames=e,this.frames=[]},t.prototype.Wn=function(e){if(o.assert(null===this.frames,"We already have a frame buffer"),e.length<=6){var t=+e;if(!isNaN(t))return this.kn(t),null}return this.kn(1),e},t.prototype.handleIncomingFrame=function(e){if(null!==this.mySock){var t=e.data;if(this.bytesReceived+=t.length,this.$.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),null!==this.frames)this.xn(t);else{var n=this.Wn(t);null!==n&&this.xn(n)}}},t.prototype.send=function(e){this.resetKeepAlive();var t=c.stringify(e);this.bytesSent+=t.length,this.$.incrementCounter("bytes_sent",t.length);var n=a.splitStringBySize(t,16384);n.length>1&&this.jn(n.length+"");for(var r=0;r<n.length;r++)this.jn(n[r])},t.prototype.An=function(){this.Sn=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)},t.prototype.wn=function(){this.Sn||(this.de("WebSocket is closing itself"),this.An(),this.onDisconnect&&(this.onDisconnect(this.bn),this.onDisconnect=null))},t.prototype.close=function(){this.Sn||(this.de("WebSocket is being closed"),this.An())},t.prototype.resetKeepAlive=function(){var e=this;clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(function(){e.mySock&&e.jn("0"),e.resetKeepAlive()},Math.floor(45e3))},t.prototype.jn=function(e){try{this.mySock.send(e)}catch(e){this.de("Exception thrown from WebSocket.send():",e.message||e.data,"Closing connection."),setTimeout(this.wn.bind(this),0)}},t.responsesRequiredToBeHealthy=2,t.healthyTimeout=3e4,t}();t.WebSocketConnection=f}).call(t,n(27))},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(){}return e.prototype.put=function(e,t,n,r){},e.prototype.merge=function(e,t,n,r){},e.prototype.refreshAuthToken=function(e){},e.prototype.onDisconnectPut=function(e,t,n){},e.prototype.onDisconnectMerge=function(e,t,n){},e.prototype.onDisconnectCancel=function(e,t){},e.prototype.reportStats=function(e){},e}();t.ServerActions=r},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(24),i=n(3),o=n(5),a=n(4),s=function(){function e(t){this.Vn=new r.IndexedFilter(t.getIndex()),this.me=t.getIndex(),this.Qn=e.qn(t),this.Un=e.Bn(t)}return e.prototype.getStartPost=function(){return this.Qn},e.prototype.getEndPost=function(){return this.Un},e.prototype.matches=function(e){return this.me.compare(this.getStartPost(),e)<=0&&this.me.compare(e,this.getEndPost())<=0},e.prototype.updateChild=function(e,t,n,r,i,s){return this.matches(new o.NamedNode(t,n))||(n=a.ChildrenNode.EMPTY_NODE),this.Vn.updateChild(e,t,n,r,i,s)},e.prototype.updateFullNode=function(e,t,n){t.isLeafNode()&&(t=a.ChildrenNode.EMPTY_NODE);var r=t.withIndex(this.me);r=r.updatePriority(a.ChildrenNode.EMPTY_NODE);var s=this;return t.forEachChild(i.PRIORITY_INDEX,function(e,t){s.matches(new o.NamedNode(e,t))||(r=r.updateImmediateChild(e,a.ChildrenNode.EMPTY_NODE))}),this.Vn.updateFullNode(e,r,n)},e.prototype.updatePriority=function(e,t){return e},e.prototype.filtersNodes=function(){return!0},e.prototype.getIndexedFilter=function(){return this.Vn},e.prototype.getIndex=function(){return this.me},e.qn=function(e){if(e.hasStart()){var t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}return e.getIndex().minPost()},e.Bn=function(e){if(e.hasEnd()){var t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}return e.getIndex().maxPost()},e}();t.RangedFilter=s},,,,,,,,,,,,,,,,,,,,,,function(e,t,n){e.exports=n(79)},function(e,t,n){"use strict";function r(t){var n=t.INTERNAL.registerService("database",function(e,t,n){return l.RepoManager.getInstance().databaseFromApp(e,n)},{Reference:s.Reference,Query:a.Query,Database:o.Database,enableLogging:u.enableLogging,INTERNAL:h,ServerValue:d,TEST_ACCESS:c},null,!0);p.isNodeSdk()&&(e.exports=n)}Object.defineProperty(t,"__esModule",{value:!0});var i=n(6),o=n(32);t.Database=o.Database;var a=n(36);t.Query=a.Query;var s=n(21);t.Reference=s.Reference;var u=n(1);t.enableLogging=u.enableLogging;var l=n(26),h=n(111),c=n(112),p=n(0),d=o.Database.ServerValue;t.ServerValue=d,t.registerDatabase=r,r(i.default);var f=n(22);t.DataSnapshot=f.DataSnapshot;var _=n(35);t.OnDisconnect=_.OnDisconnect},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=function(){function e(e){this.Hn=e,this.Gn="firebase:"}return e.prototype.set=function(e,t){null==t?this.Hn.removeItem(this.Kn(e)):this.Hn.setItem(this.Kn(e),r.stringify(t))},e.prototype.get=function(e){var t=this.Hn.getItem(this.Kn(e));return null==t?null:r.jsonEval(t)},e.prototype.remove=function(e){this.Hn.removeItem(this.Kn(e))},e.prototype.Kn=function(e){return this.Gn+e},e.prototype.toString=function(){return""+this.Hn},e}();t.DOMStorageWrapper=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=function(){function e(){this.Yn={},this.isInMemoryStorage=!0}return e.prototype.set=function(e,t){null==t?delete this.Yn[e]:this.Yn[e]=t},e.prototype.get=function(e){return r.contains(this.Yn,e)?this.Yn[e]:null},e.prototype.remove=function(e){delete this.Yn[e]},e}();t.MemoryStorage=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=function(){function e(e,t){this.committed=e,this.snapshot=t}return e.prototype.toJSON=function(){return r.validateArgCount("TransactionResult.toJSON",0,1,arguments.length),{committed:this.committed,snapshot:this.snapshot.toJSON()}},e}();t.TransactionResult=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0);t.nextPushId=function(){var e="-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",t=0,n=[];return function(i){var o=i===t;t=i;var a,s=Array(8);for(a=7;a>=0;a--)s[a]=e.charAt(i%64),i=Math.floor(i/64);r.assert(0===i,"Cannot push at time == 0");var u=s.join("");if(o){for(a=11;a>=0&&63===n[a];a--)n[a]=0;n[a]++}else for(a=0;a<12;a++)n[a]=Math.floor(64*Math.random());for(a=0;a<12;a++)u+=e.charAt(n[a]);return r.assert(20===u.length,"nextPushId: Length should be 20."),u}}()},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(22),i=n(85),o=n(0),a=n(0),s=function(){function e(e,t,n){this.Xn=e,this.zn=t,this.Jn=n}return e.prototype.respondsTo=function(e){return"value"===e},e.prototype.createEvent=function(e,t){var n=t.getQueryParams().getIndex();return new i.DataEvent("value",this,new r.DataSnapshot(e.snapshotNode,t.getRef(),n))},e.prototype.getEventRunner=function(e){var t=this.Jn;if("cancel"===e.getEventType()){a.assert(this.zn,"Raising a cancel event on a listener with no cancel callback");var n=this.zn;return function(){n.call(t,e.error)}}var r=this.Xn;return function(){r.call(t,e.snapshot)}},e.prototype.createCancelEvent=function(e,t){return this.zn?new i.CancelEvent(this,e,t):null},e.prototype.matches=function(t){return t instanceof e&&(!t.Xn||!this.Xn||t.Xn===this.Xn&&t.Jn===this.Jn)},e.prototype.hasAnyCallback=function(){return null!==this.Xn},e}();t.ValueEventRegistration=s;var u=function(){function e(e,t,n){this.$n=e,this.zn=t,this.Jn=n}return e.prototype.respondsTo=function(e){var t="children_added"===e?"child_added":e;return t="children_removed"===t?"child_removed":t,o.contains(this.$n,t)},e.prototype.createCancelEvent=function(e,t){return this.zn?new i.CancelEvent(this,e,t):null},e.prototype.createEvent=function(e,t){a.assert(null!=e.childName,"Child events should have a childName.");var n=t.getRef().child(e.childName),o=t.getQueryParams().getIndex();return new i.DataEvent(e.type,this,new r.DataSnapshot(e.snapshotNode,n,o),e.prevName)},e.prototype.getEventRunner=function(e){var t=this.Jn;if("cancel"===e.getEventType()){a.assert(this.zn,"Raising a cancel event on a listener with no cancel callback");var n=this.zn;return function(){n.call(t,e.error)}}var r=this.$n[e.eventType];return function(){r.call(t,e.snapshot,e.prevName)}},e.prototype.matches=function(t){if(t instanceof e){if(!this.$n||!t.$n)return!0;if(this.Jn===t.Jn){var n=o.getCount(t.$n);if(n===o.getCount(this.$n)){if(1===n){var r=o.getAnyKey(t.$n),i=o.getAnyKey(this.$n);return!(i!==r||t.$n[r]&&this.$n[i]&&t.$n[r]!==this.$n[i])}return o.every(this.$n,function(e,n){return t.$n[e]===n})}}}return!1},e.prototype.hasAnyCallback=function(){return null!==this.$n},e}();t.ChildEventRegistration=u},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=function(){function e(e,t,n,r){this.eventType=e,this.eventRegistration=t,this.snapshot=n,this.prevName=r}return e.prototype.getPath=function(){var e=this.snapshot.getRef();return"value"===this.eventType?e.path:e.getParent().path},e.prototype.getEventType=function(){return this.eventType},e.prototype.getEventRunner=function(){return this.eventRegistration.getEventRunner(this)},e.prototype.toString=function(){return this.getPath()+":"+this.eventType+":"+r.stringify(this.snapshot.exportVal())},e}();t.DataEvent=i;var o=function(){function e(e,t,n){this.eventRegistration=e,this.error=t,this.path=n}return e.prototype.getPath=function(){return this.path},e.prototype.getEventType=function(){return"cancel"},e.prototype.getEventRunner=function(){return this.eventRegistration.getEventRunner(this)},e.prototype.toString=function(){return this.path+":cancel"},e}();t.CancelEvent=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(1),o=n(87),a=n(4),s=n(0),u=n(23),l=n(88),h=n(89),c=n(8),p=n(46),d=n(2),f=n(47),_=n(95),y=function(){function e(e){this.Zn=e,this.er=u.ImmutableTree.Empty,this.tr=new _.WriteTree,this.nr={},this.rr={}}return e.prototype.applyUserOverwrite=function(e,t,n,r){return this.tr.addOverwrite(e,t,n,r),r?this.ir(new p.Overwrite(c.OperationSource.User,e,t)):[]},e.prototype.applyUserMerge=function(e,t,n){this.tr.addMerge(e,t,n);var r=u.ImmutableTree.fromObject(t);return this.ir(new h.Merge(c.OperationSource.User,e,r))},e.prototype.ackUserWrite=function(e,t){void 0===t&&(t=!1);var n=this.tr.getWrite(e);if(this.tr.removeWrite(e)){var r=u.ImmutableTree.Empty;return null!=n.snap?r=r.set(d.Path.Empty,!0):s.forEach(n.children,function(e,t){r=r.set(new d.Path(e),t)}),this.ir(new o.AckUserWrite(n.path,r,t))}return[]},e.prototype.applyServerOverwrite=function(e,t){return this.ir(new p.Overwrite(c.OperationSource.Server,e,t))},e.prototype.applyServerMerge=function(e,t){var n=u.ImmutableTree.fromObject(t);return this.ir(new h.Merge(c.OperationSource.Server,e,n))},e.prototype.applyListenComplete=function(e){return this.ir(new l.ListenComplete(c.OperationSource.Server,e))},e.prototype.applyTaggedQueryOverwrite=function(t,n,r){var i=this.or(r);if(null!=i){var o=e.ar(i),a=o.path,s=o.queryId,u=d.Path.relativePath(a,t),l=new p.Overwrite(c.OperationSource.forServerTaggedQuery(s),u,n);return this.sr(a,l)}return[]},e.prototype.applyTaggedQueryMerge=function(t,n,r){var i=this.or(r);if(i){var o=e.ar(i),a=o.path,s=o.queryId,l=d.Path.relativePath(a,t),p=u.ImmutableTree.fromObject(n),f=new h.Merge(c.OperationSource.forServerTaggedQuery(s),l,p);return this.sr(a,f)}return[]},e.prototype.applyTaggedListenComplete=function(t,n){var r=this.or(n);if(r){var i=e.ar(r),o=i.path,a=i.queryId,s=d.Path.relativePath(o,t),u=new l.ListenComplete(c.OperationSource.forServerTaggedQuery(a),s);return this.sr(o,u)}return[]},e.prototype.addEventRegistration=function(t,n){var i=t.path,o=null,s=!1;this.er.foreachOnPath(i,function(e,t){var n=d.Path.relativePath(e,i);o=o||t.getCompleteServerCache(n),s=s||t.hasCompleteView()});var u=this.er.get(i);u?(s=s||u.hasCompleteView(),o=o||u.getCompleteServerCache(d.Path.Empty)):(u=new f.SyncPoint,this.er=this.er.set(i,u));var l;null!=o?l=!0:(l=!1,o=a.ChildrenNode.EMPTY_NODE,this.er.subtree(i).foreachChild(function(e,t){var n=t.getCompleteServerCache(d.Path.Empty);n&&(o=o.updateImmediateChild(e,n))}));var h=u.viewExistsForQuery(t);if(!h&&!t.getQueryParams().loadsAllData()){var c=e.ur(t);r.assert(!(c in this.rr),"View does not exist, but we have a tag");var p=e.lr();this.rr[c]=p,this.nr["_"+p]=c}var _=this.tr.childWrites(i),y=u.addEventRegistration(t,n,_,o,l);if(!h&&!s){var v=u.viewForQuery(t);y=y.concat(this.hr(t,v))}return y},e.prototype.removeEventRegistration=function(t,n,r){var i=this,o=t.path,a=this.er.get(o),s=[];if(a&&("default"===t.queryIdentifier()||a.viewExistsForQuery(t))){var u=a.removeEventRegistration(t,n,r);a.isEmpty()&&(this.er=this.er.remove(o));var l=u.removed;s=u.events;var h=-1!==l.findIndex(function(e){return e.getQueryParams().loadsAllData()}),c=this.er.findOnPath(o,function(e,t){return t.hasCompleteView()});if(h&&!c){var p=this.er.subtree(o);if(!p.isEmpty())for(var d=this.cr(p),f=0;f<d.length;++f){var _=d[f],y=_.getQuery(),v=this.pr(_);this.Zn.startListening(e.dr(y),this.fr(y),v.hashFn,v.onComplete)}}!c&&l.length>0&&!r&&(h?this.Zn.stopListening(e.dr(t),null):l.forEach(function(t){var n=i.rr[e.ur(t)];i.Zn.stopListening(e.dr(t),n)})),this._r(l)}return s},e.prototype.calcCompleteEventCache=function(e,t){var n=this.tr,r=this.er.findOnPath(e,function(t,n){var r=d.Path.relativePath(t,e),i=n.getCompleteServerCache(r);if(i)return i});return n.calcCompleteEventCache(e,r,t,!0)},e.prototype.cr=function(e){return e.fold(function(e,t,n){if(t&&t.hasCompleteView())return[t.getCompleteView()];var r=[];return t&&(r=t.getQueryViews()),s.forEach(n,function(e,t){r=r.concat(t)}),r})},e.prototype._r=function(t){for(var n=0;n<t.length;++n){var r=t[n];if(!r.getQueryParams().loadsAllData()){var i=e.ur(r),o=this.rr[i];delete this.rr[i],delete this.nr["_"+o]}}},e.dr=function(e){return e.getQueryParams().loadsAllData()&&!e.getQueryParams().isDefault()?e.getRef():e},e.prototype.hr=function(t,n){var i=t.path,o=this.fr(t),a=this.pr(n),u=this.Zn.startListening(e.dr(t),o,a.hashFn,a.onComplete),l=this.er.subtree(i);if(o)r.assert(!l.value.hasCompleteView(),"If we're adding a query, it shouldn't be shadowed");else for(var h=l.fold(function(e,t,n){if(!e.isEmpty()&&t&&t.hasCompleteView())return[t.getCompleteView().getQuery()];var r=[];return t&&(r=r.concat(t.getQueryViews().map(function(e){return e.getQuery()}))),s.forEach(n,function(e,t){r=r.concat(t)}),r}),c=0;c<h.length;++c){var p=h[c];this.Zn.stopListening(e.dr(p),this.fr(p))}return u},e.prototype.pr=function(e){var t=this,n=e.getQuery(),r=this.fr(n);return{hashFn:function(){return(e.getServerCache()||a.ChildrenNode.EMPTY_NODE).hash()},onComplete:function(e){if("ok"===e)return r?t.applyTaggedListenComplete(n.path,r):t.applyListenComplete(n.path);var o=i.errorForServerCode(e,n);return t.removeEventRegistration(n,null,o)}}},e.ur=function(e){return e.path+"$"+e.queryIdentifier()},e.ar=function(e){var t=e.indexOf("$");return r.assert(-1!==t&&t<e.length-1,"Bad queryKey."),{queryId:e.substr(t+1),path:new d.Path(e.substr(0,t))}},e.prototype.or=function(e){return this.nr["_"+e]},e.prototype.fr=function(t){var n=e.ur(t);return s.safeGet(this.rr,n)},e.lr=function(){return e.yr++},e.prototype.sr=function(e,t){var n=this.er.get(e);r.assert(n,"Missing sync point for query tag that we're tracking");var i=this.tr.childWrites(e);return n.applyOperation(t,i,null)},e.prototype.ir=function(e){return this.vr(e,this.er,null,this.tr.childWrites(d.Path.Empty))},e.prototype.vr=function(e,t,n,r){if(e.path.isEmpty())return this.gr(e,t,n,r);var i=t.get(d.Path.Empty);null==n&&null!=i&&(n=i.getCompleteServerCache(d.Path.Empty));var o=[],a=e.path.getFront(),s=e.operationForChild(a),u=t.children.get(a);if(u&&s){var l=n?n.getImmediateChild(a):null,h=r.child(a);o=o.concat(this.vr(s,u,l,h))}return i&&(o=o.concat(i.applyOperation(e,r,n))),o},e.prototype.gr=function(e,t,n,r){var i=this,o=t.get(d.Path.Empty);null==n&&null!=o&&(n=o.getCompleteServerCache(d.Path.Empty));var a=[];return t.children.inorderTraversal(function(t,o){var s=n?n.getImmediateChild(t):null,u=r.child(t),l=e.operationForChild(t);l&&(a=a.concat(i.gr(l,o,s,u)))}),o&&(a=a.concat(o.applyOperation(e,r,n))),a},e.yr=1,e}();t.SyncTree=y},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(2),o=n(8),a=function(){function e(e,t,n){this.path=e,this.affectedTree=t,this.revert=n,this.type=o.OperationType.ACK_USER_WRITE,this.source=o.OperationSource.User}return e.prototype.operationForChild=function(t){if(this.path.isEmpty()){if(null!=this.affectedTree.value)return r.assert(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;var n=this.affectedTree.subtree(new i.Path(t));return new e(i.Path.Empty,n,this.revert)}return r.assert(this.path.getFront()===t,"operationForChild called for unrelated child."),new e(this.path.popFront(),this.affectedTree,this.revert)},e}();t.AckUserWrite=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(2),i=n(8),o=function(){function e(e,t){this.source=e,this.path=t,this.type=i.OperationType.LISTEN_COMPLETE}return e.prototype.operationForChild=function(t){return this.path.isEmpty()?new e(this.source,r.Path.Empty):new e(this.source,this.path.popFront())},e}();t.ListenComplete=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(8),i=n(46),o=n(2),a=n(0),s=function(){function e(e,t,n){this.source=e,this.path=t,this.children=n,this.type=r.OperationType.MERGE}return e.prototype.operationForChild=function(t){if(this.path.isEmpty()){var n=this.children.subtree(new o.Path(t));return n.isEmpty()?null:n.value?new i.Overwrite(this.source,o.Path.Empty,n.value):new e(this.source,o.Path.Empty,n)}return a.assert(this.path.getFront()===t,"Can't get a merge for a child not on the path of the operation"),new e(this.source,this.path.popFront(),this.children)},e.prototype.toString=function(){return"Operation("+this.path+": "+this.source+" merge: "+this.children+")"},e}();t.Merge=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(24),i=n(91),o=n(4),a=n(18),s=n(48),u=n(94),l=n(0),h=n(8),c=n(9),p=n(3),d=function(){function e(e,t){this.mr=e,this.Cr=[];var n=this.mr.getQueryParams(),l=new r.IndexedFilter(n.getIndex()),h=n.getNodeFilter();this.Er=new i.ViewProcessor(h);var c=t.getServerCache(),p=t.getEventCache(),d=l.updateFullNode(o.ChildrenNode.EMPTY_NODE,c.getNode(),null),f=h.updateFullNode(o.ChildrenNode.EMPTY_NODE,p.getNode(),null),_=new a.CacheNode(d,c.isFullyInitialized(),l.filtersNodes()),y=new a.CacheNode(f,p.isFullyInitialized(),h.filtersNodes());this.Nr=new s.ViewCache(y,_),this.Pr=new u.EventGenerator(this.mr)}return e.prototype.getQuery=function(){return this.mr},e.prototype.getServerCache=function(){return this.Nr.getServerCache().getNode()},e.prototype.getCompleteServerCache=function(e){var t=this.Nr.getCompleteServerSnap();return t&&(this.mr.getQueryParams().loadsAllData()||!e.isEmpty()&&!t.getImmediateChild(e.getFront()).isEmpty())?t.getChild(e):null},e.prototype.isEmpty=function(){return 0===this.Cr.length},e.prototype.addEventRegistration=function(e){this.Cr.push(e)},e.prototype.removeEventRegistration=function(e,t){var n=[];if(t){l.assert(null==e,"A cancel should cancel all event registrations.");var r=this.mr.path;this.Cr.forEach(function(e){t=t;var i=e.createCancelEvent(t,r);i&&n.push(i)})}if(e){for(var i=[],o=0;o<this.Cr.length;++o){var a=this.Cr[o];if(a.matches(e)){if(e.hasAnyCallback()){i=i.concat(this.Cr.slice(o+1));break}}else i.push(a)}this.Cr=i}else this.Cr=[];return n},e.prototype.applyOperation=function(e,t,n){e.type===h.OperationType.MERGE&&null!==e.source.queryId&&(l.assert(this.Nr.getCompleteServerSnap(),"We should always have a full cache before handling merges"),l.assert(this.Nr.getCompleteEventSnap(),"Missing event cache, even though we have a server cache"));var r=this.Nr,i=this.Er.applyOperation(r,e,t,n);return this.Er.assertIndexed(i.viewCache),l.assert(i.viewCache.getServerCache().isFullyInitialized()||!r.getServerCache().isFullyInitialized(),"Once a server snap is complete, it should never go back"),this.Nr=i.viewCache,this.br(i.changes,i.viewCache.getEventCache().getNode(),null)},e.prototype.getInitialEvents=function(e){var t=this.Nr.getEventCache(),n=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(p.PRIORITY_INDEX,function(e,t){n.push(c.Change.childAddedChange(e,t))}),t.isFullyInitialized()&&n.push(c.Change.valueChange(t.getNode())),this.br(n,t.getNode(),e)},e.prototype.br=function(e,t,n){var r=n?[n]:this.Cr;return this.Pr.generateEventsForChanges(e,t,r)},e}();t.View=d},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(8),i=n(0),o=n(92),a=n(9),s=n(4),u=n(10),l=n(23),h=n(2),c=n(93),p=function(){function e(e,t){this.viewCache=e,this.changes=t}return e}();t.ProcessorResult=p;var d=function(){function e(e){this.Sr=e}return e.prototype.assertIndexed=function(e){i.assert(e.getEventCache().getNode().isIndexed(this.Sr.getIndex()),"Event snap not indexed"),i.assert(e.getServerCache().getNode().isIndexed(this.Sr.getIndex()),"Server snap not indexed")},e.prototype.applyOperation=function(t,n,a,s){var u,l,h=new o.ChildChangeAccumulator;if(n.type===r.OperationType.OVERWRITE){var c=n;c.source.fromUser?u=this.Tr(t,c.path,c.snap,a,s,h):(i.assert(c.source.fromServer,"Unknown source."),l=c.source.tagged||t.getServerCache().isFiltered()&&!c.path.isEmpty(),u=this.wr(t,c.path,c.snap,a,s,l,h))}else if(n.type===r.OperationType.MERGE){var d=n;d.source.fromUser?u=this.Ir(t,d.path,d.children,a,s,h):(i.assert(d.source.fromServer,"Unknown source."),l=d.source.tagged||t.getServerCache().isFiltered(),u=this.Rr(t,d.path,d.children,a,s,l,h))}else if(n.type===r.OperationType.ACK_USER_WRITE){var f=n;u=f.revert?this.Or(t,f.path,a,s,h):this.Ar(t,f.path,f.affectedTree,a,s,h)}else{if(n.type!==r.OperationType.LISTEN_COMPLETE)throw i.assertionError("Unknown operation type: "+n.type);u=this.Dr(t,n.path,a,h)}var _=h.getChanges();return e.Mr(t,u,_),new p(u,_)},e.Mr=function(e,t,n){var r=t.getEventCache();if(r.isFullyInitialized()){var i=r.getNode().isLeafNode()||r.getNode().isEmpty(),o=e.getCompleteEventSnap();(n.length>0||!e.getEventCache().isFullyInitialized()||i&&!r.getNode().equals(o)||!r.getNode().getPriority().equals(o.getPriority()))&&n.push(a.Change.valueChange(t.getCompleteEventSnap()))}},e.prototype.Lr=function(e,t,n,r,o){var a=e.getEventCache();if(null!=n.shadowingWrite(t))return e;var u=void 0,l=void 0;if(t.isEmpty())if(i.assert(e.getServerCache().isFullyInitialized(),"If change path is empty, we must have complete server data"),e.getServerCache().isFiltered()){var h=e.getCompleteServerSnap(),c=h instanceof s.ChildrenNode?h:s.ChildrenNode.EMPTY_NODE,p=n.calcCompleteEventChildren(c);u=this.Sr.updateFullNode(e.getEventCache().getNode(),p,o)}else{var d=n.calcCompleteEventCache(e.getCompleteServerSnap());u=this.Sr.updateFullNode(e.getEventCache().getNode(),d,o)}else{var f=t.getFront();if(".priority"==f){i.assert(1==t.getLength(),"Can't have a priority with additional path components");var _=a.getNode();l=e.getServerCache().getNode();var y=n.calcEventCacheAfterServerOverwrite(t,_,l);u=null!=y?this.Sr.updatePriority(_,y):a.getNode()}else{var v=t.popFront(),g=void 0;if(a.isCompleteForChild(f)){l=e.getServerCache().getNode();var m=n.calcEventCacheAfterServerOverwrite(t,a.getNode(),l);g=null!=m?a.getNode().getImmediateChild(f).updateChild(v,m):a.getNode().getImmediateChild(f)}else g=n.calcCompleteChild(f,e.getServerCache());u=null!=g?this.Sr.updateChild(a.getNode(),f,g,v,r,o):a.getNode()}}return e.updateEventSnap(u,a.isFullyInitialized()||t.isEmpty(),this.Sr.filtersNodes())},e.prototype.wr=function(e,t,n,r,i,o,a){var s,u=e.getServerCache(),l=o?this.Sr:this.Sr.getIndexedFilter();if(t.isEmpty())s=l.updateFullNode(u.getNode(),n,null);else if(l.filtersNodes()&&!u.isFiltered()){var h=u.getNode().updateChild(t,n);s=l.updateFullNode(u.getNode(),h,null)}else{var p=t.getFront();if(!u.isCompleteForPath(t)&&t.getLength()>1)return e;var d=t.popFront(),f=u.getNode().getImmediateChild(p),_=f.updateChild(d,n);s=".priority"==p?l.updatePriority(u.getNode(),_):l.updateChild(u.getNode(),p,_,d,c.NO_COMPLETE_CHILD_SOURCE,null)}var y=e.updateServerSnap(s,u.isFullyInitialized()||t.isEmpty(),l.filtersNodes()),v=new c.WriteTreeCompleteChildSource(r,y,i);return this.Lr(y,t,r,v,a)},e.prototype.Tr=function(e,t,n,r,i,o){var a,u,l=e.getEventCache(),h=new c.WriteTreeCompleteChildSource(r,e,i);if(t.isEmpty())u=this.Sr.updateFullNode(e.getEventCache().getNode(),n,o),a=e.updateEventSnap(u,!0,this.Sr.filtersNodes());else{var p=t.getFront();if(".priority"===p)u=this.Sr.updatePriority(e.getEventCache().getNode(),n),a=e.updateEventSnap(u,l.isFullyInitialized(),l.isFiltered());else{var d=t.popFront(),f=l.getNode().getImmediateChild(p),_=void 0;if(d.isEmpty())_=n;else{var y=h.getCompleteChild(p);_=null!=y?".priority"===d.getBack()&&y.getChild(d.parent()).isEmpty()?y:y.updateChild(d,n):s.ChildrenNode.EMPTY_NODE}if(f.equals(_))a=e;else{var v=this.Sr.updateChild(l.getNode(),p,_,d,h,o);a=e.updateEventSnap(v,l.isFullyInitialized(),this.Sr.filtersNodes())}}}return a},e.Fr=function(e,t){return e.getEventCache().isCompleteForChild(t)},e.prototype.Ir=function(t,n,r,i,o,a){var s=this,u=t;return r.foreach(function(r,l){var h=n.child(r);e.Fr(t,h.getFront())&&(u=s.Tr(u,h,l,i,o,a))}),r.foreach(function(r,l){var h=n.child(r);e.Fr(t,h.getFront())||(u=s.Tr(u,h,l,i,o,a))}),u},e.prototype.xr=function(e,t){return t.foreach(function(t,n){e=e.updateChild(t,n)}),e},e.prototype.Rr=function(e,t,n,r,i,o,a){var s=this;if(e.getServerCache().getNode().isEmpty()&&!e.getServerCache().isFullyInitialized())return e;var u,c=e;u=t.isEmpty()?n:l.ImmutableTree.Empty.setTree(t,n);var p=e.getServerCache().getNode();return u.children.inorderTraversal(function(t,n){if(p.hasChild(t)){var u=e.getServerCache().getNode().getImmediateChild(t),l=s.xr(u,n);c=s.wr(c,new h.Path(t),l,r,i,o,a)}}),u.children.inorderTraversal(function(t,n){var u=!e.getServerCache().isCompleteForChild(t)&&null==n.value;if(!p.hasChild(t)&&!u){var l=e.getServerCache().getNode().getImmediateChild(t),d=s.xr(l,n);c=s.wr(c,new h.Path(t),d,r,i,o,a)}}),c},e.prototype.Ar=function(e,t,n,r,i,o){if(null!=r.shadowingWrite(t))return e;var a=e.getServerCache().isFiltered(),s=e.getServerCache();if(null!=n.value){if(t.isEmpty()&&s.isFullyInitialized()||s.isCompleteForPath(t))return this.wr(e,t,s.getNode().getChild(t),r,i,a,o);if(t.isEmpty()){var c=l.ImmutableTree.Empty;return s.getNode().forEachChild(u.KEY_INDEX,function(e,t){c=c.set(new h.Path(e),t)}),this.Rr(e,t,c,r,i,a,o)}return e}var p=l.ImmutableTree.Empty;return n.foreach(function(e,n){var r=t.child(e);s.isCompleteForPath(r)&&(p=p.set(e,s.getNode().getChild(r)))}),this.Rr(e,t,p,r,i,a,o)},e.prototype.Dr=function(e,t,n,r){var i=e.getServerCache(),o=e.updateServerSnap(i.getNode(),i.isFullyInitialized()||t.isEmpty(),i.isFiltered());return this.Lr(o,t,n,c.NO_COMPLETE_CHILD_SOURCE,r)},e.prototype.Or=function(e,t,n,r,o){var a;if(null!=n.shadowingWrite(t))return e;var u=new c.WriteTreeCompleteChildSource(n,e,r),l=e.getEventCache().getNode(),p=void 0;if(t.isEmpty()||".priority"===t.getFront()){var d=void 0;if(e.getServerCache().isFullyInitialized())d=n.calcCompleteEventCache(e.getCompleteServerSnap());else{var f=e.getServerCache().getNode();i.assert(f instanceof s.ChildrenNode,"serverChildren would be complete if leaf node"),d=n.calcCompleteEventChildren(f)}d=d,p=this.Sr.updateFullNode(l,d,o)}else{var _=t.getFront(),y=n.calcCompleteChild(_,e.getServerCache());null==y&&e.getServerCache().isCompleteForChild(_)&&(y=l.getImmediateChild(_)),p=null!=y?this.Sr.updateChild(l,_,y,t.popFront(),u,o):e.getEventCache().getNode().hasChild(_)?this.Sr.updateChild(l,_,s.ChildrenNode.EMPTY_NODE,t.popFront(),u,o):l,p.isEmpty()&&e.getServerCache().isFullyInitialized()&&(a=n.calcCompleteEventCache(e.getCompleteServerSnap()),a.isLeafNode()&&(p=this.Sr.updateFullNode(p,a,o)))}return a=e.getServerCache().isFullyInitialized()||null!=n.shadowingWrite(h.Path.Empty),e.updateEventSnap(p,a,this.Sr.filtersNodes())},e}();t.ViewProcessor=d},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(9),o=n(0),a=function(){function e(){this.kr={}}return e.prototype.trackChildChange=function(e){var t=e.type,n=e.childName;o.assert(t==i.Change.CHILD_ADDED||t==i.Change.CHILD_CHANGED||t==i.Change.CHILD_REMOVED,"Only child changes supported for tracking"),o.assert(".priority"!==n,"Only non-priority child changes can be tracked.");var a=r.safeGet(this.kr,n);if(a){var s=a.type;if(t==i.Change.CHILD_ADDED&&s==i.Change.CHILD_REMOVED)this.kr[n]=i.Change.childChangedChange(n,e.snapshotNode,a.snapshotNode);else if(t==i.Change.CHILD_REMOVED&&s==i.Change.CHILD_ADDED)delete this.kr[n];else if(t==i.Change.CHILD_REMOVED&&s==i.Change.CHILD_CHANGED)this.kr[n]=i.Change.childRemovedChange(n,a.oldSnap);else if(t==i.Change.CHILD_CHANGED&&s==i.Change.CHILD_ADDED)this.kr[n]=i.Change.childAddedChange(n,e.snapshotNode);else{if(t!=i.Change.CHILD_CHANGED||s!=i.Change.CHILD_CHANGED)throw o.assertionError("Illegal combination of changes: "+e+" occurred after "+a);this.kr[n]=i.Change.childChangedChange(n,e.snapshotNode,a.oldSnap)}}else this.kr[n]=e},e.prototype.getChanges=function(){return r.getValues(this.kr)},e}();t.ChildChangeAccumulator=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(18),i=function(){function e(){}return e.prototype.getCompleteChild=function(e){return null},e.prototype.getChildAfterChild=function(e,t,n){return null},e}();t.Wr=i,t.NO_COMPLETE_CHILD_SOURCE=new i;var o=function(){function e(e,t,n){void 0===n&&(n=null),this.jr=e,this.Nr=t,this.Vr=n}return e.prototype.getCompleteChild=function(e){var t=this.Nr.getEventCache();if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);var n=null!=this.Vr?new r.CacheNode(this.Vr,!0,!1):this.Nr.getServerCache();return this.jr.calcCompleteChild(e,n)},e.prototype.getChildAfterChild=function(e,t,n){var r=null!=this.Vr?this.Vr:this.Nr.getCompleteServerSnap(),i=this.jr.calcIndexedSlice(r,t,1,n,e);return 0===i.length?null:i[0]},e}();t.WriteTreeCompleteChildSource=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(5),i=n(9),o=n(0),a=function(){function e(e){this.mr=e,this.me=this.mr.getQueryParams().getIndex()}return e.prototype.generateEventsForChanges=function(e,t,n){var r=this,o=[],a=[];return e.forEach(function(e){e.type===i.Change.CHILD_CHANGED&&r.me.indexedValueChanged(e.oldSnap,e.snapshotNode)&&a.push(i.Change.childMovedChange(e.childName,e.snapshotNode))}),this.Qr(o,i.Change.CHILD_REMOVED,e,n,t),this.Qr(o,i.Change.CHILD_ADDED,e,n,t),this.Qr(o,i.Change.CHILD_MOVED,a,n,t),this.Qr(o,i.Change.CHILD_CHANGED,e,n,t),this.Qr(o,i.Change.VALUE,e,n,t),o},e.prototype.Qr=function(e,t,n,r,i){var o=this,a=n.filter(function(e){return e.type===t});a.sort(this.qr.bind(this)),a.forEach(function(t){var n=o.Ur(t,i);r.forEach(function(r){r.respondsTo(t.type)&&e.push(r.createEvent(n,o.mr))})})},e.prototype.Ur=function(e,t){return"value"===e.type||"child_removed"===e.type?e:(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,this.me),e)},e.prototype.qr=function(e,t){if(null==e.childName||null==t.childName)throw o.assertionError("Should only compare child_ events.");var n=new r.NamedNode(e.childName,e.snapshotNode),i=new r.NamedNode(t.childName,t.snapshotNode);return this.me.compare(n,i)},e}();t.EventGenerator=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(0),o=n(2),a=n(96),s=n(3),u=n(4),l=function(){function e(){this.Br=a.CompoundWrite.Empty,this.Hr=[],this.Gr=-1}return e.prototype.childWrites=function(e){return new h(e,this)},e.prototype.addOverwrite=function(e,t,n,r){i.assert(n>this.Gr,"Stacking an older write on top of newer ones"),void 0===r&&(r=!0),this.Hr.push({path:e,snap:t,writeId:n,visible:r}),r&&(this.Br=this.Br.addWrite(e,t)),this.Gr=n},e.prototype.addMerge=function(e,t,n){i.assert(n>this.Gr,"Stacking an older merge on top of newer ones"),this.Hr.push({path:e,children:t,writeId:n,visible:!0}),this.Br=this.Br.addWrites(e,t),this.Gr=n},e.prototype.getWrite=function(e){for(var t=0;t<this.Hr.length;t++){var n=this.Hr[t];if(n.writeId===e)return n}return null},e.prototype.removeWrite=function(e){var t=this,n=this.Hr.findIndex(function(t){return t.writeId===e});i.assert(n>=0,"removeWrite called with nonexistent writeId.");var o=this.Hr[n];this.Hr.splice(n,1);for(var a=o.visible,s=!1,u=this.Hr.length-1;a&&u>=0;){var l=this.Hr[u];l.visible&&(u>=n&&this.Kr(l,o.path)?a=!1:o.path.contains(l.path)&&(s=!0)),u--}if(a){if(s)return this.Yr(),!0;if(o.snap)this.Br=this.Br.removeWrite(o.path);else{var h=o.children;r.forEach(h,function(e){t.Br=t.Br.removeWrite(o.path.child(e))})}return!0}return!1},e.prototype.getCompleteWriteData=function(e){return this.Br.getCompleteNode(e)},e.prototype.calcCompleteEventCache=function(t,n,r,i){if(r||i){var a=this.Br.childCompoundWrite(t);if(!i&&a.isEmpty())return n;if(i||null!=n||a.hasCompleteWrite(o.Path.Empty)){var s=function(e){return(e.visible||i)&&(!r||!~r.indexOf(e.writeId))&&(e.path.contains(t)||t.contains(e.path))},l=e.Xr(this.Hr,s,t),h=n||u.ChildrenNode.EMPTY_NODE;return l.apply(h)}return null}var c=this.Br.getCompleteNode(t);if(null!=c)return c;var p=this.Br.childCompoundWrite(t);if(p.isEmpty())return n;if(null!=n||p.hasCompleteWrite(o.Path.Empty)){var h=n||u.ChildrenNode.EMPTY_NODE;return p.apply(h)}return null},e.prototype.calcCompleteEventChildren=function(e,t){var n=u.ChildrenNode.EMPTY_NODE,r=this.Br.getCompleteNode(e);if(r)return r.isLeafNode()||r.forEachChild(s.PRIORITY_INDEX,function(e,t){n=n.updateImmediateChild(e,t)}),n;if(t){var i=this.Br.childCompoundWrite(e);return t.forEachChild(s.PRIORITY_INDEX,function(e,t){var r=i.childCompoundWrite(new o.Path(e)).apply(t);n=n.updateImmediateChild(e,r)}),i.getCompleteChildren().forEach(function(e){n=n.updateImmediateChild(e.name,e.node)}),n}return this.Br.childCompoundWrite(e).getCompleteChildren().forEach(function(e){n=n.updateImmediateChild(e.name,e.node)}),n},e.prototype.calcEventCacheAfterServerOverwrite=function(e,t,n,r){i.assert(n||r,"Either existingEventSnap or existingServerSnap must exist");var o=e.child(t);if(this.Br.hasCompleteWrite(o))return null;var a=this.Br.childCompoundWrite(o);return a.isEmpty()?r.getChild(t):a.apply(r.getChild(t))},e.prototype.calcCompleteChild=function(e,t,n){var r=e.child(t),i=this.Br.getCompleteNode(r);return null!=i?i:n.isCompleteForChild(t)?this.Br.childCompoundWrite(r).apply(n.getNode().getImmediateChild(t)):null},e.prototype.shadowingWrite=function(e){return this.Br.getCompleteNode(e)},e.prototype.calcIndexedSlice=function(e,t,n,r,i,a){var s,u=this.Br.childCompoundWrite(e),l=u.getCompleteNode(o.Path.Empty);if(null!=l)s=l;else{if(null==t)return[];s=u.apply(t)}if(s=s.withIndex(a),s.isEmpty()||s.isLeafNode())return[];for(var h=[],c=a.getCompare(),p=i?s.getReverseIteratorFrom(n,a):s.getIteratorFrom(n,a),d=p.getNext();d&&h.length<r;)0!==c(d,n)&&h.push(d),d=p.getNext();return h},e.prototype.Kr=function(e,t){return e.snap?e.path.contains(t):!!r.findKey(e.children,function(n,r){return e.path.child(r).contains(t)})},e.prototype.Yr=function(){this.Br=e.Xr(this.Hr,e.zr,o.Path.Empty),this.Hr.length>0?this.Gr=this.Hr[this.Hr.length-1].writeId:this.Gr=-1},e.zr=function(e){return e.visible},e.Xr=function(e,t,n){for(var s=a.CompoundWrite.Empty,u=0;u<e.length;++u){var l=e[u];if(t(l)){var h=l.path,c=void 0;if(l.snap)n.contains(h)?(c=o.Path.relativePath(n,h),s=s.addWrite(c,l.snap)):h.contains(n)&&(c=o.Path.relativePath(h,n),s=s.addWrite(o.Path.Empty,l.snap.getChild(c)));else{if(!l.children)throw i.assertionError("WriteRecord should have .snap or .children");if(n.contains(h))c=o.Path.relativePath(n,h),s=s.addWrites(c,l.children);else if(h.contains(n))if(c=o.Path.relativePath(h,n),c.isEmpty())s=s.addWrites(o.Path.Empty,l.children);else{var p=r.safeGet(l.children,c.getFront());if(p){var d=p.getChild(c.popFront());s=s.addWrite(o.Path.Empty,d)}}}}}return s},e}();t.WriteTree=l;var h=function(){function e(e,t){this.Jr=e,this.$r=t}return e.prototype.calcCompleteEventCache=function(e,t,n){return this.$r.calcCompleteEventCache(this.Jr,e,t,n)},e.prototype.calcCompleteEventChildren=function(e){return this.$r.calcCompleteEventChildren(this.Jr,e)},e.prototype.calcEventCacheAfterServerOverwrite=function(e,t,n){return this.$r.calcEventCacheAfterServerOverwrite(this.Jr,e,t,n)},e.prototype.shadowingWrite=function(e){return this.$r.shadowingWrite(this.Jr.child(e))},e.prototype.calcIndexedSlice=function(e,t,n,r,i){return this.$r.calcIndexedSlice(this.Jr,e,t,n,r,i)},e.prototype.calcCompleteChild=function(e,t){return this.$r.calcCompleteChild(this.Jr,e,t)},e.prototype.child=function(t){return new e(this.Jr.child(t),this.$r)},e}();t.WriteTreeRef=h},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(23),i=n(2),o=n(0),a=n(5),s=n(3),u=n(0),l=function(){function e(e){this.$r=e}return e.prototype.addWrite=function(t,n){if(t.isEmpty())return new e(new r.ImmutableTree(n));var o=this.$r.findRootMostValueAndPath(t);if(null!=o){var a=o.path,s=o.value,u=i.Path.relativePath(a,t);return s=s.updateChild(u,n),new e(this.$r.set(a,s))}var l=new r.ImmutableTree(n);return new e(this.$r.setTree(t,l))},e.prototype.addWrites=function(e,t){var n=this;return o.forEach(t,function(t,r){n=n.addWrite(e.child(t),r)}),n},e.prototype.removeWrite=function(t){return t.isEmpty()?e.Empty:new e(this.$r.setTree(t,r.ImmutableTree.Empty))},e.prototype.hasCompleteWrite=function(e){return null!=this.getCompleteNode(e)},e.prototype.getCompleteNode=function(e){var t=this.$r.findRootMostValueAndPath(e);return null!=t?this.$r.get(t.path).getChild(i.Path.relativePath(t.path,e)):null},e.prototype.getCompleteChildren=function(){var e=[],t=this.$r.value;return null!=t?t.isLeafNode()||t.forEachChild(s.PRIORITY_INDEX,function(t,n){e.push(new a.NamedNode(t,n))}):this.$r.children.inorderTraversal(function(t,n){null!=n.value&&e.push(new a.NamedNode(t,n.value))}),e},e.prototype.childCompoundWrite=function(t){if(t.isEmpty())return this;var n=this.getCompleteNode(t);return new e(null!=n?new r.ImmutableTree(n):this.$r.subtree(t))},e.prototype.isEmpty=function(){return this.$r.isEmpty()},e.prototype.apply=function(t){return e.Zr(i.Path.Empty,this.$r,t)},e.Empty=new e(new r.ImmutableTree(null)),e.Zr=function(t,n,r){if(null!=n.value)return r.updateChild(t,n.value);var i=null;return n.children.inorderTraversal(function(n,o){".priority"===n?(u.assert(null!==o.value,"Priority writes must always be leaf nodes"),i=o.value):r=e.Zr(t.child(n),o,r)}),r.getChild(t).isEmpty()||null===i||(r=r.updateChild(t.child(".priority"),i)),r},e}();t.CompoundWrite=l},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(4),i=function(){function e(){this.ei=r.ChildrenNode.EMPTY_NODE}return e.prototype.getNode=function(e){return this.ei.getChild(e)},e.prototype.updateSnapshot=function(e,t){this.ei=this.ei.updateChild(e,t)},e}();t.SnapshotHolder=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),i=function(){function e(e){this.ti=e}return e.prototype.getToken=function(e){return this.ti.INTERNAL.getToken(e).then(null,function(e){return e&&"auth/token-not-initialized"===e.code?(r.log("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(e)})},e.prototype.addTokenChangeListener=function(e){this.ti.INTERNAL.addAuthTokenListener(e)},e.prototype.removeTokenChangeListener=function(e){this.ti.INTERNAL.removeAuthTokenListener(e)},e.prototype.notifyForInvalidToken=function(){var e='Provided authentication credentials for the app named "'+this.ti.name+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.ti.options?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.ti.options?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',r.warn(e)},e}();t.AuthTokenProvider=i},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(0),o=function(){function e(){this.ni={}}return e.prototype.incrementCounter=function(e,t){void 0===t&&(t=1),i.contains(this.ni,e)||(this.ni[e]=0),this.ni[e]+=t},e.prototype.get=function(){return r.deepCopy(this.ni)},e}();t.StatsCollection=o},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(1),o=n(49),a=1e4,s=3e4,u=function(){function e(e,t){this.Z=t,this.ri={},this.G=new o.StatsListener(e);var n=a+(s-a)*Math.random();i.setTimeoutNonBlocking(this.ii.bind(this),Math.floor(n))}return e.prototype.includeStat=function(e){this.ri[e]=!0},e.prototype.ii=function(){var e=this,t=this.G.get(),n={},o=!1;r.forEach(t,function(t,i){i>0&&r.contains(e.ri,t)&&(n[t]=i,o=!0)}),o&&this.Z.reportStats(n),i.setTimeoutNonBlocking(this.ii.bind(this),Math.floor(2*Math.random()*3e5))},e}();t.StatsReporter=u},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),i=function(){function e(){this.oi=[],this.ai=0}return e.prototype.queueEvents=function(e){for(var t=null,n=0;n<e.length;n++){var r=e[n],i=r.getPath();null===t||i.equals(t.getPath())||(this.oi.push(t),t=null),null===t&&(t=new o(i)),t.add(r)}t&&this.oi.push(t)},e.prototype.raiseEventsAtPath=function(e,t){this.queueEvents(t),this.si(function(t){return t.equals(e)})},e.prototype.raiseEventsForChangedPath=function(e,t){this.queueEvents(t),this.si(function(t){return t.contains(e)||e.contains(t)})},e.prototype.si=function(e){this.ai++;for(var t=!0,n=0;n<this.oi.length;n++){var r=this.oi[n];r&&(e(r.getPath())?(this.oi[n].raise(),this.oi[n]=null):t=!1)}t&&(this.oi=[]),this.ai--},e}();t.EventQueue=i;var o=function(){function e(e){this.Oe=e,this.ui=[]}return e.prototype.add=function(e){this.ui.push(e)},e.prototype.raise=function(){for(var e=0;e<this.ui.length;e++){var t=this.ui[e];if(null!==t){this.ui[e]=null;var n=t.getEventRunner();r.logger&&r.log("event: "+t),r.exceptionGuard(n)}}},e.prototype.getPath=function(){return this.Oe},e}();t.EventList=o},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i=n(51),o=n(0),a=function(e){function t(){var t,n,r=e.call(this,["visible"])||this;return"undefined"!=typeof document&&void 0!==document.addEventListener&&(void 0!==document.hidden?(n="visibilitychange",t="hidden"):void 0!==document.mozHidden?(n="mozvisibilitychange",t="mozHidden"):void 0!==document.msHidden?(n="msvisibilitychange",t="msHidden"):void 0!==document.webkitHidden&&(n="webkitvisibilitychange",t="webkitHidden")),r.at=!0,n&&document.addEventListener(n,function(){var e=!document[t];e!==r.at&&(r.at=e,r.trigger("visible",e))},!1),r}return r(t,e),t.getInstance=function(){return new t},t.prototype.getInitialEvent=function(e){return o.assert("visible"===e,"Unknown event type: "+e),[this.at]},t}(i.EventEmitter);t.VisibilityMonitor=a},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i=n(0),o=n(51),a=n(0),s=function(e){function t(){var t=e.call(this,["online"])||this;return t.li=!0,"undefined"==typeof window||void 0===window.addEventListener||a.isMobileCordova()||(window.addEventListener("online",function(){t.li||(t.li=!0,t.trigger("online",!0))},!1),window.addEventListener("offline",function(){t.li&&(t.li=!1,t.trigger("online",!1))},!1)),t}return r(t,e),t.getInstance=function(){return new t},t.prototype.getInitialEvent=function(e){return i.assert("online"===e,"Unknown event type: "+e),[this.li]},t.prototype.currentlyOnline=function(){return this.li},t}(o.EventEmitter);t.OnlineMonitor=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(53),i=n(54),o=n(1),a=function(){function e(e){this.hi(e)}return Object.defineProperty(e,"ALL_TRANSPORTS",{get:function(){return[r.BrowserPollConnection,i.WebSocketConnection]},enumerable:!0,configurable:!0}),e.prototype.hi=function(t){var n=i.WebSocketConnection&&i.WebSocketConnection.isAvailable(),r=n&&!i.WebSocketConnection.previouslyFailed();if(t.webSocketOnly&&(n||o.warn("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),r=!0),r)this.ci=[i.WebSocketConnection];else{var a=this.ci=[];o.each(e.ALL_TRANSPORTS,function(e,t){t&&t.isAvailable()&&a.push(t)})}},e.prototype.initialTransport=function(){if(this.ci.length>0)return this.ci[0];throw Error("No transports available")},e.prototype.upgradeTransport=function(){return this.ci.length>1?this.ci[1]:null},e}();t.TransportManager=a},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),i=function(){function e(e){this.Ut=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}return e.prototype.closeAfter=function(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)},e.prototype.handleResponse=function(e,t){var n=this;this.pendingResponses[e]=t;for(var i=this;this.pendingResponses[this.currentResponseNum]&&"break"!==function(){var e=i.pendingResponses[i.currentResponseNum];delete i.pendingResponses[i.currentResponseNum];for(var t=0;t<e.length;++t)!function(t){e[t]&&r.exceptionGuard(function(){n.Ut(e[t])})}(t);if(i.currentResponseNum===i.closeAfterResponse)return i.onClose&&(i.onClose(),i.onClose=null),"break";i.currentResponseNum++}(););},e}();t.PacketReceiver=i},function(e,t,n){"use strict";var r=this&&this.__extends||function(){var e=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])};return function(t,n){function r(){this.constructor=t}e(t,n),t.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();Object.defineProperty(t,"__esModule",{value:!0});var i=n(0),o=n(1),a=n(0),s=n(0),u=n(0),l=n(55),h=function(e){function t(t,n,r){var i=e.call(this)||this;return i.H=t,i.ee=n,i.Ke=r,i.de=o.logWrapper("p:rest:"),i.Je={},i}return r(t,e),t.prototype.reportStats=function(e){throw Error("Method not implemented.")},t.pi=function(e,t){return void 0!==t?"tag$"+t:(i.assert(e.getQueryParams().isDefault(),"should have a tag if it's not a default query."),""+e.path)},t.prototype.listen=function(e,n,r,i){var o=this,a=""+e.path;this.de("Listen called for "+a+" "+e.queryIdentifier());var u=t.pi(e,r),l={};this.Je[u]=l;var h=e.getQueryParams().toRestQueryStringParameters();this.di(a+".json",h,function(e,t){var n=t;if(404===e&&(n=null,e=null),null===e&&o.ee(a,n,!1,r),s.safeGet(o.Je,u)===l){var h;h=e?401==e?"permission_denied":"rest_error:"+e:"ok",i(h,null)}})},t.prototype.unlisten=function(e,n){var r=t.pi(e,n);delete this.Je[r]},t.prototype.refreshAuthToken=function(e){},t.prototype.di=function(e,t,n){var r=this;void 0===t&&(t={}),t.format="export",this.Ke.getToken(!1).then(function(i){var s=i&&i.accessToken;s&&(t.auth=s);var l=(r.H.secure?"https://":"http://")+r.H.host+e+"?"+u.querystring(t);r.de("Sending REST request for "+l);var h=new XMLHttpRequest;h.onreadystatechange=function(){if(n&&4===h.readyState){r.de("REST Response for "+l+" received. status:",h.status,"response:",h.responseText);var e=null;if(h.status>=200&&h.status<300){try{e=a.jsonEval(h.responseText)}catch(e){o.warn("Failed to parse JSON response for "+l+": "+h.responseText)}n(null,e)}else 401!==h.status&&404!==h.status&&o.warn("Got unsuccessful REST response for "+l+" Status: "+h.status),n(h.status);n=null}},h.open("GET",l,!0),h.send()})},t}(l.ServerActions);t.ReadonlyRestClient=h},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(1),o=n(10),a=n(3),s=n(38),u=n(42),l=n(24),h=n(108),c=n(56),p=n(0),d=function(){function e(){this.fi=!1,this._i=!1,this.yi=!1,this.vi=!1,this.gi=!1,this.mi=0,this.Ci="",this.Ei=null,this.Ni="",this.Pi=null,this.bi="",this.me=a.PRIORITY_INDEX}return e.prototype.hasStart=function(){return this._i},e.prototype.isViewFromLeft=function(){return""===this.Ci?this._i:this.Ci===e.Si.VIEW_FROM_LEFT},e.prototype.getIndexStartValue=function(){return r.assert(this._i,"Only valid if start has been set"),this.Ei},e.prototype.getIndexStartName=function(){return r.assert(this._i,"Only valid if start has been set"),this.yi?this.Ni:i.MIN_NAME},e.prototype.hasEnd=function(){return this.vi},e.prototype.getIndexEndValue=function(){return r.assert(this.vi,"Only valid if end has been set"),this.Pi},e.prototype.getIndexEndName=function(){return r.assert(this.vi,"Only valid if end has been set"),this.gi?this.bi:i.MAX_NAME},e.prototype.hasLimit=function(){return this.fi},e.prototype.hasAnchoredLimit=function(){return this.fi&&""!==this.Ci},e.prototype.getLimit=function(){return r.assert(this.fi,"Only valid if limit has been set"),this.mi},e.prototype.getIndex=function(){return this.me},e.prototype.Ti=function(){var t=new e;return t.fi=this.fi,t.mi=this.mi,t._i=this._i,t.Ei=this.Ei,t.yi=this.yi,t.Ni=this.Ni,t.vi=this.vi,t.Pi=this.Pi,t.gi=this.gi,t.bi=this.bi,t.me=this.me,t.Ci=this.Ci,t},e.prototype.limit=function(e){var t=this.Ti();return t.fi=!0,t.mi=e,t.Ci="",t},e.prototype.limitToFirst=function(t){var n=this.Ti();return n.fi=!0,n.mi=t,n.Ci=e.Si.VIEW_FROM_LEFT,n},e.prototype.limitToLast=function(t){var n=this.Ti();return n.fi=!0,n.mi=t,n.Ci=e.Si.VIEW_FROM_RIGHT,n},e.prototype.startAt=function(e,t){var n=this.Ti();return n._i=!0,void 0===e&&(e=null),n.Ei=e,null!=t?(n.yi=!0,n.Ni=t):(n.yi=!1,n.Ni=""),n},e.prototype.endAt=function(e,t){var n=this.Ti();return n.vi=!0,void 0===e&&(e=null),n.Pi=e,void 0!==t?(n.gi=!0,n.bi=t):(n.gi=!1,n.bi=""),n},e.prototype.orderBy=function(e){var t=this.Ti();return t.me=e,t},e.prototype.getQueryObject=function(){var t=e.Si,n={};if(this._i&&(n[t.INDEX_START_VALUE]=this.Ei,this.yi&&(n[t.INDEX_START_NAME]=this.Ni)),this.vi&&(n[t.INDEX_END_VALUE]=this.Pi,this.gi&&(n[t.INDEX_END_NAME]=this.bi)),this.fi){n[t.LIMIT]=this.mi;var r=this.Ci;""===r&&(r=this.isViewFromLeft()?t.VIEW_FROM_LEFT:t.VIEW_FROM_RIGHT),n[t.VIEW_FROM]=r}return this.me!==a.PRIORITY_INDEX&&(n[t.INDEX]=""+this.me),n},e.prototype.loadsAllData=function(){return!(this._i||this.vi||this.fi)},e.prototype.isDefault=function(){return this.loadsAllData()&&this.me==a.PRIORITY_INDEX},e.prototype.getNodeFilter=function(){return this.loadsAllData()?new l.IndexedFilter(this.getIndex()):this.hasLimit()?new h.LimitedFilter(this):new c.RangedFilter(this)},e.prototype.toRestQueryStringParameters=function(){var t=e.wi,n={};if(this.isDefault())return n;var i;return this.me===a.PRIORITY_INDEX?i=t.PRIORITY_INDEX:this.me===s.VALUE_INDEX?i=t.VALUE_INDEX:this.me===o.KEY_INDEX?i=t.KEY_INDEX:(r.assert(this.me instanceof u.PathIndex,"Unrecognized index type!"),i=""+this.me),n[t.ORDER_BY]=p.stringify(i),this._i&&(n[t.START_AT]=p.stringify(this.Ei),this.yi&&(n[t.START_AT]+=","+p.stringify(this.Ni))),this.vi&&(n[t.END_AT]=p.stringify(this.Pi),this.gi&&(n[t.END_AT]+=","+p.stringify(this.bi))),this.fi&&(this.isViewFromLeft()?n[t.LIMIT_TO_FIRST]=this.mi:n[t.LIMIT_TO_LAST]=this.mi),n},e.Si={INDEX_START_VALUE:"sp",INDEX_START_NAME:"sn",INDEX_END_VALUE:"ep",INDEX_END_NAME:"en",LIMIT:"l",VIEW_FROM:"vf",VIEW_FROM_LEFT:"l",VIEW_FROM_RIGHT:"r",INDEX:"i"},e.wi={ORDER_BY:"orderBy",PRIORITY_INDEX:"$priority",VALUE_INDEX:"$value",KEY_INDEX:"$key",START_AT:"startAt",END_AT:"endAt",LIMIT_TO_FIRST:"limitToFirst",LIMIT_TO_LAST:"limitToLast"},e.DEFAULT=new e,e}();t.QueryParams=d},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(56),i=n(4),o=n(5),a=n(0),s=n(9),u=function(){function e(e){this.Ii=new r.RangedFilter(e),this.me=e.getIndex(),this.mi=e.getLimit(),this.Ri=!e.isViewFromLeft()}return e.prototype.updateChild=function(e,t,n,r,a,s){return this.Ii.matches(new o.NamedNode(t,n))||(n=i.ChildrenNode.EMPTY_NODE),e.getImmediateChild(t).equals(n)?e:e.numChildren()<this.mi?this.Ii.getIndexedFilter().updateChild(e,t,n,r,a,s):this.Oi(e,t,n,a,s)},e.prototype.updateFullNode=function(e,t,n){var r;if(t.isLeafNode()||t.isEmpty())r=i.ChildrenNode.EMPTY_NODE.withIndex(this.me);else if(2*this.mi<t.numChildren()&&t.isIndexed(this.me)){r=i.ChildrenNode.EMPTY_NODE.withIndex(this.me);var o=void 0;o=this.Ri?t.getReverseIteratorFrom(this.Ii.getEndPost(),this.me):t.getIteratorFrom(this.Ii.getStartPost(),this.me);for(var a=0;o.hasNext()&&a<this.mi;){var s=o.getNext(),u=void 0;if(!(u=this.Ri?this.me.compare(this.Ii.getStartPost(),s)<=0:this.me.compare(s,this.Ii.getEndPost())<=0))break;r=r.updateImmediateChild(s.name,s.node),a++}}else{r=t.withIndex(this.me),r=r.updatePriority(i.ChildrenNode.EMPTY_NODE);var l=void 0,h=void 0,c=void 0,o=void 0;if(this.Ri){o=r.getReverseIterator(this.me),l=this.Ii.getEndPost(),h=this.Ii.getStartPost();var p=this.me.getCompare();c=function(e,t){return p(t,e)}}else o=r.getIterator(this.me),l=this.Ii.getStartPost(),h=this.Ii.getEndPost(),c=this.me.getCompare();for(var a=0,d=!1;o.hasNext();){var s=o.getNext();!d&&c(l,s)<=0&&(d=!0);var u=d&&a<this.mi&&c(s,h)<=0;u?a++:r=r.updateImmediateChild(s.name,i.ChildrenNode.EMPTY_NODE)}}return this.Ii.getIndexedFilter().updateFullNode(e,r,n)},e.prototype.updatePriority=function(e,t){return e},e.prototype.filtersNodes=function(){return!0},e.prototype.getIndexedFilter=function(){return this.Ii.getIndexedFilter()},e.prototype.getIndex=function(){return this.me},e.prototype.Oi=function(e,t,n,r,u){var l;if(this.Ri){var h=this.me.getCompare();l=function(e,t){return h(t,e)}}else l=this.me.getCompare();var c=e;a.assert(c.numChildren()==this.mi,"");var p=new o.NamedNode(t,n),d=this.Ri?c.getFirstChild(this.me):c.getLastChild(this.me),f=this.Ii.matches(p);if(c.hasChild(t)){for(var _=c.getImmediateChild(t),y=r.getChildAfterChild(this.me,d,this.Ri);null!=y&&(y.name==t||c.hasChild(y.name));)y=r.getChildAfterChild(this.me,y,this.Ri);var v=null==y?1:l(y,p);if(f&&!n.isEmpty()&&v>=0)return null!=u&&u.trackChildChange(s.Change.childChangedChange(t,n,_)),c.updateImmediateChild(t,n);null!=u&&u.trackChildChange(s.Change.childRemovedChange(t,_));var g=c.updateImmediateChild(t,i.ChildrenNode.EMPTY_NODE);return null!=y&&this.Ii.matches(y)?(null!=u&&u.trackChildChange(s.Change.childAddedChange(y.name,y.node)),g.updateImmediateChild(y.name,y.node)):g}return n.isEmpty()?e:f&&l(d,p)>=0?(null!=u&&(u.trackChildChange(s.Change.childRemovedChange(d.name,d.node)),u.trackChildChange(s.Change.childAddedChange(t,n))),c.updateImmediateChild(t,n).updateImmediateChild(d.name,i.ChildrenNode.EMPTY_NODE)):e},e}();t.LimitedFilter=u},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r,i=n(0),o=n(21),a=n(22),s=n(2),u=n(110),l=n(3),h=n(1),c=n(43),p=n(7),d=n(0),f=n(11),_=n(4),y=n(17);!function(e){e[e.RUN=0]="RUN",e[e.SENT=1]="SENT",e[e.COMPLETED=2]="COMPLETED",e[e.SENT_NEEDS_ABORT=3]="SENT_NEEDS_ABORT",e[e.NEEDS_ABORT=4]="NEEDS_ABORT"}(r=t.TransactionStatus||(t.TransactionStatus={})),y.Repo.Ai=25,y.Repo.prototype.ie=function(){this.Di=new u.Tree},y.Repo.prototype.startTransaction=function(e,t,n,s){this.de("transaction on "+e);var u=function(){},y=new o.Reference(this,e);y.on("value",u);var v=function(){y.off("value",u)},g={path:e,update:t,onComplete:n,status:null,order:h.LUIDGenerator(),applyLocally:s,retryCount:0,unwatcher:v,abortReason:null,currentWriteId:null,currentInputSnapshot:null,currentOutputSnapshotRaw:null,currentOutputSnapshotResolved:null},m=this.Mi(e);g.currentInputSnapshot=m;var C=g.update(m.val());if(void 0===C){if(g.unwatcher(),g.currentOutputSnapshotRaw=null,g.currentOutputSnapshotResolved=null,g.onComplete){var E=new a.DataSnapshot(g.currentInputSnapshot,new o.Reference(this,g.path),l.PRIORITY_INDEX);g.onComplete(null,!1,E)}}else{p.validateFirebaseData("transaction failed: Data returned ",C,g.path),g.status=r.RUN;var N=this.Di.subTree(e),P=N.getValue()||[];P.push(g),N.setValue(P);var b=void 0;"object"==typeof C&&null!==C&&d.contains(C,".priority")?(b=d.safeGet(C,".priority"),i.assert(p.isValidPriority(b),"Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.")):b=(this.ue.calcCompleteEventCache(e)||_.ChildrenNode.EMPTY_NODE).getPriority().val(),b=b;var S=this.generateServerValues(),T=f.nodeFromJSON(C,b),w=c.resolveDeferredValueSnapshot(T,S);g.currentOutputSnapshotRaw=T,g.currentOutputSnapshotResolved=w,g.currentWriteId=this.pe();var I=this.ue.applyUserOverwrite(e,w,g.currentWriteId,g.applyLocally);this.K.raiseEventsForChangedPath(e,I),this.Li()}},y.Repo.prototype.Mi=function(e,t){return this.ue.calcCompleteEventCache(e,t)||_.ChildrenNode.EMPTY_NODE},y.Repo.prototype.Li=function(e){var t=this;if(void 0===e&&(e=this.Di),e||this.Fi(e),null!==e.getValue()){var n=this.xi(e);i.assert(n.length>0,"Sending zero length transaction queue"),n.every(function(e){return e.status===r.RUN})&&this.ki(e.path(),n)}else e.hasChildren()&&e.forEachChild(function(e){t.Li(e)})},y.Repo.prototype.ki=function(e,t){for(var n=this,u=t.map(function(e){return e.currentWriteId}),c=this.Mi(e,u),p=c,d=c.hash(),f=0;f<t.length;f++){var _=t[f];i.assert(_.status===r.RUN,"tryToSendTransactionQueue_: items in queue should all be run."),_.status=r.SENT,_.retryCount++;var y=s.Path.relativePath(e,_.path);p=p.updateChild(y,_.currentOutputSnapshotRaw)}var v=p.val(!0),g=e;this.Z.put(""+g,v,function(i){n.de("transaction put response",{path:""+g,status:i});var s=[];if("ok"===i){for(var u=[],c=0;c<t.length;c++){if(t[c].status=r.COMPLETED,s=s.concat(n.ue.ackUserWrite(t[c].currentWriteId)),t[c].onComplete){var p=t[c].currentOutputSnapshotResolved,d=new o.Reference(n,t[c].path),f=new a.DataSnapshot(p,d,l.PRIORITY_INDEX);u.push(t[c].onComplete.bind(null,null,!0,f))}t[c].unwatcher()}n.Fi(n.Di.subTree(e)),n.Li(),n.K.raiseEventsForChangedPath(e,s);for(var c=0;c<u.length;c++)h.exceptionGuard(u[c])}else{if("datastale"===i)for(var c=0;c<t.length;c++)t[c].status===r.SENT_NEEDS_ABORT?t[c].status=r.NEEDS_ABORT:t[c].status=r.RUN;else{h.warn("transaction at "+g+" failed: "+i);for(var c=0;c<t.length;c++)t[c].status=r.NEEDS_ABORT,t[c].abortReason=i}n.le(e)}},d)},y.Repo.prototype.le=function(e){var t=this.Wi(e),n=t.path(),r=this.xi(t);return this.ji(r,n),n},y.Repo.prototype.ji=function(e,t){if(0!==e.length){for(var n=[],u=[],_=e.filter(function(e){return e.status===r.RUN}),v=_.map(function(e){return e.currentWriteId}),g=0;g<e.length;g++){var m=e[g],C=s.Path.relativePath(t,m.path),E=!1,N=void 0;if(i.assert(null!==C,"rerunTransactionsUnderNode_: relativePath should not be null."),m.status===r.NEEDS_ABORT)E=!0,N=m.abortReason,u=u.concat(this.ue.ackUserWrite(m.currentWriteId,!0));else if(m.status===r.RUN)if(m.retryCount>=y.Repo.Ai)E=!0,N="maxretry",u=u.concat(this.ue.ackUserWrite(m.currentWriteId,!0));else{var P=this.Mi(m.path,v);m.currentInputSnapshot=P;var b=e[g].update(P.val());if(void 0!==b){p.validateFirebaseData("transaction failed: Data returned ",b,m.path);var S=f.nodeFromJSON(b),T="object"==typeof b&&null!=b&&d.contains(b,".priority");T||(S=S.updatePriority(P.getPriority()));var w=m.currentWriteId,I=this.generateServerValues(),R=c.resolveDeferredValueSnapshot(S,I);m.currentOutputSnapshotRaw=S,m.currentOutputSnapshotResolved=R,m.currentWriteId=this.pe(),v.splice(v.indexOf(w),1),u=u.concat(this.ue.applyUserOverwrite(m.path,R,m.currentWriteId,m.applyLocally)),u=u.concat(this.ue.ackUserWrite(w,!0))}else E=!0,N="nodata",u=u.concat(this.ue.ackUserWrite(m.currentWriteId,!0))}if(this.K.raiseEventsForChangedPath(t,u),u=[],E&&(e[g].status=r.COMPLETED,function(e){setTimeout(e,Math.floor(0))}(e[g].unwatcher),e[g].onComplete))if("nodata"===N){var O=new o.Reference(this,e[g].path),A=e[g].currentInputSnapshot,D=new a.DataSnapshot(A,O,l.PRIORITY_INDEX);n.push(e[g].onComplete.bind(null,null,!1,D))}else n.push(e[g].onComplete.bind(null,Error(N),!1,null))}this.Fi(this.Di);for(var g=0;g<n.length;g++)h.exceptionGuard(n[g]);this.Li()}},y.Repo.prototype.Wi=function(e){for(var t,n=this.Di;null!==(t=e.getFront())&&null===n.getValue();)n=n.subTree(t),e=e.popFront();return n},y.Repo.prototype.xi=function(e){var t=[];return this.Vi(e,t),t.sort(function(e,t){return e.order-t.order}),t},y.Repo.prototype.Vi=function(e,t){var n=this,r=e.getValue();if(null!==r)for(var i=0;i<r.length;i++)t.push(r[i]);e.forEachChild(function(e){n.Vi(e,t)})},y.Repo.prototype.Fi=function(e){var t=this,n=e.getValue();if(n){for(var i=0,o=0;o<n.length;o++)n[o].status!==r.COMPLETED&&(n[i]=n[o],i++);n.length=i,e.setValue(n.length>0?n:null)}e.forEachChild(function(e){t.Fi(e)})},y.Repo.prototype.fe=function(e){var t=this,n=this.Wi(e).path(),r=this.Di.subTree(e);return r.forEachAncestor(function(e){t.Qi(e)}),this.Qi(r),r.forEachDescendant(function(e){t.Qi(e)}),n},y.Repo.prototype.Qi=function(e){var t=e.getValue();if(null!==t){for(var n=[],o=[],a=-1,s=0;s<t.length;s++)t[s].status===r.SENT_NEEDS_ABORT||(t[s].status===r.SENT?(i.assert(a===s-1,"All SENT items should be at beginning of queue."),a=s,t[s].status=r.SENT_NEEDS_ABORT,t[s].abortReason="set"):(i.assert(t[s].status===r.RUN,"Unexpected transaction status in abort"),t[s].unwatcher(),o=o.concat(this.ue.ackUserWrite(t[s].currentWriteId,!0)),t[s].onComplete&&n.push(t[s].onComplete.bind(null,Error("set"),!1,null))));-1===a?e.setValue(null):t.length=a+1,this.K.raiseEventsForChangedPath(e.path(),o);for(var s=0;s<n.length;s++)h.exceptionGuard(n[s])}}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(0),i=n(2),o=n(0),a=function(){function e(){this.children={},this.childCount=0,this.value=null}return e}();t.TreeNode=a;var s=function(){function e(e,t,n){void 0===e&&(e=""),void 0===t&&(t=null),void 0===n&&(n=new a),this.qi=e,this.Ui=t,this._e=n}return e.prototype.subTree=function(t){for(var n,r=t instanceof i.Path?t:new i.Path(t),s=this;null!==(n=r.getFront());)s=new e(n,s,o.safeGet(s._e.children,n)||new a),r=r.popFront();return s},e.prototype.getValue=function(){return this._e.value},e.prototype.setValue=function(e){r.assert(void 0!==e,"Cannot set value to undefined"),this._e.value=e,this.Bi()},e.prototype.clear=function(){this._e.value=null,this._e.children={},this._e.childCount=0,this.Bi()},e.prototype.hasChildren=function(){return this._e.childCount>0},e.prototype.isEmpty=function(){return null===this.getValue()&&!this.hasChildren()},e.prototype.forEachChild=function(t){var n=this;o.forEach(this._e.children,function(r,i){t(new e(r,n,i))})},e.prototype.forEachDescendant=function(e,t,n){t&&!n&&e(this),this.forEachChild(function(t){t.forEachDescendant(e,!0,n)}),t&&n&&e(this)},e.prototype.forEachAncestor=function(e,t){for(var n=t?this:this.parent();null!==n;){if(e(n))return!0;n=n.parent()}return!1},e.prototype.forEachImmediateDescendantWithValue=function(e){this.forEachChild(function(t){null!==t.getValue()?e(t):t.forEachImmediateDescendantWithValue(e)})},e.prototype.path=function(){return new i.Path(null===this.Ui?this.qi:this.Ui.path()+"/"+this.qi)},e.prototype.name=function(){return this.qi},e.prototype.parent=function(){return this.Ui},e.prototype.Bi=function(){null!==this.Ui&&this.Ui.Hi(this.qi,this)},e.prototype.Hi=function(e,t){var n=t.isEmpty(),r=o.contains(this._e.children,e);n&&r?(delete this._e.children[e],this._e.childCount--,this.Bi()):n||r||(this._e.children[e]=t._e,this._e.childCount++,this.Bi())},e}();t.Tree=s},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(54),i=n(53);t.forceLongPolling=function(){r.WebSocketConnection.forceDisallow(),i.BrowserPollConnection.forceAllow()},t.forceWebSockets=function(){i.BrowserPollConnection.forceDisallow()},t.isWebSocketsAvailable=function(){return r.WebSocketConnection.isAvailable()},t.setSecurityDebugCallback=function(e,t){e.repo.J.it=t},t.stats=function(e,t){e.repo.stats(t)},t.statsIncrementCounter=function(e,t){e.repo.statsIncrementCounter(t)},t.dataUpdateCount=function(e){return e.repo.dataUpdateCount},t.interceptServerData=function(e,t){return e.repo.he(t)}},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(34),i=n(50),o=n(26),a=n(52);t.DataConnection=i.PersistentConnection,i.PersistentConnection.prototype.simpleListen=function(e,t){this.sendRequest("q",{p:e},t)},i.PersistentConnection.prototype.echo=function(e,t){this.sendRequest("echo",{d:e},t)},t.RealTimeConnection=a.Connection,t.hijackHash=function(e){var t=i.PersistentConnection.prototype.put;return i.PersistentConnection.prototype.put=function(n,r,i,o){void 0!==o&&(o=e()),t.call(this,n,r,i,o)},function(){i.PersistentConnection.prototype.put=t}},t.ConnectionTarget=r.RepoInfo,t.queryIdentifier=function(e){return e.queryIdentifier()},t.listens=function(e){return e.repo.J.Je},t.forceRestClient=function(e){o.RepoManager.getInstance().forceRestClient(e)}}],[78])}catch(e){throw Error("Cannot instantiate firebase-database.js - be sure to load firebase-app.js first.")}

/* vuefire@1.4.4 */
!function(e,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.VueFire=n():e.VueFire=n()}(this,function(){return function(e){function n(r){if(i[r])return i[r].exports;var t=i[r]={exports:{},id:r,loaded:!1};return e[r].call(t.exports,t,t.exports,n),t.loaded=!0,t.exports}var i={};return n.m=e,n.c=i,n.p="",n(0)}([function(e,n){function i(e){return"function"==typeof e.key?e.key():e.key}function r(e){return"function"==typeof e.ref?e=e.ref():"object"==typeof e.ref&&(e=e.ref),e}function t(e){return"[object Object]"===Object.prototype.toString.call(e)}function o(e){var n=e.val(),r=t(n)?n:{".value":n};return r[".key"]=i(e),r}function s(e,n){for(var i=0;i<e.length;i++)if(e[i][".key"]===n)return i;return-1}function f(e,n,i){var o=!1,s=null,f=null;if(t(i)&&i.hasOwnProperty("source")&&(o=i.asObject,s=i.cancelCallback,f=i.readyCallback,i=i.source),!t(i))throw new Error("VueFire: invalid Firebase binding source.");var c=r(i);e.$firebaseRefs[n]=c,e._firebaseSources[n]=i,s&&(s=s.bind(e)),o?u(e,n,i,s):a(e,n,i,s),f&&i.once("value",f.bind(e))}function c(e,n,i){n in e?e[n]=i:p.util.defineReactive(e,n,i)}function a(e,n,r,t){var f=[];c(e,n,f);var a=r.on("child_added",function(e,n){var i=n?s(f,n)+1:0;f.splice(i,0,o(e))},t),u=r.on("child_removed",function(e){var n=s(f,i(e));f.splice(n,1)},t),l=r.on("child_changed",function(e){var n=s(f,i(e));f.splice(n,1,o(e))},t),b=r.on("child_moved",function(e,n){var r=s(f,i(e)),t=f.splice(r,1)[0],o=n?s(f,n)+1:0;f.splice(o,0,t)},t);e._firebaseListeners[n]={child_added:a,child_removed:u,child_changed:l,child_moved:b}}function u(e,n,i,r){c(e,n,{});var t=i.on("value",function(i){e[n]=o(i)},r);e._firebaseListeners[n]={value:t}}function l(e,n){var i=e._firebaseSources&&e._firebaseSources[n];if(!i)throw new Error('VueFire: unbind failed: "'+n+'" is not bound to a Firebase reference.');var r=e._firebaseListeners[n];for(var t in r)i.off(t,r[t]);e[n]=null,e.$firebaseRefs[n]=null,e._firebaseSources[n]=null,e._firebaseListeners[n]=null}function b(e){e.$firebaseRefs||(e.$firebaseRefs=Object.create(null),e._firebaseSources=Object.create(null),e._firebaseListeners=Object.create(null))}function d(e){p=e,p.mixin(v);var n=p.config.optionMergeStrategies;n.firebase=n.methods,p.prototype.$bindAsObject=function(e,n,i,r){b(this),f(this,e,{source:n,asObject:!0,cancelCallback:i,readyCallback:r})},p.prototype.$bindAsArray=function(e,n,i,r){b(this),f(this,e,{source:n,cancelCallback:i,readyCallback:r})},p.prototype.$unbind=function(e){l(this,e)}}var p,h=function(){var e=this.$options.firebase;if("function"==typeof e&&(e=e.call(this)),e){b(this);for(var n in e)f(this,n,e[n])}},v={created:h,beforeDestroy:function(){if(this.$firebaseRefs){for(var e in this.$firebaseRefs)this.$firebaseRefs[e]&&this.$unbind(e);this.$firebaseRefs=null,this._firebaseSources=null,this._firebaseListeners=null}}};"undefined"!=typeof window&&window.Vue&&d(window.Vue),e.exports=d}])});