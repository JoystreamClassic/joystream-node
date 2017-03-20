/*  eslint new-cap: ["error", { "newIsCap": false }]  */
'user strict'

const assert = require('assert')
const TransactionWatcher = require('./TransactionWatcher')
// const co = require('co')
const bcoin = require('bcoin')

// set default network to be testnet
bcoin.set('testnet')

class SPVWallet {
  constructor (options = {}) {
    options.prefix = options.prefix || __dirname
    this.node = new bcoin.spvnode(options)
    this.watcher = new TransactionWatcher(this.node.pool, true)

    // make sure to handle error event or app will exit with unhandled Error
    if (typeof options.onError === 'function') {
      this.node.on('error', options.onError)
    } else {
      this.node.on('error', (err) => {
        console.log(err.message)
      })
    }
  }

  async start () {
    assert(!this.node.wallet)

    await this.node.open()

    assert(this.node.wallet)

    await this.node.connect()

    await this.node.startSync()
  }

  open () {
    return this.node.open()
  }

  connect () {
    return this.node.connect()
  }

  disconnect () {
    return this.node.disconnect()
  }

  // must be connected to start syncing
  startSync () {
    this.node.startSync()
  }

  stopSync () {
    this.node.stopSync()
  }

  async getBalance () {
    return await this.node.wallet.getBalance()
  }

  getAddress () {
    return this.node.wallet.getAddress()
  }

  async getAllAddresses () {
    let account = await this.node.wallet.getAccount('default')

    // List all receive addresses of the default account
    let i
    let addresses = []
    for (i = 0; i < account.receiveDepth; i++) {
      addresses.push(account.deriveReceive(i).getAddress())
    }

    return addresses
  }

  generatePrivateKey () {
    return bcoin.ec.generatePrivateKey()
  }

  //  transaction hash (not reversed little endian txid) hex string or Buffer
  awaitTransaction (hash, timeout) {
    return this.watcher.watch(hash, timeout)
  }

  // Broadcast a signed immutable transaction (settlements, refunds)
  // Accepts hex encoded string, Buffer or bcoin.TX
  async broadcast (tx) {
    if (!(tx instanceof bcoin.primitives.TX)) {
      tx = bcoin.primitives.TX.fromRaw(tx)
    }
    return await this.node.broadcast(tx)
  }

  close () {
    return this.node.close()
  }

  // Create, fund and sign a transaction from array of outputs
  // (commitments of a joystream contract)
  createAndSend (outputs, feeRate) {
    // return the transaction (promise)
    return this.node.wallet.send({
      sort: false,
      outputs: outputs,
      rate: feeRate
    })
  }
}

module.exports = SPVWallet
