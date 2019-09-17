/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1563844382599_8955';

  // add your middleware config here
  config.middleware = ['compress'] //gzip压缩

  // tongzhou配置compress gzip压缩
  config.compress = {
    threshold: 2048 // 超过2048B进行压缩，不写默认为1024B
  }

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  //tongzhou配置静态资源
  config.static = {
    prefix: '/'
  }

  //tongzhou 跨域
  config.security = {
    csrf: {
      enable: false
    },
    domainWhiteList: ['*']
  };
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
  };




  return {
    ...config,
    ...userConfig,
  };
};
