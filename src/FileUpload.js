'use strict';

import {leftpad, resolveFunctoin} from './utils';
import Promise from '../shims/promise';
import Token from './Token';
import UploadTask from './UploadTask';

const DEFAULT_UPLOAD_ENGINE = 'alioss';

/**
 * create file folder by date
 * @param time
 * @returns {string}
 */
function createFolderName(time) {
  return time.getFullYear()
    + '/' + leftpad(time.getMonth() + 1, 2, '0')
    + '/' + leftpad(time.getDate(), 2, '0')
    + '/' + leftpad(time.getHours(), 2, '0');
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

  let key = leftpad(Math.round(Math.random() * 99999), 5, 0);
  return prefix + curTime.getTime() + "_" + key + suffix;
}

class FileUpload {
  constructor(client, opts, engine = DEFAULT_UPLOAD_ENGINE) {
    this.client = client;
    this.options = opts || {};
    this.engine = engine;

    this.token = new Token(this.options.token || this.options.auth);
  }

  verify() {
    let uploader = this;
    return Promise.resolve(uploader.token)
      .then(token => {
        if (token.isValid()) {
          return token;
        } else {
          return token.authorize({
            'x-upload-client': uploader.client.name()
            , 'x-upload-engine': uploader.engine
          })
            .then(token => {
              //update token to the upload client
              uploader.client.init(Object.assign(uploader.options, {token}))
            })
        }
      });
  }

  /**
   * 上传文件
   * @param file 文件
   * @param name 指定key
   * @param opt 配置信息（关于图片文件控制） {style: 'style', 'config': 'image_deal_config'}
   * @returns {*}
   */
  upload(file, name, opt) {
    let uploader = this;
    return this.verify()
      .then(() => uploader._upload(file, name, opt))
      .catch(err => console.log(err));
  }

  _upload(file, name, opt) {
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
    } else if (file instanceof File && !option.suffix) {
      let fileName = file.name;
      option.suffix = fileName.substr(fileName.lastIndexOf('.'));
      name = randomFileName(opt);
    } else {
      name = randomFileName(opt);
    }

    let error = resolveFunctoin(option.error);

    if (!file) {
      let errMsg = 'file content can not be empty!';
      error(name, errMsg);
      return Promise.reject(errMsg);
    }

    option.token = this.token.token;

    let uploadTask = new UploadTask(this, this.client, file, Object.assign(option, {
      name
    }));

    return uploadTask.start();
  }
}

export default FileUpload;