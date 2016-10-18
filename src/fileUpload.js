;
(function (root, factory) {
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
})(this || window, function () {
    const ALIOSS_UPLOAD_ENGINE = 'alioss';
    //默认的upload上传引擎是阿里OSS服务
    const DEFAULT_UPLOAD_ENGINE = ALIOSS_UPLOAD_ENGINE;
    //支持的上传引擎
    const SUPPORT_ENGINE_MAP = {
        alioss: require('./ossFileUpload')
    };

    let imageCompress = require('./imageCompress');
    let utils = require('./utils');

    function generateUploadImplClient(option) {
        option = option || {};
        let engine = option.engine || DEFAULT_UPLOAD_ENGINE;

        let Client = SUPPORT_ENGINE_MAP[engine];

        if (!Client) {
            throw Error('Unsupport upload engine(' + engine + ')');
        }

        return new Client(option);
    }

    /**
     * create random the uploadFile name
     * @param opt  name config, support prefix & suffix
     */
    function randomFileName(opt) {
        opt = opt || {};
        let prefix = opt.prefix || 'pk';
        let suffix = opt.suffix || '';

        let curTime = new Date().getTime();
        let key = utils.leftpad(Math.round(Math.random() * 99999), 5, 0);
        return prefix + curTime + "_" + key + suffix;
    }

    class FileUpload {
        constructor(opts) {
            this.options = opts || {};

            this.client = generateUploadImplClient(this.options);
        }

        init(opts) {
            return this.client.init(opts);
        }

        /**
         * 上传图片
         * @param data 图片
         * @param name 指定key
         * @param opt 配置信息（关于图片文件控制） {style: 'style', 'config': 'image_deal_config'}
         * @returns {*}
         */
        upload(data, name, opt) {
            //调整参数
            if (name && typeof name == 'object') {
                opt = opt || name;
                name = undefined;
            }

            let option = opt || {};

            //如果name为空,生成随机数key
            if (name && typeof name == 'string') {
                name = name.toString();
            } else if (name && name instanceof Function) {
                name = name();
            } else {
                name = randomFileName(opt);
            }

            let error = utils.resolveFunctoin(option.error);

            if (!data) {
                return new Promise(function (resolve, reject) {
                    error(name, 'file content can not be empty!');
                    reject('file content can not be empty!');
                });
            }

            let _this = this;
            if (data instanceof File && option.imageCompress) {
                return imageCompress(data, utils.extend({
                    output: 'buffer'
                }, option.imageCompress))
                    .then(function (buffer) {
                        option.type = 'buffer';
                        console.log(buffer, data)
                        return _this.client.upload(buffer, name, option);
                    }).catch(function (err) {
                        let msg = 'image compress error: ' + err;
                        error(msg);
                        throw new Error(msg);
                    });
            } else {
                return this.client.upload(data, name, option);
            }
        }
    }

    return FileUpload;
})