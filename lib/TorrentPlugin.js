'use strict'
var Promise = require('bluebird')
var commitmentToOutput = require('bindings')('JoyStreamAddon').joystream.commitmentToOutput

// temporary
let SESSION_STATE = require('bindings')('JoyStreamAddon').joystream.SessionState
let SESSION_MODE = require('bindings')('JoyStreamAddon').joystream.SessionMode
let BUYING_STATE = require('bindings')('JoyStreamAddon').joystream.BuyingState
let INNER_STATE = require('bindings')('JoyStreamAddon').joystream.InnerStateType

var util = require('./utils.js')
var assert = require('assert')

const EventEmitter = require('events')

class TorrentPlugin extends EventEmitter {

  constructor (status, plugin, peers, infoHash) {
    super()
    this.status = status
    this.plugin = plugin
    this.peers = peers
    this.infoHash = infoHash
  }

  update (status) {
    this.status = status
    this.emit('statusUpdated', status)
  }

  start_downloading(channels, signAsync) {
    let plugin = this.plugin
    let infoHash = this.infoHash

    return _createStartDownloadingInfo(channels, signAsync).then(function(info){
        return new Promise(function(resolve, reject){
            plugin.start_downloading(infoHash, info.contract, info.map, function(err){
                if(err)
                   return reject(err)

                resolve(tx)
            })
        })
    })
  }
  _createStartDownloadingInfo(channels, signAsync) {
      if(typeof signAsync != 'function')
        return Promise.reject(new TorrentPlugin.InvalidArgumentError('second argument must be a function'))

      let info

      try {
          info = this._createOutputsAndDownloadInfoMap(channels)
      } catch(e) {
          return Promise.reject(e)
      }

      return signAsync(info.contractOutputs, info.contractFeeRate).then(function(transaction){
          return {contract: transaction, map: info.downloadInfoMap}
      })
  }

  _createOutputsAndDownloadInfoMap(channels) {
      //check arguments
      if(!(channels instanceof Map))
        throw new TorrentPlugin.InvalidArgumentError('channels argument must be a Map')

      //assert valid state before starting to download
      if(this.status.session.mode != SESSION_MODE.buying)
        throw new TorrentPlugin.InvalidStateError('torrent plugin not in buying mode')

      if(this.status.session.state != SESSION_STATE.started)
        throw new TorrentPlugin.InvalidStateError('torrent plugin not started')

      if(this.status.session.buying.state != BUYING_STATE.sending_invitations)
        throw new TorrentPlugin.InvalidStateError('torrent plugin buying substate is not sending_invitations')

      let buyerTerms = this.status.session.buying.terms

      //user must have selected at least the minimum number of sellers set as per the buyer terms
      if(buyerTerms.minNumberOfSellers > 0 && buyerTerms.minNumberOfSellers > channels.size )
        throw new TorrentPlugin.NotEnoughSellersError('not enough sellers selected to meet buyer terms')

      // we cannot have 0 sellers!
      if(channels.size == 0)
          throw new TorrentPlugin.NoSellersError('no sellers')

      let peers = this.peers
      let contractFeeRate = 0
      let maxSellers = 100000 // use Number.MAX_NUMBER

      // basic checks
      for (var [endpoint, channel] of channels.entries()) {
          // transaction outputs must be greater than 0
          if(channel.value < 1)
            throw new TorrentPlugin.ValueError('value for channel must be greater than zero')

          // check peer exists and we have a connection
          if(!peers.has(endpoint))
            throw new TorrentPlugin.PeerNotFoundError('peer not found')

          let peer = peers.get(endpoint)

          if(!peer.connection)
            throw new TorrentPlugin.PeerHasNoConnectionError('peer has no connection')

          // verify connection with peer is in a valid state
          if (peer.connection.innerState != INNER_STATE.PreparingContract)
            throw new TorrentPlugin.InvalidPeerInnerStateError('peer connection not in PerparingContract inner state')

          let sellerTerms = peer.connection.announcedModeAndTermsFromPeer.seller.terms

          // check terms are compatible
          if (!util.areTermsMatching(buyerTerms, sellerTerms))
            throw new TorrentPlugin.TermsMismatchError('incompatible terms')

          // select the lowest minContractFeePerKb that will satisfy all sellers
          if( sellerTerms.minContractFeePerKb > contractFeeRate) {
            contractFeeRate = sellerTerms.minContractFeePerKb
          }
          // keep track of lowest maxNumSellers of each peer - this will set the limit
          // on the max allowed sellers in the contract
          if(sellerTerms.maxNumberOfSellers > 0 && sellerTerms.maxNumberOfSellers < maxSellers){
            maxSellers = sellerTerms.maxNumberOfSellers
            // check that we are not trying to include more sellers than any one seller will accept
            if(channels.size > maxSellers)
              throw new TorrentPlugin.TooManySellersError('number of sellers exceed max sellers constraint')
          }
      }

      let downloadInfoMap = new Map()
      let contractOutputs = []
      let index = 0

      for (var [endpoint, channel] of channels.entries()) {
        let peer = peers.get(endpoint)
        let sellerTerms = peer.connection.announcedModeAndTermsFromPeer.seller.terms

        downloadInfoMap.set(endpoint, {
           index: index,
           value: channel.value,
           sellerTerms: sellerTerms,
           buyerContractSk: Buffer.from(channel.buyerContractSk),
           buyerFinalPkHash: Buffer.from(channel.buyerFinalPkHash)
        })

        contractOutputs[index] = commitmentToOutput({
           value: channel.value,
           locktime: sellerTerms.minLock, //in time units (multiples of 512s)
           payorSk: Buffer.from(channel.buyerContractSk),
           payeePk: Buffer.from(peer.connection.payor.sellerContractPk)
        })

        index++
      }

      return ({ contractOutputs: contractOutputs,
                contractFeeRate: contractFeeRate,
                downloadInfoMap: downloadInfoMap })
  }

}

function TorrentPluginError(name, message) {
    this.name = name;
    this.message = message;
    this.stack = (new Error()).stack;
}

TorrentPlugin.InvalidArgumentError = function InvalidArgumentError(message) {
    TorrentPluginError.call(this, 'InvalidArgumentError', message)
}

TorrentPlugin.NotEnoughSellersError = function NotEnoughSellersError(message) {
    TorrentPluginError.call(this, 'NotEnoughSellersError', message)
}

TorrentPlugin.NoSellersError = function NoSellersError(message) {
    TorrentPluginError.call(this, 'NoSellersError', message)
}

TorrentPlugin.InvalidStateError = function InvalidStateError(message) {
    TorrentPluginError.call(this, 'InvalidStateError', message)
}

TorrentPlugin.ValueError = function ValueError(message) {
    TorrentPluginError.call(this, 'ValueError', message)
}

TorrentPlugin.PeerNotFoundError = function PeerNotFoundError(message) {
    TorrentPluginError.call(this, 'PeerNotFoundError', message)
}

TorrentPlugin.PeerHasNoConnectionError = function PeerHasNoConnectionError(message) {
    TorrentPluginError.call(this, 'PeerHasNoConnectionError', message)
}

TorrentPlugin.InvalidPeerInnerStateError = function InvalidPeerInnerStateError(message) {
    TorrentPluginError.call(this, 'InvalidPeerInnerStateError', message)
}

TorrentPlugin.TermsMismatchError = function TermsMismatchError(message) {
    TorrentPluginError.call(this, 'TermsMismatchError', message)
}

TorrentPlugin.TooManySellersError = function TooManySellersError(message) {
    TorrentPluginError.call(this, 'TooManySellersError', message)
}

module.exports = TorrentPlugin
