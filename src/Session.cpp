/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

#include "Session.hpp"
#include "libtorrent-node/utils.hpp"
#include "SellerTerms.hpp"
#include "BuyerTerms.hpp"
#include <protocol_session/protocol_session.hpp>

namespace joystream {
namespace node {
namespace session {

NAN_MODULE_INIT(Init) {

  // protocol_session::SessionMode
  {
    #define SET_SESSION_MODE(o, name) SET_VAL(o, #name, encode(protocol_session::SessionMode::name))

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    SET_SESSION_MODE(o, not_set);
    SET_SESSION_MODE(o, buying);
    SET_SESSION_MODE(o, selling);
    SET_SESSION_MODE(o, observing);

    SET_VAL(target, "SessionMode", o);
  }

  // protocol_session::SessionState
  {
    #define SET_SESSION_STATE(o, name) SET_VAL(o, #name, encode(protocol_session::SessionState::name))

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    SET_SESSION_STATE(o, stopped);
    SET_SESSION_STATE(o, started);
    SET_SESSION_STATE(o, paused);

    SET_VAL(target, "SessionState", o);
  }

  // protocol_session::BuyingState
  {
    #define SET_BUYING_STATE(o, name) SET_VAL(o, #name, encode(protocol_session::BuyingState::name))

    v8::Local<v8::Object> o = Nan::New<v8::Object>();

    SET_BUYING_STATE(o, sending_invitations);
    SET_BUYING_STATE(o, downloading);
    SET_BUYING_STATE(o, download_completed);

    SET_VAL(target, "BuyingState", o);
  }

}

v8::Local<v8::Uint32> encode(const protocol_session::SessionMode mode) {

  uint32_t v = 0;

  switch(mode) {
    case protocol_session::SessionMode::not_set: v = 0; break;
    case protocol_session::SessionMode::buying: v = 1; break;
    case protocol_session::SessionMode::selling: v = 2; break;
    case protocol_session::SessionMode::observing: v = 3; break;
  }

  return Nan::New<v8::Uint32>(v);
}

v8::Local<v8::Uint32> encode(const protocol_session::SessionState state) {

  uint32_t v = 0;

  switch(state) {
    case protocol_session::SessionState::stopped: v = 0; break;
    case protocol_session::SessionState::started: v = 1; break;
    case protocol_session::SessionState::paused: v = 2; break;
  }

  return Nan::New<v8::Uint32>(v);
}

v8::Local<v8::Object> encode(const protocol_session::status::Selling & s) {

  v8::Local<v8::Object> o = Nan::New<v8::Object>();

  SET_VAL(o, "terms", seller_terms::encode(s.terms));

  return o;
}

v8::Local<v8::Uint32> encode(const protocol_session::BuyingState & state) {

  uint32_t v = 0;

  switch(state) {
    case protocol_session::BuyingState::sending_invitations: v = 0; break;
    case protocol_session::BuyingState::downloading: v = 1; break;
    case protocol_session::BuyingState::download_completed: v = 2; break;
  }

  return Nan::New<v8::Uint32>(v);
}

v8::Local<v8::Object> encode(const protocol_session::status::Buying<libtorrent::tcp::endpoint> & b) {

  v8::Local<v8::Object> o = Nan::New<v8::Object>();

  SET_VAL(o, "state", encode(b.state));
  SET_VAL(o, "terms", buyer_terms::encode(b.terms));
  //auto v = std_lib_utils(b.sellers, &libtorrent::node::endpoint::encode, &encode);
  //SET_VAL(o, "sellers", v)

  // Maps connection identifier to connection
  //std::map<ConnectionIdType, Seller<ConnectionIdType>> sellers;

  return o;
}

v8::Local<v8::Object> encode(const protocol_session::status::Session<libtorrent::tcp::endpoint> & s) {

  v8::Local<v8::Object> o = Nan::New<v8::Object>();

  SET_VAL(o, "mode", encode(s.mode));
  SET_VAL(o, "state", encode(s.state));

  // Adding a tiny bit of safety here

  if(s.mode == protocol_session::SessionMode::selling)
    SET_VAL(o, "selling", encode(s.selling));
  else if(s.mode == protocol_session::SessionMode::buying)
    SET_VAL(o, "buying", encode(s.buying));

  return o;
}

}
}
}
