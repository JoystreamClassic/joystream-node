'use strict'

const EventEmitter = require('events')

class PeerPlugin extends EventEmitter {

  constructor (status = null) {
    super()
    this.status = status
  }

  update (status) {
    this.status = status
    if(this.status.connection)
      this.emit('connection', this.status.connection)
  }

}

module.exports = PeerPlugin
