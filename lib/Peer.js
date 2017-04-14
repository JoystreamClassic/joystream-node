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

    // we bind this so we can pass this Peer object when emitting event
    this.onConnection = this.onConnection.bind(this)

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
  // We should verify connection but instead get Peer object and check it
  onConnection (connection) {
    switch (connection.innerState) {
      case InnerStateTypeInfo.Invited:
        this.emit('InvitedByBuyer', this)
        break
      case InnerStateTypeInfo.PreparingContract:
        this.emit('PreparingContract', this)
        break
    }
  }

}

module.exports = Peer
