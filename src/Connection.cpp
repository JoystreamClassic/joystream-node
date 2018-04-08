/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 2 2017
 */

#include "Connection.hpp"
#include "libtorrent-node/utils.hpp"
#include "libtorrent-node/endpoint.hpp"
#include "libtorrent-node/peer_id.hpp"
#include "SellerTerms.hpp"
#include "BuyerTerms.hpp"
#include "OutPoint.hpp"
#include "Signature.hpp"
#include "PublicKey.hpp"
#include "PubKeyHash.hpp"

namespace joystream {
namespace node {
namespace connection {

  typedef std::pair<std::type_index, const char *> TypeInfo;
  #define STATE_TO_TYPE_INFO(name) (std::make_pair(std::type_index(typeid(protocol_statemachine::name)), #name))

  static const std::array<TypeInfo, 12> InnerStateTypeInfo = {

      // Initial picker state, in practice we should never be here given
      // current behaviour of plugin
      STATE_TO_TYPE_INFO(ChooseMode),

      // * Observing
      STATE_TO_TYPE_INFO(Observing),

      // * Selling
      STATE_TO_TYPE_INFO(ReadyForInvitation),
      STATE_TO_TYPE_INFO(ReadyToSendTestPayload),
      STATE_TO_TYPE_INFO(Invited),
      // (active selling state)
      STATE_TO_TYPE_INFO(WaitingToStart),
      // *StartedSelling
      STATE_TO_TYPE_INFO(ServicingPieceRequests),

      // * Buying
      STATE_TO_TYPE_INFO(ReadyToInviteSeller),
      STATE_TO_TYPE_INFO(TestingSellerSpeed),
      STATE_TO_TYPE_INFO(WaitingForSellerToJoin),
      // ** Seller has joined
      STATE_TO_TYPE_INFO(PreparingContract),
      // (active buying state)
      STATE_TO_TYPE_INFO(RequestingPieces)
  };

  NAN_MODULE_INIT(InitInnerStateTypes);

  NAN_MODULE_INIT(Init) {

    InitInnerStateTypes(target);

  }

  NAN_MODULE_INIT(InitInnerStateTypes) {

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    for(std::size_t i = 0;i < InnerStateTypeInfo.size();i++)
      SET_NUMBER(o, InnerStateTypeInfo[i].second, (uint32_t)i);


    SET_VAL(target, "InnerStateType", o);
  }

  v8::Local<v8::Uint32> encode(const std::type_index & index){

    for(std::size_t i = 0;i < InnerStateTypeInfo.size();i++) {

      if(InnerStateTypeInfo[i].first == index)
        return Nan::New<v8::Uint32>((uint32_t)i);
    }

    // Should never get here, means our code is out of synch
    // with structure of statemachine. We throw exception to detect, since
    // bindings never used in debug mode. This *ugly* code is the price of no types :/
    throw std::runtime_error("out of synch with state machine, bad build!");
  }

  v8::Local<v8::Object> encode(const protocol_statemachine::AnnouncedModeAndTerms & a) {

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    switch(a.modeAnnounced()) {
      case protocol_statemachine::ModeAnnounced::none:

        SET_BOOL(o, "none", true);
        break;

      case protocol_statemachine::ModeAnnounced::observe:

        SET_BOOL(o, "observer", true);
        break;

      case protocol_statemachine::ModeAnnounced::sell:

        {
          v8::Local<v8::Object> s = Nan::New<v8::Object>();
          SET_VAL(s, "terms", seller_terms::encode(a.sellModeTerms()));
          SET_NUMBER(s, "index", a.index());

          SET_VAL(o, "seller", s);
        }

        break;

      case protocol_statemachine::ModeAnnounced::buy:

        {

          v8::Local<v8::Object> s = Nan::New<v8::Object>();
          SET_VAL(s, "terms", buyer_terms::encode(a.buyModeTerms()));

          SET_VAL(o, "buyer", s);
        }

        break;
    }

    return o;
  }

  v8::Local<v8::Object> encode(const paymentchannel::Payor & payor) {

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    SET_NUMBER(o, "price", payor.price());
    SET_NUMBER(o, "numberOfPaymentsMade", payor.numberOfPaymentsMade());
    SET_NUMBER(o, "funds", payor.funds());
    SET_NUMBER(o, "settlementFee", payor.settlementFee());
    SET_NUMBER(o, "refundLockTime", payor.refundLockTime().counter());
    SET_VAL(o, "anchor", outpoint::encode(payor.anchor()));
    SET_VAL(o, "sellerContractPk", public_key::encode(payor.payeeContractPk()));

    return o;
  }

  v8::Local<v8::Object> encode(const paymentchannel::Payee & payee) {

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    SET_NUMBER(o, "price", payee.price());
    SET_NUMBER(o, "numberOfPaymentsMade", payee.numberOfPaymentsMade());
    SET_NUMBER(o, "funds", payee.numberOfPaymentsMade());
    SET_NUMBER(o, "settlementFee", payee.settlementFee());
    SET_NUMBER(o, "refundLockTime", payee.lockTime().counter());
    SET_VAL(o, "anchor", outpoint::encode(payee.contractOutPoint()));
    SET_VAL(o, "lastValidPayorPaymentSignature", signature::encode(payee.lastValidPayorPaymentSignature()));
    SET_VAL(o, "buyerContractPk", public_key::encode(payee.payorContractPk()));
    SET_VAL(o, "buyerFinalPkHash", pubkey_hash::encode(payee.payorFinalPkHash()));

    return o;
  }

  v8::Local<v8::Object> encode(const joystream::protocol_session::status::Connection<libtorrent::peer_id>& c) {

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    SET_VAL(o, "pid", libtorrent::node::peer_id::encode(c.connectionId));

    // machine
    SET_VAL(o, "innerState", encode(c.machine.innerStateTypeIndex));
    SET_VAL(o, "payor", encode(c.machine.payor));
    SET_VAL(o, "payee", encode(c.machine.payee));
    SET_VAL(o, "announcedModeAndTermsFromPeer", encode(c.machine.announcedModeAndTermsFromPeer));
    SET_NUMBER(o, "latency", c.machine.latency);

    //std::queue<uint32_t> downloadedValidPieces;

    return o;
  }

}
}
}
