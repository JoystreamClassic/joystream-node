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
    })
  })

  let buyers = new Map()

  // start uploading to matching buyers
  torrent.on('peerPluginStatusUpdates', function (peerStatuses) {
    console.log(peerStatuses.length, "connections")
    let connections = pickSuitableBuyers(peerStatuses, sellerTerms)

    if (!connections.length) return

    connections.forEach((connection) => {
      const pid = connection.pid
      if (buyers.has(pid)) return
      buyers.set(pid, true)
      const buyerTerms = connection.announcedModeAndTermsFromPeer.buyer.terms

      torrent.startUploading(pid, buyerTerms, contractSk, finalPkHash, (err) => {
        if (err) {
          console.log('Failed to start uploading to buyer', err)
          buyers.delete(pid)
        } else {
          console.log('Started Selling To Buyer', connection)
        }
      })
    })
  })

  // start uploading again to a peer if they leave
  torrent.on('connectionRemoved', (pid) => buyers.delete(pid))
}

function pickSuitableBuyers (peerStatuses, sellerTerms) {
  var suitableBuyers = []

  for (var i in peerStatuses) {
    const status = peerStatuses[i]

    if(!status.connection) continue

    // Buyer must have invited us
    if(status.connection.innerState !== InnerStateTypeInfo.Invited) continue

    try {
      // lazy checking for buyer
      const buyerTerms = status.connection.announcedModeAndTermsFromPeer.buyer.terms
      if (areTermsMatching(buyerTerms, sellerTerms)) {
        suitableBuyers.push(status.connection)
      }
    } catch (e) {}
  }

  return suitableBuyers
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
