;
(function(root, factory) {
    'use strict'

    if (root) {
        root.FileUpload = factory()
    }

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define('FileUpload', factory)
    } else if (typeof exports === 'object') {
        exports = module.exports = factory()
    }
})(this || window, function() {
    var FileUpload = require('./ossFileUpload');
    return FileUpload;
})