'use strict'

var sha1 = require('sha1')
const EventEmitter = require('events')

//const cleanAnnouncedJSPeersMapInterval = 60 * 60 * 1000 // 1h
// const outOfDatePeerTime = 60 * 60 * 1000 // 1h

class Torrent extends EventEmitter {

  constructor (handle, plugin) {
    super()

    this.handle = handle
    this.plugin = plugin // joystream extension (libtorrent session plugin)

    this.infoHash = handle.infoHash()
    this.secondaryInfoHash = this._secondaryInfoHash(this.infoHash)
  }

  /* * * * * * * * * * * * *
   *  Secondary Info Hash
   * * * * * * * * * * * * */

  // Review needed !
  _secondaryInfoHash (infoHash) {
    var newInfoHash = infoHash + '_JS'
    return sha1(newInfoHash)
  }

  _onDhtGetPeersReply (peers) {
    this.emit('dhtGetPeersReply', peers)
  }

  // Torrent status
  status () {
    return this.handle.status()
  }

  _onPeerPluginStatusUpdate (statuses) {
    this.emit('peerPluginStatusUpdates', statuses)
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
    this.emit('pluginStatusUpdate', status)
    //this.emit('pluginStatusUpdate', new TorrentPluginStatus(status))
  }

  _onConnectionAdded (pid, status) {
    this.emit('connectionAdded', pid, status)
    //this.emit('connectionAdded', new ConnectionStatus(status))
  }

  _onPieceFinished (pieceIndex) {
    this.emit('pieceFinished', pieceIndex)
  }

  _onTorrentChecked () {
    this.emit('torrentChecked')
  }

  _onConnectionRemoved (pid) {
    this.emit('connectionRemoved', pid)
  }

  // Torrent Plugin Controls

  toSellMode (sellerTerms, callback = () => {}) {
    this.plugin.to_sell_mode(this.infoHash, sellerTerms, callback)
  }

  toBuyMode (buyerTerms, callback = () => {}) {
    this.plugin.to_buy_mode(this.infoHash, buyerTerms, callback)
  }

  toObserveMode (callback = () => {}) {
    this.plugin.to_observe_mode(this.infoHash, callback)
  }

  setLibtorrentInteraction (mode, callback = () => {}) {
    this.plugin.set_libtorrent_interaction(this.infoHash, mode, callback)
  }

  stopPlugin (callback = () => {}) {
    this.plugin.stop(this.infoHash, callback)
  }

  startPlugin (callback = () => {}) {
    this.plugin.start(this.infoHash, callback)
  }

  pausePlugin (callback = () => {}) {
    this.plugin.pause(this.infoHash, callback)
  }

  startUploading (connectionId, buyerTerms, contractSk, finalPkHash, callback = () => {}) {
    this.plugin.start_uploading(this.infoHash, connectionId, buyerTerms, contractSk, finalPkHash, callback)
  }

  startDownloading (contract, downloadInfoMap, callback = () => {}) {
    this.plugin.start_downloading(this.infoHash, contract, downloadInfoMap, callback)
  }

  connectPeer (peer) {
    this.handle.connectPeer(peer)
  }

}

module.exports = Torrent
