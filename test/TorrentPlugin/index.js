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

describe('TorrentPlugin', function(){
    let tp

    beforeEach(function(){
        let status = createValidStatus()
        let plugin = {start_downloading : function(){}}
        let peers = new Map()
        let infoHash = "12345"
        tp = new TorrentPlugin(status, plugin, peers, infoHash)
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
    })
})
