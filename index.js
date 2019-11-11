require('dotenv').config()
const database = require('./lib/database')
const synchronize = require('./lib/synchronize')
const www = require('./lib/www')

database.init()
  .then(() => {
    return new Promise((resolve, reject) => {
      const app = www()
      app.listen(process.env.PORT || 8000, err => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  })
  // .then(() => synchronize())
  .then(() => console.log('Running'))
  .catch(err => console.log(err))
