var Session = require('./dist/Session')
var joystream = require('bindings')('JoyStreamAddon').joystream
var libtorrent = require('bindings')('JoyStreamAddon').libtorrent

// Sanity check - ensure we are linking with expected core libraries
const linked = joystream.protocolVersion
const expected = 4
if (linked !== expected) {
  throw Error('Wrong Protocol Version linked. expected=v' + expected + ', linked=v' + linked)
}

module.exports = {
  // Connection Statemachine Protocol major version
  protocolVersion: joystream.protocolVersion,

  // Libtorrent Interaction mode
  LibtorrentInteraction: joystream.LibtorrentInteraction,

  // Connection State
  ConnectionInnerState: joystream.InnerStateType,

  // Session Mode and State
  SessionMode: joystream.SessionMode,
  SessionState: joystream.SessionState,
  BuyingState: joystream.BuyingState,
  SellingState: joystream.SellingState,

  // BEPSupport
  BEPSupportStatus: joystream.BEPSupportStatus,

  // Torrent State
  TorrentState: libtorrent.TorrentState,

  // Alerts
  LibtorrentAlertType: libtorrent.AlertType,
  LibtorrentAlertNotification: libtorrent.AlertNotification,

  // Classes
  TorrentInfo: libtorrent.TorrentInfo,
  Session: Session,

  // Payment channel, helper methods
  paymentChannel: {
    commitmentToOutput: joystream.commitmentToOutput
  }
}
