'use strict'

const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo
const path = require('path')
const areTermsMatching = require('../../lib/utils').areTermsMatching
const InnerStateTypeInfo = require('bindings')('JoyStreamAddon').joystream.InnerStateType

const torrentPath = path.join(__dirname, '/../../test/sfc.torrent')
const sintelTorrentPath = path.join(__dirname, '/../../test/sintel.torrent')

var sellerSession = new Session({
  port: 6882
})

let addTorrentParamsSeller = {
  ti: new TorrentInfo(torrentPath),
  savePath: path.join(__dirname, '/downloads/')
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
    if(status.connection.innerState !== InnerStateTypeInfo.Invited) continue

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

  torrent.setLibtorrentInteraction(3)

  waitForState(torrent, 5, function () {
    letsSell(torrent)
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
