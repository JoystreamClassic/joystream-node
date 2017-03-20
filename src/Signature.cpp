/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 3 2017
 */

#include "Signature.hpp"
#include "buffers.hpp"

#include <common/Signature.hpp>

namespace joystream {
namespace node {
namespace signature {

v8::Local<v8::Object> encode(const Coin::Signature & sig) {
    auto raw = sig.rawDER();
    return UCharVectorToNodeBuffer(raw);
}

}
}
}
