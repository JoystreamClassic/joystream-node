/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

#include "TorrentPluginStatus.hpp"
#include "libtorrent-node/utils.hpp"
#include "Session.hpp"
#include <extension/extension.hpp>

namespace joystream {
namespace node {
namespace torrent_plugin_status {

  NAN_MODULE_INIT(Init) {
    session::Init(target);
  }

  v8::Local<v8::Object> encode(const extension::status::TorrentPlugin & t) {

    v8::Local<v8::Object> o = Nan::New<v8::Object>();
    SET_VAL(o, "session", session::encode(t.session));
    return o;
  }

}
}
}
