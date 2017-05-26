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

/* * * * * * * * * * *
 *
 *   DHT test
 *
 * * * * * * * * * * */

// Seller adding torrent and starting sell mode
sellerSession.addTorrent(addTorrentParamsSeller, (err, torrent) => {
  if (!err) {
    console.log('Torrent added to seller session')
  } else {
    console.error(err)
  }
})

/*buyerSession.addTorrent(addTorrentParamsBuyer, (err, torrent) => {
  // TODO : Find a better way to do that.
  if (!err) {
    console.log('Torrent added to buyer session')
  } else {
    console.error(err)
  }
})*/

setInterval(() => {
  console.log('DHT announce')

  for (var [secondaryInfoHash] of sellerSession.torrentsBySecondaryHash.entries()) {
    sellerSession.dhtAnnounce(secondaryInfoHash)
    sellerSession.dhtGetPeers(secondaryInfoHash)
  }

  /*for (var [secondaryInfoHash] of buyerSession.torrentsBySecondaryHash.entries()) {
    buyerSession.dhtAnnounce(secondaryInfoHash)
    buyerSession.dhtGetPeers(secondaryInfoHash)
  }*/
}, 5000)
