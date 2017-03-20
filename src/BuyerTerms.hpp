/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 9 2017
 */

#ifndef JOYSTREAM_NODE_BUYER_TERMS_HPP
#define JOYSTREAM_NODE_BUYER_TERMS_HPP

#include <nan.h>

namespace joystream {
namespace protocol_wire {
  class BuyerTerms;
}
namespace node {
namespace buyer_terms {

  /**
   * Encoding o
   * {Number} o.maxPrice - maximum unit price in sats.
   * {Number} o.maxLock - maximum lock time in seconds.
   * {Number} o.minNumberOfSellers - min. number of sellers.
   * {Number} o.maxContractFeePerKb - max. pr. Kb contract tx fee in stats.
   */

  v8::Local<v8::Value> encode(const protocol_wire::BuyerTerms & terms);
  protocol_wire::BuyerTerms decode(const v8::Local<v8::Value> & o);

}
}
}

#endif // JOYSTREAM_NODE_BUYER_TERMS_HPP
