const { Model } = require('objection');
const { knex } = require('../database')

Model.knex(knex)

class FilmRole extends Model {
  static get tableName() {
    return 'film_roles'
  }

  static get relationMappings() {
    const Person = require('./Person')
    const Film = require('./Film')
    const Role = require('./Role')
    return {
      person: {
        relation: Model.HasOneRelation,
        modelClass: Person,
        join: {
          from: 'film_roles.person_id',
          to: 'persons.id'
        }
      },
      film: {
        relation: Model.HasOneRelation,
        modelClass: Film,
        join: {
          from: 'film_roles.person_id',
          to: 'films.id'
        }
      },
      role: {
        relation: Model.HasOneRelation,
        modelClass: Role,
        join: {
          from: 'film_roles.role_id',
          to: 'roles.id'
        }
      }
    }
  }
}

module.exports = FilmRole
