var Global = (function () {
  let host = "https://lexinh5.bld365.com"



  function pxStrToRem(pxStr) {
    let str = pxStr
    let numberTemp = Number(str.slice(0, str.length - 2))
    let remStr = numberTemp / 100 + "rem"
    return remStr
  }
  function sizeStrToNumber(str) {
    let strTemp = str.toString()
    let numberTemp
    if (strTemp.indexOf("px") > -1) {
      numberTemp = Number(str.slice(0, str.length - 2))
    } else if (strTemp.indexOf("rem") > -1) {
      numberTemp = Number(str.slice(0, str.length - 3)) * 100
    }
    return numberTemp
  }
  //ios input不回弹
  function kickBack() {
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollTop + 1);
      document.body.scrollTop >= 1 && window.scrollTo(0, document.body.scrollTop - 1);
    }, 10)
  }

  //传统方式
  //根据 本月应发H 计算 企业实付AM
  function calcAMbyH(H, ALin) { //H 本月应发
    let I = H < 3710 ? 3710 : H //养老保险缴费基数
    let J = 5991 //医保单位基数
    let X = 0
    let Y = 0
    let AA = 0
    let AB = 0
    let AC = 0
    let AD = 0
    let AE = 0
    let AF = 0

    let AM //企业应付 AJ+AL
    //求AJ
    let AJ = 0.285 * H + 0.0035 * I + 0.086 * J + X
    //求AL
    let AL //H - AK

    //计算AI //扣个人所得税(个人)
    let AG = 0.085 * I + 0.14 * H + Y + AA + AB + AC + AD + AE + AF
    let AH = H - AG
    //根据AH算AI
    let arr1 = [0.03, 0.1, 0.2, 0.25, 0.3, 0.35, 0.45]
    let arr2 = [0, 210, 1410, 2660, 4410, 7160, 15160]
    let arrTemp = arr1.map(function (rate, index) {
      return (AH - 5000) * rate - arr2[index]
    })
    let AI = Math.max(...arrTemp) < 0 ? 0 : Math.max(...arrTemp)
    let AK = 0.085 * I + 0.14 * H + Y + AI

    AL = H - AK
    AL = ALin
    console.log("个人实收", AL)
    AM = AJ + AL
    console.log("企业实付", AM)
    return AM
  }
  //根据 个人实收AL 计算 本月应发H
  function calcHbyAL(AL) {
    let arr1 = [0.03, 0.1, 0.2, 0.25, 0.3, 0.35, 0.45]
    let arr2 = [0, 210, 1410, 2660, 4410, 7160, 15160]

    //一、H>3710的情况
    //所有可能的H
    let arrTemp = arr1.map(function (rate, index) {
      return (AL - 5000 * rate - arr2[index]) / (0.775 - 0.775 * rate)
    })
    //排除不对的H
    let arrTemp2 = arrTemp.filter(function (H, index) {
      return H > 0 && H > 3710 && ((0.775 * H - 5000) * arr1[index] - arr2[index]) > 0
    })

    let H
    if (arrTemp2.length > 0) {
      let idx
      //个人所得税arr
      let AIarr = arrTemp2.map(function (H, index) {
        return (0.775 * H - 5000) * arr1[index] - arr2[index]
      })
      let maxAI = Math.max(...AIarr)
      idx = AIarr.indexOf(maxAI)
      H = arrTemp2[idx]
    } else {
      H = AL / 0.775
    }
    H = H > 3710 ? H : undefined

    //二、H<3710的情况
    if (!H) {
      //所有可能的H
      let arrTemp = arr1.map(function (rate, index) {
        return (AL + 315.35 - 5315.35 * rate - arr2[index]) / (0.86 - 0.86 * rate)
      })
      //排除不对的H
      let arrTemp2 = arrTemp.filter(function (H, index) {
        return H > 0 && H <= 3710 && ((0.86 * H - 5315.35) * arr1[index] - arr2[index]) > 0
      })

      let smallH
      if (arrTemp2.length > 0) {
        let idx
        //个人所得税arr
        let AIarr = arrTemp2.map(function (H, index) {
          return (0.86 * H - 5315.35) * arr1[index] - arr2[index]
        })
        let maxAI = Math.max(...AIarr)
        idx = AIarr.indexOf(maxAI)
        smallH = arrTemp2[idx]
      } else {
        smallH = (AL + 315.53) / 0.86
      }
      smallH = smallH <= 3710 ? smallH : undefined

      console.log("本月应发<=3710", smallH)
      return smallH
    } else {
      console.log("本月应发>3710", H)
      return H
    }
  }

  //乐薪方式
  //最终输入 个人实收AL 员工人数pernum 得到 4个值
  function lexinCalc(AL, pernum) {
    //本月应发
    let H = calcHbyAL(AL)
    //传统 企业实付
    let AM = calcAMbyH(H, AL)
    //乐薪 企业实付
    let AM_lexin = AL * 1.03 //直接乘以个人实收AL
    //节省
    let save = AM - AM_lexin
    let save_year = save * 12 * pernum
    return {
      AM,
      AM_lexin,
      save,
      save_year,
    }
  }
  // //最终输入 本月应发H 员工人数pernum 得到 4个值
  // function lexinCalcByH(H, pernum) {
  //   //本月应发 H
  //   //传统 企业实付
  //   let AM = calcAMbyH(H)
  //   //乐薪 企业实付
  //   let AM_lexin = calcAMbyH_lexin(H)
  //   //节省
  //   let save = AM - AM_lexin
  //   let save_year = save * 12 * pernum
  //   return {
  //     AM,
  //     AM_lexin,
  //     save,
  //     save_year,
  //   }
  // }

  //金钱格式化
  function toMoney(val) {
    var str = (val / 100 * 100).toFixed(2) + '';
    var intSum = str.substring(0, str.indexOf(".")).replace(/\B(?=(?:\d{3})+$)/g, ',');//取到整数部分
    var dot = str.substring(str.length, str.indexOf("."))//取到小数部分搜索
    var ret = intSum + dot;
    return ret;
  }
  //配置微信js-sdk
  function configWechat(options, callback) { //options { title,desc,imgUrl}
    let timer = null
    let cookieObj = getCookieObj()

    //刷页面
    timer = window.setTimeout(function () {
      if (timer) {
        window.location.href = window.location.href + '&time=' + new Date().getTime()
      }
    }, 3000)
    //获取wx config
    //绑定
    wx.ready(function () {
      wx.onMenuShareAppMessage({
        title: options.title ? options.title : "乐薪平台", // 分享标题
        desc: options.desc ? options.desc : document.getElementsByTagName("title")[0].innerHTML, // 分享描述
        link: window.location.href, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
        imgUrl: options.imgUrl ? options.imgUrl : 'https://www.bld365.com/static/media/home02.186e2e64.png', // 分享图标
        type: '', // 分享类型,music、video或link，不填默认为link
        dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
      });

      if (callback) {
        callback()
      }
    });
    wx.error(function (err) {
      if (callback) {
        callback()
      }
    });
    //绑定 end

    //获取wx config参数
    let url = window.location.href
    // let urlStr = ''

    // if (isIOS() && url.indexOf(',') > -1) {
    //   // urlStr = url.split('?')[0]
    //   let optionStr = url.split('?')[1].split(',')[1]
    //   urlStr = window.location.origin + window.location.pathname + "?" + optionStr
    // } else {
    //   urlStr = url
    // }

    $.ajax({
      type: "post",
      url: host + "/api/jssdkconfig",
      data: { url: url },
      headers: {
        "x-csrf-token": cookieObj.csrfToken,
      },
      async: true,
      success: function (res) {
        window.clearTimeout(timer)
        console.log(res)
        if (res.code === 200) {
          let param = res.data
          //wx config
          wx.config({
            // debug: true, // 开启调试模式,调用的所有api的返回值会在客户端，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: param.appId, // 必填，公众号的唯一标识
            timestamp: param.timestamp, // 必填，生成签名的时间戳
            nonceStr: param.nonceStr, // 必填，生成签名的随机串
            signature: param.signature,// 必填，签名
            jsApiList: [
              // "updateAppMessageShareData",
              // "updateTimelineShareData"
              "onMenuShareAppMessage",
              'chooseImage',
              'uploadImage'
            ],
          });
        } else {
          console.log("获取jsconfig失败")
        }
      },
      error: function (e) {
        window.clearTimeout(timer)
        window.location.href = window.location.href + '&time=' + new Date().getTime()
      }
    })
  }
  //判断是否是IOS
  function isIOS() {
    let u = navigator.userAgent;
    let isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    return isIOS;
  }
  //根据img大小和容器的宽高比，设置img的css，注：img初始不能设置固定宽高
  function setImgCssByBox(img, num) { //img元素 num box宽高比 widht/height
    let imgW = img.width
    let imgH = img.height
    if ((imgW / imgH) > num) { //width更大  很长
      img.style.width = "100%"
      img.style.height = "auto"
    } else {
      img.style.width = "auto"
      img.style.height = "100%"
    }
  }
  //获取页面url参数
  function getPageParams() {
    var url = window.location.href
    var option = {}
    if (url.indexOf("?") > -1) {
      var arr = url.split("?")[1].split("&")
      arr.forEach(function (str) {
        var arrTemp = str.split("=")
        option[arrTemp[0]] = arrTemp[1]
      })
    }
    return option
  }
  //获取cookieObj
  function getCookieObj() {
    let cookieStr = document.cookie
    let cookieArr = cookieStr.split(';')
    let cookieObj = {}
    cookieArr.forEach(function (str) {
      let key = str.split('=')[0]
      let value = str.split('=')[1]
      cookieObj[key] = value
    })
    return cookieObj
  }
  /**
   * 取得url参数
   */
  function getUrlParam(key) {
    let url = window.location.href
    if (url.indexOf(key + '=') > -1) {
      let strBack = url.split(key + '=')[1] //key=后面的str
      if (strBack.indexOf('&') > -1) { //后面还有参数
        let value = strBack.split('&')[0]
        return value
      } else { //后面没参数了
        return strBack
      }
    } else {
      return null
    }
  }



  ////////////////////////////////////////////////////////////////////////////////
  return {
    host: host,

    sizeStrToNumber,
    pxStrToRem,
    kickBack,

    //计算器
    calcAMbyH,
    calcHbyAL,
    lexinCalc,
    // lexinCalcByH,
    toMoney,
    configWechat,
    isIOS,
    setImgCssByBox,
    getPageParams,
    getUrlParam,
    getCookieObj,
  }
})()

//====================================================================================================================

//介绍intro页面 证书滚动效果
//移动端滑动
var EventUtil = {
  addHandler: function (element, type, handler) {
    if (element.addEventListener)
      element.addEventListener(type, handler, false);
    else if (element.attachEvent)
      element.attachEvent("on" + type, handler);
    else
      element["on" + type] = handler;
  },
  removeHandler: function (element, type, handler) {
    if (element.removeEventListener)
      element.removeEventListener(type, handler, false);
    else if (element.detachEvent)
      element.detachEvent("on" + type, handler);
    else
      element["on" + type] = handler;
  },
  /**
   * 监听触摸的方向
   * @param target            要绑定监听的目标元素
   * @param isPreventDefault  是否屏蔽掉触摸滑动的默认行为（例如页面的上下滚动，缩放等）
   * @param upCallback        向上滑动的监听回调（若不关心，可以不传，或传false）
   * @param rightCallback     向右滑动的监听回调（若不关心，可以不传，或传false）
   * @param downCallback      向下滑动的监听回调（若不关心，可以不传，或传false）
   * @param leftCallback      向左滑动的监听回调（若不关心，可以不传，或传false）
   */
  listenTouchDirection: function (target, isPreventDefault, upCallback, rightCallback, downCallback, leftCallback) {
    this.addHandler(target, "touchstart", handleTouchEvent);
    this.addHandler(target, "touchend", handleTouchEvent);
    this.addHandler(target, "touchmove", handleTouchEvent);
    var startX;
    var startY;
    function handleTouchEvent(event) {
      switch (event.type) {
        case "touchstart":
          startX = event.touches[0].pageX;
          startY = event.touches[0].pageY;
          break;
        case "touchend":
          var spanX = event.changedTouches[0].pageX - startX;
          var spanY = event.changedTouches[0].pageY - startY;

          if (Math.abs(spanX) > Math.abs(spanY)) {      //认定为水平方向滑动
            if (spanX > 30) {         //向右
              if (rightCallback)
                rightCallback();
            } else if (spanX < -30) { //向左
              if (leftCallback)
                leftCallback();
            }
          } else {                                    //认定为垂直方向滑动
            if (spanY > 30) {         //向下
              if (downCallback)
                downCallback();
            } else if (spanY < -30) {//向上
              if (upCallback)
                upCallback();
            }
          }
          break;
        case "touchmove":
          //阻止默认行为
          if (isPreventDefault)
            event.preventDefault();
          break;
      }
    }
  }
};