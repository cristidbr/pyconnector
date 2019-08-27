'use strict'

const ZMQ = require('zeromq')
const ChildProcess = require('child_process')
const { EventEmitter } = require('events')

// connector class
class PyConnector {
  constructor (options) {
    // set options
    this._opts = this._processOptions(Object.assign(
      {
        port: 24001,
        endpoint: null,
        path: null,
        respawn: 0,
        local: true
      }, options))

    // event callbacks
    this._events = new EventEmitter()
    this._connector = ZMQ.socket('req')

    // spawn Python process
    this._process = null
    if (this._opts.local && this._opts.path !== null) {
      this._processSpawn()
    }

    // query identifiers
    this._qid = 0

    // connect and handle messages
    this._connector.connect(this._opts.endpoint)
    this._connector.on('message', (data) => {
      this._responseHandle(data)
    })
  }

  _responseHandle (data) {
    // response decoding
    var response = JSON.parse(data.toString())
    var evt = `q_${response._p}_${response._id}`

    // pass data
    this._events.emit(evt, response)
  }

  // summon handler process
  _processSpawn () {
    var ns = this

    // create child process
    this._process = ChildProcess.spawn(
      'python',
      [this._opts.path, '--pynodeport', this._opts.port],
      { stdio: 'inherit' }
    )

    // error handling
    this._process.on('error', (e) => {
      console.error(`PyConnector cannot start process ${this._opts.path}`)
      console.error(e)
      ns._process = null
    })

    // close event
    this._process.on('close', () => {
      ns._process = null

      // respawn timeout option
      if (ns._opts.respawn > 0) {
        // hopefully restart
        setTimeout(ns._processSpawn, ns._opts.respawn)
      }
    })
  }

  // set options
  _processOptions (opts) {
    opts.local = false

    // custom endpoint
    if (opts.endpoint !== null) {
      // string endpoint
      if (opts.endpoint.substring) {
        // grab port value
        let parts = opts.endpoint.split(':')
        opts.port = parseInt(parts.pop())

        // check if string contains protocol
        if (opts.endpoint.indexOf('//') >= 0) {
          parts = opts.endpoint.split('//').slice(1)
          opts.endpoint = `tcp://${parts[0]}`
          opts.respawn = 0
          return opts
        }

        opts.endpoint = `tcp://${opts.endpoint}`
        opts.respawn = 0
        return opts
      }

      // numeric endpoint
      opts.port = opts.endpoint
    }

    // local instance
    opts.endpoint = `tcp://127.0.0.1:${opts.port}`
    opts.local = true

    return opts
  }

  // retrieve all available paths handled by Python
  routes (callback) {
    // use the query function
    return this.query('__pyroutes', {}, callback)
  }

  // query Python endpoint
  query (path, args, callback) {
    // increment identifier
    var qdata = {
      _p: path,
      _id: this._qid++,
      args: args
    }

    // asyncronous response
    var query = new Promise((resolve, reject) => {
      // set callback
      this._events.once(`q_${qdata._p}_${qdata._id}`, (response) => {
        resolve(response.data)
        // run callback
        if (callback) callback(response.data)
      })

      // send JSON query
      this._connector.send(JSON.stringify(qdata))
    }).catch(
      // handle errors
      (e) => {
        // log
        console.error(e)
        // remove listeners for erroneous event
        this._events.removeAllListeners(`q_${qdata._p}_${qdata._id}`)
        return e
      })

    return query
  }

  end () {
    if (this._process !== null) {
      this._process.kill('SIGINT')
      this._process.kill()
    }

    this._connector.close()
  }
};

module.exports = PyConnector
