/**
 * Created by rdshoep on 16/4/13.
 */
import { extend, leftpad } from './utils';
import ajax from '@fdaciuk/ajax';
import Promise from 'promise';
// import OSS from 'ali-oss';

//alioss default domain host
const ALI_OSS_DOMAIN = "aliyuncs.com/";
const TYPE_FILE = 'file';
const TYPE_BUFFER = 'buffer';

/**
 * create random the uploadFile name
 * @param opt  name config, support prefix & suffix
 */
function randomFileName(opt) {
    opt = opt || {};
    let prefix = opt.prefix || 'pk';
    let suffix = opt.suffix || '';

    let curTime = new Date().getTime();
    let key = leftpad(Math.round(Math.random() * 99999), 5, 0);
    return prefix + curTime + "_" + key + suffix;
}

/**
 * auto generate image url
 * support oss style or specifix config
 * 
 * @param url the original url
 * @param opt config info
 */
function generateImageUrl(url, opt) {
    let suffix;
    if (opt) {
        if (opt.style && typeof opt.style == 'string') {
            suffix = '@!' + opt.style;
        }
        if (opt.config && typeof opt.config == 'string') {
            suffix = '@' + opt.config;
        }
    }

    if (url && suffix) {
        return url + suffix;
    }

    return url;
}

function resolveSafeFunctoin(possibleFunction) {
    if (possibleFunction && possibleFunction instanceof Function) {
        return possibleFunction;
    } else {
        return new Function;
    }
}

class OssFileUpload {
    constructor(opts) {
        this.options = opts || {};
    }

    init(opts) {
        let options = extend({}, this.options, opts);
        let _this = this;

        return new Promise(function(resolve, reject) {
            if (options.auth && typeof options.auth == 'object') {
                _this._initClient(extend({}, options, options.auth));
                _this._initial = true;
                resolve();
            } else {
                let authUrl = options.url;
                if (authUrl && typeof authUrl == 'string') {
                    _this.authorize(options.url, function(err, opt) {
                        if (err) {
                            console.error(err);
                            reject(err);
                            return;
                        }

                        _this._initClient(opt);
                        _this._initial = true;
                        resolve();
                    });
                } else {
                    reject('invalid auth server url: ' + authUrl);
                }
            }
        });
    }

    authorize(url, callback) {
        callback = resolveSafeFunctoin(callback);

        ajax()
            .get(url)
            .then(function(res, xhr) {
                if (res && typeof res == 'object') {
                    callback(undefined, {
                        region: res.region,
                        accessKeyId: res.AccessKeyId,
                        accessKeySecret: res.AccessKeySecret,
                        stsToken: res.SecurityToken,
                        bucket: res.bucket,
                        static: res.static
                    });
                } else {
                    callback('request to sts server error: (' + xhr.status + ')' + xhr.responseText);
                }
            })
            .catch(function(res, xhr) {
                callback('request to sts server error: (' + xhr.status + ')' + xhr.responseText);
            });
    }

    _initClient(options) {
        this.client = new OSS.Wrapper({
            region: options.region,
            accessKeyId: options.accessKeyId,
            accessKeySecret: options.accessKeySecret,
            stsToken: options.stsToken,
            bucket: options.bucket
        });
        //静态文件URL
        if (options.static) {
            this.domain = options.static;
        } else {
            this.domain = "http://" + options.bucket + "." + options.region +
                "." + ALI_OSS_DOMAIN;
        }
    }

    verify() {
        if (this._initial) {
            return new Promise(function(resole) {
                resole();
            });
        } else {
            return this.init(this.options);
        }
    }

    _uploadImpl(data, name, type, option) {
        type = type || TYPE_FILE;

        if (TYPE_FILE == type) {
            return this.client.multipartUpload(name, data, option);
        } else if (TYPE_BUFFER == type) {
            return this.client.put(name, new OSS.Buffer(data));
        } else {
            return new Promise(function(resolve, reject) {
                reject('unsupported upload data type:' + type);
            });
        }
    }

    /**
     * 上传图片
     * @param file 图片
     * @param name 指定key
     * @param opt 配置信息（关于图片文件控制） {style: 'style', 'config': 'image_deal_config'}
     * @returns {*}
     */
    upload(file, name, opt) {
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

        //before upload callback function
        let before = resolveSafeFunctoin(option.before);
        let success = resolveSafeFunctoin(option.success);
        let error = resolveSafeFunctoin(option.error);
        let progress = resolveSafeFunctoin(option.progress);

        var _this = this;

        let type = option.type || TYPE_FILE;

        if (!file) {
            return new Promise(function(resolve, reject) {
                error(name, 'file content can not be empty!');
                reject(err);
            });
        }

        return this.verify()
            .then(function() {
                before(name);
                console.log('begin upload');
                return _this._uploadImpl(file, name, type, {
                    progress: function(p) {
                        return function(done) {
                            console.log('upload progress: %s', p);
                            progress(name, p);
                            done();
                        };
                    }
                });
            })
            .then(function(res) {
                console.log('upload success: %j', res);
                res.url = generateImageUrl(_this.domain + res.name, option);
                success(name, res);
                return res;
            })
            .catch(function(err) {
                console.log('upload error: %j', err);
                error(name, err);
                return new Promise(function(resolve, reject) {
                    reject(err);
                });
            });
    }
}

// export default OssFileUpload;

module.exports = OssFileUpload;