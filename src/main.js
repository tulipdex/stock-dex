import Vue from 'vue'
import App from './App.vue'
import router from './_router'
import store from './_store/store'
// BOOTSTRAP
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.config.productionTip = false
// Vue.use(VueRouter)
Vue.use(BootstrapVue);

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')
