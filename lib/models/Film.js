const { Model, raw, ref } = require('objection');
const { knex } = require('../database')
const _ = require('lodash')

Model.knex(knex)

class Film extends Model {
  static get tableName() {
    return 'films'
  }

  static get relationMappings() {
    const FilmRole = require('./FilmRole')
    const Genre = require('./Genre')
    return {
      roles: {
        relation: Model.HasManyRelation,
        modelClass: FilmRole,
        join: {
          from: 'films.id',
          to: 'film_roles.film_id'
        }
      },
      genres: {
        relation: Model.ManyToManyRelation,
        modelClass: Genre,
        join: {
          from: 'films.id',
          through: {
            from: 'films_genres.film_id',
            to: 'films_genres.genre_id'
          },
          to: 'genres.id'
        }
      }
    }
  }

  static async findOrCreateFilmByIdentifiers(archiveID, imdbID) {
    const movies = await Film.query()
      .where('archiveorg_identifier', archiveID)
      .where('imdb_identifier', imdbID)
      .eager('[roles.[person, role]]')
    if (movies.length > 0) {
      return movies[0]
    } else {
      return Film.query()
        .insert({
          archiveorg_identifier: archiveID,
          imdb_identifier: imdbID,
          created_at: new Date()
        })
    }
  }

  static async getYears(actors, directors, genres) {
    const FilmRole = require('./FilmRole')
    const Role = require('./Role')
    return Film.query().select([
      raw('year'),
      raw('count(*) as film_count')
    ])
      .where(builder => {
        if (actors) {
          builder.whereIn('id', FilmRole.query().select('film_id').whereIn('person_id', actors).where('role_id', Role.query().select('id').where('role', 'actor')))
        }
        if (directors) {
          builder.whereIn('id', FilmRole.query().select('film_id').whereIn('person_id', directors).where('role_id', Role.query().select('id').where('role', 'director')))
        }
        if (genres) {
          builder.whereIn('id', raw('select film_id from films_genres where genre_id in (?)', genres))
        }
      })
      .groupBy('year')
      .orderBy('year')
  }

  static async searchFilms(page, perPage, actors, directors, genres, years) {
    const Role = require('./Role')
    const FilmRole = require('./FilmRole')
    return Film.query()
      .select([
        'films.*',
        raw('count(*) OVER() AS total_count')
      ])
      .where(builder => {
        if (years.length > 0) {
          builder.whereIn('year', years)
        }
        if (actors.length > 0) {
          builder.whereIn('id', FilmRole.query().select('film_id').whereIn('person_id', actors).where('role_id', Role.query().select('id').where('role', 'actor')))
        }
        if (directors.length > 0) {
          builder.whereIn('id', FilmRole.query().select('film_id').whereIn('person_id', directors).where('role_id', Role.query().select('id').where('role', 'director')))
        }
        if (genres.length > 0) {
          builder.whereIn('id', raw('select film_id from films_genres where genre_id in (?)', genres))
        }
      })
      .orderBy(['year', 'title'])
      .limit(perPage)
      .offset(perPage * page)
  }
}

module.exports = Film
