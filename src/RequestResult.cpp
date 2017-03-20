/**
 * Copyright (C) JoyStream - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Bedeho Mender <bedeho.mender@gmail.com>, January 25 2017
 */

#include "RequestResult.hpp"
#include "detail/UnhandledCallbackException.hpp"
#include "libtorrent-node/utils.hpp"

#define UNWRAP_THIS(var) RequestResult * var = Nan::ObjectWrap::Unwrap<RequestResult>(info.This());

namespace joystream {
namespace node {

 Nan::Persistent<v8::Function> RequestResult::constructor;

 NAN_MODULE_INIT(RequestResult::Init) {

   // Create constructor function
   v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
   //tpl->SetClassName(Nan::New("RequestResult").ToLocalChecked());

   v8::Local<v8::ObjectTemplate> itpl = tpl->InstanceTemplate();
   itpl->SetInternalFieldCount(1);

   // Accessors are defined on instance
   Nan::SetAccessor(itpl, Nan::New("type").ToLocalChecked(), Type);
   Nan::SetAccessor(itpl, Nan::New("what").ToLocalChecked(), What);
   Nan::SetAccessor(itpl, Nan::New("message").ToLocalChecked(), Message);
   Nan::SetAccessor(itpl, Nan::New("category").ToLocalChecked(), Category);

   // Methods on prototype
   Nan::SetPrototypeMethod(tpl, "run", Run);

   constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());
   //Nan::Set(target, Nan::New("RequestResult").ToLocalChecked(), Nan::GetFunction(tpl).ToLocalChecked());
 }

 v8::Local<v8::Object> RequestResult::NewInstance(const extension::alert::RequestResult * alert) {

   // Create object using constructor
   NEW_OBJECT(constructor, o)

   // Set callback on wrapped object
   RequestResult * requestResult = Nan::ObjectWrap::Unwrap<RequestResult>(o);

   requestResult->_loadedCallback = alert->loadedCallback;
   requestResult->_type = alert->type();
   requestResult->_what = alert->what();
   requestResult->_message = alert->message();
   requestResult->_category = alert->category();

   return o;
 }

 NAN_METHOD(RequestResult::New) {

   NEW_OPERATOR_GUARD(info, constructor)

   (new RequestResult())->Wrap(info.This());

   RETURN(info.This())
 }

 NAN_METHOD(RequestResult::Run) {

   UNWRAP_THIS(requestResult)

    // Make callback, and catch any unhandled exceptions
    // the developer may have introduced. This is here to
    // prevent weird stack corruption we were seeing, which made
    // it near impossible to attribute observed behaviour to an unhandled exception.
    // The developer should correct code to not have unhandled exceptions.
    try {
        requestResult->_loadedCallback();
    } catch(const detail::UnhandledCallbackException & e) {

        v8::MaybeLocal<v8::String> exception_as_string = e.exception->ToString();

        Nan::ThrowError(exception_as_string.ToLocalChecked());

        //// Rethrow into nodejs environment?
        //Nan::FatalException(e.trap);
    }

   RETURN_VOID
 }

NAN_GETTER(RequestResult::Type) {

   RequestResult * requestResult = Nan::ObjectWrap::Unwrap<RequestResult>(info.Holder());

   v8::Local<v8::Number> type = Nan::New(requestResult->_type);

   RETURN(type)
}

 NAN_GETTER(RequestResult::What) {

   UNWRAP_THIS(requestResult)
   Nan::MaybeLocal<v8::String> what = Nan::New(requestResult->_what);
   RETURN(what.ToLocalChecked())
 }

 NAN_GETTER(RequestResult::Message) {

   UNWRAP_THIS(requestResult)
   Nan::MaybeLocal<v8::String> message = Nan::New(requestResult->_message);
   RETURN(message.ToLocalChecked())
 }

 NAN_GETTER(RequestResult::Category) {

   UNWRAP_THIS(requestResult)
   v8::Local<v8::Number> category = Nan::New(requestResult->_category);
   RETURN(category)
 }

}
}
