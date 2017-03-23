'use strict'

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

  // pre-requisists:
  // 1. update commitmentToOutput to take a privateKey for buyer instead of publicKey
  //    (to avoid conversion in javascript)

  start_downloading(channels /* Map() */, signAsync) {
      //check arguments
      if(!(channels instanceof Map))
        return Promise.reject(new Error('channels argument must be a Map'))

      if(typeof signAsync != 'function')
        return Promise.reject(new Error('second argument must be a function'))

      //assert valid state before starting to download
      if(this.status.session.mode != TorrentPlugin.MODE.buying)
        return Promise.reject(new Error('torrent plugin not in buying mode'))

      if(this.status.session.state != TorrentPlugin.STATE.started)
        return Promise.reject(new Error('torrent plugin not started'))

      if(this.status.session.buying.state != TorrentPlugin.BUYING_STATE.sending_invitations)
        return Promise.reject(new Error('torrent plugin buying substate is not sending_invitations'))

      let buyerTerms = this.status.session.buying.terms

      //user must have selected at least the minimum number of sellers set as per the buyer terms
      if(buyerTerms.minNumberOfSellers > 0 && buyerTerms.minNumberOfSellers > channels.size )
        return Promise.reject(new Error('not enough sellers selected to meet buyer terms'))

      // we cannot have 0 sellers!
      if(channels.size == 0)
          return Promise.reject(new Error('no sellers'))

      let peers = this.peers
      let contractFeeRate = 0
      let maxSellers = 100000 // use Number.MAX_NUMBER

      // basic checks
      for (var [endpoint, channel] of channels.entries()) {
          // transaction outputs must be greater than 0
          if(channel.value < 1)
            return Promise.reject(new Error('value for channel must be greater than zero'))

          // check peer exists and we have a connection
          if(!peers.hash(endpoint))
            return Promise.reject(new Error('peer not found'))

          let peer = peers.get(endpoint)

          if(!peer.connection)
            return Promise.reject(new Error('peer has no connection'))

          // verify connection with peer is in a valid state
          if (peer.connection.innerState != TorrentPlugin.INNER_STATE.PreparingContract)
            return Promise.reject(new Error('peer connection not in PerparingContract inner state'))

          let sellerTerms = peer.connection.announcedModeAndTermsFromPeer.seller.terms

          // check terms are compatible
          if (!util.areTermsMatching(buyerTerms, sellerTerms))
            return Promise.reject(new Error('incompatible terms'))

          // select the lowest minContractFeePerKb that will satisfy all sellers
          if( sellerTerms.minContractFeePerKb > contractFeeRate) {
            contractFeeRate = sellerTerms.minContractFeePerKb
            if(contractFeeRate > buyerTerms.maxContractFeePerKb)
              return Promise.reject(new Error(''))
          }
          // keep track of lowest maxNumSellers of each peer - this will set the limit
          // on the max allowed sellers in the contract
          if(sellerTerms.maxNumberOfSellers > 0 && sellerTerms.maxNumberOfSellers < maxSellers){
            maxSellers = sellerTerms.maxNumberOfSellers
            // check that we are not trying to include more sellers than any one seller will accept
            if(channels.size > maxSellers)
              return Promise.reject(new Error('number of sellers exceed max sellers constraint'))
          }
      }

      assert(contractFeeRate <= buyerTerms.maxContractFeePerKb)
      assert(channels.size > 0)
      assert(channels.size > buyerTerms.minNumberOfSellers)
      assert(channels.size <= maxSellers)

      let downloadInfoMap = new Map()
      let commitments = []
      let index = 0

      for (var [endpoint, channel] of channels.entries()) {
        downloadInfoMap.set(endpoint, {
           index: index++,
           value: channel.value,
           sellerTerms: sellerTerms,
           buyerContractSk: channel.buyerContractSk, //copy the buffer?
           buyerFinalPkHash: channel.buyerFinalPkHash //copy the buffer?
        })

        commitments.push({
           value: channel.value,
           locktime: sellerTerms.minLock,
           payorSk: channel.payorContractSk, //copy buffer?
           sellerPk: peer.connection.payor.sellerPublicKey, //not yet encoded - copy buffer?
        })
      }

      assert(commitments.length ==  channels.size)
      assert(downloadInfoMap.size == channels.size)

      // construct outputs for contract
      let contractOutputs = [] // array of Buffers (raw outputs)

      for (var i = 0; i < commitments.length; i++) {
        try {
            contractOutputs[i] = commitmentToOutput(commitments[i])
        } catch(e) {
            return Promise.reject(e)
        }
      }

      assert(contractOutputs.length == commitments.length)

      let torrentPlugin = this.plugin
      let infoHash = this.infoHash
      return signAsync(contractOutputs, contractFeeRate).then(function(tx){
          // expect tx to be a signed serialized tx - Buffer or hex string
          if(!Buffer.isBuffer(tx)){
            if(typeof tx === 'string') {
                try {
                    tx = Buffer.from(tx, 'hex')
                }catch(e){
                    return Promise.reject(new Error(e))
                }
            } else {
                return Promise.reject(new Error('async signer returned invalid type'))
            }
          }

          return new Promise(function(resolve, reject){
              torrentPlugin.start_downloading(infoHash, tx, downloadInfoMap, function(err, result){
                  if(err)
                     return reject(err)

                  // might be useful to return the downloadInfoMap also?
                  resolve(result)
              })
          })
      })
  }
}

// these are tomporary here and need to be put in the right place
TorrentPlugin.STATE = require('bindings')('JoyStreamAddon').joystream.SessionState
TorrentPlugin.MODE = require('bindings')('JoyStreamAddon').joystream.SessionMode
TorrentPlugin.BUYING_STATE = require('bindings')('JoyStreamAddon').joystream.BuyingState
TorrentPlugin.INNER_STATE = require('bindings')('JoyStreamAddon').joystream.InnerStateType
//const InnerStateTypeInfo = require('./InnerStateTypeInfo')

module.exports = TorrentPlugin
