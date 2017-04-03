var fs = require('fs-extra')
var rimraf = require('rimraf')
var BuildSystem = require('cmake-js').BuildSystem
var spawn = require('child_process').spawn
var minimist = require('minimist')
var debug = require('debug')('JoyStreamAddon')

function clean() {
    try {
        fs.unlinkSync('./conaninfo.txt')
        fs.unlinkSync('./conanbuildinfo.cmake')
        rimraf.sync('./build/')
    } catch(e){}
}

function getRuntimeAndVersion() {
    // check command line args for runtime and runtime_version (both must be provided)
    // arch and debug
    // if not.. fallback to (process.versions.node)
    return new Promise(function(resolve, reject){
        var options = minimist(process.argv.slice(2),{boolean:true});

        // build with user specified options if any option is specified
        if(options.runtime || options.runtime_version) {
            if(!options.runtime || !options.runtime_version) {
                return reject('Error: runtime and runtime_version options must be specified together')
            } else {
                resolve(options)
            }
        } else {
            // build for version and arch of node running npm script
            resolve({
                runtime: 'node',
                runtime_version: process.versions.node,
                arch: process.arch,
                debug: options.debug
            })
        }

    })
}

function conanInstall(options) {
    debug('conan install with options:' + options)

    var args = ['install', '.', '--build=missing']
    args.push("-oruntime=" + options.runtime)
    args.push("-oruntime_version=" + options.runtime_version)

    var mapping = {
        'x64' : 'x86_64',
        'ia32' : 'x86'
    }

    //conan architecture setting
    if(options.arch) {
        args.push("-sarch=" + (mapping[options.arch] || options.arch))
    }

    return new Promise(function(resolve, reject){
        var child = spawn('conan', args, {stdio: 'inherit', detached:false})

        child.on('close', function(exit_code){
            if(exit_code === 0) return resolve(options)

            reject()
        })
    })
}

function rebuild(opts){
    var mapping = {
        'x86_64' : 'x64',
        'x86' : 'ia32'
    }

    var options = {
        runtime: opts.runtime,
        runtimeVersion: opts.runtime_version,
        arch: mapping[opts.arch] || opts.arch,
        debug: opts.debug
    }

    debug('cmake-js rebuild with options: ' + options)

    // configure build system
    var bs = new BuildSystem(options)

    // rebuild() the addon instead of just compile(), to avoid issues when switching runtimes
    return bs.rebuild().then(function(){
        if(process.platform !== 'win32') return
        // on windows with visual studio, .node files is produced in build/bin
        // instead of build/Release. copy it to where the bindings module can find it
        try {
            fs.copySync('build/bin/JoyStreamAddon.node', 'build/JoyStreamAddon.node')
        } catch(e){}
    })

}

clean()
getRuntimeAndVersion()
  .then(conanInstall)
  .then(rebuild)
  .catch(function(err){
    console.error('JoyStreamAddon build failed:', err)
    process.exit(-1)
  })
