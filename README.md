# PyConnector

**`pyconnector`**: Bridge the gap between Node.JS and Python applications

Both [Node.JS](https://nodejs.org/en/) and [Python](https://www.python.org/) have their own unique strengths and weaknesses 
when it comes to developing applications. This module provides a simple and crude interface to embed and use Python code 
for number crunching queries.

## Installation

Just type `npm install pyconnector` and you are ready to go.

## Usage

### Node.JS

Create a new instance of `PyConnector` class having the desired options.

```js
// minimal.js
const Path = require('path')
const PyConnector = require('pyconnector')

// create connector
var PyAPI = new PyConnector({
  // local port or remote IP:Port string '192.168.0.12:9000'
  endpoint: 24001,
  // pass null or remove option to prevent spawning a child process
  path: Path.join(__dirname, 'minimal.py')
});

// query python resolvers
(async function () {
  console.log('Available Python routes:', await PyAPI.routes())
  console.log('Python version:', await PyAPI.query('pyversion'))
  console.log('Increment ++', await PyAPI.query('increment'))
  console.log('Increment ++', await PyAPI.query('increment', { pass_var: 13 }))

  // kill python process
  PyAPI.end()
})()
```

### Python 

#### Install Python dependencies
`pip install nodeconnector argparse`

#### Create minimal.py file

```py
# minimal.py
import sys
import time
import argparse
import nodeconnector

# argument parsing, PyConnector automatically sends this
parser = argparse.ArgumentParser( description = 'Python Exposed API' )
parser.add_argument( '--pynodeport', help = 'PyConnector Node.JS query port', default = 24001 )
args = parser.parse_args()

# create interface
nodeq = nodeconnector.Interface( )

# python version query
def nodeq_version( args, ctx = {} ):
    return ( '%d.%d.%d' % ( sys.version_info[ 0 ], sys.version_info[ 1 ], sys.version_info[ 2 ] ) )

# increment value query
def nodeq_increment( args, ctx = {} ):
    # return value
    ctx[ 'inc' ] += 1
    args[ 'value' ] = ctx[ 'inc' ]

    return args

# queries are executed on a separate thread, a context dict can be used to pass data
nodeq.handle( 'pyversion', nodeq_version )
nodeq.handle( 'increment', nodeq_increment, dict( inc = 0 ) ) 

# launch API
nodeq.listen( port = args.pynodeport ) 

# wait
while( True ):
    time.sleep( 0.001 )
```

## Background

**PyConnector** is intended to be used for rapid prototyping within POC applications. For production and advanced use cases, its
recommended to use this [ZeroMQ package](https://www.npmjs.com/package/zeromq), which this module heavily relies upon.


## License (MIT)

Copyright (C) 2019 Cristian Dobre


