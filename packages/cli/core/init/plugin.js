const { isStr, isFunc } = require('../util/tools');

function checkPlugins (ins, plugins) {
  plugins = plugins.map(plg => {
    // ensure plugin is valid
    // or process would be exit
    try {
      if (isStr(plg)) {
        plg = { src: plg }
      }
      plg.fn = require(plg.src)
      if (!isFunc(plg.fn)) {
        throw 'Plugin must be a function.'
      }
      return plg
    } catch (error) {
      ins.logger.error(
        'init',
        'Plugins init error, please check your plugin in wepy.config.js file.\n' +
        error
      );
      throw new Error('EXIT');
    }
  })

  return plugins;
}

exports = module.exports = function (ins) {
  // system plugins
  let systemPluginFns = [
    './../plugins/scriptDepFix',
    './../plugins/scriptInjection',
    './../plugins/build/app',
    './../plugins/build/pages',
    './../plugins/build/components',
    './../plugins/build/vendor',
    './../plugins/build/assets',

    './../plugins/template/parse',

    './../plugins/template/attrs',
    './../plugins/template/directives',


    './../plugins/helper/supportSrc',
    './../plugins/helper/sfcCustomBlock',
    './../plugins/helper/generateCodeFrame',
    './../plugins/helper/errorHandler',

    './../plugins/compiler/index',

  ].map(v => require(v).call(ins));
  // check custom plugins
  const customPlugins = checkPlugins(ins, ins.options.plugins)
  
  customPlugins.forEach(plg => ins.register(plg.src, plg.fn));

  ins.register('before-output-file', item => customPlugins.forEach(plg => ins.hookSeq(plg.src, plg.config, item)))
}
