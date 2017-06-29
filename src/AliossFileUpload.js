/**
 * Created by rdshoep on 16/4/13.
 */
import {extend, leftpad, resolveFunctoin} from './utils';
import ajax from '@fdaciuk/ajax';
import Promise from '../shims/promise';
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

class AliossFileUpload {
  constructor(opts) {
    this.options = opts || {};
  }

  name() {
    return 'alioss';
  }

  init(opts) {
    let options = extend({}, this.options, opts);

    let token = options.token, expand;
    if (token) {
      expand = {
        region: token.region,
        accessKeyId: token.AccessKeyId,
        accessKeySecret: token.AccessKeySecret,
        stsToken: token.SecurityToken,
        bucket: token.bucket,
        static: token.static
      }
    }

    this._initClient(extend({}, options, expand));
  }

  _initClient(options) {
    this.options = extend({}, this.options, options);

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
    return Promise.resolve(this)
      .then(client => {
        if (!client.options.token) {
          return Promise.reject('AliossFileUpload Client without token node, you need use init method to config.');
        }
      })
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
    let before = resolveFunctoin(option.before);
    let success = resolveFunctoin(option.success);
    let error = resolveFunctoin(option.error);
    let progress = resolveFunctoin(option.progress);

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

export default AliossFileUpload;