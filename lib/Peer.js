'use strict'

const EventEmitter = require('events')
const PeerPlugin = require('./PeerPlugin')
const InnerStateTypeInfo = require('bindings')('JoyStreamAddon').joystream.InnerStateType
const assert = require('assert')

class Peer extends EventEmitter {

  constructor (info, status = null) {
    super()
    this.peerInformation = info
    this.peerPlugin = null
    this.contractSent = false

    if(status != null)
        this.addPeerPlugin(status)
  }

  /**
   * Add a new PeerPlugin to the Peer
   * @param {object} The peerPlugin status
   */
  addPeerPlugin (status) {
    assert(this.peerPlugin == null)
    this.peerPlugin = new PeerPlugin(status)
    this.peerPlugin.on('connection', this.onConnection.bind(this))
  }

  /**
   * remove the PeerPlugin
   * @param {object} The peerPlugin status
   */
  removePeerPlugin () {
    assert(this.peerPlugin !== null)
    this.peerPlugin = null
  }

  /**
   * Listener for when a peerPlugin is updated.
   * @param {object} The connection
   */
  onConnection (connection) {
    switch (connection.innerState) {
      case InnerStateTypeInfo.Invited:
        this.emit('InvitedByBuyer', connection)
        break
      case InnerStateTypeInfo.PreparingContract:
        this.emit('PreparingContract', connection)
        break
    }
  }

}

module.exports = Peer
