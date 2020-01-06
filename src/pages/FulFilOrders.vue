<template>
  <div id="FulFilOrder">
    <div v-if="toggle == 0">
      <Buy />
    </div>
    <div v-else-if="toggle == 1">
      <Sell />
    </div>
  </div>
</template>

<script>
import Buy from "@/components/orders/Buy.vue"
import Sell from "@/components/orders/Sell.vue"

export default {
  name: 'FulFilOrder',
  component:{
    Buy,
    Sell
  }
  data(){
    return{
      msg: 'Welcome to the Decentralized Atlanta Stock Exchange'
      toggle: 0,
    }
  },
  methods:{
    toggleOrderType(){

    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
