'use strict';

const Controller = require('egg').Controller
const Wechat = require('../components/Wechat')
const WechatJsTicket = require('../components/WechatJsTicket')
const utils = require('../utils/utils')

class ApiController extends Controller {
  async jssdkconfig() {
    const { ctx } = this
    let query = ctx.request.body
    let wechat = new Wechat(ctx)
    let access_token = await wechat.getAccessToken()
    console.log('--------------access_token--------------')
    console.log(access_token)
    let wechatJsTicket = new WechatJsTicket(ctx, access_token)
    let js_ticket = await wechatJsTicket.getJsTicket()
    console.log('--------------js_ticket------------------')
    console.log(js_ticket)
    //计算config
    let param = wechat.initConfigParam(js_ticket, query.url)
    //返回
    ctx.status = 200
    ctx.body = {
      code: 200,
      data: param,
    }
  }
  //实名认证页面 初始 调用
  async initrealname() {
    const { ctx } = this
    console.log(ctx.request.body)
    let query = ctx.request.body
    console.log('--------去   获取openid---------------------')
    const result = await ctx.curl(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${utils.appid}&secret=${utils.appSecret}&code=${query.code}&grant_type=authorization_code`, {
      dataType: 'json',
    })
    console.log('--------获取openid---------------------')
    console.log(result.data)
    let data = result.data
    let openid = data.openid
    //返回
    ctx.status = 200
    ctx.body = {
      code: 200,
      data: openid,
      data_unionId: data.unionid ? data.unionid : null,
    }
  }
  //上传图片 ocr识别
  async uploadocr() {
    const { ctx } = this
    let query = ctx.request.body

    let media_id = query.serverId
    let photoType = query.photoType
    let isTest = query.isTest

    let wechat = new Wechat(ctx)
    let access_token = await wechat.getAccessToken()
    //用serverId获取img
    let result = await ctx.curl(`https://api.weixin.qq.com/cgi-bin/media/get?access_token=${access_token}&media_id=${media_id}`)

    let buffer = result.data
    console.log(buffer)
    //调用接口 ocr
    let postData = {
      fileName: new Date().getTime() + "",
      fieldType: photoType == 'photo1' ? 'PSPT_POSITIVE' : 'PSPT_NEGATIVE',
      ocrType: photoType == 'photo1' ? 'ID_CARD_FRONT' : 'ID_CARD_BACK',
    }
    let urlHost = isTest == 'dev' ? 'https://payt.bld365.com' : 'https://pay.bld365.com' //dev prod
    // let urlHost = 'https://pay.bld365.com'
    console.log(urlHost)
    let result2 = await ctx.curl(urlHost + '/app/image/upload', {
      method: 'POST',
      dataType: 'json',
      data: postData,
      // 单文件上传
      files: buffer,
      timeout: 60000,
    })

    console.log(result2.data)

    if (result2.data.resultCode == '200') {
      ctx.status = 200
      ctx.body = {
        code: 200,
        data: result2.data.value
      }
    } else {
      ctx.status = 200
      ctx.body = {
        code: 100,
        data: result2.data.systemMessage
      }
    }
  }

  //获取第三方网站的图片
  async getimage() {
    const { ctx } = this
    let url = ctx.request.url
    let key = url.split('imageId=')[1]
    let result = await ctx.curl(`http://file.bld365.com/image/getImage?imageId=${key}`)
    console.log(result)
    let buffer = result.data
    //返回
    ctx.status = 200
    // ctx.body = {
    //   code: 200,
    //   data: 1,
    // }
    ctx.body = buffer
  }
}

module.exports = ApiController;
