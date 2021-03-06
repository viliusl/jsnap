(function() {
    
    var window = this;
    
    function Queue() {
        this.front = []
        this.back = []
    }
    Queue.prototype.isEmpty = function() {
        return this.front.length == 0 && this.back.length == 0;
    }
    Queue.prototype.pop = function() {
        if (this.front.length == 0) {
            var tmp = this.front;
            this.front = this.back.reverse();
            this.back = tmp;
        }
        return this.front.pop();
    }
    Queue.prototype.push = function(x) {
        this.back.push(x);
    }
    
    var queue = new Queue();
    var protoQueue = new Queue();
    
    var paths = {}
    
    function enqueue(x, path) {
        if (typeof x !== 'object' && typeof x !== 'function')
            return;
        if (x === null)
            return;
        if (x.hasOwnProperty("__jsnapHiddenProp__queued")) {
            return;
        }
        x.__jsnapHiddenProp__queued = true;
        x.__jsnapHiddenProp__path = path;
        queue.push(x)
    }
    
    function visit(x) {
        var path = x.__jsnapHiddenProp__path;
        if (typeof x === 'function') {
            paths['$' + path] = true
        }
        var names = Object.getOwnPropertyNames(x)
        for (var i=0; i<names.length; i++) {
            var name = names[i];
            if (name.substring(0,19) === '__jsnapHiddenProp__')
                continue; // skip injected properties
            if (typeof x === 'function' && (name === 'arguments' || name === 'caller'))
                continue; // skip the call stack properties
            if (name === '__proto__')
                continue; // skip access to internal prototype (it is handled elsewhere)
            try {
                var prty = Object.getOwnPropertyDescriptor(x, name)
            } catch (e) {
                continue; // back off if WebKit security gets angry
            }
            if (!prty) {
                continue; // there are strange objects where this can happen (eg. process.env in node.js)
            }
            var path2 = path === '' ? name : (path + '.' + name);
            if (prty.value) {
                enqueue(prty.value, path2)
            }
            if (prty.get) {
                enqueue(prty.get, path2 + '#get')
            }
            if (prty.set) {
                enqueue(prty.set, path2 + '#set')
            }
        }
        protoQueue.push(x)
    }
    
    function blacklist(x) {
        x.__jsnapHiddenProp__queued = true;
    }
    
    var isPhantomJs = !!window._phantom;
    var isNodeJs = !isPhantomJs;
    
    if (isPhantomJs) {
        blacklist(_phantom)
        blacklist(callPhantom)
    }
    if (isNodeJs) {
        var fs = require('fs')
        enqueue(fs, "require('fs')")
        blacklist(require.main) // don't inspect the nativedump module
    }
    
    enqueue(window, "")
    while (true) {
        while (!queue.isEmpty()) {
            visit(queue.pop());
        }
        if (protoQueue.isEmpty()) {
            break;
        }
        var x = protoQueue.pop();
        enqueue(Object.getPrototypeOf(x), x.__jsnapHiddenProp__path + '.__proto__')
    }
    
    for (var k in paths) {
        if (k[0] != '$')
            continue;
        console.log(k.substring(1))
    }
    
})();