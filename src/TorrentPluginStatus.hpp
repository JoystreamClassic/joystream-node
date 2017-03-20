/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

#ifndef JOYSTREAM_NODE_TORRENT_PLUGIN_STATUS_HPP
#define JOYSTREAM_NODE_TORRENT_PLUGIN_STATUS_HPP

#include <nan.h>

namespace joystream {
namespace extension {
namespace status {
  struct TorrentPlugin;
}
}
namespace node {
namespace torrent_plugin_status {

  NAN_MODULE_INIT(Init);

  v8::Local<v8::Object> encode(const extension::status::TorrentPlugin & t);

}
}
}

#endif // JOYSTREAM_NODE_TORRENT_PLUGIN_STATUS_HPP
