'use strict';

const ALIOSS_UPLOAD_ENGINE = 'alioss';
//默认的upload上传引擎是阿里OSS服务
const DEFAULT_UPLOAD_ENGINE = ALIOSS_UPLOAD_ENGINE;
//支持的上传引擎
const SUPPORT_ENGINE_MAP = {
    alioss: require('./ossFileUpload')
};

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
 * create file folder by date
 * @param time
 * @returns {string}
 */
function createFolderName(time) {
    return time.getFullYear()
        + '/' + utils.leftpad(time.getMonth() + 1, 2, '0')
        + '/' + utils.leftpad(time.getDate(), 2, '0')
        + '/' + utils.leftpad(time.getHours(), 2, '0');
}

/**
 * create random the uploadFile name
 * @param opt  name config, support prefix & suffix
 */
function randomFileName(opt) {
    opt = opt || {};
    let curTime = new Date();

    let prefix = opt.prefix || createFolderName(curTime);
    let suffix = opt.suffix || '';

    let key = utils.leftpad(Math.round(Math.random() * 99999), 5, 0);
    return prefix + curTime.getTime() + "_" + key + suffix;
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
        } else if (data instanceof File && !option.suffix) {
            let fileName = data.name;
            option.suffix = fileName.substr(fileName.lastIndexOf('.'));
            name = randomFileName(opt);
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

        return this._upload(data, name, option)
    }

    _upload(data, name, option) {
        return this.client.upload(data, name, option);
    }
}

module.exports = module.exports['default'] = FileUpload;