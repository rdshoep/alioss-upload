# token auth server
配置token server，可以更好的设定相关机制来支持多应用的文件上传支持。

稍后会开源配套的授权服务端代码～

## token request
请求的相关参数：
```
{
  method: 'get',
  headers: {
    'x-upload-client': '', // plupload or alioss
    'x-upload-engine': 'alioss' //support list, now only alioss
  }
}
```

如果存在跨域问题，请参照如下配置
```js
//koa 1.x
this.set('Access-Control-Allow-Origin', '*');
this.set('Access-Control-Allow-METHOD', 'GET');
this.set('Access-Control-Allow-Headers', 'x-upload-engine,x-upload-client');
this.set('Access-Control-Max-Age', '86400');
```
