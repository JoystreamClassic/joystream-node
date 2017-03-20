var lib = require('../')
var debug = require('debug')('buyer')

var app = new lib.Session({
  port: 6882
})

var wallet = new lib.SPVWallet({
  db: 'leveldb',
  prefix: '/home/lola/joystream/test2/',
  network: 'testnet',
  httpPort: 18333
})

let addTorrentParams = {
  ti: new lib.TorrentInfo('/home/lola/joystream/test/306497171.torrent'),
  path: '/home/lola/joystream/test/'
}

function letsBuy(torrent) {
  //  100, 5, 1, 20000
  let buyerTerm = {
    maxPrice: 100,
    maxLock: 5,
    minNumberOfSellers: 1,
    maxContractFeePerKb: 20000
  }

  torrent.toBuyMode(buyerTerm, (err, result) => {
    if (!err) {
      debug('We are in buying mode')
    } else {
      console.log(err)
    }
  })
}

wallet.start().then(() => {
  debug('Wallet Ready !')

  debug('Address to fund wallet : ', wallet.getAddress().toString())

  wallet.getBalance().then((balance) => {
    debug('Balance : ', balance)
  })

  app.addTorrent(addTorrentParams, (err, torrent) => {
    debug('Torrent Added !')

    if (!err) {
      if (torrent.torrentPlugin) {
        // Verify if it is on downloading status
        if (torrent.handle.status().state === 3) {
          letsBuy(torrent)
        } else {
          // Wait to pass to change status
          torrent.on('state_changed_alert', () => {
            debug('Torrent state changed')
            // Verify if is downloading state
            if (torrent.handle.status().state === 3) {
              debug('Torrent seeding, we can go to sell mode')
              letsBuy(torrent)
            }
          })
        }
      } else {
        // we wait for the plugin to be added
        torrent.on('torrentPluginAdded', () => {
          debug('Torrent Plugin added')

          // Verify if it is on downloading status
          if (torrent.handle.status().state === 3) {
            letsBuy(torrent)
          } else {
            // Wait to pass to change status
            torrent.on('state_changed_alert', () => {
              debug('Torrent state changed')
              // Verify if is downloading state
              if (torrent.handle.status().state === 3) {
                debug('Torrent seeding, we can go to sell mode')
                letsBuy(torrent)
              }
            })
          }
        })
      }
    } else {
      debug(err)
    }
  })
})
