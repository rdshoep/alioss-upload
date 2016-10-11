/**
 * Created by rdshoep on 16/4/4.
 */
function extend() {
    if (arguments && arguments.length > 1) {
        var obj = arguments[0] || {};
        for (var i = 1; i < arguments.length; i++) {
            var ext = arguments[i];
            if (ext) {
                for (var p in ext) {
                    if (!obj.hasOwnProperty(p) || obj[p] !== ext[p]) {
                        obj[p] = ext[p];
                    }
                }
            }
        }

        return obj;
    }
    return arguments[0];
}

//https://github.com/stevemao/left-pad
function leftpad(str, len, ch) {
    str = String(str);

    var i = -1;

    if (!ch && ch !== 0) ch = ' ';

    len = len - str.length;

    while (++i < len) {
        str = ch + str;
    }

    return str;
}

/**
 * 融合resolve和callback
 */
function concatResolve(cb, resolve) {
    if (!(cb && typeof cb == 'function')) return resolve;

    return function() {
        cb.apply(this, [null].concat([].slice.apply(arguments)));
        resolve.apply(this, arguments);
    }
}

/**
 * 融合reject和callback
 */
function concatReject(cb, reject) {
    if (!(cb && typeof cb == 'function')) return reject;

    return function() {
        cb.apply(this, arguments);
        reject.apply(this, arguments);
    }
}

function resolveFunctoin(possibleFunction) {
    if (possibleFunction && possibleFunction instanceof Function) {
        return possibleFunction;
    } else {
        return new Function;
    }
}

export {
    extend,
    leftpad,
    concatResolve,
    concatReject,
    resolveFunctoin
}