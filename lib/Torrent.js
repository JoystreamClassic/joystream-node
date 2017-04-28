'use strict'

var sha1 = require('sha1')
const EventEmitter = require('events')
var Peer = require('./Peer')
var TorrentPlugin = require('./TorrentPlugin')
const StateT = require('./StateT')
const InnerStateTypeInfo = require('bindings')('JoyStreamAddon').joystream.InnerStateType
var debug = require('debug')('torrent')
var _ = require('lodash')
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
  }

  // Review needed !
  secondaryInfoHash () {
    var newInfoHash = this.handle.infoHash() + '_JS'
    return sha1(newInfoHash)
  }

  addJSPeerAtTimestamp (address, timestamp) {
    this.announcedJSPeersAtTimestamp.set(address, timestamp)
  }

  addPeer (ip, peerPluginStatus = null) {
    var peersInfo = this.handle.getPeerInfo()

    if (!this.peers.has(ip.address + ':' + ip.key)) {
      for (var i in peersInfo) {
        // Should happen only once
        if (_.isEqual(peersInfo[i].ip, ip)) {
          var peer = new Peer(ip, peerPluginStatus)
          this.peers.set(ip.address + ':' + ip.key, peer)
          this.emit('peerAdded', peer)
          peer.on('InvitedByBuyer', (buyer) => {
            this.InvitedByBuyer(buyer)
          })
          peer.on('PreparingContract', (seller) => {
            this.emit('readyToBuyTo', seller)
          })
        }
      }
    } else {
      //debug('Peer already added')
    }
  }

  removePeer (ip) {
    if (this.peers.has(ip.address + ':' + ip.key)) {
      this.peers.delete(ip.address + ':' + ip.key)
      this.emit('peerRemoved', ip)
    } else {
      //debug('Not in peers list')
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

  addTorrentPlugin (torrentPluginStatus) {
    if (this.torrentPlugin) {
      //debug('This torrent already have a torrentPlugin')
    } else {
      this.torrentPlugin = new TorrentPlugin(torrentPluginStatus, this.plugin, this.peers, this.handle.infoHash())
      this.emit('torrentPluginAdded', this.torrentPlugin)
    }
  }

  removeTorrentPlugin () {
    if (this.torrentPlugin) {
      this.torrentPlugin = null
      this.emit('torrentPluginRemoved')
    } else {
      debug('Cannot remove torrentPlugin because undefined')
    }
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

  setLibtorrentInteraction (mode) {
    const infoHash = this.handle.infoHash()
    this.plugin.set_libtorrent_interaction(infoHash, mode, () => {
      console.log('Set LibtorrentInteraction to ', mode)
    })
  }
}

module.exports = Torrent
