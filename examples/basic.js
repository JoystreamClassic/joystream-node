var lib = require('../')
var debug = require('debug')('basic')

debug('Starting basic.js example')

var app = new lib.Session({
  port: 6882
})

var wallet = new lib.SPVWallet({
  db: 'leveldb',
  prefix: '/home/lola/joystream/test/',
  network: 'testnet',
  httpPort: 18332
})

wallet.start().then(() => {
  debug('Wallet Ready we can start to sell')

  debug('Address to fund wallet : ', wallet.getAddress().toString())

  let addTorrentParams = {
    ti: new lib.TorrentInfo('/home/lola/joystream/test/306497171.torrent'),
    savePath: '/home/lola/joystream/test/'
  }

  app.addTorrent(addTorrentParams, (err, torrent) => {
    if (!err) {
      debug('Torrent Added !')

      // 50, 1, 10, 15000, 5000
      let sellerTerm = {
        minPrice: 50,
        minLock: 1,
        maxNumberOfSellers: 10,
        minContractFeePerKb: 15000,
        settlementFee: 5000
      }

      if (torrent.torrentPlugin) {
        if (torrent.handle.status().state === 5) {
          torrent.toSellMode(sellerTerm, (err, result) => {
            if (!err) {
              debug('We are in selling mode')
            } else {
              console.log(err)
            }
          })
        } else {
          torrent.on('state_changed_alert', () => {
            if (torrent.handle.status().state === 5) {
              torrent.toSellMode(sellerTerm, (err, result) => {
                if (!err) {
                  debug('We are in selling mode')
                } else {
                  console.log(err)
                }
              })
            }
          })
        }
      } else {
        // we wait for the plugin to be added
        torrent.on('torrentPluginAdded', () => {
          debug('Torrent Plugin added')

          torrent.on('state_changed_alert', () => {
            if (torrent.handle.status().state === 5) {
              torrent.toSellMode(sellerTerm, (err, result) => {
                if (!err) {
                  debug('We are in selling mode')
                } else {
                  console.log(err)
                }
              })
            }
          })
        })
      }
    } else {
      debug(err)
    }
  })
})
