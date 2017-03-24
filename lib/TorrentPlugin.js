'use strict'
var Promise = require('bluebird')
var commitmentToOutput = require('bindings')('JoyStreamAddon').joystream.commitmentToOutput
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
      try {
          info = _createOutputsAndDownloadInfoMap(channels)
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
        throw new Error('channels argument must be a Map')

      if(typeof signAsync != 'function')
        throw new Error('second argument must be a function')

      //assert valid state before starting to download
      if(this.status.session.mode != TorrentPlugin.MODE.buying)
        throw new Error('torrent plugin not in buying mode')

      if(this.status.session.state != TorrentPlugin.STATE.started)
        throw new Error('torrent plugin not started')

      if(this.status.session.buying.state != TorrentPlugin.BUYING_STATE.sending_invitations)
        throw new Error('torrent plugin buying substate is not sending_invitations')

      let buyerTerms = this.status.session.buying.terms

      //user must have selected at least the minimum number of sellers set as per the buyer terms
      if(buyerTerms.minNumberOfSellers > 0 && buyerTerms.minNumberOfSellers > channels.size )
        throw new Error('not enough sellers selected to meet buyer terms')

      // we cannot have 0 sellers!
      if(channels.size == 0)
          throw new Error('no sellers')

      let peers = this.peers
      let contractFeeRate = 0
      let maxSellers = 100000 // use Number.MAX_NUMBER

      // basic checks
      for (var [endpoint, channel] of channels.entries()) {
          // transaction outputs must be greater than 0
          if(channel.value < 1)
            throw new Error('value for channel must be greater than zero')

          // check peer exists and we have a connection
          if(!peers.hash(endpoint))
            throw new Error('peer not found')

          let peer = peers.get(endpoint)

          if(!peer.connection)
            throw new Error('peer has no connection')

          // verify connection with peer is in a valid state
          if (peer.connection.innerState != TorrentPlugin.INNER_STATE.PreparingContract)
            throw new Error('peer connection not in PerparingContract inner state')

          let sellerTerms = peer.connection.announcedModeAndTermsFromPeer.seller.terms

          // check terms are compatible
          if (!util.areTermsMatching(buyerTerms, sellerTerms))
            throw new Error('incompatible terms')

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
              throw new Error('number of sellers exceed max sellers constraint')
          }
      }

      assert(contractFeeRate <= buyerTerms.maxContractFeePerKb)
      assert(channels.size > 0)
      assert(channels.size > buyerTerms.minNumberOfSellers)
      assert(channels.size <= maxSellers)

      let downloadInfoMap = new Map()
      let contractOutputs = []
      let index = 0

      for (var [endpoint, channel] of channels.entries()) {
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

      assert(contractOutputs.length == channels.size)
      assert(downloadInfoMap.size == channels.size)

      return ({ contractOutputs: contractOutputs,
                contractFeeRate: contractFeeRate,
                downloadInfoMap: downloadInfoMap })
  }
}

// these are tomporary here and need to be put in the right place
TorrentPlugin.STATE = require('bindings')('JoyStreamAddon').joystream.SessionState
TorrentPlugin.MODE = require('bindings')('JoyStreamAddon').joystream.SessionMode
TorrentPlugin.BUYING_STATE = require('bindings')('JoyStreamAddon').joystream.BuyingState
TorrentPlugin.INNER_STATE = require('bindings')('JoyStreamAddon').joystream.InnerStateType
//const InnerStateTypeInfo = require('./InnerStateTypeInfo')

module.exports = TorrentPlugin
