'use strict'

const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo
const path = require('path')
const areTermsMatching = require('../../lib/utils').areTermsMatching
const InnerStateTypeInfo = require('bindings')('JoyStreamAddon').joystream.InnerStateType

const torrentPath = path.join(__dirname, '/../../test/sfc.torrent')
const sintelTorrentPath = path.join(__dirname, '/../../test/sintel.torrent')

var buyerSession = new Session({
  port: 6881
})

let addTorrentParamsBuyer = {
  ti: new TorrentInfo(torrentPath),
  savePath: path.join(__dirname, '/downloads/')
}

function letsBuy (torrent) {
  console.log('torrent in downloading state, going to buy mode')
  //  100, 5, 1, 20000
  const buyerTerms = {
    maxPrice: 100,
    maxLock: 5,
    minNumberOfSellers: 1,
    maxContractFeePerKb: 20000
  }

  let lookingForSeller = false

  torrent.toBuyMode(buyerTerms, (err) => {
    if (err) {
      return console.log(err)
    }

    torrent.startPlugin(function (err) {
      if(err) {
        return console.log(err)
      }

      console.log('We are in buying mode')
      lookingForSeller = true
    })
  })

  // Wait for one suitable seller and start downloading
  torrent.on('peerPluginStatusUpdates', function (peerStatuses) {
    if (!lookingForSeller) return

    console.log('looking for seller')

    const connection = pickSuitableSeller(peerStatuses, buyerTerms)

    if (!connection) return

    console.log('found a suitable seller', connection)

    // Stop looking for seller
    lookingForSeller = false

    const pid = connection.pid
    const sellerTerms = connection.announcedModeAndTermsFromPeer.seller.terms

    let setup = makeContractAndDownloadInfoMap(pid, sellerTerms)

    torrent.startDownloading(setup.contract, setup.map, function (err) {
      if (err) {
        console.log(err)
        lookingForSeller = true
        return
      }
      console.log('Started Downloading From Seller')
    })
  })
}

function makeContractAndDownloadInfoMap (pid, sellerTerms) {
  // Fake contract
  const contract = Buffer.from('01000000017b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3f00000000494830450221008949f0cb400094ad2b5eb399d59d01c14d73d8fe6e96df1a7150deb388ab8935022079656090d7f6bac4c9a94e0aad311a4268e082a725f8aeae0573fb12ff866a5f01ffffffff01f0ca052a010000001976a914cbc20a7664f2f69e5355aa427045bc15e7c6c77288ac00000000', 'hex')

  // Download info map for one seller
  const map = new Map()

  map.set(pid, {
    index: 0,
    value: 100000,
    sellerTerms: sellerTerms,
    buyerContractSk: Buffer.from('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20', 'hex'),
    buyerFinalPkHash: new Buffer(20)
  })

  return {contract, map}
}

function pickSuitableSeller (peerStatuses, buyerTerms) {
  for (var i in peerStatuses) {
    const status = peerStatuses[i]

    if (!status.connection) continue

    //console.log(status.connection.announcedModeAndTermsFromPeer)

    // connection must be in PerparingContract state
    if (status.connection.innerState !== InnerStateTypeInfo.PreparingContract) {
      console.log('not in preparing contract status')
      continue
    }

    try {
      // lazy checking for seller, if peer is not a seller this will throw..
      const sellerTerms = status.connection.announcedModeAndTermsFromPeer.seller.terms
      console.log(sellerTerms)
      if (areTermsMatching(buyerTerms, sellerTerms)) {
        return status.connection
      }

    } catch (e) { console.log(e) }
  }

  return null
}

buyerSession.addTorrent(addTorrentParamsBuyer, (err, torrent) => {
  if (err) {
    return console.log(err)
  }

  console.log(torrent)

  torrent.setLibtorrentInteraction(3)

  // Wait for libtorrent state to be downloading
  waitForState(torrent, 3, function () {
    letsBuy(torrent)
  })

  // Wait for libtorrent state to be seeding which means we already
  // have it and it doesn't make sense to try to buy it, or we completed downloading it
  waitForState(torrent, 5, function () {
    console.log('Torrent downloaded, exiting')
    process.exit()
  })
})

function waitForState (torrent, targetState, callback) {
  function checkState () {
    if (torrent.status().state === targetState) {
      torrent.removeListener('state_changed', checkState)
      callback()
    }
  }

  if (torrent.status().state === targetState) {
    callback()
  } else {
    torrent.on('state_changed', checkState)
  }
}
