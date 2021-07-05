
  
  module.exports = {
    
  
    signTypedData: function (web3, from, data) {
      return new Promise(async (resolve, reject) => {
        function cb(err, result) {
          if (err) {
            return reject(err);
          }
          if (result.error) {
            return reject(result.error);
          }
  
          const sig = result.result;
          const sig0 = sig.substring(2);
          const r = "0x" + sig0.substring(0, 64);
          const s = "0x" + sig0.substring(64, 128);
          const v = parseInt(sig0.substring(128, 130), 16);
  
          resolve({
            data,
            sig,
            v, r, s
          });
        }
        if (web3.currentProvider.isMetaMask) {
          web3.currentProvider.sendAsync({
            jsonrpc: "2.0",
            method: "eth_signTypedData_v3",
            params: [from, JSON.stringify(data)],
            id: new Date().getTime()
          }, cb);
        } else {
          let send = web3.currentProvider.sendAsync;
          if (!send) send = web3.currentProvider.send;
          send.bind(web3.currentProvider)({
            jsonrpc: "2.0",
            method: "eth_signTypedData",
            params: [from, data],
            id: new Date().getTime()
          }, cb);
        }
      });
    },

    signTypedDataEthersJS: function (web3, from, data) {
      return new Promise(async (resolve, reject) => {
        function cb(err, result) {
          if (err) {
            return reject(err);
          }
          if (result.error) {
            return reject(result.error);
          }
  
          const sig = result.result;
          const sig0 = sig.substring(2);
          const r = "0x" + sig0.substring(0, 64);
          const s = "0x" + sig0.substring(64, 128);
          const v = parseInt(sig0.substring(128, 130), 16);
  
          resolve({
            data,
            sig,
            v, r, s
          });
        }
     
          web3.send({
            method: "eth_signTypedData_v3",
            params: [from, JSON.stringify(data)],
            id: new Date().getTime()
          }, cb);
      });
    }
  };