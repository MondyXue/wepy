import WepyApp from '../class/WepyApp';
import WepyPage from '../class/WepyPage';
import WepyComponent from '../class/WepyComponent';
import { observe } from './../observer/index';
import { proxy } from './data';
import Watcher from './../observer/watcher';
import $global from './../global';
import { initHooks, callUserHook } from './hooks';
import { initProps } from './props';
import { initWatch } from './watch';
import { initRender } from './render';
import { initData } from './data';
import { initComputed } from './computed';
import { initMethods } from './methods';
import { initEvents } from './events';
import { isStr, isArr, isFunc } from '../../shared/index';
import Dirty from '../class/Dirty';
import Base from '../class/Base';


let comid = 0;
let app;


const callUserMethod = function (vm, userOpt, methodName, args = [], hook) {
  let result;
  let method = userOpt[methodName];
  if (hook) {
    args = callUserHook(vm, `before-${methodName}`, args);
  }
  if (isFunc(method)) {
    result = method.apply(vm, args);
  }
  if (hook) {
    result = callUserHook(vm, `after-${methodName}`, args, result);
  }
  return result;
};

/*
 * patch app lifecyle
 */
export function patchAppLifecycle (appConfig, options, rel) {
  appConfig.onLaunch = function (...args) {
    let vm = new WepyApp();
    app = vm;
    vm.$options = options;
    vm.$route = {};

    let result;
    vm.$wx = this;
    this.$wepy = vm;

    if (!('options' in this)) {
      this.options = args && args.length ? args[0] : {}
    }
    if (typeof options.config === 'object') {
      this.$config = options.config
    }

    Base.getApp = () => app
    Base.getCurrentPages = () => {
      const pages = getCurrentPages();
      return pages && pages.length ? pages.map(page => page.$wepy) : null;
    }
    Base.getCurrentPage = () => {
      const pages = getCurrentPages();
      return pages && pages.length ? pages[pages.length - 1].$wepy : null;
    }

    initHooks(vm, options.hooks);

    initMethods(vm, options.methods);

    return callUserMethod(vm, vm.$options, 'onLaunch', args, true);
  };

  ['onShow', 'onHide', 'onError', 'onPageNotFound'].forEach(k => {
    appConfig[k] = function (...args) {
      return callUserMethod(app, app.$options, k, args, true);
    }
  });
};

export function patchComponentLifecycle (compConfig, options) {

  compConfig.created = function () {
    let vm = new WepyComponent();
    this.$wepy = vm;
    vm.$wx = this;
    vm.$id = ++comid;

    if (!vm.$app) {
      //vm.$app = $global.$app;
    }

    initProps (vm, compConfig.properties, true);
  }
};

export function patchLifecycle (output, options, rel, isComponent) {

  const initClass = isComponent ? WepyComponent : WepyPage;
  const initLifecycle = function (...args) {
    let vm = new initClass();

    vm.$dirty = new Dirty('path');
    vm.$children = [];
    vm.$refs = {};

    this.$wepy = vm;
    vm.$wx = this;
    vm.$is = this.is;
    vm.$options = options;
    vm.$rel = rel;
    if (!isComponent) {
      vm.$root = vm;
      vm.$app = app;
      const appConfig = app.$options.config
      const pageConfig = options.config
      if (typeof pageConfig === 'object' && typeof appConfig === 'object' && typeof appConfig.window === 'object' ) {
        for (const name in appConfig.window) {
          if (!(name in pageConfig)) {
            pageConfig[name] = appConfig.window[name]
          }
        }
        this.$config = pageConfig
      }
    }

    vm.$id = ++comid + (isComponent ? '.1' : '.0');
    if (!vm.$app) {
      // vm.$app = $global.$app;
    }

    initHooks(vm, options.hooks);

    initProps(vm, output.properties);

    initData(vm, output.data, isComponent);

    initMethods(vm, options.methods);

    initWatch(vm, options.watch);

    // initEvents(vm);

    // create render watcher
    initRender(vm, Object.keys(vm._data).concat(Object.keys(vm._props)));

    // not need to patch computed to ouput
    initComputed(vm, options.computed, true);

    return callUserMethod(vm, vm.$options, 'created', args, true);
  };

  output.created = initLifecycle;
  if (isComponent) {
    output.attached = function (...args) { // Component attached
      let outProps = output.properties || {};
      // this.propperties are includes datas
      let acceptProps = this.properties;
      let vm = this.$wepy;
      let parent = this.triggerEvent('_init', vm);

      initEvents(vm);

      Object.keys(outProps).forEach(k => vm[k] = acceptProps[k]);

      return callUserMethod(vm, vm.$options, 'attached', args, true);
    };
  } else {
    output.attached = function (...args) { // Page attached
      let vm = this.$wepy;
      let app = vm.$app;
      let pages = getCurrentPages();
      let currentPage = pages[pages.length - 1];
      let path = currentPage.__route__;
      let webViewId = currentPage.__wxWebviewId__;
      if (app.$route.path !== path) {
        app.$route.path = path;
        app.$route.webViewId = webViewId;
        vm.routed && (vm.routed());
      }

      // TODO: page attached
      return callUserMethod(vm, vm.$options, 'attached', args, true);
    }

    // Page lifecycle will be called under methods
    // e.g:
    // Component({
    //   methods: {
    //     onLoad () {
    //       console.log('page onload')
    //     }
    //   }
    // })

    let pageLifecycle = output.methods;

    pageLifecycle.onLoad = function (...args) {
      // TODO: onLoad
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onLoad', args, true);
    }

    pageLifecycle.onShow = function (...args) {
      // TODO: onShow
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onShow', args, true);
    }

    pageLifecycle.onHide = function (...args) {
      // TODO: onHide
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onHide', args, true);
    }

    pageLifecycle.onUnload = function (...args) {
      // TODO: onUnload
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onUnload', args, true);
    }

    pageLifecycle.onPullDownRefresh = function (...args) {
      // TODO: onPullDownRefresh
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onPullDownRefresh', args, true);
    }

    pageLifecycle.onReachBottom = function (...args) {
      // TODO: onReachBottom
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onReachBottom', args, true);
    }

    pageLifecycle.onShareAppMessage = function (...args) {
      // TODO: onShareAppMessage
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onShareAppMessage', args, true);
    }

    pageLifecycle.onPageScroll = function (...args) {
      // TODO: onPageScroll
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onPageScroll', args, true);
    }

    pageLifecycle.onTabItemTap = function (...args) {
      // TODO: onTabItemTap
      let vm = this.$wepy;
      return callUserMethod(vm, vm.$options, 'onTabItemTap', args, true);
    }
  }

  output.ready = function () {
    // TODO: ready
  };

  output.moved = function () {
    // TODO: moved
  };
};

