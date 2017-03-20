/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, February 2 2017
 */

#include <nan.h>

namespace joystream {
namespace extension {
    enum class BEPSupportStatus;
}
namespace node {
namespace bep_support_status {

  NAN_MODULE_INIT(Init);

  v8::Local<v8::Uint32> encode(extension::BEPSupportStatus status);
}
}
}
