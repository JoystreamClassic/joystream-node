/* global it, describe */
var Torrent = require('../../dist/Torrent')
var assert = require('chai').assert
var sinon = require('sinon')

describe('Torrent class', function () {

  // Mock handle and plugin
  var handle = new Object()
  handle.infoHash = function () { return '65168b94ba4f425dfbf2c42819ca3e9c26cd08c6'}
  var plugin = new Object()

  it('Torrent create second info hash', function () {
    var torrent = new Torrent(handle, plugin)

    assert(torrent.secondaryInfoHash)
  })

  /*it('Torrent test refreshJoyStreamPeerList', function () {
    var torrent = new Torrent(handle, plugin)

  })*/
})
