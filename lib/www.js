const express = require('express')
const morgan = require('morgan')
const Person = require('./models/Person')
const Genre = require('./models/Genre')
const Film = require('./models/Film')
const _ = require('lodash')

module.exports = () => {
  const app = express()
  app.use(morgan('common'))
  app.use(express.static('public'))
  app.set('view engine', 'pug')

  app.get('/', async (req, res, next) => {
    try {
      const selected = {
        actors: cleanIntArray(req.query.actors),
        genres: cleanIntArray(req.query.genres),
        years: cleanIntArray(req.query.years),
        directors: cleanIntArray(req.query.directors)
      }
      const films = await Film.searchFilms(
        selected.actors,
        selected.directors,
        selected.genres,
        selected.years
      )
      const params = {
        actors: await Person.getActors(
          selected.directors.length > 0 ? selected.directors : null,
          selected.genres.length > 0 ? selected.genres : null,
          selected.years.length > 0 ? selected.years : null
        ),
        directors: await Person.getDirectors(
          selected.actors.length > 0 ? selected.actors : null,
          selected.genres.length > 0 ? selected.genres : null,
          selected.years.length > 0 ? selected.years : null
        ),
        genres: await Genre.getGenres(
          selected.actors.length > 0 ? selected.actors : null,
          selected.directors.length > 0 ? selected.directors : null,
          selected.years.length > 0 ? selected.years : null,
        ),
        years: await Film.getYears(
          selected.actors.length > 0 ? selected.actors : null,
          selected.directors.length > 0 ? selected.directors : null,
          selected.genres.length > 0 ? selected.genres : null,
        ),
        selected,
        films: _.chunk(films, 6)
      }
      res.render('index', params)
    } catch (err) {
      next(err)
    }
  })

  return app
}

const cleanIntArray = input => {
  if (!input) {
    return []
  }
  if (input instanceof Array) {
    return input.map(s => parseInt(s)).filter(i => !isNaN(i))
  } else {
    const i = parseInt(input)
    return isNaN(i) ? [] : [i]
  }
}
