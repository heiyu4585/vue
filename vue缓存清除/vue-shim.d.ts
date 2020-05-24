/*
 * @description: 模块拓展类型定义文件
 * @author: huxianghe
 * @lastEditors: huxianghe
 * @Date: 2019-05-04 08:53:10
 * @LastEditTime: 2019-05-04 11:20:30
 */
import Vue, { VNode } from 'vue'
import { Route } from 'vue-router'
import ManageCachedComponents from './clear-cache'

export type ElementType = string | number

export interface KeepAliveCachedComponent {
  [key: string]: VNode
}

interface CtorOptions {
  name: string
  [key: string]: any
}

declare module 'vue/types/vue' {
  interface Vue {
    $route: Route
    $mc: ManageCachedComponents
    includes: string[]
    keys?: ElementType[]
    cache?: KeepAliveCachedComponent
  }
  interface VueConstructor {
    cid: number
    options: CtorOptions
  }
}