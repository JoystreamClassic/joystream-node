'use strict'

const EventEmitter = require('events')
const PeerPlugin = require('./PeerPlugin')
const InnerStateTypeInfo = require('bindings')('JoyStreamAddon').joystream.InnerStateType

class Peer extends EventEmitter {

  constructor (info, status = null) {
    super()
    this.peerInformation = info
    this.peerPlugin = status ? new PeerPlugin(status) : null
    this.contractSent = false
  }

  /**
   * Add a new PeerPlugin to the Peer
   * @param {object} The peerPlugin status
   */
  addPeerPlugin (status) {
    this.peerPlugin = new PeerPlugin(this.torrent, status)
  }

  /**
   * remove the PeerPlugin
   * @param {object} The peerPlugin status
   */
  removePeerPlugin () {
    this.peerPlugin = null
  }

  /**
   * Listener for when a peerPlugin is updated.
   * @param {object} The connection
   */
  onPeerPluginUpdated (connection) {
    switch (connection.innerState) {
      case InnerStateTypeInfo.INVITED:
        this.emit('InvitedByBuyer', connection)
        break
      case InnerStateTypeInfo.PREPARING_CONTRACT:
        this.emit('PreparingContract', connection)
        break
    }
  }


  /**
   * Called everytime a joystream connection has been made.
   * @param {object} Connection
   */
  onConnection (connection) {
    this.peerPlugin.on('peerPluginStatusUpdateAlert', this.onPeerPluginUpdated.bind(this))
  }

}

module.exports = Peer
