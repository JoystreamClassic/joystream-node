/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

#include "PeerPluginStatus.hpp"
#include "libtorrent-node/utils.hpp"
#include "libtorrent-node/endpoint.hpp"
#include "BEPSupportStatus.hpp"
#include "Connection.hpp"

namespace joystream {
namespace node {
namespace peer_plugin_status {

NAN_MODULE_INIT(Init) {
  bep_support_status::Init(target);
  connection::Init(target);
}

v8::Local<v8::Object> encode(const extension::status::PeerPlugin & s) {

  v8::Local<v8::Object> o = Nan::New<v8::Object>();

  SET_VAL(o, "endPoint", libtorrent::node::endpoint::encode(s.endPoint));
  SET_VAL(o, "peerBEP10SupportStatus", bep_support_status::encode(s.peerBEP10SupportStatus));
  SET_VAL(o, "peerBitSwaprBEPSupportStatus", bep_support_status::encode(s.peerBitSwaprBEPSupportStatus));

  if(s.connection)
    SET_VAL(o, "connection", connection::encode(s.connection.get()));

  return o;
}

}
}
}
