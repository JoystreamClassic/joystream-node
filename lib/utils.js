
/**
 * Test if the seller and buyer terms are a match.
 * @param {object} The buyer terms
 * @param {object} The seller terms
 * @return {bool} True if it is a match or false if it isn't
 */
function areTermsMatching (buyerTerms, sellerTerms) {

  if (buyerTerms.maxPrice >= sellerTerms.minPrice &&
      buyerTerms.maxLock >= sellerTerms.minLock &&
      buyerTerms.minNumberOfSellers <= sellerTerms.maxNumberOfSellers &&
      buyerTerms.maxContractFeePerKb >= sellerTerms.minContractFeePerKb
  ) {
    return true
  } else {
    return false
  }
}

module.exports = { areTermsMatching }
