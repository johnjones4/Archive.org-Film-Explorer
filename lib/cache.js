const Memcached = require('memcached')
const md5 = require('md5')

const memcached = new Memcached(process.env.MEMCACHED_HOST)

const makeFilmsKey = (page, perPage, actors, directors, genres, years) => 'films-' + md5([page, perPage, actors, directors, genres, years].join('-'))

const makeOptionsKey = (type, params) => {
  return type + '-' + md5(params.join('-'))
}

exports.searchFilms = (page, perPage, actors, directors, genres, years) => {
  return new Promise((resolve, reject) => {
    const key = makeFilmsKey(page, perPage, actors, directors, genres, years)
    memcached.get(key, (err, data) => {
      if (err) {
        return reject(err)
      }
      if (data) {
        return resolve(JSON.parse(data))
      }
      resolve(null)
    })
  })
}

exports.cacheFilms = (page, perPage, actors, directors, genres, years, films) => {
  return new Promise((resolve, reject) => {
    const key = makeFilmsKey(page, perPage, actors, directors, genres, years)
    const age = 60 * 60 * 24 * 30
    memcached.set(key, JSON.stringify(films), age, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

exports.getOptions = (type, params) => {
  return new Promise((resolve, reject) => {
    const key = makeOptionsKey(type, params)
    memcached.get(key, (err, data) => {
      if (err) {
        return reject(err)
      }
      if (data) {
        return resolve(JSON.parse(data))
      }
      resolve(null)
    })
  })
}

exports.cacheOptions = (type, params, options) => {
  return new Promise((resolve, reject) => {
    const key = makeOptionsKey(type, params)
    const age = 60 * 60 * 24 * 30
    memcached.set(key, JSON.stringify(options), age, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}
