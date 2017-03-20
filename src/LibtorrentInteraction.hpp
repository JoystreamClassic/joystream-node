/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 19 2017
 */

 #ifndef JOYSTREAM_NODE_LIBTORRENTINTERACTION_HPP
 #define JOYSTREAM_NODE_LIBTORRENTINTERACTION_HPP

#include <nan.h>

#include <extension/extension.hpp> // cannot forward declare extension::TorrentPlugin::LibtorrentInteraction

namespace joystream {
namespace extension {
  enum class LibtorrentInteraction;
}
namespace node {
namespace libtorrent_interaction {

  // Exports object called `LibtorrentInteraction` object, which maps
  // extension::LibtorrentInteraction enums, as strings, to integers.
  NAN_MODULE_INIT(Init);

  /**
   * Encoding as Number
   */

  v8::Local<v8::Value> createValue(extension::TorrentPlugin::LibtorrentInteraction interaction);
  extension::TorrentPlugin::LibtorrentInteraction fromValue(const v8::Local<v8::Value> & v);

}
}
}

#endif // JOYSTREAM_NODE_LIBTORRENTINTERACTION_HPP
