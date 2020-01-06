// require('babel-register');
// require('babel-polyfill')
// Configs the enviroment variables
require('dotenv').config();

module.exports = {
  networks: {
    development:{
      host: 'localhost',
      port: "7545",
      network_id: "*",//match with any network
    }
  },
  // these two are very important that they remain inside the src folder
  contracts_directory: './src/contracts',
  contracts_build_directory: './src/abis',
  // Configure your compilers
  compilers: {
    solc: {
       optimizer: {
         enabled: true,
         runs: 200
       },
    }
  }
}
