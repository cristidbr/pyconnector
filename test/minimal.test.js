'use strict'

/* global describe, it, beforeEach  */
const assert = require('assert')
const PyConnector = require('../src/index.js')
const Path = require('path')

// constructor arguments
describe('Constructor Options test.', function () {
  let pyhandle

  it('should detect port from endpoint option', async function () {
    pyhandle = new PyConnector({
      endpoint: '127.0.0.1:24001',
      path: null
    })
    assert.ok(pyhandle._opts.endpoint === 'tcp://127.0.0.1:24001')
    assert.ok(pyhandle._opts.port === 24001)
    pyhandle.end()
  })

  it('should set local endpoint option correctly', async function () {
    pyhandle = new PyConnector({
      port: 8009,
      path: null
    })

    assert.ok(pyhandle._opts.endpoint === 'tcp://127.0.0.1:8009')
    assert.ok(pyhandle._opts.port === 8009)
    pyhandle.end()
  })
})

describe('Python Minimal Connector test.', function () {
  let pyhandle

  beforeEach(function () {
    pyhandle = new PyConnector({
      endpoint: 23001,
      path: Path.join(__dirname, 'py/minimal.py')
    })
  })

  it('should spawn child process', function () {
    assert.ok(pyhandle._process !== null)
    pyhandle.end()
  })

  it('should return a list of Python declared routes', async function () {
    const routes = await pyhandle.routes()
    assert.ok(routes.length === 2)
    assert.ok(routes.indexOf('pyversion') >= 0)
    assert.ok(routes.indexOf('increment') >= 0)
    pyhandle.end()
  })

  it('should query Python version', async function () {
    const pyver = await pyhandle.query('pyversion')
    assert.ok((!!pyver.substring) === true)
    assert.ok(parseInt(pyver.split('.')[0]) === 3)
    pyhandle.end()
  })

  it('should be able to execute multiple queries', async function () {
    let inc = await pyhandle.query('increment')
    assert.ok(inc.value === 1)
    inc = await pyhandle.query('increment')
    assert.ok(inc.value === 2)
    pyhandle.end()
  })
})
