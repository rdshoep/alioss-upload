/*
 * @description
 *   Please write the Token script's description
 * @author rdshoep(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(2017/6/28)
 */
import ajax from '@fdaciuk/ajax';
import {resolveFunctoin} from './utils';
import Promise from '../shims/promise'

function parseExpireTime(token) {
  let expireTime = token.Expiration || token.expiration;

  if (!expireTime) {
    let expiresIn = token.expiresIn || token.expires_in;
    if (expiresIn) {
      expireTime = Date.now() + Number(expiresIn);
    }
  }

  expireTime = expireTime || (Date.now() + 24 * 60 * 60 * 1000);

  return new Date(expireTime).getTime();
}

function request(url, headers, callback) {
  callback = resolveFunctoin(callback);

  ajax({
    headers
  })
    .get(url)
    .then(function (res, xhr) {
      if (res && typeof res == 'object') {
        callback(undefined, res);
      } else {
        callback('request to sts server error: (' + xhr.status + ')' + xhr.responseText);
      }
    })
    .catch(function (res, xhr) {
      callback('request to sts server error: (' + xhr.status + ')' + xhr.responseText);
    });
}

class Token {
  constructor(opt) {
    if (typeof opt === 'string') {
      this.authUrl = opt;
    } else if (typeof opt === 'object') {
      this.token = opt;
      this.expiration = parseExpireTime(this.token);
    } else {
      throw new Error('invalid token setting(Accepts: string/object)');
    }
  }

  isValid() {
    return Date.now() < this.expiration;
  }

  authorize(headers) {
    let _this = this;
    return new Promise((resolve, reject) => {
      request(_this.authUrl, headers, (err, token) => {
        if (err) {
          reject(err)
        } else {
          resolve(token)
        }
      })
    })
      .then(token => {
        _this.token = token;
        _this.expiration = parseExpireTime(token);
        return token;
      })
  }
}

export default Token;