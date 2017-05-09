'use strict'

var sha1 = require('sha1')
const EventEmitter = require('events')
var Peer = require('./Peer')
var TorrentPlugin = require('./TorrentPlugin')
const StateT = require('./StateT')
const InnerStateTypeInfo = require('bindings')('JoyStreamAddon').joystream.InnerStateType
var debug = require('debug')('torrent')
var _ = require('lodash')
var assert = require('assert')

import { areTermsMatching } from './utils'

class Torrent extends EventEmitter {

  constructor (handle, plugin) {
    super()
    this.handle = handle
    this.plugin = plugin
    this.torrentPlugin = null
    this.peers = new Map()
    this.terms = null
    this.announcedJSPeersAtTimestamp = new Map()
    this.infoHash = handle.infoHash()
  }

  // Review needed !
  secondaryInfoHash () {
    var newInfoHash = this.handle.infoHash() + '_JS'
    return sha1(newInfoHash)
  }

  addJSPeerAtTimestamp (address, timestamp) {
    this.announcedJSPeersAtTimestamp.set(address, timestamp)
  }

  onPeerConnected (endpoint) {
    const addr = endpoint.address + ':' + endpoint.key

    if (this.peers.has(addr)) return

    const peersInfo = this.handle.getPeerInfo()

    if(!_.find(peersInfo, (info) => _.isEqual(info.ip, endpoint))) return

    return this._addNewPeer(endpoint)
  }

  _addNewPeer (endpoint) {
    const peer = new Peer(endpoint)
    const addr = endpoint.address + ':' + endpoint.key

    this.peers.set(addr, peer)

    this.emit('peer_added', peer)

    peer.on('InvitedByBuyer', (buyer) => {
      this.InvitedByBuyer(buyer)
    })

    peer.on('PreparingContract', (seller) => {
      this.emit('readyToBuyTo', seller)
    })

    return peer
  }

  onPeerDisconnected (endpoint) {
    const addr = endpoint.address + ':' + endpoint.key
    if (this.peers.has(addr)) {
      this.peers.delete(addr)
      this.emit('peer_removed', endpoint)
    }
  }

  onPeerPluginAdded (endpoint, status) {
    const addr = endpoint.address + ':' + endpoint.key

    let peer

    if (!this.peers.has(addr)) {
      peer = this.onPeerConnected(endpoint)
    } else {
      peer = this.peers.get(addr)
    }

    if (peer) {
      peer.addPeerPlugin(status)
      this.emit('peerPluginAdded', endpoint)
    }
  }

  onPeerPluginStatusUpdate (status) {
    var peer = this.peers.get(status.endPoint.address + ':' + status.endPoint.key)
    if (peer) {
      peer.onPluginStatusUpdate(status)
    }
  }

  onPeerPluginRemoved (endpoint) {
    const addr = endpoint.address + ':' + endpoint.key
    let peer = this.peers.get(addr)
    if (peer) {
      peer.removePeerPlugin()
    }
  }

  onResumeData (buff) {
    this.emit('resumedata', buff)
  }

  onResumeDataFailed () {
    this.emit('error', new Error('resume data generation failed'))
  }

  onMetaData (torrentInfo) {
    this.emit('metadata', torrentInfo)
  }

  onRemoved () {
    // TODO: have the torrent cleanup and emit a signal that is was removed
    // set it's handle to null because the handle
    // doesn't point to an existing torrent anymore
  }

  onFinished () {
    this.emit('finished')
  }

  onStatusUpdate (status) {
    this.emit('status_update', status)

    // event for backwards compatibility
    this.emit('state_update_alert', status.state, status.progress)
  }

  onStateChanged () {
    this.emit('state_changed')
  }

  onResumed () {
    this.emit('resumed')
  }

  onPaused () {
    this.emit('paused')
  }

  onTorrentPluginStatusUpdate (status) {
    this.torrentPlugin.update(status)
  }

  onConnection (endpoint, status) {
    const addr = endpoint.address + ':' + endpoint.key
    let peer = this.peers.get(addr)
    if (peer) {
      this.emit('connectionAdded', status)
    }

  }

  onConnectionRemoved (endpoint) {
    const addr = endpoint.address + ':' + endpoint.key
    let peer = this.peers.get(addr)
    if (peer) {
      this.emit('connectionRemoved', endpoint)
    }
  }

  addTorrentPlugin (torrentPluginStatus) {
    assert (!this.torrentPlugin)

    this.torrentPlugin = new TorrentPlugin(torrentPluginStatus, this.plugin, this.peers, this.handle.infoHash())
    this.emit('torrentPluginAdded', this.torrentPlugin)
  }

  removeTorrentPlugin () {
    assert(this.torrentPlugin)

    this.torrentPlugin = null
    this.emit('torrentPluginRemoved')
  }

  toSellMode (sellerTerms, callback) {
    // Verify if torrentPlugin set
    if (this.torrentPlugin) {
      debug('TorrentPlugin set')
      // Verify torrent state
      if (this.handle.status().state === StateT.SEEDING) {
        debug('Torrent seeding')
        this.terms = sellerTerms
        this.torrentPlugin.to_sell_mode(sellerTerms, callback)
      } else {
        debug('Torrent not in seeding state')
        callback(new Error('Torrent not in seeding state'), null)
      }
    } else {
      debug('TorrentPlugin not set for this torrent')
      callback(new Error('TorrentPlugin not set for this torrent'), null)
    }
  }

  startSelling (connection, contractSk, finalPkHash, callback) {
    var infoHash = this.handle.infoHash()
    debug('Ok, calling start_uploading')
    this.plugin.start_uploading(infoHash, connection.endpoint, connection.announcedModeAndTermsFromPeer.buyer.terms, contractSk, finalPkHash, (err, result) => {
      callback(err, result)
    })
  }

  InvitedByBuyer (connection) {
    if (areTermsMatching(connection.announcedModeAndTermsFromPeer.buyer.terms, this.terms)) {
      this.emit('readyToSellTo', connection)
    }
  }

  toBuyMode (buyerTerms, callback) {
    var infoHash = this.handle.infoHash()

    if (this.torrentPlugin) {
      if (this.handle.status().state === StateT.DOWNLOADING) {
        this.plugin.to_buy_mode(infoHash, buyerTerms, (err, result) => {
          debug('IN BUYING MODE !')
          if (!err) {
            this.torrentMode = 'Buying'
            this.terms = buyerTerms

            this.plugin.start(infoHash, (err, result) => {
              if (!err) {
                debug('Plugin started')
                callback(err, result)
              } else {
                callback(err, result)
              }
            })
          } else {
            callback(err, result)
          }
        })
      } else {
        debug('Torrent not in downloading state')
        callback(new Error('Torrent not in downloading state'), null)
      }
    } else {
      debug('TorrentPlugin not set for this torrent')
      callback(new Error('TorrentPlugin not set for this torrent'), null)
    }
  }

  startBuyingFromSeller (connection, contractSk, finalPkHash, valueLocked, asyncSign, callback) {
    if (connection.innerState === InnerStateTypeInfo.PreparingContract) {
      let channel = new Map()
      channel.set(connection.endpoint, {
        buyerContractSk: contractSk,
        buyerFinalPkHash: finalPkHash,
        value: valueLocked
      })

      this.torrentPlugin.start_downloading(channel, asyncSign)
        .catch((error) => {
          console.error(error)
        })
    } else {
      callback(new Error('Not in Preparing Contract state'), null)
    }
  }

  observeTorrent (callback) {
    // var infoHash = this.handle.infoHash()
    /*
      TODO
    */
  }

  setLibtorrentInteraction (mode, callback = () => {}) {
    const infoHash = this.handle.infoHash()
    this.plugin.set_libtorrent_interaction(infoHash, mode, callback)
  }
}

module.exports = Torrent
