const Film = require('./models/Film')
const FilmRole = require('./models/FilmRole')
const Person = require('./models/Person')
const Role = require('./models/Role')
const Genre = require('./models/Genre')
const bent = require('bent')
const getJSON = bent('json')
const querystring = require('querystring')
const _ = require('lodash')

module.exports = async () => {
  const films = await getArchiveOrgData(true)
  for (const i in films) {
    const film = films[i]
    const omdbData = await findOMDBData(film.title, film.year)
    if (omdbData) {
      await saveMovie(film, omdbData)
    } else {
      console.error(`No OMDb data for ${film.title} (${film.year})`)
    }
  }
}

const getArchiveOrgData = async fetchAll => {
  const rows = 1000
  let firstRun = true
  let hasMore = true
  let films = []
  let page = 0
  while ((fetchAll && hasMore) || firstRun) {
    page += 1
    firstRun = false
    const info = await getJSON('https://archive.org/advancedsearch.php?' + querystring.stringify({
      q: 'collection:feature_films',
      output: 'json',
      rows,
      page
    }))
    if (info && info.response) {
      films = films.concat(info.response.docs)
      hasMore = films.length < info.response.numFound
    }
  }
  return films
}

const findOMDBData = async (title, year) => {
  try {
    const params = {
      apikey: process.env.OMDB_API_KEY,
      t: title
    }
    if (year) {
      params.y = year
    }
    const movie = await getJSON('http://www.omdbapi.com?' + querystring.stringify(params))
    if (movie && movie.Response === 'True') {
      return movie
    }
  } catch (e) {
    console.error(e)
  }
  return null
}

const saveMovie = async (archiveData, omdbData) => {
  console.log(archiveData.title)
  const film = await Film.findOrCreateFilmByIdentifiers(archiveData.identifier, omdbData.imdbID)
  const cleanName = name => {
    const paren = name.indexOf(' (')
    return paren < 0 ? name : name.substring(0, paren)
  }
  const roleDetails = _.uniqWith([]
    .concat(omdbData.Actors.split(', ').map(name => {
      return {
        name: cleanName(name),
        role: 'actor'
      }
    }))
    .concat(omdbData.Director.split(', ').map(name => {
      return {
        name: cleanName(name),
        role: 'director'
      }
    }))
    .concat(omdbData.Writer.split(', ').map(name => {
      return {
        name: cleanName(name),
        role: 'writer'
      }
    })), _.isEqual)
  const roles = []
  for (const i in roleDetails) {
    const {name, role} = roleDetails[i]
    const props = {
      person_id: (await Person.findOrCreateByName(name)).id,
      role_id: (await Role.findOrCreateRoleByName(role)).id,
      film_id: film.id
    }
    roles.push((await FilmRole.query().findOne(props)) || (await FilmRole.query().insert(props)))
  }

  const genreStrings = _.uniq((archiveData.genre ? archiveData.genre.split(',') : []).concat(omdbData.Genre ? omdbData.Genre.split(', ') : []).map(genre => genre.trim()).filter(genre => genre.length > 0))
  const genres = []
  for (const i in genreStrings) {
    genres.push(await Genre.findOrCreateGenreByName(genreStrings[i]))
  }

  await Film.query().upsertGraph([
    {
      id: film.id,
      archiveorg_metadata: archiveData,
      omdb_metadata: omdbData,
      title: archiveData.title,
      year: isNaN(parseInt(archiveData.year)) ? (isNaN(parseInt(omdbData.Year)) ? null : parseInt(omdbData.Year)) : parseInt(archiveData.year),
      roles,
      genres,
      updated_at: new Date()
    }
  ], {
    relate: true,
    unrelate: true
  })
  // console.log(roles)
  // await film.syncRoles(roles)
}
