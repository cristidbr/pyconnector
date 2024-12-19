const Path = require('path')
const PyConnector = require('pyconnector')

// launch API
const PyAPI = new PyConnector({
  endpoint: 24001,
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
