var Session = require('./dist/Session')
var joystream = require('bindings')('JoyStreamAddon').joystream
var libtorrent = require('bindings')('JoyStreamAddon').libtorrent

module.exports = {
  // Libtorrent Interaction mode
  LibtorrentInteraction: joystream.LibtorrentInteraction,

  // Connection State
  InnerStateTypeInfo: joystream.InnerStateType,

  // Session Mode and State
  SESSION_MODE: joystream.SessionMode,
  SESSION_STATE: joystream.SessionState,
  BUYING_STATE: joystream.BuyingState,
  SELLING_STATE: joystream.SellingState,

  // Torrent State
  TORRENT_STATE: libtorrent.TorrentState,

  // Classes
  TorrentInfo: libtorrent.TorrentInfo,
  Session,

  // Payment channel, helper methods
  paymentChannel: {
    commitmentToOutput: joystream.commitmentToOutput
  }
}
