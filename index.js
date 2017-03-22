var Session = require('./dist/Session')
var StateT = require('./dist/StateT')
var SPVWallet = require('./dist/SPVWallet')
var Joystream = require('bindings')('JoyStreamAddon').joystream
var Libtorrent = require('bindings')('JoyStreamAddon').libtorrent

module.exports = {
  InnerStateTypeInfo: Joystream.InnerStateType,
  TorrentInfo: Libtorrent.TorrentInfo,
  Session,
  StateT,
  SPVWallet
}
