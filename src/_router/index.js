import Vue from 'vue'
import Router from 'vue-router'
import Home from '@/pages/Home'
import Docs from '@/pages/Docs'
//meta
// import Meta from 'vue-meta'

Vue.use(Router)
// Vue.use(Meta)

const router = new Router({
  // mode: 'history',
  // base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: {layout: 'home'}
    },
    {
      path: '/docs',
      name: 'Docs',
      component: Docs,
    },
  ]
})

export default router
