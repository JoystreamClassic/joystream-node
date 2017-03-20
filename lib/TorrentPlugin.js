'use strict'

var commitmentToOutput = require('bindings')('JoyStreamAddon').joystream.commitmentToOutput
var util = require('./utils.js')

var assert = require('assert')

const EventEmitter = require('events')

class TorrentPlugin extends EventEmitter {

  constructor (status, plugin, peers) {
    super()
    this.status = status
    this.plugin = plugin
    this.peers = peers
  }

  update (status) {
    this.status = status
    this.emit('statusUpdated', status)
  }

  // pre-requisists:
  // 1. update commitmentToOutput to take a privateKey for buyer instead of publicKey
  //    (to avoid conversion in javascript)

  /* channel = {
    endpoint: "192.168.0.2:1245", //ip:port
    value: 50000, //satoshi
    payorContractSk: Buffer[33] // private key (update commitmentToOutput to take a payor SK)
    payorFinalPkHash: Buffer[20] // pubkeyhash
   }*/

  start_downloading(channels, signAsync) {
      //assert valid state before starting to download
      if(this.status.session.mode != TorrentPlugin.MODE.buying)
        return Promise.reject(new Error('torrent plugin not in buying mode'))

      if(this.status.session.state != TorrentPlugin.STATE.started)
        return Promise.reject(new Error('torrent plugin not started'))

      if(this.status.session.buying.state != TorrentPlugin.BUYING_STATE.sending_invitations)
        return Promise.reject(new Error('torrent plugin buying substate is not sending_invitations'))

      let buyerTerms = this.status.session.buying.terms

      //user must have selected at least the minimum number of sellers set as per the buyer terms
      if(buyerTerms.minNumberOfSellers > 0 && buyerTerms.minNumberOfSellers > selectedSellers.length)
        return Promise.reject(new Error('not enough sellers selected to meet buyer terms'))

      let peers = this.peers
      let downloadInfoMap = new Map()
      let commitments = []
      let contractFeeRate = 0
      let maxSellers = 100000 // use Number.MAX_NUMBER

      channels.forEach(function(channel){
        if(commitments.length > maxSellers) return;

        // check for duplicate peers
        if(downloadInfoMap.has(channel.endpoint)) return;

        let peer = peers[channel.endpoint] //double check how endpoint is encoded

        // check peer exists and we have a connection
        if(!peer || !peer.connection) return;

        // verify connection with peer is in a valid state
        if (peer.connection.innerState != TorrentPlugin.INNER_STATE.PreparingContract) return;

        let sellerTerms = peer.connection.announcedModeAndTermsFromPeer.seller.terms

        // check terms are compatible
        if (!util.areTermsMatching(buyerTerms, sellerTerms)) return;

        // select the lowest minContractFeePerKb that will satisfy all sellers
        if( sellerTerms.minContractFeePerKb > contractFeeRate)
        contractFeeRate = sellerTerms.minContractFeePerKb

        // keep track of lowest maxNumSellers of each peer - this will set the limit
        // on the max allowed sellers in the contract
        if(sellerTerms.maxNumberOfSellers > 0 && sellerTerms.maxNumberOfSellers < maxSellers){
         maxSellers = sellerTerms.maxNumberOfSellers
        }

        downloadInfoMap.set(channel.endpoint, {
           index: commitments.length, //add to map before commitments
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
      })

      assert(contractFeeRate <= buyerTerms.maxContractFeePerKb)
      assert(channels.length >= commitments.length)
      assert(downloadInfoMap.size == commitments.length)

      // check that we do not have more commitments/sellers than any one seller will accept
      if(commitments.length > maxSellers)
        return Promise.reject(new Error('number of sellers exceed max sellers constraint'))

      //check buyer min sellers
      if(buyerTerms.minNumberOfSellers > 0 && commitments.length < buyerTerms.minNumberOfSellers)
        return Promise.reject(new Error('not enough sellers selected to meet buyer terms'))

      // we cannot have 0 sellers!
      if(commitments.length == 0)
        return Promise.reject(new Error('no sellers'))


      let contractOutputs = []

      // construct outputs for contract
      try {
          commitments.forEach(function(commitment){
              contractOutputs.push(commitmentToOutput(commitment))
          })
      } catch (e) {
          return Promise.reject(e)
      }

      assert(contractOutputs.length == commitments.length)

      let torrentPlugin = this.plugin

      return signAsync(contractOutputs, contractFeeRate).then(function(tx){
          return new Promise(function(resolve, reject){
              torrentPlugin.start_downloading(hash, tx, downloadInfoMap, function(err, result){
                  if(err)
                     return reject(err)

                  resolve(result)
              })
          })
      })
  }
}

TorrentPlugin.STATE = require('bindings')('JoyStreamAddon').joystream.SessionState
TorrentPlugin.MODE = require('bindings')('JoyStreamAddon').joystream.SessionMode
TorrentPlugin.BUYING_STATE = require('bindings')('JoyStreamAddon').joystream.BuyingState
TorrentPlugin.INNER_STATE = require('bindings')('JoyStreamAddon').joystream.InnerStateType
//const InnerStateTypeInfo = require('./InnerStateTypeInfo')

module.exports = TorrentPlugin
