var TorrentPlugin = require('../../lib/TorrentPlugin')
var assert = require('chai').assert
var sinon = require('sinon');

// temporary
let SESSION_STATE = require('bindings')('JoyStreamAddon').joystream.SessionState
let SESSION_MODE = require('bindings')('JoyStreamAddon').joystream.SessionMode
let BUYING_STATE = require('bindings')('JoyStreamAddon').joystream.BuyingState
let INNER_STATE = require('bindings')('JoyStreamAddon').joystream.InnerStateType

function createValidStatus(terms) {
    let status = {}
    status.session = {}
    status.session.mode = SESSION_MODE.buying
    status.session.state = SESSION_STATE.started
    status.session.buying = {}
    status.session.buying.state = BUYING_STATE.sending_invitations
    status.session.buying.terms = terms
    return status
}

function createValidState(){
    let tp = new TorrentPlugin()

    let buyerTerms = {
        maxPrice: 100,
        maxLock: 5,
        minNumberOfSellers: 1,
        maxContractFeePerKb: 20000
    }

    tp.update(createValidStatus(buyerTerms))

    let channels = new Map()

    tp.peers = new Map()

    let peer = {connection: {announcedModeAndTermsFromPeer : {seller : {terms : {}}}}}

    peer.connection.innerState = INNER_STATE.PreparingContract
    peer.connection.announcedModeAndTermsFromPeer.seller.terms = {
        minPrice: 100,
        minLock: 5,
        maxNumberOfSellers: 20,
        minContractFeePerKb:15000
    }
    peer.connection.payor = {
        sellerContractPk: Buffer.from('030589ee559348bd6a7325994f9c8eff12bd5d73cc683142bd0dd1a17abc99b0dc','hex')
    }

    tp.peers.set(0, peer)
    tp.peers.set(1, peer)

    channels.set(0, {
        value: 5000,
        buyerContractSk: Buffer.from('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20', 'hex'),
        buyerFinalPkHash: Buffer(20)
    })

    channels.set(1, {
        value: 5000,
        buyerContractSk: Buffer.from('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20', 'hex'),
        buyerFinalPkHash: Buffer(20)
    })

    return {tp, channels}
}
describe('TorrentPlugin', function(){
    let tp

    beforeEach(function(){
        tp = new TorrentPlugin(createValidStatus())
    })

    it('Is an EventEmitter', function(){
        assert.typeOf(tp.on, 'function')
        assert.typeOf(tp.emit, 'function')
        var spy = sinon.spy()
        tp.on('test_event', spy)
        tp.emit('test_event')
        assert(spy.called)
    })

    it('Emits status updates', function(){
        // has an update method
        assert.typeOf(tp.update, 'function')

        var spy = sinon.spy()

        let status = { staus: 'xyz'}
        tp.on('statusUpdated', spy)
        tp.update(status)

        assert(spy.calledWith(status))
    })

    describe('exceptions', function(){
        it('exceptions', function(){
            assert.typeOf(TorrentPlugin.InvalidArgumentError, 'function')
            assert.typeOf(TorrentPlugin.InvalidStateError, 'function')
            assert.typeOf(TorrentPlugin.NoSellersError, 'function')
            assert.typeOf(TorrentPlugin.NotEnoughSellersError, 'function')
            assert.typeOf(TorrentPlugin.ValueError, 'function')
            assert.typeOf(TorrentPlugin.PeerNotFoundError, 'function')
            assert.typeOf(TorrentPlugin.PeerHasNoConnectionError, 'function')
            assert.typeOf(TorrentPlugin.InvalidPeerInnerStateError, 'function')
            assert.typeOf(TorrentPlugin.TermsMismatchError, 'function')
            assert.typeOf(TorrentPlugin.TooManySellersError, 'function')
        })
    })
    describe('createOutputsAndDownloadInfoMap', function(){

        it('throws if argument is not a Map()', function(){
            assert.throws(function(){
                tp._createOutputsAndDownloadInfoMap()
            }, TorrentPlugin.InvalidArgumentError)

            assert.throws(function(){
                tp._createOutputsAndDownloadInfoMap({})
            }, TorrentPlugin.InvalidArgumentError)
        })

        it('throws if not in valid state', function(){
            assert.throws(function(){
                let status = createValidStatus()
                status.session.mode = -1
                status.session.state = -1
                status.session.buying.state = -1
                tp.update(status)
                tp._createOutputsAndDownloadInfoMap(new Map())
            }, TorrentPlugin.InvalidStateError)
        })

        it('throws if 0 sellers selected', function(){
            assert.throws(function(){
                let buyerTerms = {
                    minNumberOfSellers: 0
                }
                tp.update(createValidStatus(buyerTerms))
                tp._createOutputsAndDownloadInfoMap(new Map())
            }, TorrentPlugin.NoSellersError)
        })

        it('throws if not enough sellers selected', function(){
            assert.throws(function(){
                let buyerTerms = {
                    minNumberOfSellers: 2
                }
                tp.update(createValidStatus(buyerTerms))
                tp._createOutputsAndDownloadInfoMap(new Map())
            }, TorrentPlugin.NotEnoughSellersError)
        })

        it('throws on invalid channel value', function(){
            assert.throws(function(){
                let buyerTerms = {
                    minNumberOfSellers: 1
                }

                tp.update(createValidStatus(buyerTerms))

                let channels = new Map()

                channels.set(0, {
                    value: 0
                })

                tp._createOutputsAndDownloadInfoMap(channels)
            }, TorrentPlugin.ValueError)
        })

        it('throws on missing peer', function(){
            assert.throws(function(){
                let buyerTerms = {
                    minNumberOfSellers: 1
                }

                tp.update(createValidStatus(buyerTerms))

                let channels = new Map()

                channels.set(0, {
                    value: 5000
                })

                tp.peers = new Map()

                tp._createOutputsAndDownloadInfoMap(channels)
            }, TorrentPlugin.PeerNotFoundError)
        })

        it('throws on missing peer.connection', function(){
            assert.throws(function(){
                let buyerTerms = {
                    minNumberOfSellers: 1
                }

                tp.update(createValidStatus(buyerTerms))

                let channels = new Map()

                channels.set(0, {
                    value: 5000
                })

                tp.peers = new Map()
                tp.peers.set(0, {
                    connection: null
                })
                tp._createOutputsAndDownloadInfoMap(channels)
            }, TorrentPlugin.PeerHasNoConnectionError)
        })

        it('throws on invalid peer.connection.innerState', function(){
            assert.throws(function(){
                let buyerTerms = {
                    minNumberOfSellers: 1
                }

                tp.update(createValidStatus(buyerTerms))

                let channels = new Map()

                channels.set(0, {
                    value: 5000
                })

                tp.peers = new Map()
                tp.peers.set(0, {
                    connection: {
                        innterState: -1
                    }
                })
                tp._createOutputsAndDownloadInfoMap(channels)
            }, TorrentPlugin.InvalidPeerInnerStateError)
        })

        it('throws on terms mismatch', function(){
            assert.throws(function(){
                let buyerTerms = {
                    maxPrice: 100,
                    maxLock: 5,
                    minNumberOfSellers: 1,
                    maxContractFeePerKb: 20000
                }

                tp.update(createValidStatus(buyerTerms))

                let channels = new Map()

                channels.set(0, {
                    value: 5000
                })

                tp.peers = new Map()

                let peer = {connection: {announcedModeAndTermsFromPeer : {seller : {terms : {}}}}}

                peer.connection.innerState = INNER_STATE.PreparingContract
                peer.connection.announcedModeAndTermsFromPeer.seller.terms = {
                    minPrice: 100,
                    minLock: 5,
                    maxNumberOfSellers: 1,
                    minContractFeePerKb:50000
                }

                tp.peers.set(0, peer)
                tp._createOutputsAndDownloadInfoMap(channels)
            }, TorrentPlugin.TermsMismatchError)
        })

        it('throws on too many sellers', function(){
            assert.throws(function(){
                let buyerTerms = {
                    maxPrice: 100,
                    maxLock: 5,
                    minNumberOfSellers: 1,
                    maxContractFeePerKb: 20000
                }

                tp.update(createValidStatus(buyerTerms))

                let channels = new Map()

                tp.peers = new Map()

                let peer = {connection: {announcedModeAndTermsFromPeer : {seller : {terms : {}}}}}

                peer.connection.innerState = INNER_STATE.PreparingContract
                peer.connection.announcedModeAndTermsFromPeer.seller.terms = {
                    minPrice: 100,
                    minLock: 5,
                    maxNumberOfSellers: 1,
                    minContractFeePerKb:20000
                }

                tp.peers.set(0, peer)
                tp.peers.set(1, peer)

                channels.set(0, {
                    value: 5000
                })

                channels.set(1, {
                    value: 5000
                })

                tp._createOutputsAndDownloadInfoMap(channels)
            }, TorrentPlugin.TooManySellersError)
        })

        it('successfully creates downloadInfoMap', function(){
            let {tp, channels} = createValidState()

            let info = tp._createOutputsAndDownloadInfoMap(channels)

            assert.isAtLeast(info.contractOutputs.length, 1)
            assert.equal(info.contractOutputs.length, channels.size)
            assert.isAtMost(info.contractFeeRate, 20000)
            assert.equal(info.contractFeeRate, 15000)
            assert.equal(info.downloadInfoMap.size, channels.size)
            assert(info.downloadInfoMap.has(0))
            assert(info.downloadInfoMap.has(1))
        })
    })

    describe('_createStartDownloadingInfo', function() {
        it('returns rejected promise on invalid async signer callback', function(done){

            tp._createOutputsAndDownloadInfoMap = sinon.spy()

            let p = tp._createStartDownloadingInfo(null, null)

            p.then(function(){
                assert.fail()
                done()
            })
            .catch(function(err){
                assert.isTrue(err instanceof TorrentPlugin.InvalidArgumentError)
                assert.isFalse(tp._createOutputsAndDownloadInfoMap.called)
                done()
            })
        })

        it('calls createOutputsAndDownloadInfoMap, and asyncSigner', function(done){

            let outputs = [1,2]
            let fee = 1000

            let map = 'map'
            let channels = 'channels'
            let contract = 'contract'

            tp._createOutputsAndDownloadInfoMap = sinon.spy(function(ch){
                return {
                    contractOutputs: outputs,
                    contractFeeRate: fee,
                    downloadInfoMap: map
                }
            })

            let signer = sinon.spy(function(){
                return new Promise(function(resolve, reject) {
                    resolve(contract)
                })
            })

            let p = tp._createStartDownloadingInfo(channels, signer)

            p.then(function(info){
                assert.isTrue(tp._createOutputsAndDownloadInfoMap.calledWith(channels))
                assert.isTrue(signer.calledWith(outputs, fee))

                assert.equal(info.contract, contract)
                assert.equal(info.map, map)
                done()
            })
            .catch(function(err){
                assert.fail()
                done()
            })
        })
    })
})
