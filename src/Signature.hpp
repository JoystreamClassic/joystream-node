/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

#ifndef JOYSTREAM_NODE_SIGNATURE_HPP
#define JOYSTREAM_NODE_SIGNATURE_HPP

#include <nan.h>

namespace Coin {
  class Signature;
}

namespace joystream {
namespace node {
namespace signature {

    /* @brief Creates js representation of representing a signature.
     * @param {const Coin::Signature&}
     * @return v8::Local<v8::Object> - node Buffer
     * @throws
     */
    v8::Local<v8::Object> encode(const Coin::Signature &);

}
}
}

#endif // JOYSTREAM_NODE_SIGNATURE_HPP
