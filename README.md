# alioss-upload
upload plugin for alioss
[aliyun oss docs](https://help.aliyun.com/document_detail/32069.html)

## Usage
```html
<script src="//gosspublic.alicdn.com/aliyun-oss-sdk-4.4.4.min.js"></script>
<script src="/dist/0.1.2/upload.full.js"></script>
<script>
    var fileUpload = new FileUpload({
        auth: 'http://oss.stsserver.com/token'
    });

    fileUpload.upload(file, {
        style: 'wx',
        suffix: '.jpg',
        before: function(name) {
            console.log('before', name);
        },
        progress: function(name, p) {
            console.log('progress', name, p);
        },
        success: function(name, res) {
            console.log('success', name, res);
            document.getElementById('img').src = res.url;
        },
        error: function(name, err) {
            console.log('error', name, err);
        }
        , imageCompress: {
            maxWidth: 400
        }
    });
</script>
```

## Flow
1. Client init setting (token/server link)
2. Upload
  * verify, auto init upload client
  * multi handle jobs (compress[piexif], rotate, ...)
  * began upload ==> upload finish ==> callback  (multi implement upload client)

## Config
* `option` new FileUpload(option)
```js
    auth: {
        region: 'oss region',
        accessKeyId: 'AccessKeyId',
        accessKeySecret: 'AccessKeySecret',
        stsToken: 'SecurityToken',
        bucket: 'oss bucket name',
        static: 'cnd domain', replace default alioss domain
    }

    // static option
    // it will replace http://bucket.oss-cn-beijing.aliyuncs.com/dist/1.bbe6ae3b139f90dbe30c.js
    // to http://cdn.staticdomain.com/dist/1.bbe6ae3b139f90dbe30c.js
```    
or
```js
    auth: 'auth token server(STS SERVER)'
    // return data format like object `auth` node type
    // sts server need notice `cros`, it you use second domain, response
    // header must be contain `Access-Control-Allow-Origin` and
    // `Access-Control-Allow-METHOD`
```

* `fileUploader.upload(data, name, option)`
  1. `data` File or Buffer, default File, if data is Buffer type, you need set option.type='buffer'
  2. `name` String | Function, value as you set, default 'year/month/date/hour/timeInterval_random.fileType'.
  3. `option` json object
    * `prefix` file name prefix str
    * `suffix` file name suffix str
    * `before` function, invoke before upload 
    * `progress` function, get upload progress
    * `success` function, invoke after upload file success
    * `error` function, get some error
    * `compress` 
      1. `quality` image quality 1 ~ 100
      2. `outputImageType` default 'image/jpeg', image/png is option
      3. `exif` boolean, save exif info after compress
      4. `maxWidth` Number image max width
      5. `maxHeight` Number image max height
      6. `maxSize` Number image max size  (false or number > 0)
                   if maxWidth,maxHeight,maxSize are undefined,use default maxPixels(500*600=300000)
                   if you set, it will convert maxSize to maxPixels by `outputImageType`
      7. `backgroundColor` String background color, default '#fff', it works that png convert to jpeg

### difference between `upload.js` and `upload.full.js`
 `upload.js` only support upload
 `upload.full.js` support compress, and retain image exif info is a option

### Update List
#### 0.1.2
force set compress maxSize to 5MB, compress in mobile env will out of memory

#### 0.1.1(2016/12/06)
repair bug: image compress return base64 instead of buffer when compression is not actived
repair bug: maxSize=false can't off maxSize setting
increase DEFAULT_COMPRESS_PIXELS_SIZE to 300000(500*600)

#### 0.1.0
1. auto set fileName prefix by upload time, such as '/2016/12/03/123455231231_13221';
2. auto set fileName suffix by file.name;
3. create two version script file: upload.js, upload.full.js
   * upload.js  only upload file;
   * upload.full.js contain upload.js's functions, and support compress image(copy exif info)