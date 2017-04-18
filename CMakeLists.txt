cmake_minimum_required(VERSION 2.8)

project (JoyStreamAddon)

include(conanbuildinfo.cmake)
conan_basic_setup()

set(CMAKE_POSITION_INDEPENDENT_CODE ON)

include_directories(${CMAKE_JS_INC})

# cmake-js cannot find the nan headers when our package is installed
# in parallel to it. This happens when pacakge is being installed as
# a dependency as opposed to just running npm install inside the package
include_directories("../nan/")

file(GLOB_RECURSE JOYSTREAM_SOURCE_FILES "src/*.cpp")

add_library(JoyStreamAddon SHARED ${JOYSTREAM_SOURCE_FILES})
set_target_properties(JoyStreamAddon PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(JoyStreamAddon ${CONAN_LIBS} ${CMAKE_JS_LIB})
