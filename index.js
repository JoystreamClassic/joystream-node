var Session = require('./dist/Session')
var StateT = require('./dist/StateT')
var SPVWallet = require('./dist/SPVWallet')
var InnerStateTypeInfo = require('./dist/InnerStateTypeInfo')
var Libtorrent = require('bindings')('JoyStreamAddon').libtorrent

module.exports = {
  InnerStateTypeInfo,
  TorrentInfo: Libtorrent.TorrentInfo,
  Session,
  StateT,
  SPVWallet
}
