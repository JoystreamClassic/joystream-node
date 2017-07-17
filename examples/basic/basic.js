const Session = require('../../').Session
const TorrentInfo = require('../../').TorrentInfo
const _ = require('lodash')

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

    torrent.on('state_changed', () => {

      var status = torrent.status()

      console.log(status)

      if (status.state === 5 || status.state === 3) {
        var havePiece = torrent.handle.havePiece(0)

        var torrentInfo = torrent.handle.torrentFile()
        console.log(torrentInfo)
        var fileStorage = torrentInfo.files()
        console.log(fileStorage.fileName(0))

        if (havePiece) {
          console.log('asking for piece !')
          torrent.handle.readPiece(0)
        }
      }
    })

    /*session.removeTorrent(torrent.infoHash, (err, result) => {
      if (!err) {
        console.log('====== Torrent Sintel Removed ======')
      } else {
        console.error(err)
      }
    })*/
  } else {
    console.error(err)
  }
})
