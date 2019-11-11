const { Model, raw } = require('objection');
const { knex } = require('../database')

Model.knex(knex)

class Genre extends Model {
  static get tableName() {
    return 'genres'
  }

  static get relationMappings() {
    const Film = require('./Film')
    return {
      films: {
        relation: Model.ManyToManyRelation,
        modelClass: Film,
        join: {
          from: 'genres.id',
          through: {
            from: 'films_genres.genre_id',
            to: 'films_genres.film_id'
          },
          to: 'films.id'
        }
      }
    }
  }

  static async findOrCreateGenreByName (genreName) {
    const genre = await Genre.query().findOne({genre: genreName})
    if (genre) {
      return genre
    } else {
      return Genre.query()
        .insert({
          genre: genreName
        })
    }
  }

  static async getGenres(actors, directors, years) {
    const FilmRole = require('./FilmRole')
    const Role = require('./Role')
    const Film = require('./Film')
    return Genre.query()
      .select([
        'genres.*',
        Genre.relatedQuery('films').where(builder => {
          if (actors) {
            builder.whereIn('films.id', FilmRole.query().select('film_id').whereIn('person_id', actors).where('role_id', Role.query().select('id').where('role', 'actor')))
          }
          if (directors) {
            builder.whereIn('films.id', FilmRole.query().select('film_id').whereIn('person_id', directors).where('role_id', Role.query().select('id').where('role', 'director')))
          }
          if (years) {
            builder.whereIn('year', years)
          }
        }).count().as('films_count')
      ])
      .where(builder => {
        if (actors) {
          builder.whereExists(Genre.relatedQuery('films').whereIn('films.id', FilmRole.query().select('film_id').whereIn('person_id', actors).where('role_id', Role.query().select('id').where('role', 'actor'))))
        }
        if (directors) {
          builder.whereExists(Genre.relatedQuery('films').whereIn('films.id', FilmRole.query().select('film_id').whereIn('person_id', directors).where('role_id', Role.query().select('id').where('role', 'director'))))
        }
        if (years) {
          builder.whereExists(Genre.relatedQuery('films').whereIn('year', years))
        }
      })
      .orderBy('genre')
  }
}

module.exports = Genre
