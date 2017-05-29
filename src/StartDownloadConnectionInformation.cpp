/**
* Copyright (C) JoyStream - All Rights Reserved
* Unauthorized copying of this file, via any medium is strictly prohibited
* Proprietary and confidential
* Written by Bedeho Mender <bedeho.mender@gmail.com>, January 19 2017
*/

#include "StartDownloadConnectionInformation.hpp"
#include "SellerTerms.hpp"
#include "PrivateKey.hpp"
#include "PubKeyHash.hpp"
#include <extension/Common.hpp> //std::hash<endpoint> specialization
#include "libtorrent-node/endpoint.hpp"
#include "libtorrent-node/peer_id.hpp"
#include "libtorrent-node/utils.hpp"

#define SELLER_TERMS_KEY "sellerTerms"
#define INDEX_KEY "index"
#define VALUE_KEY "value"
#define BUYER_CONTRACT_SK_KEY "buyerContractSk"
#define BUYER_FINAL_PK_HASH_KEY "buyerFinalPkHash"

namespace joystream {
namespace node {
namespace StartDownloadConnectionInformation {

NAN_MODULE_INIT(Init) {

  // export PeerNotReadyToStartDownloadCause

}

v8::Local<v8::Object> encode(const protocol_session::StartDownloadConnectionInformation & inf) {

  v8::Local<v8::Object> o = Nan::New<v8::Object>();

  SET_VAL(o, SELLER_TERMS_KEY, seller_terms::encode(inf.sellerTerms));
  SET_UINT32(o, INDEX_KEY, inf.index);
  SET_NUMBER(o, VALUE_KEY, inf.value);
  SET_VAL(o, BUYER_CONTRACT_SK_KEY, private_key::encode(inf.buyerContractKeyPair.sk()));
  SET_VAL(o, BUYER_FINAL_PK_HASH_KEY, pubkey_hash::encode(inf.buyerFinalPkHash));

  return o;
}

protocol_session::StartDownloadConnectionInformation decode(const v8::Local<v8::Value> & v) {

  v8::Local<v8::Object> o = ToV8<v8::Object>(v);

  protocol_wire::SellerTerms terms(seller_terms::decode(GET_VAL(o, SELLER_TERMS_KEY)));
  Coin::PrivateKey sk(private_key::decode(GET_VAL(o, BUYER_CONTRACT_SK_KEY)));
  Coin::PubKeyHash pubKeyHash(pubkey_hash::decode(GET_VAL(o, BUYER_FINAL_PK_HASH_KEY)));

  return protocol_session::StartDownloadConnectionInformation(terms,
                                                              GET_UINT32(o, INDEX_KEY),
                                                              GET_INT64(o, VALUE_KEY),
                                                              Coin::KeyPair(sk),
                                                              pubKeyHash);
}

}// StartDownloadConnectionInformation namespace

namespace PeerToStartDownloadInformationMap {

//v8::Local<v8::Object> encode(const protocol_session::PeerToStartDownloadInformationMap<libtorrent::peer_id> & information) {
//}

protocol_session::PeerToStartDownloadInformationMap<libtorrent::peer_id> decode(const v8::Local<v8::Value> & v) {

  return std_lib_utils::decode<libtorrent::peer_id, protocol_session::StartDownloadConnectionInformation>(v,
                                                                                                             &libtorrent::node::peer_id::decode,
                                                                                                             &joystream::node::StartDownloadConnectionInformation::decode);
}

}


}
}
