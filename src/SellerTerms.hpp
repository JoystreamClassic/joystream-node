/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 11 2017
 */

#ifndef JOYSTREAM_NODE_SELLER_TERMS_HPP
#define JOYSTREAM_NODE_SELLER_TERMS_HPP

#include <nan.h>
#include <protocol_wire/protocol_wire.hpp>

namespace joystream {
namespace protocol_wire {
  class SellerTerms;
}
namespace node {
namespace seller_terms {

  /**
   * Encoding o
   * {Number} o.minPrice - min. unit price in sats.
   * {Number} o.minLock - min. lock time in seconds.
   * {Number} o.maxNumberOfSellers - max. number of sellers.
   * {Number} o.minContractFeePerKb - min. pr. Kb contract tx fee in sats.
   * {Number} o.settlementFee - (total) settlement tx fee in sats.
   */

  v8::Local<v8::Value> encode(const protocol_wire::SellerTerms & terms);
  protocol_wire::SellerTerms decode(const v8::Local<v8::Value> & o);

}
}
}

#endif // JOYSTREAM_NODE_SELLER_TERMS_HPP
