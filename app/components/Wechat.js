const path = require('path')
const crypto = require("crypto") //sha1加密
const utils = require('../utils/utils')

/**
 * 
 * @param {*} eggCtx
 */
function Wechat(eggCtx) {
  this.eggCtx = eggCtx
  this.appid = utils.appid
  this.appSecret = utils.appSecret
}

//===================================================================================================================================

//获取access_token ajax
Wechat.prototype.getAccessTokenAjax = function () {
  let self = this
  return new Promise(function (resolve, reject) {
    console.log('ajax')
    let result = self.eggCtx.curl(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${self.appid}&secret=${self.appSecret}`)
    resolve(result)
  })
}

//读取access_token db
Wechat.prototype.readAccessToken = function () {
  return new Promise(function (resolve, reject) {
    console.log('读取')
    utils.readFileAsync(path.join(__dirname, "../db/access_token.txt"))
      .then(function (data) {
        let dataObj = JSON.parse(data)
        resolve(dataObj)
      })
  })
}

//写入access_token db
Wechat.prototype.writeAccessToken = function (data) {
  return new Promise(function (resolve, reject) {
    console.log('写入')
    let dataStr = JSON.stringify(data)
    utils.writeFileAsync(path.join(__dirname, "../db/access_token.txt"), dataStr)
      .then(function () {
        resolve()
      })
  })
}

//验证access_token是否合法（到期）
Wechat.prototype.isValidAccessToken = function (data) {
  if (!data || !data.access_token || !data.expires_in) {
    return false
  }
  let expires_in = data.expires_in
  let now = new Date().getTime()
  return now < expires_in
}

//===================================================================================================================================

//update access_token
Wechat.prototype.updateAccessToken = async function () {
  let result = await this.getAccessTokenAjax()
  let data = JSON.parse(result.data)
  //处理data
  let expires_in = new Date().getTime() + (data.expires_in - 20) * 1000 //考虑到网络延迟 提前20秒到期
  data.expires_in = expires_in
  //处理data end
  this.writeAccessToken(data)
  return data.access_token
}

//获取access_token
Wechat.prototype.getAccessToken = async function () {
  let data = await this.readAccessToken()
  if (this.isValidAccessToken(data)) { //合法
    return data.access_token
  } else { //不合法
    let access_token = await this.updateAccessToken() //其实这里可以再优化一下
    return access_token
  }
}

//生成js sdk config参数
Wechat.prototype.initConfigParam = function (js_ticket, url) {
  let nonceStr = utils.createNonce()
  let timestamp = utils.createTimestamp()

  let paramArr = [
    "noncestr=" + nonceStr,
    "jsapi_ticket=" + js_ticket,
    "timestamp=" + timestamp,
    "url=" + url
  ]
  let str = paramArr.sort().join("&")
  //sha1加密
  let shasum = crypto.createHash("sha1")
  shasum.update(str)
  let signature = shasum.digest("hex")

  return {
    appId: utils.appid,
    timestamp: timestamp,
    nonceStr: nonceStr,
    signature: signature,
  }
}

//===================================================================================================================================

module.exports = Wechat
