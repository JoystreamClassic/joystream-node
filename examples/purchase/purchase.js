'use strict'

const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo
const path = require('path')
const areTermsMatching = require('../../lib/utils').areTermsMatching
const ConnectionInnerState = require('../../').ConnectionInnerState
const TorrentState = require('../../').TorrentState
const LibtorrentInteraction = require('../../').LibtorrentInteraction

const sfcTorrentPath = path.join(__dirname, '/../../test/sfc.torrent')
const sintelTorrentPath = path.join(__dirname, '/../../test/sintel.torrent')

var buyerSession = new Session({
  port: 6881
})

let addTorrentParamsBuyer = {
  ti: new TorrentInfo(sintelTorrentPath),
  savePath: path.join(__dirname, '/buyer/')
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
    if (status.connection.innerState !== ConnectionInnerState.PreparingContract) {
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

  torrent.setLibtorrentInteraction(LibtorrentInteraction.BlockUploadingAndDownloading)

  // Wait for libtorrent state to be downloading
  waitForState(torrent, TorrentState.downloading, function () {
    letsBuy(torrent)
  })

  // Wait for libtorrent state to be seeding which means we already
  // have it and it doesn't make sense to try to buy it, or we completed downloading it
  waitForState(torrent, TorrentState.seeding, function () {
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

var sellerSession = new Session({
  port: 6882
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

  let lookingForBuyer = false

  let contractSk = Buffer.from('030589ee559348bd6a7325994f9c8eff12bd5d73cc683142bd0dd1a17abc99b0', 'hex')
  let finalPkHash = new Buffer(20)

  torrent.toSellMode(sellerTerms, (err, result) => {
    if (err) {
      return console.log(err)
    }

    torrent.startPlugin(function (err) {
      if(err) {
        return console.log(err)
      }

      console.log('We are in sell mode')
      lookingForBuyer = true
    })
  })

  // Wait for one suitable buyer and start uploading
  torrent.on('peerPluginStatusUpdates', function (peerStatuses) {
    if (!lookingForBuyer) return

    let connection = pickSuitableBuyer(peerStatuses, sellerTerms)

    if (!connection) return

    lookingForBuyer = false

    console.log('Found Suitable buyer', connection)

    const pid = connection.pid
    const buyerTerms = connection.announcedModeAndTermsFromPeer.buyer.terms

    torrent.startUploading(pid, buyerTerms, contractSk, finalPkHash, (err) => {
      if (err) {
        console.log('Failed to start uploading to buyer', err)
        lookingForBuyer = true
      } else {
        console.log('Started Selling To Buyer', connection)
      }
    })
  })
}

function pickSuitableBuyer (peerStatuses, sellerTerms) {
  for (var i in peerStatuses) {
    const status = peerStatuses[i]

    if(!status.connection) continue

    // Buyer must have invited us
    if(status.connection.innerState !== ConnectionInnerState.Invited) continue

    try {
      // lazy checking for buyer
      const buyerTerms = status.connection.announcedModeAndTermsFromPeer.buyer.terms
      if(areTermsMatching(buyerTerms, sellerTerms)){
        return status.connection
      }
    } catch (e) {}
  }

  return null
}

sellerSession.addTorrent(addTorrentParamsSeller, (err, torrent) => {
  if (err) {
    return console.log(err)
  }

  console.log(torrent)

  torrent.setLibtorrentInteraction(LibtorrentInteraction.BlockUploadingAndDownloading)

  waitForState(torrent, TorrentState.seeding, function () {
    letsSell(torrent)
  })
})
