const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo
const _ = require('lodash')

console.log('====== Starting basic.js example ======')

// start a joystream session
var session = new Session()

let addTorrentParams = {
  ti: new TorrentInfo(__dirname + '/../../test/sintel.torrent'),
  path: __dirname
}

session.addTorrent(addTorrentParams, (err, torrent) => {
  if (!err) {
    console.log('====== Torrent Sintel Added ======')

    console.log(torrent)

    session.removeTorrent(torrent.handle.infoHash(), (err, result) => {
      if (!err) {
        console.log('====== Torrent Sintel Removed ======')
      } else {
        console.error(err)
      }
    })
  } else {
    console.error(err)
  }
})