/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 9 2017
 */

#include "BuyerTerms.hpp"
#include "libtorrent-node/utils.hpp"

#include <protocol_wire/protocol_wire.hpp>

#define MAX_PRICE_KEY "maxPrice"
#define MAX_LOCK_KEY "maxLock"
#define MIN_NUMBER_OF_SELLERS_KEY "minNumberOfSellers"
#define MAX_CONTRACT_FEE_PER_KB_KEY "maxContractFeePerKb"

namespace joystream {
namespace node {
namespace buyer_terms {

v8::Local<v8::Value> encode(const protocol_wire::BuyerTerms & terms) {

  v8::Local<v8::Object> o = Nan::New<v8::Object>();

  SET_NUMBER(o, MAX_PRICE_KEY, terms.maxPrice());
  SET_UINT32(o, MAX_LOCK_KEY, terms.maxLock());
  SET_UINT32(o, MIN_NUMBER_OF_SELLERS_KEY, terms.minNumberOfSellers());
  SET_NUMBER(o, MAX_CONTRACT_FEE_PER_KB_KEY, terms.maxContractFeePerKb());

  return o;
}

protocol_wire::BuyerTerms decode(const v8::Local<v8::Value> & v) {

  if(!v->IsObject())
    throw std::runtime_error("Argument must be dictionary.");

  // Convert to object
  v8::Local<v8::Object> o = v->ToObject();

  return protocol_wire::BuyerTerms(GET_INT64(o, MAX_PRICE_KEY),
                                   GET_UINT32(o, MAX_LOCK_KEY),
                                   GET_UINT32(o, MIN_NUMBER_OF_SELLERS_KEY),
                                   GET_INT64(o, MAX_CONTRACT_FEE_PER_KB_KEY));
}

}
}
}
