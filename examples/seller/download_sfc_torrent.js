'use strict'

const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo
const path = require('path')

const sfcTorrentPath = path.join(__dirname, '/../../test/sfc.torrent')
const sintelTorrentPath = path.join(__dirname, '/../../test/sintel.torrent')

var session = new Session({
  port: 6882
})

let addTorrentParams = {
  ti: new TorrentInfo(sfcTorrentPath),
  savePath: path.join(__dirname, '/downloads/')
}

session.addTorrent(addTorrentParams, (err, torrent) => {
  if (err) {
    console.log(err)
    process.exit()
  }

  console.log(torrent)

  // Wait for libtorrent state to be downloading
  waitForState(torrent, 3, function () {
    console.log('downloading torrent...')
  })

  waitForState(torrent, 5, function () {
    console.log('finished downloading torrent')
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
