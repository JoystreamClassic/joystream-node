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

  constructor (handle, resumeData, plugin) {
    super()
    this.handle = handle
    this.resumeData = resumeData
    this.plugin = plugin
    this.torrentPlugin = null
    this.intervalID = null
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

  addPeer (ip, peerPlugin = null) {
    var peersInfo = this.handle.getPeerInfo()

    if (!this.peers.has(ip.address + ':' + ip.key)) {
      for (var i in peersInfo) {
        // Should happen only once
        if (_.isEqual(peersInfo[i].ip, ip)) {
          var peer = new Peer(ip, this, peerPlugin)
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
      debug('Peer already added')
    }
  }

  removePeer (ip) {
    if (this.peers.has(ip.address + ':' + ip.key)) {
      this.peers.delete(ip.address + ':' + ip.key)
      this.emit('peerRemoved', ip)
    } else {
      debug('Not in peers list')
    }
  }

  setResumeDataGenerationResult (resumeData) {
    this.resumeData = resumeData
    this.emit('resume_data_generation_completed', resumeData)
  }

  addTorrentPlugin (torrentPluginStatus) {
    if (this.torrentPlugin) {
      debug('This torrent already have a torrentPlugin')
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
    var infoHash = this.handle.infoHash()

    // Verify if torrentPlugin set
    if (this.torrentPlugin) {
      debug('TorrentPlugin set')
      // Verify torrent state
      if (this.handle.status().state === StateT.SEEDING) {
        debug('Torrent seeding')
        this.plugin.to_sell_mode(infoHash, sellerTerms, (err, result) => {
          if (!err) {
            this.torrentMode = 'Selling'
            this.terms = sellerTerms

            this.plugin.start(infoHash, (err, result) => {
              if (!err) {
                debug('Plugin started')

                // Regularly request status alerts from peer plugins on this torrent
                this.intervalID = setInterval(() => {
                  this.plugin.post_peer_plugin_status_updates(infoHash)
                }, 1000)

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

                // Regularly request status alerts from peer plugins on this torrent
                this.intervalID = setInterval(() => {
                  this.plugin.post_peer_plugin_status_updates(infoHash)
                }, 1000)

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

  startBuying (connection, contractSk, finalPkHash, valueLocked, callback) {
    var infoHash = this.handle.infoHash()
    if (connection.innerState === InnerStateTypeInfo.PreparingContract) {
      let channel = new Map()
      channel.set(connection.endpoint, {
        buyerContractSk: contractSk,
        buyerFinalPkHash: finalPkHash,
        value: valueLocked
      })

      this.torrentPlugin.start_downloading(channel, (outputs, feeRate) => {
        //console.log(outputs, feeRate)
        let transaction = Buffer.from('01000000017b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3f00000000494830450221008949f0cb400094ad2b5eb399d59d01c14d73d8fe6e96df1a7150deb388ab8935022079656090d7f6bac4c9a94e0aad311a4268e082a725f8aeae0573fb12ff866a5f01ffffffff01f0ca052a010000001976a914cbc20a7664f2f69e5355aa427045bc15e7c6c77288ac00000000', 'hex')
        return Promise.resolve(transaction)
      }).catch((error) => {
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
}

module.exports = Torrent
