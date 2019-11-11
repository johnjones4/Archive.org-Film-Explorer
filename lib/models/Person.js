const { Model, ref, raw } = require('objection');
const { knex } = require('../database')

Model.knex(knex)

class Person extends Model {
  static get tableName() {
    return 'persons'
  }

  static get relationMappings() {
    const FilmRole = require('./FilmRole')
    return {
      roles: {
        relation: Model.HasManyRelation,
        modelClass: FilmRole,
        join: {
          from: 'persons.id',
          to: 'film_roles.person_id'
        }
      }
    }
  }

  static async findOrCreateByName (name) {
    const person = await Person.query().findOne({ name })
    if (person) {
      return person
    } else {
      return Person.query()
        .insert({
          name
        })
    }
  }

  static async getActors (directors, genres, years) {
    return Person.gerPersonsOfRole('actor', null, directors, genres, years)
  }

  static async getDirectors (actors, genres, years) {
    return Person.gerPersonsOfRole('director', actors, null, genres, years)
  }

  static async gerPersonsOfRole (role, actors, directors, genres, years) {
    const Role = require('./Role')
    const FilmRole = require('./FilmRole')
    const Film = require('./Film')
    const subqueryFn = builder => {
      builder.where('role_id', Role.query().select('id').where('role', role))
      if (actors) {
        builder.whereIn('film_id', FilmRole.query().select('film_id').whereIn('person_id', actors).where('role_id', Role.query().select('id').where('role', 'actor')))
      }
      if (directors) {
        builder.whereIn('film_id', FilmRole.query().select('film_id').whereIn('person_id', directors).where('role_id', Role.query().select('id').where('role', 'director')))
      }
      if (genres) {
        builder.whereIn('film_id', raw('select film_id from films_genres where genre_id in (?)', genres))
      }
      if (years) {
        builder.whereIn('film_id', Film.query().select('id').whereIn('year', years))
      }
    }
    return Person.query()
      .select([
        'persons.*',
        FilmRole.query().where('person_id', ref('persons.id')).where(subqueryFn).count().as('role_count')
      ])
      .whereIn('id', FilmRole.query().select('person_id').where(subqueryFn))
      .orderBy('name')
  }
}

module.exports = Person
