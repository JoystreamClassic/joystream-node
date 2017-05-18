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
    this.announcedJSPeersAtTimestamp = new Map()
    this.infoHash = handle.infoHash()

    // duplicating state.. not taking into account terms being changed
    this.terms = null
    this.mode = null
  }

  // Review needed !
  secondaryInfoHash () {
    var newInfoHash = this.infoHash + '_JS'
    return sha1(newInfoHash)
  }

  addJSPeerAtTimestamp (address, timestamp) {
    this.announcedJSPeersAtTimestamp.set(address, timestamp)
  }

  _onPeerConnected (endpoint) {
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
      this.emit('readyToBuyFrom', seller)
    })

    return peer
  }

  _onPeerDisconnected (endpoint) {
    const addr = endpoint.address + ':' + endpoint.key
    if (this.peers.has(addr)) {
      this.peers.delete(addr)
      this.emit('peer_removed', endpoint)
    }
  }

  _onPeerPluginAdded (endpoint, status) {
    const addr = endpoint.address + ':' + endpoint.key

    let peer

    if (!this.peers.has(addr)) {
      // We always see the peerplugin added alert before the peer connected alert
      peer = this._onPeerConnected(endpoint)
    } else {
      peer = this.peers.get(addr)
    }

    if (peer) {
      peer._onPeerPluginAdded(status)
      this.emit('peerPluginAdded', endpoint)
    }
  }

  _onPeerPluginStatusUpdate (status) {
    var peer = this.peers.get(status.endPoint.address + ':' + status.endPoint.key)
    if (peer) {
      peer._onPeerPluginStatusUpdate(status)
      this.emit('peerPluginStatusUpdateAlert', status)
    }
  }

  _onPeerPluginRemoved (endpoint) {
    const addr = endpoint.address + ':' + endpoint.key
    let peer = this.peers.get(addr)
    if (peer) {
      peer._onPeerPluginRemoved()
      this.emit('peerPluginRemoved', endpoint)
    }
  }

  _onResumeData (buff) {
    this.emit('resumedata', buff)
  }

  _onResumeDataFailed () {
    this.emit('error', new Error('resume data generation failed'))
  }

  _onMetaData (torrentInfo) {
    this.emit('metadata', torrentInfo)
  }

  _onRemoved () {
    // TODO: have the torrent cleanup and emit a signal that is was removed
    // set it's handle to null because the handle
    // doesn't point to an existing torrent anymore
  }

  _onFinished () {
    this.emit('finished')
  }

  _onStatusUpdate (status) {
    this.emit('status_update', status)

    // event for backwards compatibility
    this.emit('state_update_alert', status.state, status.progress)
  }

  _onStateChanged () {
    this.emit('state_changed')
  }

  _onResumed () {
    this.emit('resumed')
  }

  _onPaused () {
    this.emit('paused')
  }

  _onTorrentPluginStatusUpdate (status) {
    this.torrentPlugin.update(status)
  }

  _onConnectionAdded (endpoint, status) {
    const addr = endpoint.address + ':' + endpoint.key
    let peer = this.peers.get(addr)
    if (peer) {
      this.emit('connectionAdded', status)
    }
  }

  _onConnectionRemoved (endpoint) {
    const addr = endpoint.address + ':' + endpoint.key
    let peer = this.peers.get(addr)
    if (peer) {
      this.emit('connectionRemoved', endpoint)
    }
  }

  _onTorrentPluginAdded (torrentPluginStatus) {
    assert(!this.torrentPlugin)

    this.torrentPlugin = new TorrentPlugin(torrentPluginStatus, this.plugin, this.peers, this.infoHash)
    this.emit('torrentPluginAdded', this.torrentPlugin)
  }

  _onTorrentPluginRemoved () {
    assert(this.torrentPlugin)

    this.torrentPlugin = null
    this.emit('torrentPluginRemoved')
  }

  toSellMode (sellerTerms, callback = () => {}) {
    // Verify if torrentPlugin set
    if (!this.torrentPlugin) {
      return callback(new Error('TorrentPlugin not set for this torrent'), null)
    }

    // Verify torrent state
    if (!this.handle.status().state === StateT.SEEDING) {
      return callback(new Error('Torrent not in seeding state'), null)
    }

    this.torrentPlugin.toSellMode(sellerTerms, (err) => {
      if (!err) {
        this.terms = sellerTerms
        this.mode = 'sell'
      }
      callback(err)
    })
  }

  startSelling (connection, contractSk, finalPkHash, callback = () => {}) {
    this.plugin.start_uploading(this.infoHash, connection.endpoint, connection.announcedModeAndTermsFromPeer.buyer.terms, contractSk, finalPkHash, (err, result) => {
      callback(err, result)
    })
  }

  InvitedByBuyer (connection) {
    if (areTermsMatching(connection.announcedModeAndTermsFromPeer.buyer.terms, this.terms)) {
      this.emit('readyToSellTo', connection)
    }
  }

  toBuyMode (buyerTerms, callback = () => {}) {
    // Verify if torrentPlugin set
    if (!this.torrentPlugin) {
      return callback(new Error('TorrentPlugin not set for this torrent'), null)
    }

    // Verify torrent state
    if (!this.handle.status().state === StateT.DOWNLOADING) {
      return callback(new Error('Torrent not in downloading state'), null)
    }

    this.torrentPlugin.toBuyMode(buyerTerms, (err) => {
      if (!err) {
        this.terms = buyerTerms
        this.mode = 'buy'
      }
      callback(err)
    })
  }

  // Just go to buy mode
  toObserveMode (callback = () => {}) {
    // Verify if torrentPlugin set
    if (!this.torrentPlugin) {
      return callback(new Error('TorrentPlugin not set for this torrent'), null)
    }

    this.torrentPlugin.toObserveMode(callback)
  }

  startBuyingFromSeller (connection, contractSk, finalPkHash, valueLocked, asyncSign, callback = () => {}) {
    if (connection.innerState === InnerStateTypeInfo.PreparingContract) {
      let channels = new Map()

      channels.set(connection.endpoint, {
        buyerContractSk: contractSk,
        buyerFinalPkHash: finalPkHash,
        value: valueLocked
      })

      this.torrentPlugin.start_downloading(channels, asyncSign)
        .catch((error) => {
          console.error(error)
        })
    } else {
      callback(new Error('Not in Preparing Contract state'), null)
    }
  }

  setLibtorrentInteraction (mode, callback = () => {}) {
    this.plugin.set_libtorrent_interaction(this.infoHash, mode, callback)
  }
}

module.exports = Torrent
