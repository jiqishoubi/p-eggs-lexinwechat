/**
 * 更新access_token / js_ticket
 */
const Subscription = require('egg').Subscription
const Wechat = require('../components/Wechat')
const WechatJsTicket = require('../components/WechatJsTicket')

class UpdateAccess extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '7175s', // 间隔
      type: 'worker',
      immediate: true, //服务启动时，立即执行一次
      // disable: true,
    }
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    //创建报表wechat实例
    let wechat = new Wechat(this.ctx)
    //定时更新 报表access_token
    let access_token = await wechat.updateAccessToken()

    //创建wechat js_ticket实例
    let wechatJsTicket = new WechatJsTicket(this.ctx, access_token)
    //更新js_ticket
    await wechatJsTicket.updateJsTicket()
  }
}

module.exports = UpdateAccess