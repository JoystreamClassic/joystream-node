const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo

console.log('====== Starting basic.js example ======')

// start a joystream session
var session = new Session({port: 6881})

let addTorrentParams = {
  ti: new TorrentInfo(__dirname + '/../../test/sintel.torrent'),
  path: __dirname
}

session.addTorrent(addTorrentParams, (err, torrent) => {
  if (!err) {
    console.log('====== Torrent Sintel Added ======')

    console.log(torrent)

    session.removeTorrent(torrent.infoHash, (err, result) => {
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
