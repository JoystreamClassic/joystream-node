'use strict'

const EventEmitter = require('events')

class PeerPlugin extends EventEmitter {

  constructor (status = null) {
    super()
    this.status = status
  }

  update (status) {
    this.status = status
    this.emit('peerPluginStatusUpdateAlert', this.status.connection)
  }

}

module.exports = PeerPlugin
