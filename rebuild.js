var fs = require('fs-extra')
var ini = require('ini')
var BuildSystem = require('cmake-js').BuildSystem

// read options and settings from conaninfo.txt
try {
    var conaninfo = ini.parse(fs.readFileSync('conaninfo.txt', 'utf-8'))
} catch(e){
    console.log('unable to read conaninfo.txt')
    process.exit(-1)
}

//conan uses values x86 and x86_64 for 32bit and 64bit architecture
var mapping = {
    'x86_64' : 'x64',
    'x86' : 'ia32'
}

// convert atch to cmake-js/node-gyp notation
var arch = mapping[conaninfo.settings.arch] || conaninfo.settings.arch

var options = {
    runtime: conaninfo.options.runtime,
    runtimeVersion: conaninfo.options.runtime_version,
    arch: arch,
    debug: conaninfo.settings.build_type == "Debug" ? true : false
}

// configure build system
var bs = new BuildSystem(options)

// rebuild() the addon instead of just compile(), to avoid issues when switching runtimes
bs.rebuild().then(function(){
    // on windows with visual studio, .node files is produced in build/bin
    // instead of build/Release. copy it to where the bindings module can find it
    fs.copy('build/bin/JoyStreamAddon.node', 'build/JoyStreamAddon.node', function(err) {
      process.exit()
    })

}).catch(function(err){
    console.log(err)
    process.exit(-1)
})
