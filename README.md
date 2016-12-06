# alioss-upload
upload plugin for alioss

## Flow

1. Client init setting (token/server link)
2. Upload
  * verify, auto init upload client
  * multi handle jobs (compress[piexif], rotate, ...)
  * began upload ==> upload finish ==> callback  (multi implment upload client)

### Config
* `option` new FileUpload(option)
```json
    auth {
        region: 'oss region',
        accessKeyId: 'AccessKeyId',
        accessKeySecret: 'AccessKeySecret',
        stsToken: 'SecurityToken',
        bucket: 'oss bucket name',
        static: 'cnd domain', replace default alioss domain
    }
```    
or
``` 
    auth: 'auth token server(STS SERVER)'
    return data format like object auth type
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
      6. `maxSize` Number image max size
      7. `backgroundColor` String background color, default '#fff', it works that png convert to jpeg
    

### Update List
#### 0.1.1(2016/12/06)
repair bug: image compress return base64 instead of buffer when compression is not actived

#### 0.1.0
1. auto set fileName prefix by upload time, such as '/2016/12/03/123455231231_13221';
2. auto set fileName suffix by file.name;
3. create two version script file: upload.js, upload.full.js
   * upload.js  only upload file;
   * upload.full.js contain upload.js's functions, and support compress image(copy exif info)