/*
 * @description: TS 版本的缓冲移除
 * @author: huxianghe
 * @lastEditors: huxianghe
 * @Date: 2019-05-03 16:13:34
 * @LastEditTime: 2019-05-04 11:54:23
 */

import Vue, { VNode } from 'vue'
import { Route } from 'vue-router'
import { ElementType } from './vue-shim'

interface CachedComponentList {
  componentName: string,
  key: string,
  routeLevel: number
}

interface RemoveCachedRules {
  removeAllLowLevelCacheComp: boolean
  removeSameLevelCacheComp: boolean
}

const hasOwnProperty = Object.prototype.hasOwnProperty

const inArray = (ele: ElementType, array: ElementType[]) => {
  const i = array.indexOf(ele)
  const o = {
    include: i !== -1,
    index: i
  }
  return o
}

const isArray = (array: any) => {
  return Array.isArray(array)
}

const hasOwn = (key: ElementType, obj: object) => {
  return hasOwnProperty.call(obj, key)
}

export default class ManageCachedComponents {
  private mc_keepAliveKeys: ElementType[] = []
  private mc_cachedParentComponent: VNode = <VNode>{}
  private mc_cachedComponentsInfo: CachedComponentList = <CachedComponentList>{}
  public mc_removeCacheRule: RemoveCachedRules = {
    removeAllLowLevelCacheComp: true,
    removeSameLevelCacheComp: true
  }

  /**
   * 从缓存列表中移除 key
   */
  private mc_removeCacheKey (key: ElementType, keys: ElementType[]) {
    const { include, index } = inArray(key, keys)
    include && keys.splice(index, 1)
  }

  /**
   * 从 keep-alive 实例的 cache 移除缓存组件并移除缓存 key
   * @param key 缓存组件的 key
   * @param componentName 要清除的缓存组件名称
   */
  private mc_removeCachedComponent (key: string, componentName: string) {
    const { mc_keepAliveKeys, mc_cachedParentComponent, mc_cachedComponentsInfo } = this
    const { componentInstance } = mc_cachedParentComponent
    const cacheList = componentInstance.cache
    const keysList = componentInstance.keys
    const { include } = inArray(key, keysList)
    if (include && cacheList[key]) {
      this.mc_removeCacheKey(key, keysList)
      this.mc_removeCacheKey(key, mc_keepAliveKeys)
      cacheList[key].componentInstance.$destroy()
      delete cacheList[key]
      delete mc_cachedComponentsInfo[componentName]
    }
  }

  /**
   * 添加缓存组件到缓存列表
   * @param Vue 当前组件实例
   */
  mc_addCacheComponentToCacheList (Vue: Vue) {
    const { mc_cachedComponentsInfo } = this
    const { $vnode, $route, includes } = Vue
    const { componentOptions, parent } = $vnode
    const componentName = componentOptions.Ctor.options.name
    const compName = `cache-com::${componentName}`
    const { include } = inArray(componentName, includes)
    if (parent && include && !hasOwn(compName, mc_cachedComponentsInfo)) {
      const { keys, cache } = parent.componentInstance
      const key = !$vnode.key
                  ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
                  : $vnode.key
      const routeLevel = $route.meta.level
      mc_cachedComponentsInfo[compName] = {
        componentName,
        key,
        routeLevel
      }
      this.mc_keepAliveKeys = keys
      this.mc_cachedParentComponent = parent
    }
  }

  /**
   * 根据组件名称移除指定的组件
   * @param componentName 要移除的组件名称或者名称列表
   */
  mc_removeCachedByComponentName (componentName: string | string[]) {
    if (!isArray(componentName) && typeof componentName !== 'string') {
      throw new TypeError(`移除的组件可以是 array 或者 string，当前类型为: ${typeof componentName}`)
    }
    const { mc_cachedComponentsInfo } = this
    if (isArray(componentName)) {
      const unKnowComponents = []
      for (const name of componentName) {
        const compName = `cache-com::${name}`
        if (hasOwn(compName, mc_cachedComponentsInfo)) {
          const { key } = mc_cachedComponentsInfo[compName]
          this.mc_removeCachedComponent(key, compName)
        } else {
          unKnowComponents.push(name)
        }
      }
      // 提示存在非缓存组件
      if (unKnowComponents.length) {
        let tips = unKnowComponents.join(` && `)
        console.warn(`${tips} 组件非缓存组件，请在移除缓存列表中删除以上组件名`)
      }
      return
    }

    const compName = `cache-com::${componentName}`
    if (hasOwn(compName, mc_cachedComponentsInfo)) {
      const { key } = mc_cachedComponentsInfo[compName]
      this.mc_removeCachedComponent(key, compName)
    } else {
      console.warn(`${componentName} 组件非缓存组件，请添加正确的缓存组件名`)
    }
  }

  /**
   * 移除路由级别的缓存组件
   * @param toRoute 跳转路由记录
   * @param Vue 当前组件实例
   */
  mc_removeCachedByComponentLevel (toRoute: Route, Vue: Vue) {
    const { level, compName } = toRoute.meta
    const { mc_cachedComponentsInfo, mc_removeCacheRule } = this
    const componentName = Vue.$vnode.componentOptions.Ctor.options.name
    if (
        level &&
        compName &&
        mc_cachedComponentsInfo['cache-com::' + compName] &&
        mc_cachedComponentsInfo['cache-com::' + componentName]
      ) {
      const { removeAllLowLevelCacheComp, removeSameLevelCacheComp } = mc_removeCacheRule
      if (removeAllLowLevelCacheComp) {
        const cachedCompList = []
        for (const cacheItem in mc_cachedComponentsInfo) {
          const { componentName, routeLevel } = mc_cachedComponentsInfo[cacheItem]
          if (
              componentName !== compName &&
              Number(routeLevel) >= level &&
              removeSameLevelCacheComp
            ) {
              cachedCompList.push(mc_cachedComponentsInfo[cacheItem])
          }
        }

        if (cachedCompList.length) {
          cachedCompList.forEach(cacheItem => {
            const { key, componentName } = cacheItem
            const compName = 'cache-com::' + componentName
            this.mc_removeCachedComponent(key, compName)
          })
        }
        return
      }
      const { routeLevel } = mc_cachedComponentsInfo['cache-com::' + componentName]
      if (Number(routeLevel) >= level && removeSameLevelCacheComp) {
        this.mc_removeCachedByComponentName(componentName)
      }
    }
  }
}