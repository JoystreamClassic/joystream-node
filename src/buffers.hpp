#ifndef JOYSTREAM_NODE_BUFFERS_HPP
#define JOYSTREAM_NODE_BUFFERS_HPP

#include <nan.h>

namespace joystream {
namespace node {

// Utility Methods to convert between node Buffer and std::vector<unsigned char>

/**
 * @brief Copies data from a node Buffer into a new std::vector<unsigned char>
 * @param {v8::Local<v8::Value>} value
 * @throws std::runtime_error if value not a node buffer
 * @return std::vector<unsigned char>
 */
std::vector<unsigned char> NodeBufferToUCharVector(v8::Local<v8::Value>);

/**
 * @brief Converts hex encoded data into a std::vector<unsigned char>
 * @param {v8::Local<v8::Value>} value
 * @throws std::runtime_error if value not a string
 * @return std::vector<unsigned char>
 */
 std::vector<unsigned char> StringToUCharVector(v8::Local<v8::Value>);

/**
 * @brief Copies data from a uchar_vector into a new node Buffer
 * @param std::vector<unsigned char> data
 * @return {v8::Local<v8::Value>} node Buffer
 */
v8::Local<v8::Object> UCharVectorToNodeBuffer(std::vector<unsigned char>&);

}
}

#endif
