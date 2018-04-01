'use strict'

var JoyStreamAddon = require('bindings')('JoyStreamAddon').joystream
var Libtorrent = require('bindings')('JoyStreamAddon').libtorrent
var debug = require('debug')
const EventEmitter = require('events')
const Torrent = require('./Torrent')
const assert = require('assert')

const minimumMessageId = 60
const popAlertInterval = 100 // 100ms
const statusUpdateInterval = 1000 // 1 second
const DHTAnnounceInterval = 2 * 60 * 1000 // 2 minutes
const DHTGetPeersInterval = 30 * 1000 // 30 seconds

function isEmptyInfoHash (infoHash) {
  return infoHash === '0000000000000000000000000000000000000000' // 20-bytes (160-bit) all zeros info_hash
}

/*
 * Class Node
 * Manage the alerts and execute the differents request (add_torrent, buy_torrent,...)
 * TODO: File too big. The alerts process should go in another class.
 */

class Session extends EventEmitter {

  constructor ({libtorrent_settings, assistedPeerDiscovery = true, network}) {
    // Network must be explicitly supplied
    if (typeof network !== 'string') {
      throw new Error('network not specified')
    }

    super()
    this._assistedPeerDiscovery = assistedPeerDiscovery
    this._externalUdpPort = 0
    this.session = new Libtorrent.Session(libtorrent_settings)

    this.plugin = new JoyStreamAddon.Plugin(minimumMessageId, network)
    this.torrents = new Map()
    this.torrentsBySecondaryHash = new Map()

      // Add plugin to session
    this.session.addExtension(this.plugin)

    // Process alerts at regular interval
    setInterval(() => {
      // Pop alerts
      var alerts = this.session.popAlerts()

      if (alerts.length > 4900) {
        console.log('== Warning: alert queue limit almost reached in last pop alerts interval', alerts.length)
      }

      // Process alerts
      for (var i in alerts) {
        this.process(alerts[i])
      }
    }, popAlertInterval)

    // Request plugin and peer status updates at regular interval
    setInterval(() => {
      for (var [infoHash] of this.torrents.entries()) {
          this.plugin.post_torrent_plugin_status_updates(infoHash)
          this.plugin.post_peer_plugin_status_updates(infoHash)
      }
    }, statusUpdateInterval)

    // DHT routines for secondary info hash. It will improve finding joystream client
    // or a specific info hash.
    if (assistedPeerDiscovery) {
      // The first callback will not occur until the first interval, so make sure to make an announcement
      // and request for peers when the torrent is first added
      setInterval(() => {
        this._forEachSecondaryHash(this.dhtAnnounce.bind(this))
      }, DHTAnnounceInterval)

      setInterval(() => {
        this._forEachSecondaryHash(this.dhtGetPeers.bind(this))
      }, DHTGetPeersInterval)
    }

  }

  _forEachSecondaryHash (func) {
    if (typeof func === 'function') {
      for (var [secondaryInfoHash] of this.torrentsBySecondaryHash.entries()) {
        func(secondaryInfoHash)
      }
    }
  }

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
  addTorrent (addTorrentParams, callback = () => {}) {
    this.plugin.add_torrent(addTorrentParams, (err, torrentHandle) => {
      if (err) return callback(err)

      if (!torrentHandle.isValid()) {
        return callback(new Error('torrent handle invalid'))
      }

      const infoHash = torrentHandle.infoHash()

      // At this point we should have handled the add_torrent_alert and created a Torrent
      assert(this.torrents.has(infoHash))

      const torrent = this.torrents.get(infoHash)

      // we emit torrent_added event here as we can guarantee that our torrent plugin has been installed
      this.emit('torrent_added', torrent)

      callback(null, torrent)
    })
  }

 /**
  * Remove a torrent.
  * @param {infoHash} InfoHash of the torrent to be removed.
  * @param {callback} Callback called after torrent removed.
  */
  removeTorrent (infoHash, callback = () => {}) {
    const alertDebug = debug('session:removeTorrent')

    if (this.torrents.has(infoHash)) {
      this.plugin.remove_torrent(infoHash, (err) => {
        // At this point we should have handled the torrent_removed_alert

        // An error occurs when the libtorrent session doesn't have the torrent we are
        // trying to remove. This can happen if a call to libtorrent session to remove the same torrent
        // was made prior to the plugin request being processed. There is no benefit to propagate this error

        if (err) {
          alertDebug('torrent not in session')
        }

        callback()
      })
    } else {
      callback(new Error('Cannot remove torrent : Torrent not found'))
    }
  }

 /**
  * Pause the libtorrent session.
  * @param {callback} Callback called after plugin paused.
  */
  pauseLibtorrent (callback) {
    this.plugin.pause_libtorrent((err) => {
      callback(err)
    })
  }

  /**
   * Call postTorrentUpdates on session.
   */
  postTorrentUpdates () {
    this.session.postTorrentUpdates()
  }

  /**
   * Announce infoHash to DHT.
   * @param {infoHash} Hash of the torrent that need to be announced.
   */
  dhtAnnounce (infoHash) {
    // Announce the successfully mapped port or the local listening port
    this.session.dhtAnnounce(infoHash, this._externalUdpPort || this.session.listenPort())
  }

  /**
   * Get peers from DHT.
   * @param {infoHash} Hash of the torrent that sou want to get peers from.
   */
  dhtGetPeers (infoHash) {
    const alertDebug = debug('session:dhtGetPeers')

    alertDebug('Trying to get DHT peers from :', infoHash)

    this.session.dhtGetPeers(infoHash)
  }

  /**
   * Apply settings pack settings to the session
   * @param {Object} Settings - libtorrent settings pack
   */
  applySettings (settings) {
     this.session.applySettings(settings)
  }

  process (alert) {
    this.emit('alert', alert)

    switch (alert.type) {

      // tracker_reply_alert
      case Libtorrent.AlertType.tracker_reply_alert:
        this._processTrackerReplyAlert(alert)
        break

        // dht_get_peers_reply_alert
      case Libtorrent.AlertType.dht_get_peers_reply_alert:
        this._processDhtGetPeersReplyAlert(alert)
        break

        // listen_succeeded_alert
      case Libtorrent.AlertType.listen_succeeded_alert:
        this._listenSucceededAlert(alert)
        break

        // metadata_received_alert
      case Libtorrent.AlertType.metadata_received_alert:
        this._metadataReceivedAlert(alert)
        break

        // metadata_failed_alert
      case Libtorrent.AlertType.metadata_failed_alert:
        this._metadataFailedAlert(alert)
        break

        // add_torrent_alert
      case Libtorrent.AlertType.add_torrent_alert:
        this._addTorrentAlert(alert)
        break

        // torrent_finished_alert
      case Libtorrent.AlertType.torrent_finished_alert:
        this._torrentFinishedAlert(alert)
        break

        // state_update_alert
      case Libtorrent.AlertType.state_update_alert:
        this._stateUpdateAlert(alert)
        break

        // state_changed_alert
      case Libtorrent.AlertType.state_changed_alert:
        this._stateChangedAlert(alert)
        break

        // torrent_removed_alert
      case Libtorrent.AlertType.torrent_removed_alert:
        this._torrentRemovedAlert(alert)
        break

        // torrent_resumed_alert
      case Libtorrent.AlertType.torrent_resumed_alert:
        this._torrentResumedAlert(alert)
        break

        // save_resume_data_alert
      case Libtorrent.AlertType.save_resume_data_alert:
        this._saveResumeDataAlert(alert)
        break

        // save_resume_data_failed_alert
      case Libtorrent.AlertType.save_resume_data_failed_alert:
        this._saveResumeDataFailedAlert(alert)
        break

        // torrent_paused_alert
      case Libtorrent.AlertType.torrent_paused_alert:
        this._torrentPausedAlert(alert)
        break

        // torrent_checked_alert
      case Libtorrent.AlertType.torrent_checked_alert:
        this._torrentCheckedAlert(alert)
        break

        // peer_connect_alert
      case Libtorrent.AlertType.peer_connect_alert:
        this._peerConnectAlert(alert)
        break

        // peer_disconnected_alert
      case Libtorrent.AlertType.peer_disconnected_alert:
        this._peerDisconnectedAlert(alert)
        break

        // incoming_connection_alert
      case Libtorrent.AlertType.incoming_connection_alert:
        this._incomingConnectionAlert(alert)
        break

        // read_piece_alert
      case Libtorrent.AlertType.read_piece_alert:
        this._readPieceAlert(alert)
        break

        // piece_finished_alert
      case Libtorrent.AlertType.piece_finished_alert:
        this._pieceFinishedAlert(alert)
        break

      case Libtorrent.AlertType.portmap_alert:
        this._portMapAlert(alert)
        break

      case Libtorrent.AlertType.portmap_error_alert:
        this._portMapErrorAlert(alert)
        break

        // TorrentPluginStatusUpdateAlert
      case JoyStreamAddon.AlertType.TorrentPluginStatusUpdateAlert:
        this._torrentPluginStatusUpdateAlert(alert)
        break

        // PeerPluginStatusUpdateAlert
      case JoyStreamAddon.AlertType.PeerPluginStatusUpdateAlert:
        this._peerPluginStatusUpdateAlert(alert)
        break

        // RequestResult
      case JoyStreamAddon.AlertType.RequestResult:
        this._requestResult(alert)
        break

        // ConnectionAddedToSession
      case JoyStreamAddon.AlertType.ConnectionAddedToSession:
        this._connectionAddedToSession(alert)
        break

          // ConnectionRemovedFromSession
      case JoyStreamAddon.AlertType.ConnectionRemovedFromSession:
        this._connectionRemovedFromSession(alert)
        break

        // SessionStarted
      case JoyStreamAddon.AlertType.SessionStarted:
        this._sessionStarted(alert)
        break

        // SessionStopped
      case JoyStreamAddon.AlertType.SessionStopped:
        this._sessionStopped(alert)
        break

        // SessionPaused
      case JoyStreamAddon.AlertType.SessionPaused:
        this._sessionPaused(alert)
        break

        // SessionToObserveMode
      case JoyStreamAddon.AlertType.SessionToObserveMode:
        this._sessionToObserveMode(alert)
        break

        // SessionToSellMode
      case JoyStreamAddon.AlertType.SessionToSellMode:
        this._sessionToSellMode(alert)
        break

        // SessionToBuyMode
      case JoyStreamAddon.AlertType.SessionToBuyMode:
        this._sessionToBuyMode(alert)
        break

        // ValidPaymentReceived
      case JoyStreamAddon.AlertType.ValidPaymentReceived:
        this._validPaymentReceived(alert)
        break

        // InvalidPaymentReceived
      case JoyStreamAddon.AlertType.InvalidPaymentReceived:
        this._invalidPaymentReceived(alert)
        break

        // LastPaymentReceived
      case JoyStreamAddon.AlertType.LastPaymentReceived:
        this._lastPaymentReceived(alert)
        break

        // SellerTermsUpdated
      case JoyStreamAddon.AlertType.SellerTermsUpdated:
        this._sellerTermsUpdated(alert)
        break

        // SentPayment
      case JoyStreamAddon.AlertType.SentPayment:
        this._sentPayment(alert)
        break

        // ContractConstructed
      case JoyStreamAddon.AlertType.ContractConstructed:
        this._contractConstructed(alert)
        break

        // ValidPieceArrived
      case JoyStreamAddon.AlertType.ValidPieceArrived:
        this._validPieceArrived(alert)
        break

        // InvalidPieceArrived
      case JoyStreamAddon.AlertType.InvalidPieceArrived:
        this._invalidPieceArrived(alert)
        break

        // BuyerTermsUpdated
      case JoyStreamAddon.AlertType.BuyerTermsUpdated:
        this._buyerTermsUpdated(alert)
        break

        // AnchorAnnounced
      case JoyStreamAddon.AlertType.AnchorAnnounced:
        this._anchorAnnounced(alert)
        break

        // UploadStarted
      case JoyStreamAddon.AlertType.UploadStarted:
        this._uploadStarted(alert)
        break

        // UploadStarted
      case JoyStreamAddon.AlertType.DownloadStarted:
        this._downloadStarted(alert)
        break

        // AllSellersGone
      case JoyStreamAddon.AlertType.AllSellersGone:
        this._allSellersGone(alert)
        break
    }
  }

  _processTrackerReplyAlert (alert) {
  }

  _processDhtGetPeersReplyAlert (alert) {
    var alertDebug = debug('session:processDhtGetPeersReplyAlert')
    var originalHash = this.torrentsBySecondaryHash.get(alert.infoHash)

    if (!this.torrents.has(originalHash)) {
      alertDebug('Torrent with secondaryInfoHash ' + alert.infoHash + ' not found')
      return
    }

    var torrent = this.torrents.get(originalHash)

    torrent._onDhtGetPeersReply(alert.peers)
  }

  _listenSucceededAlert (alert) {
    var endpoint = alert.endpoint
    this.emit('listen_succeeded_alert', endpoint)
  }

  _metadataReceivedAlert (alert) {
    var alertDebug = debug('session:metadataReceivedAlert')
    var torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    var torrent = this.torrents.get(infoHash)

    var torrentInfo = torrentHandle.torrentFile()

    if (torrentInfo && torrent) {
      alertDebug(infoHash)
      torrent._onMetaData(torrentInfo)
    }
  }

  _metadataFailedAlert (alert) {
    // what to do?
    var alertDebug = debug('session:metadataFailedAlert')
    var torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()



    alertDebug(infoHash)
  }

  _addTorrentAlert (alert) {
    var alertDebug = debug('session:addTorrentAlert')

    if (alert.error) {
      alertDebug(alert.error.message)
      return
    }

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    // if a torrent is added without flag_duplicate_is_error in add torrent parameters
    // we may get an add_torrent_alert for an existing torrent
    if (this.torrents.has(infoHash)) {
      alertDebug('duplicate')
      return
    }

    var torrent = new Torrent(torrentHandle, this.plugin)

    // Add torrent to torrents map
    this.torrents.set(infoHash, torrent)

    // DHT stuff
    if (this._assistedPeerDiscovery) {
      this.torrentsBySecondaryHash.set(torrent.secondaryInfoHash, infoHash)
      this.dhtAnnounce(torrent.secondaryInfoHash)
      this.dhtGetPeers(torrent.secondaryInfoHash)
    }

    // We do not emit torrent_added event here, we defer it until we
    // are guranteed the call to libtorrent add_torrent has returned
    // this will be in the request result callback of our extension's add_torrent request
    // Instead we emit a differnet named alert
    this.emit('libtorrent_added_torrent', torrent)
  }

  _torrentFinishedAlert (alert) {
    const alertDebug = debug('session:torrentFinishedAlert')

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      alertDebug(infoHash)
      const torrent = this.torrents.get(infoHash)
      torrent._onFinished()
    }
  }

  _stateUpdateAlert (alert) {
    var status = alert.status

    for (var i in status) {
      const torrent = this.torrents.get(status[i].infoHash)
      if (torrent) {
        torrent._onStatusUpdate(status[i])
      }
    }
  }

  _stateChangedAlert (alert) {
    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onStateChanged()
    }
  }

  _torrentRemovedAlert (alert) {
    /*
     * NOTICE: Docs say p->handle may be invalid at this time - likely because this is a removal operation,
     * so we must use p->info_hash instead.
     */

    var alertDebug = debug('session:torrentRemovedAlert')

    const infoHash = alert.infoHash

    alertDebug(infoHash)

    if (this.torrents.has(infoHash)) {
      const secondaryInfoHash = this.torrents.get(infoHash).secondaryInfoHash
      this.torrentsBySecondaryHash.delete(secondaryInfoHash)

      this.torrents.delete(infoHash)

      this.emit('torrent_removed', infoHash)
    }
  }

  _torrentResumedAlert (alert) {
    var alertDebug = debug('session:torrentResumedAlert')

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      alertDebug(infoHash)
      const torrent = this.torrents.get(infoHash)
      torrent._onResumed()
    }
  }

  _saveResumeDataAlert (alert) {
    var alertDebug = debug('session:saveResumeDataAlert')

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    alertDebug(infoHash)

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onResumeData(alert.resumeData)
    }
  }

  _saveResumeDataFailedAlert (alert) {
    var alertDebug = debug('session:saveResumeDataFailedAlert')

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    alertDebug(infoHash)

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onResumeDataFailed(alert.error)
    }
  }

  _torrentPausedAlert (alert) {
    var alertDebug = debug('session:torrentPausedAlert')

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onPaused()
    }
  }

  _torrentCheckedAlert (alert) {
    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onTorrentChecked()
    }
  }

  _peerConnectAlert (alert) {

  }

  _peerDisconnectedAlert (alert) {

  }

  _incomingConnectionAlert (alert) {

  }

  _readPieceAlert (alert) {
    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      if (alert.error) {
        torrent._onReadPiece(null, alert.error)
        return
      }
      var piece = {
        index: alert.pieceIndex,
        buffer: alert.buffer,
        size: alert.size
      }
      torrent._onReadPiece(piece, null)
    }
  }

  _pieceFinishedAlert (alert) {
    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onPieceFinished(alert.pieceIndex)
    }
  }

  _requestResult (alert) {
    alert.run()
  }

  _torrentPluginStatusUpdateAlert (alert) {
    for (var status of alert.statuses) {
      var torrent = this.torrents.get(status.infoHash)
      if (torrent) {
        torrent._onTorrentPluginStatusUpdate(status)
      }
    }
  }

  _peerPluginStatusUpdateAlert (alert) {
    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onPeerPluginStatusUpdate(alert.statuses)
    }
  }

  _connectionAddedToSession (alert) {
    var alertDebug = debug('session:connectionAddedToSession')

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onConnectionAdded(alert.pid, alert.status)
    }
  }

  _connectionRemovedFromSession (alert) {
    var alertDebug = debug('session:connectionRemovedFromSession')

    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent._onConnectionRemoved(alert.pid)
    }
  }

  _portMapAlert(alert) {
    // We will assume that only libtorrent is making mappings
    if (alert.protocol === 1) {
      this._externalUdpPort = alert.externalPort
    }
  }

  _portMapErrorAlert(alert) {

  }

  __emitEventOnValidTorrent (eventName, alert) {
    const torrentHandle = alert.handle

    const infoHash = torrentHandle.infoHash()

    if (isEmptyInfoHash(infoHash)) {
      return
    }

    if (this.torrents.has(infoHash)) {
      const torrent = this.torrents.get(infoHash)
      torrent.emit(eventName, alert)
    }
  }

  _sessionStarted (alert) {
    this.__emitEventOnValidTorrent('sessionStarted', alert)
  }

  _sessionPaused (alert) {
    this.__emitEventOnValidTorrent('sessionPaused', alert)
  }

  _sessionStopped (alert) {
    this.__emitEventOnValidTorrent('sessionStopped', alert)
  }

  _sessionToObserveMode (alert) {
    this.__emitEventOnValidTorrent('sessionToObserveMode', alert)
  }

  _sessionToSellMode (alert) {
    this.__emitEventOnValidTorrent('sessionToSellMode', alert)
  }

  _sessionToBuyMode (alert) {
    this.__emitEventOnValidTorrent('sessionToBuyMode', alert)
  }

  _validPaymentReceived (alert) {
    this.__emitEventOnValidTorrent('validPaymentReceived', alert)
  }

  _invalidPaymentReceived (alert) {
    this.__emitEventOnValidTorrent('invalidPaymentReceived', alert)
  }

  _buyerTermsUpdated (alert) {
    this.__emitEventOnValidTorrent('buyerTermsUpdated', alert)
  }

  _sellerTermsUpdated (alert) {
    this.__emitEventOnValidTorrent('sellerTermsUpdated', alert)
  }

  _contractConstructed (alert) {
    this.__emitEventOnValidTorrent('contractConstructed', alert)
  }

  _sentPayment (alert) {
    this.__emitEventOnValidTorrent('sentPayment', alert)
  }

  _lastPaymentReceived (alert) {
    this.__emitEventOnValidTorrent('lastPaymentReceived', alert)
  }

  _invalidPieceArrived (alert) {
    this.__emitEventOnValidTorrent('invalidPieceArrived', alert)
  }

  _validPieceArrived (alert) {
    this.__emitEventOnValidTorrent('validPieceArrived', alert)
  }

  _anchorAnnounced (alert) {
    this.__emitEventOnValidTorrent('anchorAnnounced', alert)
  }

  _uploadStarted (alert) {
    this.__emitEventOnValidTorrent('uploadStarted', alert)
  }

  _downloadStarted (alert) {
    this.__emitEventOnValidTorrent('downloadStarted', alert)
  }

  _allSellersGone (alert) {
    this.__emitEventOnValidTorrent('allSellersGone', alert)
  }
}

module.exports = Session
