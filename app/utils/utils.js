const fs = require("fs")

exports.appid = "wx3bc1a93ad9d4163b" ////乐薪 微信公众号appid
exports.appSecret = "ff37d4466cfaab709205c73565adefd7"

//读取
exports.readFileAsync = function (fpath, encoding) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fpath, encoding, function (err, content) {
      if (err) reject(err)
      else resolve(content)
    })
  })
}

//写入
exports.writeFileAsync = function (fpath, content) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(fpath, content, function (err, content) {
      if (err) reject(err)
      else resolve()
    })
  })
}

//生成随机字符串
exports.createNonce = function () {
  return Math.random().toString(36).substr(2, 15)
}

//生成时间戳
exports.createTimestamp = function () {
  return parseInt(new Date().getTime() / 1000, 10) + ""
}

//buffer转array buffer
exports.toArrayBuffer = function (buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}