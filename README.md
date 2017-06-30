# uploader for oss service
Uploader Plugin for Object Storage Service

## 中文
目前仅支持alioss，后期会增加其他云服务平台

支持列表：
* alioss

上传支持多种实现，根据云服务商提供支持的不同而不同。
目前使用alioss上传支持
 1. alioss官方Client
    * upload.alioss.js
    * upload.alioss.compress.js  支持压缩图片的压缩操作
 2. plupload（[更多搭建说明](docs/plupload.md)）
    * upload.plupload.js  自带压缩文件的支持，不过对于flash、sliverlight需要设置相关的资源文件

### Usage
html导入资源

* alioss
    ```html
    <script src="//gosspublic.alicdn.com/aliyun-oss-sdk-4.4.4.min.js"></script>
    <script src="/js/1.0.0/upload.alioss.compress.js"></script>
    ```
* plupload
    ```html
    <script src="/js/1.0.0/upload.plupload.js"></script>
    ```

脚本上传文件
```js
var uploader = new Uploader({
    token: 'http://oss.stsserver.com/token'
});

uploader.upload(file, {
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
    //if you use upload.alioss.js, imageCompress will be ignored
    , imageCompress: {
        maxWidth: 200
    }
});
```

### API
####  `option` 
Uploader构造配置 `new Uploader(option)`

* token
token主要是用于保存对于第三方云存储服务的授权信息，支持两种方式：
1. 使用临时授权访问的服务，这种情况下只需要配置对应的链接即可。（推荐此模式，确保数据更加安全）
[授权服务搭建说明](docs/token-server.md)
```js
    {
        auth: 'http://auth.token-server.com/token/path'
    }
```
使用临时授权服务，返回的数据格式和下面的格式相同即可。

2. 通过配置设置相关的访问授权数据
不过针对两种模式有两种不同的数据数据格式

alioss官方客户端的认证[官方文档](https://help.aliyun.com/document_detail/32069.html)
```js
    {
        token: {
            accessKeyId: 'AccessKeyId',
            accessKeySecret: 'AccessKeySecret',
            stsToken: 'SecurityToken', // sts token mode use this node 
            Expiration: 'Token Expiration Time',
            region: 'oss region',
            bucket: 'oss bucket name',
            static: 'cnd domain' // bucket.region.ossdomain.com => your.cdn-domain.com
        }
    }
``` 

pluoload的认证数据格式[官方文档](https://help.aliyun.com/document_detail/31925.html)
```js
    {
        token: {
            policy: 'policyBase64',
            OSSAccessKeyId: 'accessKeyId',
            success_action_status: '200',
            signature: 'signature',
            Expiration: 'expiration',
            bucket: 'bucketName',
            region: 'bucketRegion',
            static: 'cnd domain' // bucket.region.ossdomain.com => your.cdn-domain.com
        }
    }
``` 

* `static` 用于替换上传成功后的链接，默认使用云存储格式的链接方式
* `Expiration` 用于设置Token失效时间，如果失效会自动更新。如果未设置，默认长期有效
* 其他配置参照相关配置的说明控制

####  `fileUploader.upload(data, name, option)` 
1. `data` File
2. `name` String | Function, value as you set, default 'year/month/date/hour/timeInterval_random.fileType'.
3. `option` json object
    * `prefix` file name prefix str
    * `suffix` file name suffix str
    * `before` function, invoke before upload 
    * `progress` function, get upload progress
    * `success` function, invoke after upload file success
    * `error` function, get some error
    * `imageCompress`
        1. `quality` image quality 1 ~ 100
        2. `outputImageType` default 'image/jpeg', image/png is option
        3. `exif` boolean, save exif info after compress
        4. `maxWidth` Number image max width
        5. `maxHeight` Number image max height
        6. `maxSize` Number image max size  (false or number > 0)
                   if maxWidth,maxHeight,maxSize are undefined,use default maxPixels(500*600=300000)
        7. `backgroundColor` String background color, default '#fff', it works that png convert to jpeg
        
`option.imageCompress.maxSize` and `option.imageCompress.backgroundColor` not working for plupload client