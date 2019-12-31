<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      For a guide on the DASE, check out here
      <router-link :to="{name: 'Docs'}">Docs</router-link>
    </p>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data(){
    return{
      msg: 'Welcome to the Decentralized Atlanta Stock Exchange'
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
