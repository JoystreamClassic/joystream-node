/* global it, describe */
var lib = require('../')
var assert = require('assert')

// Test AddTorrentParams
const TORRENTS = {
  file: {
    ti: new lib.TorrentInfo(__dirname + '/sintel.torrent'),
    savePath: __dirname,
    paused: true
  },

  magnet: {
    url: 'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.webtorrent.io&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel-1024-surround.mp4',
    savePath: __dirname,
    paused: true
  },

  infohash:{
    infoHash: '6a9759bffd5c0af65319979fb7832189f4f3c35d',
    name: 'sintel.mp4',
    savePath: __dirname,
    paused: true
  }
}

describe('Session', function () {
  // default 2s is not enough for most of the operations we are testing
  // which make take multiple pop alert intervals to complete.
  this.timeout(5000)

  var session;

  before(function () {
    session = new lib.Session({
      libtorrent_settings: {
        listen_interfaces: '127.0.0.1:6881',
        peer_fingerprint: {
          name: 'JS',
          major: 1,
          minor: 0,
          revision: 5,
          tag: 0
        }
      },
      network: 'testnet3'
    })
  })

  // start with empty session before each testcase
  beforeEach(function (done) {
    var callbacks = []

    // remove all torrents
    for (var [infoHash] of session.torrents.entries()) {
      callbacks.push(new Promise(function (resolve) {
        session.removeTorrent(infoHash, resolve)
      }))
    }

    // Wait for all callacks to be called
    Promise.all(callbacks).then(function () {
      done()
    })
  })

  describe('Adding torrents', function () {

    it('Add torrent with torrent info file', function (done) {
      session.addTorrent(TORRENTS.file, (err, torrent) => {
        assert(!err)
        done()
      })
    })

    it('Add torrent with magnet url', function (done) {
      session.addTorrent(TORRENTS.magnet, (err, torrent) => {
        assert(!err)
        assert(torrent.infoHash === '6a9759bffd5c0af65319979fb7832189f4f3c35d')
        done()
      })
    })

    it('Add torrent with info_hash', function (done) {
      session.addTorrent(TORRENTS.infohash, (err, torrent) => {
        assert(!err)
        done()
      })
    })

    it('torrentsBySecondaryHash map updated', function (done) {
      session.addTorrent(TORRENTS.infohash, (err, torrent) => {
        assert(session.torrentsBySecondaryHash.has(torrent.secondaryInfoHash))
        done()
      })
    })
  })

  describe('Removing torrent from plugin', function () {
    it('Remove torrent', function (done) {
      session.addTorrent(TORRENTS.infohash, (err, torrent) => {
        session.removeTorrent(torrent.infoHash, (err, result) => {
          assert(!err)
          assert(!session.torrents.has(torrent.infoHash))
          done()
        })
      })
    })

    it('torrentsBySecondaryHash map updated after removed', function (done) {
      session.addTorrent(TORRENTS.infohash, (err, torrent) => {
        assert(!err)
        session.removeTorrent(torrent.infoHash, (err, result) => {
          assert(!err)
          assert(!session.torrents.has(torrent.infoHash))
          assert(!session.torrentsBySecondaryHash.has(torrent.secondaryInfoHash))
          done()
        })
      })
    })
  })
})
