var appid = 'wx3bc1a93ad9d4163b' //乐薪公众号appid
let code = '' //公众号code

var Real = {
  isTest: false,

  host: function () {
    return Real.isTest ? 'https://payt.bld365.com' : 'https://pay.bld365.com'
  },
  companyCode: '', //企业id
  mchCode: '', //商户id
  openId: '',
  unionId: '', //2019.08.13新增unionId
  curPhoto: '', //保存当前点击的photo
  smsTimer: null, //验证码计时器
  smsTimerSecond: 60,
  photo1_url: '',
  photo2_url: '',
  token: '', //我们自己的token 可以判断是否实名认证了



  //获取页面参数
  getPageParam: function () {
    code = Global.getUrlParam('code')
    Real.companyCode = Global.getUrlParam('companyCode')
    Real.mchCode = Global.getUrlParam('mchCode')
  },
  //获取协议信息
  getProtocolInfo: function () {
    $('.protocol_iframe iframe').attr('src', '')
    let cookieObj = Global.getCookieObj()
    $.ajax({
      url: Real.host() + `/app/bind/getProtocol?companyCode=${Real.companyCode}`,
      headers: { "x-csrf-token": cookieObj.csrfToken },
      success: function (res) {
        if (
          res.resultCode &&
          res.resultCode.toString() == '200' &&
          res.value &&
          res.value !== '' &&
          res.value.indexOf('.pdf') > -1
        ) { //获取到协议了
          let valueTemp = `https://lexinapp.bld365.com/pdfweb/web/viewer.html?pdfurl=${res.value}`
          $('.protocol_iframe iframe').attr('src', valueTemp)
        } else {
          $.toast('当前企业未上传协议', "text", 1200)
          //勾选同意 不可用
          $(':checkbox').prop('disabled', true)
        }
      }
    })
  },
  //调起 相册/拍照
  chooseImg: function () {
    //一、选择图片 并显示出来
    wx.chooseImage({
      count: 1, // 默认9
      // sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        let localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
        let localId = localIds[0]
        //二、上传图片到微信服务器
        Real.uploadImgWx(localId)
      }
    })
  },
  //上传图片
  uploadImgWx: function (localId) {
    wx.uploadImage({
      localId: localId, // 需要上传的图片的本地ID，由chooseImage接口获得
      isShowProgressTips: 1, // 默认为1，显示进度提示
      success: function (res) {
        let serverId = res.serverId // 返回图片的服务器端ID
        Real.uploadImgAndOcr(serverId, localId)
      }
    })
  },
  //上传图片到自己的服务器 并ocr识别
  uploadImgAndOcr: function (serverId, localId) {
    let postData = {
      serverId,
      photoType: Real.curPhoto, //photo1 photo2
      isTest: Real.isTest ? 'dev' : 'prod',
    }
    let cookieObj = Global.getCookieObj()
    $.showLoading("身份证识别中...")
    $.ajax({
      type: 'post',
      url: Global.host + "/api/uploadocr",
      data: postData,
      headers: { "x-csrf-token": cookieObj.csrfToken },
      success: function (res) {
        $.hideLoading()
        if (res.code == 200) {
          let data = res.data

          //判断条件
          let flag = Real.curPhoto == 'photo1' ?
            (
              data &&
              data.OCR_DATA &&
              data.OCR_DATA['姓名'] &&
              data.OCR_DATA['姓名'] !== '' &&
              data.OCR_DATA['公民身份号码'] &&
              data.OCR_DATA['公民身份号码'] !== ''
            ) : (
              data &&
              data.OCR_DATA &&
              data.OCR_DATA['失效日期'] &&
              data.OCR_DATA['失效日期'] !== '' &&
              data.OCR_DATA['签发机关'] &&
              data.OCR_DATA['签发机关'] !== '' &&
              data.OCR_DATA['签发日期'] &&
              data.OCR_DATA['签发日期'] !== ''
            )

          if (flag) { //ocr识别正确 真实的身份证
            Real.showPhoto(localId) //将照片显示出来
            //姓名
            if (data && data.OCR_DATA && data.OCR_DATA['姓名']) {
              $('input[name="userName"]').val(data.OCR_DATA['姓名'])
            }
            //身份证号
            if (data && data.OCR_DATA && data.OCR_DATA['公民身份号码']) {
              $('input[name="psptNo"]').val(data.OCR_DATA['公民身份号码'])
            }
            //保存photo url
            Real[Real.curPhoto + '_url'] = res && res.data && res.data.FILE_URL ? res.data.FILE_URL : ''
          } else { //不是身份证
            $.toast('请上传真实的身份证', "text", 1200)
          }
        } else {
          $.toast(res.data, "text", 1200)
        }
      }
    })
  },
  //将照片显示出来
  showPhoto: function (localId) {
    let $imgBoxEle = $('[data-photo="' + Real.curPhoto + '"]')
    if (Global.isIOS()) {
      wx.getLocalImgData({
        localId: localId, // 图片的localID
        success: function (res) {
          let localData = res.localData; // localData是图片的base64数据，可以用img标签显示

          $imgBoxEle.addClass('haveChoosed')
          $imgBoxEle.find('img').attr('src', localData)
        }
      })
    } else {
      $imgBoxEle.addClass('haveChoosed')
      $imgBoxEle.find('img').attr('src', localId)
    }
  },
  //获取验证码
  getSms: function () {
    //验证
    //一、上传证件后，获取验证码
    if ($('.chongpai').is(":hidden")) {
      $.toast("请上传证件后进行手机验证", "text", 1200)
      return false
    }
    //二、验证手机号
    let value = $('input[name="phoneNumber"]').val()
    let reg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/
    if (!reg.test(value)) {
      $.toast("请输入正确手机号", "text", 1200)
      return false
    }
    //验证 end

    $('input[name="smsCaptcha"]').val('')
    Real.smsBgTimer()
    let cookieObj = Global.getCookieObj()
    $.ajax({
      type: 'post',
      // url: Real.host() + "/app/wechat/mp/user/register/sendSMSCaptcha",
      url: Real.host() + "/app/wechat/html/user/register/sendSMSCaptcha",
      data: {
        phoneNumber: $('input[name="phoneNumber"]').val(),
        unionId: Real.unionId,
        openId: Real.openId,
      },
      headers: {
        "x-csrf-token": cookieObj.csrfToken,
      },
      success: function (res) {
        if (res.resultCode && res.resultCode.toString() == '200') {

        } else {
          $.toast(res.systemMessage, "text", 1200)
          Real.smsEndTimer()
        }
      },
    })
  },
  //验证码 开始计时
  smsBgTimer: function () {
    $('.smsBtn').addClass('disabled')
    $('.smsBtnSecond').html('(' + Real.smsTimerSecond + 's)')
    Real.smsTimer = setInterval(function () {
      Real.smsTimerSecond--
      $('.smsBtnSecond').html('(' + Real.smsTimerSecond + 's)')
      if (Real.smsTimerSecond === -1) {
        Real.smsEndTimer()
      }
    }, 1000)
  },
  //验证码 取消计时
  smsEndTimer: function () {
    $('.smsBtn').removeClass('disabled')
    $('.smsBtnSecond').html('')
    window.clearInterval(Real.smsTimer)
    Real.smsTimerSecond = 60
  },
  //点击最后的提交
  submit: function () {
    //验证
    //照片
    if (Real.photo1_url == '' || Real.photo1_url == '') {
      $.toast("请进行身份证识别", "text", 1200)
      return false
    }
    let phoneNumber = $('input[name="phoneNumber"]').val()
    let smsCaptcha = $('input[name="smsCaptcha"]').val()
    let userName = $('input[name="userName"]').val()
    let psptNo = $('input[name="psptNo"]').val()
    //身份
    if (userName.trim() == '' || psptNo.trim() == '') {
      $.toast("姓名和身份证号请填写完整", "text", 1200)
      return false
    }
    //手机
    let reg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/
    if (!reg.test(phoneNumber)) {
      $.toast("请输入正确手机号", "text", 1200)
      return false
    }
    //验证码
    if (smsCaptcha.trim() == '') {
      $.toast("请输入验证码", "text", 1200)
      return false
    }
    //同意
    if (!$(':checkbox').is(':checked')) {
      $.toast("签约前请同意协议", "text", 1200)
      return false
    }
    //验证 end

    //一、实名认证
    let postData = {
      openId: Real.openId,
      phoneNumber,
      smsCaptcha,
      userName,
      psptNo,
      psptPositive: Real.photo1_url,
      psptNegative: Real.photo2_url,
      unionId: Real.unionId,
    }
    let cookieObj = Global.getCookieObj()
    $.showLoading("处理中...")
    $.ajax({
      type: 'post',
      url: Real.host() + "/app/wechat/html/user/register/submit",
      data: postData,
      headers: { "x-csrf-token": cookieObj.csrfToken },
      success: function (res) {
        if (res.resultCode && res.resultCode.toString() == '200') {
          let value = res.value
          Real.token = value.TOKEN
          //二、签约
          Real.sign()
        } else {
          $.hideLoading()
          $.hideLoading()
          $.toast(res.systemMessage, "text", 1200)
        }
      }
    })
  },
  //签约ajax
  sign: function () {
    //验证
    //同意
    if (!$(':checkbox').is(':checked')) {
      $.toast("签约前请同意协议", "text", 1200)
      return false
    }
    //验证 end
    // return
    let cookieObj = Global.getCookieObj()
    $.showLoading("处理中...")
    $.ajax({
      type: 'post',
      url: Real.host() + `/app/company/bindEmployee?token=${Real.token}&merchantCode=${Real.mchCode}&unionId=${Real.unionId}`,
      headers: { "x-csrf-token": cookieObj.csrfToken },
      success: function (res) {
        $.hideLoading()
        $.hideLoading()
        if (res.resultCode && res.resultCode.toString() == '200') {
          window.location.href = 'realname_success.html'
        } else {
          $.toast(res.systemMessage, "text", 1200)
        }
      }
    })
  },
  //查看协议
  seeProtocol: function () {
    let src = $('.protocol_iframe iframe').attr('src')
    if (src !== '' && src.indexOf('.pdf') > -1) {
      $('.protocol_iframe').show()
    } else {
      $.toast('当前企业未上传协议', "text", 1200)
    }
  },
  //用code获取openid
  getOpenid: function () {
    let cookieObj = Global.getCookieObj()
    $.ajax({
      type: 'post',
      url: Global.host + '/api/initrealname',
      data: { code },
      headers: { "x-csrf-token": cookieObj.csrfToken },
      success: function (res) {
        console.log(res)
        let openId = res.data
        let unionId = res.data_unionId
        Real.openId = openId
        Real.unionId = unionId
        //一、用openid换我们自己的token
        let cookieObj = Global.getCookieObj()
        $.ajax({
          type: 'post',
          url: Real.host() + "/app/wechat/html/user/token",
          data: {
            openId,
            unionId: Real.unionId,
          },
          headers: { "x-csrf-token": cookieObj.csrfToken },
          success: function (res) {
            if (res.resultCode && res.resultCode.toString() == '200') { //已实名
              //已实名 回显
              Real.realNameRender(res.value)
              //二、获取这个人 已签约列表
              Real.getSignList()
            } else { //未实名
              $.hideLoading()
              $('.h100scroll').css('display', 'block')
            }
          }
        })
      },
      error: function (err) {
      }
    })
  },
  //获取 已签约列表
  getSignList: function () {
    let cookieObj = Global.getCookieObj()
    $.ajax({
      type: 'post',
      url: Real.host() + `/app/employee/getEmployeeList?token=${Real.token}&status=90`,
      headers: { "x-csrf-token": cookieObj.csrfToken },
      success: function (res) {
        if (res.resultCode && res.resultCode.toString() == '200') {
          let signList = res.value
          let signCodeList = signList.map(function (obj) {
            return obj.COMPANY_CODE
          })
          if (signCodeList.indexOf(Real.companyCode) > -1) { //已签约 这个企业
            window.location.href = 'realname_success.html'
          } else { //未签约 这个企业
            $.hideLoading()
            $('.h100scroll').css('display', 'block')
          }
        }
      }
    })
  },
  //已实名 回显dom
  realNameRender: function (value) {
    Real.token = value.TOKEN
    // 照片
    if (value.userAuthInfo && value.userAuthInfo.PSPT_POSITIVE) {
      $('[data-photo="photo1"]').find('img').attr('src', value.userAuthInfo.PSPT_POSITIVE)
    }
    if (value.userAuthInfo && value.userAuthInfo.PSPT_NEGATIVE) {
      $('[data-photo="photo2"]').find('img').attr('src', value.userAuthInfo.PSPT_NEGATIVE)
    }
    $('.photo_img_box').addClass('disabled')
    //form
    $('input[name="userName"]').val(value.userAuthInfo && value.userAuthInfo.REAL_NAME ? value.userAuthInfo.REAL_NAME : '')
    $('input[name="psptNo"]').val(value.userAuthInfo && value.userAuthInfo.PSPT_NO ? value.userAuthInfo.PSPT_NO : '')
    $('input[name="phoneNumber"]').val(value.PHONE_NUMBER)
    $('.sms_input_item').hide()
    $('.form_wrap input[name]').prop('readonly', true)
  },
  //======================================================================================================
  //ios兼容问题
  iosCompatible: function () {
    let wrapEle = $('.h100scroll')[0]
    let bfscrolltop = wrapEle.scrollTop
    if (Global.isIOS()) {
      $("input").focus(function () {
        wrapEle.scrollTop = wrapEle.scrollHeight;
      }).blur(function () {
        wrapEle.scrollTop = bfscrolltop;
      });
    }
  },
  eventsBind: function () {
    Real.iosCompatible() //ios兼容问题
    //点击拍照img
    $('.photo_img_box').click(function () {
      let dataPhoto = $(this).attr('data-photo')
      Real.curPhoto = dataPhoto
      if ($(this).find('.chongpai').is(":hidden")) { //第一次点击
        let imgSrc = ''
        if (dataPhoto === 'photo1') {
          imgSrc = 'https://cdn.s.bld365.com/shenfen_alert_img2.png'
        } else {
          imgSrc = 'https://cdn.s.bld365.com/shenfen_alert_img1.png'
        }
        $('.modal_div_photo_img').attr('src', imgSrc)
        $('.modal_photo').show()
      } else { //重拍
        Real.chooseImg()
      }
    })
    //点击拍照弹出框 我知道了
    $('.modal_div').click(function () {
      $('.modal_photo').hide()
      Real.chooseImg()
    })
    //点击获取验证码
    $('.smsBtn').click(function () {
      Real.getSms()
    })
    //点击最后的提交
    $('.submit_btn').click(function () {
      if (Real.token == '') { //未实名
        Real.submit()
      } else { //实名了
        Real.sign()
      }
    })
    //点击查看协议
    $('.goSeeProtocol').click(function (e) {
      e.stopPropagation()
      Real.seeProtocol()
    })
    //点击协议里的 关闭
    $('.close_iframe_btn').click(function () {
      $('.protocol_iframe').hide()
    })
  },
  init: function () {
    //获取页面参数companyCode mchCode
    Real.getPageParam()

    //根据code看是否关注公众号了 是否实名验证了
    Real.getOpenid()
    //获取 获取协议信息
    Real.getProtocolInfo()

    Real.eventsBind()
  }
}

$(function () {
  let appid = "wx3bc1a93ad9d4163b"; //乐薪公众号appid
  let code = Global.getUrlParam('code')
  let redirect_uri = window.location.href;

  $.showLoading("微信登录中...")
  if (!code) {
    window.location.href = `
      https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect
    `
  } else {
    Global.configWechat({
      title: "乐薪平台-实名认证",
      desc: "乐薪平台，实名认证，签约企业",
    }, function () {
      Real.init()
    })
  }
})