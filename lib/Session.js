'use strict'

var JoyStreamAddon = require('bindings')('JoyStreamAddon').joystream
var Libtorrent = require('bindings')('JoyStreamAddon').libtorrent
var debug = require('debug')
const EventEmitter = require('events')
const Torrent = require('./Torrent')

const _processDhtGetPeersReplyAlert = Symbol('processDhtGetPeersReplyAlert')
const _listenSucceededAlert = Symbol('listenSucceededAlert')
const _metadataReceivedAlert = Symbol('metadataReceivedAlert')
const _metadataFailedAlert = Symbol('metadataFailedAlert')
const _addTorrentAlert = Symbol('addTorrentAlert')
const _torrentFinishedAlert = Symbol('torrentFinishedAlert')
const _stateUpdateAlert = Symbol('stateUpdateAlert')
const _stateChangedAlert = Symbol('stateChangedAlert')
const _torrentRemovedAlert = Symbol('torrentRemovedAlert')
const _torrentResumedAlert = Symbol('torrentResumedAlert')
const _saveResumeDataAlert = Symbol('saveResumeDataAlert')
const _saveResumeDataFailedAlert = Symbol('saveResumeDataFailedAlert')
const _torrentPausedAlert = Symbol('torrentPausedAlert')
const _torrentCheckedAlert = Symbol('torrentCheckedAlert')
const _peerConnectAlert = Symbol('peerConnectAlert')
const _peerDisconnectedAlert = Symbol('peerDisconnectedAlert')
const _readPieceAlert = Symbol('readPieceAlert')
const _pieceFinishedAlert = Symbol('pieceFinishedAlert')
const _requestResult = Symbol('requestResult')
const _torrentPluginStatusUpdateAlert = Symbol('torrentPluginStatusUpdateAlert')
const _peerPluginStatusUpdateAlert = Symbol('peerPluginStatusUpdateAlert')
const _torrentPluginAdded = Symbol('torrentPluginAdded')
const _torrentPluginRemoved = Symbol('torrentPluginRemoved')
const _peerPluginAdded = Symbol('peerPluginAdded')
const _peerPluginRemoved = Symbol('peerPluginRemoved')
const _connectionAddedToSession = Symbol('connectionAddedToSession')
const _connectionRemovedFromSession = Symbol('connectionRemovedFromSession')
const _sessionStarted = Symbol('sessionStarted')
const _sessionStopped = Symbol('sessionStopped')
const _sessionPaused = Symbol('sessionPaused')
const _sessionToObserveMode = Symbol('sessionToObserveMode')
const _sessionToSellMode = Symbol('sessionToSellMode')
const _sessionToBuyMode = Symbol('sessionToBuyMode')
const _validPaymentReceived = Symbol('validPaymentReceived')
const _invalidPaymentReceived = Symbol('invalidPaymentReceived')
const _lastPaymentReceived = Symbol('lastPaymentReceived')
const _sellerTermsUpdated = Symbol('sellerTermsUpdated')
const _sentPayment = Symbol('sentPayment')
const _contractConstructed = Symbol('contractConstructed')
const _validPieceArrived = Symbol('validPieceArrived')
const _invalidPieceArrived = Symbol('invalidPieceArrived')
const _buyerTermsUpdated = Symbol('buyerTermsUpdated')
const _anchorAnnounced = Symbol('anchorAnnounced')

const minimumMessageId = 60

/*
 * Class Node
 * Manage the alerts and execute the differents request (add_torrent, buy_torrent,...)
 * TODO: File too big. The alerts process should go in another class.
 */

class Session extends EventEmitter {

  constructor (port) {
    super()
    this.session = new Libtorrent.Session(port)
    this.plugin = new JoyStreamAddon.Plugin(minimumMessageId)
    this.torrents = new Map()
    this.torrentsBySecondaryHash = new Map()

      // Add plugin to session
    this.session.addExtension(this.plugin)

      // Pop alerts every second
    setInterval(function () {
      var alerts = this.session.popAlerts()
      for (var i in alerts) {
        this.process(alerts[i])
      }
    }.bind(this), 1000)

    // Regularly request plugin and peer status alerts
    setInterval(() => {
      for (var [infoHash, torrent] of this.torrents.entries()) {
          this.plugin.post_torrent_plugin_status_updates(infoHash)
          this.plugin.post_peer_plugin_status_updates(infoHash)
      }
    }, 1000)
  }

    /* * * * * * * * * * * * *
     *
     *  Session methods
     *
     * * * * * * * * * * * * */

 /**
  * Get the port libtorrent is using.
  * @return {number}
  */
  listenPort () {
    return this.session.listenPort()
  }

 /**
  * Add a torrent to the joystream extension.
  * @param {addTorrentParams} Torrent to be added to the plugin.
  * @param {callback} Callback called after torrent added.
  */
  addTorrent (addTorrentParams, callback) {
    this.plugin.add_torrent(addTorrentParams, (err, torrentHandle) => {
      var torrent = this.torrents.get(torrentHandle.infoHash())
      if (torrent) {
        callback(err, torrent)
      } else {
        callback(new Error('Torrent not found'), null)
      }
    })
  }

 /**
  * Remove a torrent.
  * @param {infoHash} InfoHash of the torrent to be removed.
  * @param {callback} Callback called after torrent removed.
  */
  removeTorrent (infoHash, callback) {
    var torrent = this.torrents.get(infoHash)

    if (torrent) {
      this.plugin.remove_torrent(infoHash, (err, result) => {
        if (!err) {
          this.torrents.delete(infoHash)
          callback(err, result)
        }
      })
    } else {
      callback(new Error('Cannot remove torrent : Torrent not found'), null)
    }
  }

 /**
  * Pause the libtorrent session.
  * @param {callback} Callback called after plugin paused.
  */
  pauseLibtorrent (callback) {
    this.plugin.pause_libtorrent((err, result) => {
      if (!err) {
        callback(err, result)
      }
    })
  }

  generateSavedTorrents () {
      // Use levelDB instead ?
  }

    /* * * * * * * * * * *
     *
     *  Alerts
     *
     * * * * * * * * * * */
  process (alert) {
    switch (alert.type) {

        // dht_get_peers_reply_alert
      case Libtorrent.AlertType.dht_get_peers_reply_alert:
        this[_processDhtGetPeersReplyAlert](alert)
        break

        // listen_succeeded_alert
      case Libtorrent.AlertType.listen_succeeded_alert:
        this[_listenSucceededAlert](alert)
        break

        // metadata_received_alert
      case Libtorrent.AlertType.metadata_received_alert:
        this[_metadataReceivedAlert](alert)
        break

        // metadata_failed_alert
      case Libtorrent.AlertType.metadata_failed_alert:
        this[_metadataFailedAlert](alert)
        break

        // add_torrent_alert
      case Libtorrent.AlertType.add_torrent_alert:
        this[_addTorrentAlert](alert)
        break

        // torrent_finished_alert
      case Libtorrent.AlertType.torrent_finished_alert:
        this[_torrentFinishedAlert](alert)
        break

        // state_update_alert
      case Libtorrent.AlertType.state_update_alert:
        this[_stateUpdateAlert](alert)
        break

        // state_changed_alert
      case Libtorrent.AlertType.state_changed_alert:
        this[_stateChangedAlert](alert)
        break

        // torrent_removed_alert
      case Libtorrent.AlertType.torrent_removed_alert:
        this[_torrentRemovedAlert](alert)
        break

        // torrent_resumed_alert
      case Libtorrent.AlertType.torrent_resumed_alert:
        this[_torrentResumedAlert](alert)
        break

        // save_resume_data_alert
      case Libtorrent.AlertType.save_resume_data_alert:
        this[_saveResumeDataAlert](alert)
        break

        // save_resume_data_failed_alert
      case Libtorrent.AlertType.save_resume_data_failed_alert:
        this[_saveResumeDataFailedAlert](alert)
        break

        // torrent_paused_alert
      case Libtorrent.AlertType.torrent_paused_alert:
        this[_torrentPausedAlert](alert)
        break

        // torrent_checked_alert
      case Libtorrent.AlertType.torrent_checked_alert:
        this[_torrentCheckedAlert](alert)
        break

        // peer_connect_alert
      case Libtorrent.AlertType.peer_connect_alert:
        this[_peerConnectAlert](alert)
        break

        // peer_disconnected_alert
      case Libtorrent.AlertType.peer_disconnected_alert:
        this[_peerDisconnectedAlert](alert)
        break

        // read_piece_alert
      case Libtorrent.AlertType.read_piece_alert:
        this[_readPieceAlert](alert)
        break

        // piece_finished_alert
      case Libtorrent.AlertType.piece_finished_alert:
        this[_pieceFinishedAlert](alert)
        break

        // TorrentPluginStatusUpdateAlert
      case JoyStreamAddon.AlertType.TorrentPluginStatusUpdateAlert:
        this[_torrentPluginStatusUpdateAlert](alert)
        break

        // PeerPluginStatusUpdateAlert
      case JoyStreamAddon.AlertType.PeerPluginStatusUpdateAlert:
        this[_peerPluginStatusUpdateAlert](alert)
        break

        // RequestResult
      case JoyStreamAddon.AlertType.RequestResult:
        this[_requestResult](alert)
        break

        // TorrentPluginAdded
      case JoyStreamAddon.AlertType.TorrentPluginAdded:
        this[_torrentPluginAdded](alert)
        break

        // TorrentPluginRemoved
      case JoyStreamAddon.AlertType.TorrentPluginRemoved:
        this[_torrentPluginRemoved](alert)
        break

        // PeerPluginAdded
      case JoyStreamAddon.AlertType.PeerPluginAdded:
        this[_peerPluginAdded](alert)
        break

        // PeerPluginRemoved
      case JoyStreamAddon.AlertType.PeerPluginRemoved:
        this[_peerPluginRemoved](alert)
        break

        // ConnectionAddedToSession
      case JoyStreamAddon.AlertType.ConnectionAddedToSession:
        this[_connectionAddedToSession](alert)
        break

          // ConnectionRemovedFromSession
      case JoyStreamAddon.AlertType.ConnectionRemovedFromSession:
        this[_connectionRemovedFromSession](alert)
        break

        // SessionStarted
      case JoyStreamAddon.AlertType.SessionStarted:
        this[_sessionStarted](alert)
        break

        // SessionStopped
      case JoyStreamAddon.AlertType.SessionStopped:
        this[_sessionStopped](alert)
        break

        // SessionPaused
      case JoyStreamAddon.AlertType.SessionPaused:
        this[_sessionPaused](alert)
        break

        // SessionToObserveMode
      case JoyStreamAddon.AlertType.SessionToObserveMode:
        this[_sessionToObserveMode](alert)
        break

        // SessionToSellMode
      case JoyStreamAddon.AlertType.SessionToSellMode:
        this[_sessionToSellMode](alert)
        break

        // SessionToBuyMode
      case JoyStreamAddon.AlertType.SessionToBuyMode:
        this[_sessionToBuyMode](alert)
        break

        // ValidPaymentReceived
      case JoyStreamAddon.AlertType.ValidPaymentReceived:
        this[_validPaymentReceived](alert)
        break

        // InvalidPaymentReceived
      case JoyStreamAddon.AlertType.InvalidPaymentReceived:
        this[_invalidPaymentReceived](alert)
        break

        // LastPaymentReceived
      case JoyStreamAddon.AlertType.LastPaymentReceived:
        this[_lastPaymentReceived](alert)
        break

        // SellerTermsUpdated
      case JoyStreamAddon.AlertType.SellerTermsUpdated:
        this[_sellerTermsUpdated](alert)
        break

        // SentPayment
      case JoyStreamAddon.AlertType.SentPayment:
        this[_sentPayment](alert)
        break

        // ContractConstructed
      case JoyStreamAddon.AlertType.ContractConstructed:
        this[_contractConstructed](alert)
        break

        // ValidPieceArrived
      case JoyStreamAddon.AlertType.ValidPieceArrived:
        this[_validPieceArrived](alert)
        break

        // InvalidPieceArrived
      case JoyStreamAddon.AlertType.InvalidPieceArrived:
        this[_invalidPieceArrived](alert)
        break

        // BuyerTermsUpdated
      case JoyStreamAddon.AlertType.BuyerTermsUpdated:
        this[_buyerTermsUpdated](alert)
        break

        // AnchorAnnounced
      case JoyStreamAddon.AlertType.AnchorAnnounced:
        this[_anchorAnnounced](alert)
        break

      default:
        break
    }
  }

    /*
     * Private Method
     */

  [_processDhtGetPeersReplyAlert] (alert) {
    var alertDebug = debug('session:processDhtGetPeersReplyAlert')
    var torrentSecondaryHash = this.torrentsBySecondaryHash.get(alert.infoHash)
    var torrent = this.torrents.get(torrentSecondaryHash)
    if (torrent) {
      var timestamp = Date.now()
      var peers = alert.peers
      for (var i in peers) {
        torrent.addJSPeerAtTimestamp(peers[i].address, timestamp)
        torrent.handle.connectPeer(peers[i])
        alertDebug('Connection added by DHT')
      }
    } else {
      alertDebug('Torrent with secondaryInfoHash ' + alert.infoHash + ' not found')
    }
  }

  [_listenSucceededAlert] (alert) {
    var endpoint = alert.endpoint
    this.emit('listen_succeeded_alert', endpoint)
  }

  [_metadataReceivedAlert] (alert) {
    var alertDebug = debug('session:metadataReceivedAlert')
    var torrentHandle = alert.handle
    var torrentInfo = torrentHandle.torrentFile()
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrentInfo && torrent) {
      alertDebug('Received Metadata for torrent')
      torrent.emit('metadata_received_alert', torrentInfo)
    }
  }

  [_metadataFailedAlert] (alert) {
    // what to do?
    var alertDebug = debug('session:metadataFailedAlert')
    alertDebug('Failed to get metadata...')
  }

  [_addTorrentAlert] (alert) {
    var alertDebug = debug('session:addTorrentAlert')
    if (!alert.error) {
      var torrentHandle = alert.handle
      var resumeData = alert.addTorrentParams.resumeData

      var torrent = this.torrents.get(torrentHandle.infoHash())
        // Verify if torrent not already in torrents list
      if (!torrent) {
        var newTorrent = new Torrent(torrentHandle,
                                    resumeData,
                                    this.plugin)

          // Add torrent to torrents map
        this.torrents.set(torrentHandle.infoHash(), newTorrent)

          // DHT stuff
        this.torrentsBySecondaryHash.set(newTorrent.secondaryInfoHash(), torrentHandle.infoHash())
        this.session.dhtAnnounce(newTorrent.secondaryInfoHash(), this.session.listenPort)
      } else {
        torrent.resumeData = resumeData
      }
      alertDebug('Adding torrent succeeded.')
    } else {
      // Need error wrapper for message
      alertDebug('Adding torrent failed:')
    }
  }

  [_torrentFinishedAlert] (alert) {
    var alertDebug = debug('session:torrentFinishedAlert')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
      torrent.emit('torrent_finished_alert')
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_stateUpdateAlert] (alert) {
    var alertDebug = debug('session:stateUpdateAlert')

    var status = alert.status

    for (var i in status) {
      var torrent = this.torrents.get(status[i].infoHash)

      if (torrent) {
        torrent.emit('state_update_alert', status[i].state, status[i].progress)
      } else {
        alertDebug('Torrent not found !')
      }
    }
  }

  [_stateChangedAlert] (alert) {
    var alertDebug = debug('session:stateChangedAlert')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
      torrent.emit('state_changed_alert')
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_torrentRemovedAlert] (alert) {
    /*
     * NOTICE: Docs say p->handle may be invalid at this time - likely because this is a removal operation,
     * so we must use p->info_hash instead.
     */
    var alertDebug = debug('session:torrentRemovedAlert')
    var torrent = this.torrents.get(alert.infoHash)

    if (torrent) {
      torrent.emit('torrent_removed_alert')
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_torrentResumedAlert] (alert) {
    var alertDebug = debug('session:torrentResumedAlert')

    var infoHash = alert.handle.infoHash()
    var torrent = this.torrents.get(infoHash)

    if (torrent) {
        // emit alert that the torrent has been resumed
      alertDebug('Torrent resumed')
      torrent.emit('torrent_resumed_alert')
    } else {
      var err = 'Cannot find torrent to resume'
      alertDebug(err)
      throw new Error(err)
    }
  }

  [_saveResumeDataAlert] (alert) {
    var alertDebug = debug('session:saveResumeDataAlert')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
      var resumeData = Libtorrent.BEncode(alert.resumeData)
      torrent.setResumeDataGenerationResult(resumeData)
    } else {
      alertDebug('Torrent not found !')
    }
  }

  [_saveResumeDataFailedAlert] (alert) {
    var alertDebug = debug('session:saveResumeDataFailedAlert')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
        // Save empty resume data in torrent, is required
        // to trigger event signal
      var resumeData = ''
      torrent.setResumeDataGenerationResult(resumeData)
    } else {
      alertDebug('Torrent not found !')
    }
  }

  [_torrentPausedAlert] (alert) {
    var alertDebug = debug('session:torrentPausedAlert')

    var infoHash = alert.handle.infoHash()
    var torrent = this.torrents.get(infoHash)

      /* Need to verify if is_all_zero() ?
       * If all_zero torrent not find so probably not
       */

    if (torrent) {
        // emit alert that the torrent has been paused
      alertDebug('Torrent paused')
      torrent.emit('torrent_paused_alert')
    } else {
      var err = 'Cannot find torrent to pause'
      alertDebug(err)
      throw new Error(err)
    }
  }

  [_torrentCheckedAlert] (alert) {
    // Nothing to do ?
  }

  [_peerConnectAlert] (alert) {
    var alertDebug = debug('session:peerConnectAlert')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
      torrent.addPeer(alert.ip)
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_peerDisconnectedAlert] (alert) {
    var alertDebug = debug('session:peerDisconnectedAlert')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
      torrent.removePeer(alert.ip)
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_readPieceAlert] (alert) {
    // Nothing todo here ?
    var alertDebug = debug('session:readPieceAlert')
    alertDebug('Piece read')
  }

  [_pieceFinishedAlert] (alert) {
    // Nothing to do here ?
  }

  [_requestResult] (alert) {
    alert.run()
  }

  [_torrentPluginStatusUpdateAlert] (alert) {
    var alertDebug = debug('session:torrentPluginStatusUpdateAlert')

    for (var status of alert.statuses) {
      var torrent = this.torrents.get(status.infoHash)
      if (torrent) {
        torrent.torrentPlugin.update(status)
      } else {
        throw new Error('Torrent not found')
      }
    }
    alertDebug('TorrentPlugin status updated')
    // this.emit('TorrentPluginStatusUpdateAlert', statuses)
  }

  [_peerPluginStatusUpdateAlert] (alert) {
    var alertDebug = debug('session:peerPluginStatusUpdateAlert')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())
    var statuses = alert.statuses

    if (torrent) {
      if (!torrent.plugin) {
        alertDebug('No plugin find')
      } else {
        for (var status of statuses) {
          var peer = torrent.peers.get(status.endPoint.address + ':' + status.endPoint.key)
          if (peer) {
            if (peer.peerPlugin) {
              peer.peerPlugin.update(status)
            } else {
              throw new Error('No peer Plugin !')
            }
          } else {
            alertDebug('Peer not found !')
          }
        }
      }
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_torrentPluginAdded] (alert) {
    var alertDebug = debug('session:torrentPluginAdded')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
      alertDebug('Torrent already created')
    } else {
      torrent = new Torrent(torrentHandle, '', this.plugin)
      this.torrents.set(torrentHandle.infoHash(), torrent)
    }
    torrent.addTorrentPlugin(alert.status)
  }

  [_torrentPluginRemoved] (alert) {
    var alertDebug = debug('session:torrentPluginRemoved')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    if (torrent) {
      if (torrent.torrentPlugin) {
        torrent.removeTorrentPlugin()
      }
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_peerPluginAdded] (alert) {
    var alertDebug = debug('session:peerPluginAdded')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())
    var peer = torrent.peers.get(alert.ip.address + ':' + alert.ip.key)

    if (torrent) {
      if (peer) {
        if (!peer.peerPlugin) {
          peer.addPeerPlugin(alert.status)
          torrent.emit('peerPluginAdded', alert.ip)
        } else {
          alertDebug('PeerPlugin already initialized')
        }
      } else {
        alertDebug('Peer not found ! We create peer')
        // var peersInfo = torrentHandle.getPeerInfo()
        torrent.addPeer(alert.ip, alert.status)
        torrent.emit('peerPluginAdded', alert.ip)
      }
    } else {
      alertDebug('Torrent not found')
    }
  }

  [_peerPluginRemoved] (alert) {
    var alertDebug = debug('session:peerPluginRemoved')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())
    var peer = torrent.peers.get(alert.ip.address + ':' + alert.ip.key)

    if (peer) {
      if (!peer.peerPlugin) {
        peer.removePeerPlugin()
      } else {
        alertDebug('PeerPlugin already removed')
      }
    } else {
      alertDebug('Peer not found !')
    }
  }

  [_connectionAddedToSession] (alert) {
    var alertDebug = debug('session:connectionAddedToSession')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())
    var peer = torrent.peers.get(alert.ip.address + ':' + alert.ip.key)

    if (peer) {
      alertDebug('Connection Added to Session')
      peer.onConnection(alert.status)
    }
  }

  [_connectionRemovedFromSession] (alert) {
    var alertDebug = debug('session:connectionRemovedFromSession')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())
    var peer = torrent.peers.get(alert.ip.address + ':' + alert.ip.key)

    if (peer) {
      alertDebug('Connection Removed from Session')
      torrent.emit('connectionRemoved')
    }
  }

  [_sessionStarted] (alert) {
    var alertDebug = debug('session:sessionStarted')

    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    alertDebug('SessionStarted !')

    torrent.torrentPlugin.emit('sessionStarted')
  }

  [_sessionPaused] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('sessionPause')
  }

  [_sessionStopped] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('sessionStopped')
  }

  [_sessionToObserveMode] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('sessionToObserveMode')
  }

  [_sessionToSellMode] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('SessionToSellMode', alert)
  }

  [_sessionToBuyMode] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('SessionToBuyMode', alert)
  }

  [_validPaymentReceived] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('validPaymentReceived', alert)
  }

  [_invalidPaymentReceived] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('invalidPaymentReceived', alert)
  }

  [_buyerTermsUpdated] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('buyerTermsUpdated', alert)
  }

  [_sellerTermsUpdated] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('sellerTermsUpdated', alert)
  }

  [_contractConstructed] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('contractConstructed', alert)
  }

  [_sentPayment] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('sentPayment', alert)
  }

  [_lastPaymentReceived] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('lastPaymentReceived', alert)
  }

  [_invalidPieceArrived] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('invalidPieceArrived', alert)
  }

  [_validPieceArrived] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('validPieceArrived', alert)
  }

  [_anchorAnnounced] (alert) {
    var torrentHandle = alert.handle
    var torrent = this.torrents.get(torrentHandle.infoHash())

    torrent.emit('AnchorAnnounced', alert)
  }
}

module.exports = Session
