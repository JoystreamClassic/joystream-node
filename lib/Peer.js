'use strict'

const EventEmitter = require('events')
const PeerPlugin = require('./PeerPlugin')
const InnerStateTypeInfo = require('bindings')('JoyStreamAddon').joystream.InnerStateType
const assert = require('assert')

class Peer extends EventEmitter {

  constructor (info) {
    super()
    this.peerInformation = info
    this.peerPlugin = null
    this.contractSent = false
  }

  /**
   * Add a new PeerPlugin to the Peer
   * @param {object} The peerPlugin status
   */
  _onPeerPluginAdded (status) {
    assert(this.peerPlugin == null)
    this.peerPlugin = new PeerPlugin(status)
    this.peerPlugin.on('connection', this.onConnection.bind(this))
  }

  /**
   * remove the PeerPlugin
   * @param {object} The peerPlugin status
   */
  _onPeerPluginRemoved () {
    assert(this.peerPlugin !== null)
    this.peerPlugin = null
  }

  _onPeerPluginStatusUpdate (status) {
    if (this.peerPlugin) {
      this.peerPlugin.update(status)
    }
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
