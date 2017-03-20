/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 2 2017
 */

#include "BEPSupportStatus.hpp"
#include "libtorrent-node/utils.hpp"
#include <extension/extension.hpp>

namespace joystream {
namespace node {
namespace bep_support_status {

  NAN_MODULE_INIT(Init) {

    v8::Local<v8::Object> object = Nan::New<v8::Object>();

    #define SET_BEP_SUPPORT_STATUS(name) SET_VAL(object, #name, encode(extension::BEPSupportStatus::name));

    SET_BEP_SUPPORT_STATUS(unknown);
    SET_BEP_SUPPORT_STATUS(supported);
    SET_BEP_SUPPORT_STATUS(not_supported);

    SET_VAL(target, "BEPSupportStatus", object);
  }

  v8::Local<v8::Uint32> encode(extension::BEPSupportStatus status) {

    #define BET_SUPPORT_CASE(name) case extension::BEPSupportStatus::name:  v = 0; break;

    uint32_t v = 0;

    switch(status) {
      BET_SUPPORT_CASE(unknown)
      BET_SUPPORT_CASE(supported)
      BET_SUPPORT_CASE(not_supported)
    }

    return Nan::New<v8::Uint32>(v);
  }

}
}
}
