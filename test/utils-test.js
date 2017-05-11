/* global it, describe */
var utils = require('../dist/utils')
var assert = require('assert')

describe('Test utils methods', function () {
  describe('Test areTermsMatching method', function () {
    it('Terms should match', function () {
      let sellerTerms = {
        minPrice: 50,
        minLock: 1,
        maxNumberOfSellers: 10,
        minContractFeePerKb: 15000,
        settlementFee: 5000
      }
      let buyerTerms = {
        maxPrice: 100,
        maxLock: 5,
        minNumberOfSellers: 1,
        maxContractFeePerKb: 20000
      }
      assert(utils.areTermsMatching(buyerTerms, sellerTerms))
    })
    it('Price not matching', function () {
      let sellerTerms = {
        minPrice: 101,
        minLock: 1,
        maxNumberOfSellers: 10,
        minContractFeePerKb: 15000,
        settlementFee: 5000
      }
      let buyerTerms = {
        maxPrice: 100,
        maxLock: 5,
        minNumberOfSellers: 1,
        maxContractFeePerKb: 20000
      }
      assert(!utils.areTermsMatching(buyerTerms, sellerTerms))
    })
    it('Lock not matching', function () {
      let sellerTerms = {
        minPrice: 50,
        minLock: 6,
        maxNumberOfSellers: 10,
        minContractFeePerKb: 15000,
        settlementFee: 5000
      }
      let buyerTerms = {
        maxPrice: 100,
        maxLock: 5,
        minNumberOfSellers: 1,
        maxContractFeePerKb: 20000
      }
      assert(!utils.areTermsMatching(buyerTerms, sellerTerms))
    })
    it('Numbers of Seller not matching', function () {
      let sellerTerms = {
        minPrice: 50,
        minLock: 1,
        maxNumberOfSellers: 4,
        minContractFeePerKb: 15000,
        settlementFee: 5000
      }
      let buyerTerms = {
        maxPrice: 100,
        maxLock: 5,
        minNumberOfSellers: 5,
        maxContractFeePerKb: 20000
      }
      assert(!utils.areTermsMatching(buyerTerms, sellerTerms))
    })
    it('ContractFeePerKb not matching', function () {
      let sellerTerms = {
        minPrice: 50,
        minLock: 1,
        maxNumberOfSellers: 10,
        minContractFeePerKb: 20001,
        settlementFee: 5000
      }
      let buyerTerms = {
        maxPrice: 100,
        maxLock: 5,
        minNumberOfSellers: 1,
        maxContractFeePerKb: 20000
      }
      assert(!utils.areTermsMatching(buyerTerms, sellerTerms))
    })
  })
})
