var Session = require('./dist/Session')
var StateT = require('./dist/StateT')
var Joystream = require('bindings')('JoyStreamAddon').joystream
var Libtorrent = require('bindings')('JoyStreamAddon').libtorrent

module.exports = {
  LibtorrentInteraction: Joystream.LibtorrentInteraction,
  InnerStateTypeInfo: Joystream.InnerStateType,
  TorrentInfo: Libtorrent.TorrentInfo,
  Session,
  StateT
}
