import WepyPage from '../class/WepyPage';
import { isFunc } from './../util/index';

export function callUserHook (vm, hookName, args, result) {
  if (!(vm instanceof WepyPage)) {
    return args;
  }
  let appHook = vm.$app.hooks[hookName];
  let pageHook = vm.hooks[hookName];
  if (hookName.indexOf('after-') === 0) {
    result = isFunc(appHook) ? appHook.call(vm, args, result) : result;
    result = isFunc(pageHook) ? pageHook.call(vm, args, result) : result;
    return result
  } else {
    args = isFunc(appHook) ? appHook.call(vm, args) : args;
    args = isFunc(pageHook) ? pageHook.call(vm, args) : args;
    return args;
  }
}

export function initHooks(vm, hooks = {}) {
  vm.hooks = hooks;
};
