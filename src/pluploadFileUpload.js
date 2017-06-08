/**
 * Created by rdshoep on 16/4/13.
 */
import * as utils from './utils';
import ajax from '@fdaciuk/ajax';
import Promise from 'promise';
import plupload from 'plupload'
import EventEmitter from 'eventemitter3'

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

class PluploadFileUpload {
    constructor(opts) {
        this.options = opts || {};

        this.eventEmitter = new EventEmitter();

        this.initUploader();
    }

    initUploader(){
        let _this = this
            , options = this.options
            , client = _this;

        //兼容模式处理browse_button是必填项的问题
        //如果没有设置，创造一个隐藏的input
        if(!options.fileInput){
            let id = 'input_plupload_' + Date.now();
            let fileInput = document.createElement('input');
            fileInput.setAttribute('id', id);
            fileInput.setAttribute('type', 'file');
            fileInput.setAttribute('style', 'width: 0; height: 0; position: absolute; top: -100px; visibility: hidden')
            document.body.appendChild(fileInput);

            options.fileInput = id;
        }

        this.uploader = new plupload.Uploader({
            runtimes : 'html5,flash,silverlight,html4',
            browse_button : options.fileInput,
            //multi_selection: false,
            //TODO set static urls to support flash and silverlight
            //TODO crossdomain.xml
            flash_swf_url : 'plupload/Moxie.swf',
            silverlight_xap_url : 'plupload/Moxie.swf',
            max_retries: 3,
            // chunk_size: '200kb',
            url : 'http://oss.aliyuncs.com',
            init: {
                PostInit: function(uploader){
                    console.log('PostInit', uploader)
                    client.eventEmitter.emit('PostInit');

                    uploader.setOption({
                        'multipart_params': client.options.multipart_params
                    });
                },
                FilesAdded: function(uploader, files){
                    console.log('FilesAdded', uploader, files)
                    client.eventEmitter.emit('FilesAdded', files);
                },
                BeforeUpload: function(uploader, file) {
                    console.log('BeforeUpload', uploader, file)
                    client.eventEmitter.emit('BeforeUpload', file.name, file);

                    uploader.setOption({
                        'multipart_params': utils.extend({}, client.options.multipart_params, {
                            'key': file.name
                        })
                    });

                    uploader.start();
                },
                UploadProgress: function(uploader, file) {
                    console.log('UploadProgress', uploader, file)
                    client.eventEmitter.emit('UploadProgress', file.name, file.percent);
                },
                FileUploaded: function(uploader, file, info) {
                    console.log('FileUploaded', uploader, file, info)
                    client.eventEmitter.emit('FileUploaded', file.name, file);
                },
                Error: function(uploader, err) {
                    console.log('Error', uploader, err)
                    client.eventEmitter.emit('Error', err.file.name, err);
                }
            }
        });
        this.uploader.init();
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

        ajax({
            headers: {
                'x-upload-engine': 'plupload',
                'x-upload-server': 'alioss'
            }
        })
            .get(url)
            .then(function (res, xhr) {
                if (res && typeof res == 'object') {
                    callback(undefined, {
                        host: res.host,
                        bucket: res.bucket,
                        region: res.region,
                        static: res.static,
                        multipart_params: {
                            policy: res.policy,
                            OSSAccessKeyId: res.OSSAccessKeyId,
                            success_action_status: res.success_action_status,
                            signature: res.signature,
                        }
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
        this.options = utils.extend({}, this.options, options);

        console.log(options.host)
        if(options.host){
            this.uploader.setOption({
                url: options.host
            })

            console.log(this.uploader.getOption())
        }

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

    _uploadImpl(file, name) {
        let uploader = this.uploader
            , options = this.options;

        uploader.addFile(file, name);

        uploader.start();
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

        var _this = this
            , client = _this;

        if (!file) {
            let err = 'file content can not be empty!';
            error(name, err);
            return Promise.reject(err);
        }

        let eventListenerMap = {
            'BeforeUpload': bindEventNameAndFilterFile(name, 'BeforeUpload', function(){
                before.apply(this, arguments);

                let opt = option.imageCompress || {}, resize;

                let maxWidth = opt.maxWidth || opt.width
                    , maxHeight = opt.maxHeight || opt.height
                    , exif = opt.exif || opt.preserve_headers
                    , quality = opt.quality;

                if(maxWidth || maxHeight || exif !== undefined || quality){
                    resize = {
                        width: maxWidth,
                        height: maxHeight,
                        preserve_headers: exif !== undefined ? !!exif: true,
                        quality: quality || 100
                    }
                }

                client.uploader.setOption({
                    resize: resize
                })
            }),
            'UploadProgress': bindEventNameAndFilterFile(name, 'UploadProgress', progress),
            'FileUploaded': bindEventNameAndFilterFile(name, 'FileUploaded', function(name, file){
                var url = generateImageUrl(_this.domain + name, option);
                success(name, {
                    name: name,
                    url: url
                });
            }),
            'Error': bindEventNameAndFilterFile(name, 'Error', error)
        };

        function bindEventNameAndFilterFile(fileName, eventName, fn){
            return function(){
                let name = arguments[0];
                if(name != fileName) return;

                fn.apply(this, arguments);

                if (eventName == 'FileUploaded'
                    || eventName == 'Error') {
                    Object.keys(eventListenerMap).forEach(function(key){
                        console.log('removeListener', key)
                        let listener = eventListenerMap[key];
                        client.eventEmitter.removeListener(key, listener);
                    })
                }
            }
        }

        //bind events
        Object.keys(eventListenerMap).forEach(function(key){
            let listener = eventListenerMap[key];
            client.eventEmitter.on(key, listener)
        });

        return this.verify()
            .then(function(){
                return _this._uploadImpl(file, name);
            })
            .catch(function (err) {
                console.log('upload error: %j', err);
                eventListenerMap['Error'](name, err);
                return Promise.reject(err);
            });
    }
}

module.exports = PluploadFileUpload;