require('dotenv').config()
const database = require('./lib/database')
const synchronize = require('./lib/synchronize')

database.init()
  .then(() => synchronize())
  .then(() => process.exit(0))
  .catch(err => console.log(err))
