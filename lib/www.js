const express = require('express')
const morgan = require('morgan')
const Person = require('./models/Person')
const Genre = require('./models/Genre')
const Film = require('./models/Film')
const _ = require('lodash')
const querystring = require('querystring')
const cache = require('./cache')

module.exports = () => {
  const app = express()
  app.use(morgan('common'))
  app.use(express.static('public'))
  app.set('view engine', 'pug')

  app.get('/', async (req, res, next) => {
    const perPage = 6 * 10
    const pageWindow = 6
    try {
      const selected = {
        actors: cleanIntArray(req.query.actors),
        genres: cleanIntArray(req.query.genres),
        years: cleanIntArray(req.query.years),
        directors: cleanIntArray(req.query.directors)
      }
      const page = req.query.page ? parseInt(req.query.page) : 0

      let films = await cache.searchFilms(
        page,
        perPage,
        selected.actors,
        selected.directors,
        selected.genres,
        selected.years
      )
      const putCache = !films
      if (!films) {
        films = await Film.searchFilms(
          page,
          perPage,
          selected.actors,
          selected.directors,
          selected.genres,
          selected.years
        )
      }

      const maxPages = Math.ceil((films.length > 0 ? films[0].total_count : 0) / perPage)
      const start = Math.max(0, page - (pageWindow / 2))
      const end = Math.min(maxPages, start + pageWindow + 1)

      const {actors, putActorsCache} = await getActors(
        selected.directors.length > 0 ? selected.directors : null,
        selected.genres.length > 0 ? selected.genres : null,
        selected.years.length > 0 ? selected.years : null
      )
      const {directors, putDirectorsCache} = await getDirectors(
        selected.actors.length > 0 ? selected.actors : null,
        selected.genres.length > 0 ? selected.genres : null,
        selected.years.length > 0 ? selected.years : null
      )
      const {genres, putGenresCache} = await getGenres(
        selected.actors.length > 0 ? selected.actors : null,
        selected.directors.length > 0 ? selected.directors : null,
        selected.years.length > 0 ? selected.years : null,
      )
      const {years, putYearsCache} = await getYears(
        selected.actors.length > 0 ? selected.actors : null,
        selected.directors.length > 0 ? selected.directors : null,
        selected.genres.length > 0 ? selected.genres : null,
      )

      res.render('index', {
        actors,
        directors,
        genres,
        years,
        selected,
        films: _.chunk(films, 6),
        pages: [...Array(end - start).keys()].map(p => {
          return {
            page: start + p + 1,
            url: '/?' + querystring.stringify(Object.assign({}, req.query, {
              page: start + p
            }))
          }
        }),
        currentPage: page,
        maxPages,
        firstPageURL: '/?' + querystring.stringify(Object.assign({}, req.query, {
          page: 0
        })),
        lastPageURL: '/?' + querystring.stringify(Object.assign({}, req.query, {
          page: maxPages - 1
        })),
        previousPageURL: page > 0 ? ('/?' + querystring.stringify(Object.assign({}, req.query, {
          page: page - 1
        }))) : null,
        nextPageURL: page < maxPages - 1 ? ('/?' + querystring.stringify(Object.assign({}, req.query, {
          page: page + 1
        }))) : null
      })

      if (putCache) {
        await cache.cacheFilms(
          page,
          perPage,
          selected.actors,
          selected.directors,
          selected.genres,
          selected.years,
          films
        )
      }
      if (putActorsCache) {
        await cache.cacheOptions('actors', [
          selected.directors.length > 0 ? selected.directors : null,
          selected.genres.length > 0 ? selected.genres : null,
          selected.years.length > 0 ? selected.years : null
        ], actors)
      }
      if (putDirectorsCache) {
        await cache.cacheOptions('directors', [
          selected.actors.length > 0 ? selected.actors : null,
          selected.genres.length > 0 ? selected.genres : null,
          selected.years.length > 0 ? selected.years : null
        ], directors)
      }
      if (putGenresCache) {
        await cache.cacheOptions('genres', [
          selected.actors.length > 0 ? selected.actors : null,
          selected.directors.length > 0 ? selected.directors : null,
          selected.years.length > 0 ? selected.years : null,
        ], genres)
      }
      if (putYearsCache) {
        await cache.cacheOptions('years', [
          selected.actors.length > 0 ? selected.actors : null,
          selected.directors.length > 0 ? selected.directors : null,
          selected.genres.length > 0 ? selected.genres : null,
        ], years)
      }
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

const getActors = async (directors, genres, years) => {
  let actors = await cache.getOptions('actors', [directors, genres, years])
  const putActorsCache = !actors
  if (!actors) {
    actors = await Person.getActors(directors, genres, years)
  }
  return {actors, putActorsCache}
}

const getDirectors = async (actors, genres, years) => {
  let directors = await cache.getOptions('directors', [actors, genres, years])
  const putDirectorsCache = !directors
  if (!directors) {
    directors = await Person.getDirectors(actors, genres, years)
  }
  return {directors, putDirectorsCache}
}

const getGenres = async (actors, directors, years) => {
  let genres = await cache.getOptions('genres', [actors, directors, years])
  const putGenresCache = !genres
  if (!genres) {
    genres = await Genre.getGenres(actors, directors, years)
  }
  return {genres, putGenresCache}
}

const getYears = async (actors, directors, genres) => {
  let years = await cache.getOptions('years', [actors, directors, genres])
  const putYearsCache = !years
  if (!years) {
    years = await Film.getYears(actors, directors, genres)
  }
  return {years, putYearsCache}
}
