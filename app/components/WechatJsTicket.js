const path = require('path')
const utils = require('../utils/utils')

/**
 * 
 * @param {*} eggCtx
 * @param {*} agentDbKey 存在db里的{}的key， 'baobiao'
 */
function WechatJsTicket(eggCtx, access_token) {
  this.eggCtx = eggCtx
  this.access_token = access_token
}

//===================================================================================================================================

//获取js_ticket ajax
WechatJsTicket.prototype.getJsTicketAjax = function () {
  let self = this
  return new Promise(function (resolve, reject) {
    let result = self.eggCtx.curl(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${self.access_token}&type=jsapi`)
    resolve(result)
  })
}

//读取js_ticket db
WechatJsTicket.prototype.readJsTicket = function () {
  return new Promise(function (resolve, reject) {
    console.log('读取 js_ticket')
    utils.readFileAsync(path.join(__dirname, "../db/js_ticket.txt"))
      .then(function (data) {
        let dataObj = JSON.parse(data)
        resolve(dataObj)
      })
  })
}

//写入js_ticket db
WechatJsTicket.prototype.writeJsTicket = function (data) {
  return new Promise(function (resolve, reject) {
    console.log('写入 js_ticket')
    let dataStr = JSON.stringify(data)
    utils.writeFileAsync(path.join(__dirname, "../db/js_ticket.txt"), dataStr)
      .then(function () {
        resolve()
      })
  })
}

//验证js_ticket是否合法（到期）
WechatJsTicket.prototype.isValidJsTicket = function (data) {
  if (!data || !data.ticket || !data.expires_in) {
    return false
  }
  let expires_in = data.expires_in
  let now = new Date().getTime()
  return now < expires_in
}

//===================================================================================================================================

//update js_ticket
WechatJsTicket.prototype.updateJsTicket = async function () {
  let result = await this.getJsTicketAjax()
  let data = JSON.parse(result.data)
  //处理jsticketObj
  let expires_in = new Date().getTime() + (data.expires_in - 20) * 1000 //考虑到网络延迟 提前20秒到期
  data.expires_in = expires_in
  //处理jsticketObj end
  this.writeJsTicket(data)
  return data.ticket
}

//获取js_ticket
WechatJsTicket.prototype.getJsTicket = async function () {
  let data = await this.readJsTicket()
  if (this.isValidJsTicket(data)) { //合法
    return data.ticket
  } else { //不合法
    let ticket = await this.updateJsTicket() //其实这里可以再优化一下
    return ticket
  }
}

//===================================================================================================================================

module.exports = WechatJsTicket
