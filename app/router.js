'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app
  router.post('/api/jssdkconfig', controller.api.jssdkconfig) //获取js sdk config
  router.post('/api/initrealname', controller.api.initrealname)
  router.post('/api/uploadocr', controller.api.uploadocr)

  router.get('/api/getimage', controller.api.getimage)
}
