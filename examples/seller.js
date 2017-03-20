var lib = require('../')
var debug = require('debug')('seller')

var app = new lib.Session({
  port: 6881
})

var wallet = new lib.SPVWallet({
  db: 'leveldb',
  prefix: '/home/lola/joystream/test/',
  network: 'testnet',
  httpPort: 18332
})

function letsSell (torrent) {

  //  50, 1, 10, 15000, 5000
  let sellerTerm = {
    minPrice: 50,
    minLock: 1,
    maxNumberOfSellers: 10,
    minContractFeePerKb: 15000,
    settlementFee: 5000
  }

  torrent.toSellMode(sellerTerm, (err, result) => {
    if (!err) {
      debug('We are in selling mode')

      torrent.on('readyToSellTo', (buyer) => {

        if (!buyer.contractSent) {
          let contractSk = wallet.generatePrivateKey()
          let finalPkHash = wallet.getAddress().getHash()

          buyer.contractSent = true

          torrent.startSelling(buyer, contractSk, finalPkHash, (err, result) => {
            if (!err) {
              debug('Selling to peer !')
            } else {
              buyer.contractSent = false
              debug(err)
            }
          })
        }
      })
    } else {
      console.log(err)
    }
  })
}

wallet.start().then(() => {
  debug('Wallet Ready !')

  let addTorrentParams = {
    ti: new lib.TorrentInfo('/home/lola/joystream/test/306497171.torrent'),
    savePath: '/home/lola/joystream/test/'
  }

  app.addTorrent(addTorrentParams, (err, torrent) => {
    debug('Torrent Added !')

    if (!err) {

      debug('Waiting for torrentPlugin to be set')

      if (torrent.torrentPlugin) {
        debug('Torrent Plugin here')

        if (torrent.handle.status().state === 5) {
          debug('Torrent seeding, we can go to sell mode')
          letsSell(torrent)
        } else {

          function waitingTorrentToSeed () {
            debug('Torrent state changed')
            if (torrent.handle.status().state === 5) {
              debug('Torrent seeding, we can go to sell mode')
              console.log(torrent)
              torrent.removeListener('state_changed_alert', waitingTorrentToSeed)
              letsSell(torrent)
            }
          }

          torrent.on('state_changed_alert', waitingTorrentToSeed)
        }
      } else {
        // we wait for the plugin to be added
        torrent.once('torrentPluginAdded', () => {
          debug('Torrent Plugin added')

          torrent.on('state_changed_alert', () => {
            debug('Torrent state changed')
            if (torrent.handle.status().state === 5) {
              debug('Torrent seeding, we can go to sell mode')
              letsSell(torrent)
            }
          })
        })
      }
    } else {
      debug(err)
    }
  })
})
