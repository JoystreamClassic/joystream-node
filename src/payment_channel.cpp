#include "payment_channel.hpp"
#include "PubKeyHash.hpp"
#include "PublicKey.hpp"
#include "PrivateKey.hpp"
#include "Signature.hpp"
#include "OutPoint.hpp"
#include "Transaction.hpp"

#include <common/PrivateKey.hpp>
#include <common/KeyPair.hpp>

#include "libtorrent-node/utils.hpp"
#include "buffers.hpp"

#include <paymentchannel/Commitment.hpp>
#include <paymentchannel/Payee.hpp>

#include <CoinCore/CoinNodeData.h>

namespace joystream {
namespace node {
namespace payment_channel {

  #define VALUE_KEY "value"
  #define PAYOR_KEY "payorSk"
  #define PAYEE_KEY "payeePk"
  #define LOCKTIME_KEY "locktime"

  NAN_MODULE_INIT(Init) {

    Nan::Set(target, Nan::New("commitmentToOutput").ToLocalChecked(),
      Nan::New<v8::FunctionTemplate>(commitment::CommitmentToOutput)->GetFunction());

    Nan::Set(target, Nan::New("createSettlementTransaction").ToLocalChecked(),
      Nan::New<v8::FunctionTemplate>(settlement::CreateSettlementTransaction)->GetFunction());
  }

namespace commitment {

  NAN_METHOD(CommitmentToOutput) {
    ARGUMENTS_REQUIRE_DECODED(0, commitment, paymentchannel::Commitment, decode)

    Coin::TxOut txout;

    try {
      txout = commitment.contractOutput();
    } catch(std::exception &e) {
      return Nan::ThrowError(e.what());
    }

    auto rawoutput = txout.getSerialized();

    info.GetReturnValue().Set(UCharVectorToNodeBuffer(rawoutput));
  }

  paymentchannel::Commitment decode(const v8::Local<v8::Value> &commitment) {
    if(!commitment->IsObject()){
        throw std::runtime_error("argument not an Object");
    }

    auto obj = ToV8<v8::Object>(commitment);

    auto value = GET_VAL(obj, VALUE_KEY);

    if(!value->IsNumber()){
      throw std::runtime_error("value is not a Number");
    }

    int64_t outputValue = ToNative<int64_t>(value); // Number satoshi

    if(outputValue < 0) {
      throw std::runtime_error("value is negative");
    }

    auto locktime = GET_VAL(obj, LOCKTIME_KEY);

    if(!locktime->IsNumber()){
      throw std::runtime_error("locktime is not a Number");
    }

    int32_t relativeLocktime = ToNative<int32_t>(locktime); // Number locktime counter;
    if(relativeLocktime < 0) {
      throw std::runtime_error("locktime value is negative");
    }

    auto payorSk = GET_VAL(obj, PAYOR_KEY); // private_key

    auto payeePk = GET_VAL(obj, PAYEE_KEY); // public_key

    return paymentchannel::Commitment(outputValue,
                                      private_key::decode(payorSk).toPublicKey(),
                                      public_key::decode(payeePk),
                                      //relative_locktime::decode(locktime)); //todo
                                      Coin::RelativeLockTime::fromTimeUnits(relativeLocktime));
  }

} // commitment namespace

namespace settlement {

  NAN_METHOD(CreateSettlementTransaction) {
    // TODO: implement decode method? ARGUMENTS_REQUIRE_DECODED(0, payee, paymentchannel::Payee, decode)

    ARGUMENTS_REQUIRE_NUMBER(0, numberOfPaymentsMade)
    ARGUMENTS_REQUIRE_NUMBER(1, refundLockTime)
    ARGUMENTS_REQUIRE_NUMBER(2, price)
    ARGUMENTS_REQUIRE_NUMBER(3, funds)
    ARGUMENTS_REQUIRE_NUMBER(4, settlementFee)
    ARGUMENTS_REQUIRE_DECODED(5, contractOutPoint, Coin::typesafeOutPoint, outpoint::decode)
    ARGUMENTS_REQUIRE_DECODED(6, payeeContractPrivKey, Coin::PrivateKey, private_key::decode)
    ARGUMENTS_REQUIRE_DECODED(7, payeeFinalPkHash, Coin::PubKeyHash, pubkey_hash::decode)
    ARGUMENTS_REQUIRE_DECODED(8, payorContractPk, Coin::PublicKey, public_key::decode)
    ARGUMENTS_REQUIRE_DECODED(9, payorFinalPkHash, Coin::PubKeyHash, pubkey_hash::decode)
    ARGUMENTS_REQUIRE_DECODED(10, lastValidPayorPaymentSignature, Coin::Signature, signature::decode)

    paymentchannel::Payee payee(numberOfPaymentsMade,
                                Coin::RelativeLockTime::fromTimeUnits(refundLockTime),
                                price,
                                funds,
                                settlementFee,
                                contractOutPoint,
                                Coin::KeyPair(payeeContractPrivKey),
                                payeeFinalPkHash,
                                payorContractPk,
                                payorFinalPkHash,
                                lastValidPayorPaymentSignature);

    try {

      info.GetReturnValue().Set(transaction::encode(payee.lastPaymentTransaction()));

    } catch(std::exception &e) {
      return Nan::ThrowError(e.what());
    }

  }
} // settlement namespace

}}}
