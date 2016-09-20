/**
 * Created by rdshoep on 16/4/13.
 */
import {extend, leftpad} from './utils';
import ajax from '@fdaciuk/ajax';
import Promise from 'promise';

function randomName() {
    var curTime = new Date().getTime();
    var key = leftpad(Math.round(Math.random() * 99999), 5, 0);
    return "pk" + curTime + "_" + key;
}

const ALI_OSS_DOMAIN = "aliyuncs.com/";
const TYPE_FILE = 'file';
const TYPE_BUFFER = 'buffer';

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

    return url
}
class FileUpload {
    constructor(opts) {
        this.options = opts || {};
    }

    authorize(url, callback) {
        ajax({
            url: url,
            type: 'GET',
            success: function (res) {
                callback(undefined, {
                    region: res.region,
                    accessKeyId: res.AccessKeyId,
                    accessKeySecret: res.AccessKeySecret,
                    stsToken: res.SecurityToken,
                    bucket: res.bucket,
                    static: res.static
                });
            },
            error: function (err) {
                callback(err);
            }
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
            this.domain = "http://" + options.bucket + "." + options.region + "." + ALI_OSS_DOMAIN;
        }
    }

    init(opts) {
        var options = extend({
            type: 1 //  1--需要从服务器获取信息进行auth,  2--直接使用配置信息
        }, this.options, opts);

        var _this = this;

        return new Promise(function (resolve, reject) {
            if (options.type == 1 && options.url) {
                _this.authorize(options.url, function (err, opt) {
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
                _this._initClient(options);
                _this._initial = true;
                resolve();
            }
        });
    }

    verify() {
        if (this._initial) {
            return new Promise(function (resole) {
                resole();
            });
        } else {
            return this.init(this.options);
        }
    }

    /**
     * 上传图片
     * @param file 图片
     * @param name 指定key
     * @param callback 回调函数
     * @param opt 配置信息（关于图片文件控制） {style: 'style', 'config': 'image_deal_config'}
     * @returns {*}
     */
    upload(file, name, callback, opt) {
        //调整参数
        if (name && name instanceof Function) {
            callback = name;
            name = undefined;
        }

        //如果name为空,生成随机数key
        if (name) {
            name = name.toString();
        } else {
            name = randomName();

            let fileSuffix = opt.suffix;
            if (fileSuffix && typeof fileSuffix == 'string') {
                name = name + fileSuffix;
            }
        }

        callback = callback || new Function;

        var _this = this;
        let option = opt || {};
        let type = opt.type || TYPE_FILE;

        if (TYPE_BUFFER == type) {
            this.verify().then(function () {
                console.log('begin upload');
                _this.client.put(name, new OSS.Buffer(file)).then(function (res) {
                    console.log('upload success: %j', res);
                    res.url = generateImageUrl(_this.domain + res.name, option);
                    return callback(undefined, res);
                }).catch(function (err) {
                    console.log('upload error: %j', err);
                    callback(err);
                });
            });
        }
        else if (TYPE_FILE == type) {
            this.verify().then(
                function () {
                    console.log('begin upload');
                    _this.client.multipartUpload(name, file, {
                        progress: function (p) {
                            console.log('upload progress: %s', p);
                            return function (done) {
                                done();
                            }
                        }
                    }).then(function (res) {
                        console.log('upload success: %j', res);
                        res.url = generateImageUrl(_this.domain + res.name, option);
                        return callback(undefined, res);
                    }).catch(function (err) {
                        console.log('upload error: %j', err);
                        callback(err);
                    });
                }
            );
        }

        return name;
    }
}

export default FileUpload;