/**
 * Created by rdshoep on 16/4/13.
 */
import * as utils from './utils';
import ajax from '@fdaciuk/ajax';
import Promise from 'promise';
// import OSS from 'ali-oss';

//alioss default domain host
const ALI_OSS_DOMAIN = "aliyuncs.com/";

const TYPE_FILE = 'file';
const TYPE_BUFFER = 'buffer';

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

class OssFileUpload {
    constructor(opts) {
        this.options = opts || {};
    }

    init(opts) {
        let options = utils.extend({}, this.options, opts);
        let _this = this;

        return new Promise(function (resolve, reject) {
            if (options.auth) {
                if (typeof options.auth == 'object') {
                    _this._initClient(utils.extend({}, options, options.auth));
                    _this._initial = true;
                    resolve();
                } else if (typeof options.auth == 'string') {
                    _this.authorize(options.auth, function (err, opt) {
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
                    reject('invalid option.auth config type: ' + typeof options.auth);
                }
            } else {
                reject("option.auth config can't be null!");
            }
        });
    }

    authorize(url, callback) {
        callback = utils.resolveFunctoin(callback);

        ajax()
            .get(url)
            .then(function (res, xhr) {
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
            .catch(function (res, xhr) {
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
            return Promise.resolve();
        } else {
            return this.init(this.options);
        }
    }

    _uploadImpl(data, name, type, option) {
        type = type || TYPE_FILE;

        if (TYPE_FILE == type) {
            console.log(name, data, option)
            return this.client.multipartUpload(name, data, option);
        } else if (TYPE_BUFFER == type) {
            console.log(name, data, option, OSS.Buffer)
            return this.client.put(name, new OSS.Buffer(data));
        } else {
            return Promise.reject('unsupported upload data type:' + type)
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
        let option = opt || {};

        //before upload callback function
        let before = utils.resolveFunctoin(option.before);
        let success = utils.resolveFunctoin(option.success);
        let error = utils.resolveFunctoin(option.error);
        let progress = utils.resolveFunctoin(option.progress);

        var _this = this;

        let type = option.type || TYPE_FILE;

        if (!file) {
            return new Promise(function (resolve, reject) {
                error(name, 'file content can not be empty!');
                reject(err);
            });
        }

        return this.verify()
            .then(function () {
                before(name);
                console.log('begin upload');
                return _this._uploadImpl(file, name, type, {
                    progress: function (p) {
                        return function (done) {
                            console.log('upload progress: %s', p);
                            progress(name, p);
                            done();
                        };
                    }
                });
            })
            .then(function (res) {
                console.log('upload success: %j', res);
                res.url = generateImageUrl(_this.domain + res.name, option);
                success(name, res);
                return res;
            })
            .catch(function (err) {
                console.log('upload error: %j', err);
                error(name, err);
                return Promise.reject(err);
            });
    }
}

module.exports = OssFileUpload;