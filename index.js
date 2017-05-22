var Session = require('./dist/Session')
var StateT = require('./dist/StateT')
var Joystream = require('bindings')('JoyStreamAddon').joystream
var Libtorrent = require('bindings')('JoyStreamAddon').libtorrent
var commitmentToOutput = Joystream.commitmentToOutput
var SESSION_STATE = Joystream.SessionState
var SESSION_MODE = Joystream.SessionMode
var BUYING_STATE = Joystream.BuyingState
var SELLING_STATE = Joystream.SellingState

module.exports = {
  LibtorrentInteraction: Joystream.LibtorrentInteraction,
  InnerStateTypeInfo: Joystream.InnerStateType,
  SESSION_STATE,
  SESSION_MODE,
  BUYING_STATE,
  SELLING_STATE,
  TORRENT_STATE: StateT,
  TorrentInfo: Libtorrent.TorrentInfo,
  Session,
  StateT,
  PaymentChannel: {
    commitmentToOutput
  }
}
