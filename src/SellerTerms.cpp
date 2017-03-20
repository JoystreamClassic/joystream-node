/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 11 2017
 */

#include "SellerTerms.hpp"
#include "libtorrent-node/utils.hpp"

#include <protocol_wire/protocol_wire.hpp>

#define MIN_PRICE_KEY "minPrice"
#define MIN_LOCK_KEY "minLock"
#define MAX_NUMBER_OF_SELLERS_KEY "maxNumberOfSellers"
#define MIN_CONTRACT_FEE_PER_KB_KEY "minContractFeePerKb"
#define SETTLEMENT_FEE_KEY "settlementFee"

namespace joystream {
namespace node {
namespace seller_terms {

v8::Local<v8::Value> encode(const protocol_wire::SellerTerms & terms) {

  v8::Local<v8::Object> o = Nan::New<v8::Object>();

  SET_NUMBER(o, MIN_PRICE_KEY, terms.minPrice());
  SET_UINT32(o, MIN_LOCK_KEY, terms.minLock());
  SET_UINT32(o, MAX_NUMBER_OF_SELLERS_KEY, terms.maxSellers());
  SET_NUMBER(o, MIN_CONTRACT_FEE_PER_KB_KEY, terms.minContractFeePerKb());
  SET_NUMBER(o, SETTLEMENT_FEE_KEY, terms.settlementFee());

  return o;
}

protocol_wire::SellerTerms decode(const v8::Local<v8::Value> & v) {

  // Convert to object
  if(!v->IsObject())
    throw std::runtime_error("Argument must be dictionary.");

  v8::Local<v8::Object> o = v->ToObject();

  return protocol_wire::SellerTerms(GET_INT64(o, MIN_PRICE_KEY),
                                    GET_UINT32(o, MIN_LOCK_KEY),
                                    GET_UINT32(o, MAX_NUMBER_OF_SELLERS_KEY),
                                    GET_INT64(o, MIN_CONTRACT_FEE_PER_KB_KEY),
                                    GET_INT64(o, SETTLEMENT_FEE_KEY));
}

}
}
}
