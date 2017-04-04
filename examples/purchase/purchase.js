const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo
const path = require('path')

const sintelTorrentPath = path.join(__dirname, '/../../test/sintel.torrent')

/* * * * * * * * * * *
 *
 *   Buyer
 *
 * * * * * * * * * * */

var buyerSession = new Session({
  port: 6882
})

let addTorrentParamsBuyer = {
  ti: new TorrentInfo(sintelTorrentPath),
  savePath: path.join(__dirname, '/buyer/')
}

function letsBuy (torrent) {
  //  100, 5, 1, 20000
  let buyerTerms = {
    maxPrice: 100,
    maxLock: 5,
    minNumberOfSellers: 1,
    maxContractFeePerKb: 20000
  }

  torrent.toBuyMode(buyerTerms, (err, result) => {
    if (!err) {
      console.log('We are in buying mode')
      torrent.on('readyToBuyTo', (seller) => {
        console.log('We are ready to buy')
        if (!seller.contractSent) {
          let contractSk = Buffer.from('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20', 'hex')
          let finalPkHash = new Buffer(20)
          let value = 5000

          seller.contractSent = true

          torrent.startBuying(seller, contractSk, finalPkHash, value, (err, result) => {
            if (!err) {
              console.log('Buying to peer !')
            } else {
              seller.contractSent = false
              console.error(err)
            }
          })
        }
      })
    } else {
      console.log(err)
    }
  })
}

 /* * * * * * * * * * *
  *
  *   Seller
  *
  * * * * * * * * * * */

var sellerSession = new Session({
  port: 6881
})

let addTorrentParamsSeller = {
  ti: new TorrentInfo(sintelTorrentPath),
  savePath: path.join(__dirname, '/seller/')
}

function letsSell (torrent) {
  //  50, 1, 10, 15000, 5000
  let sellerTerms = {
    minPrice: 50,
    minLock: 1,
    maxNumberOfSellers: 10,
    minContractFeePerKb: 15000,
    settlementFee: 5000
  }

  torrent.toSellMode(sellerTerms, (err, result) => {
    if (!err) {
      console.log('We are in sell mode')
      torrent.on('readyToSellTo', (buyer) => {
        if (!buyer.contractSent) {
          let contractSk = Buffer.from('030589ee559348bd6a7325994f9c8eff12bd5d73cc683142bd0dd1a17abc99b0','hex')
          let finalPkHash = new Buffer(20)

          buyer.contractSent = true

          torrent.startSelling(buyer, contractSk, finalPkHash, (err, result) => {
            if (!err) {
              console.log('Selling to peer !')
            } else {
              buyer.contractSent = false
              console.error(err)
            }
          })
        }
      })
    } else {
      console.log(err)
    }
  })
}

/* * * * * * * * * * *
 *
 *   Purchase
 *
 * * * * * * * * * * */

// Seller adding torrent and starting sell mode
sellerSession.addTorrent(addTorrentParamsSeller, (err, torrent) => {
  if (!err) {
    function waitingTorrentToSeed () {
      if (torrent.handle.status().state === 5) {
        torrent.removeListener('state_changed_alert', waitingTorrentToSeed)
        letsSell(torrent)
      }
    }
    if (torrent.torrentPlugin) {
      if (torrent.handle.status().state === 5) {
        letsSell(torrent)
      } else {
        torrent.on('state_changed_alert', waitingTorrentToSeed)
      }
    } else {
      // we wait for the plugin to be added
      torrent.once('torrentPluginAdded', () => {
        if (torrent.handle.status().state === 3) {
          letsSell(torrent)
        } else {
          torrent.on('state_changed_alert', waitingTorrentToSeed)
        }
      })
    }
  } else {
    console.error(err)
  }
})

buyerSession.addTorrent(addTorrentParamsBuyer, (err, torrent) => {
  // TODO : Find a better way to do that.
  if (!err) {
    function waitingTorrentToDownload () {
      if (torrent.handle.status().state === 3) {
        torrent.removeListener('state_changed_alert', waitingTorrentToDownload)
        letsBuy(torrent)
      }
    }
    if (torrent.torrentPlugin) {
      if (torrent.handle.status().state === 3) {
        letsBuy(torrent)
      } else {
        torrent.on('state_changed_alert', waitingTorrentToDownload)
      }
    } else {
      // we wait for the plugin to be added
      torrent.on('torrentPluginAdded', () => {
        if (torrent.handle.status().state === 3) {
          letsBuy(torrent)
        } else {
          torrent.on('state_changed_alert', waitingTorrentToDownload)
        }
      })
    }
  } else {
    console.error(err)
  }
})
