const { Model } = require('objection');
const { knex } = require('../database')

Model.knex(knex)

class Role extends Model {
  static get tableName() {
    return 'roles'
  }

  static async findOrCreateRoleByName (roleName) {
    const roles = await Role.query()
      .where('role', roleName)
      .limit(1)
    if (roles.length > 0) {
      return roles[0]
    } else {
      return Role.query()
        .insert({
          role: roleName
        })
    }
  }
}

module.exports = Role
