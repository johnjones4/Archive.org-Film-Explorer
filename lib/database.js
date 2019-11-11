const knex = exports.knex = require('knex')({
  client: 'pg',
  connection: {
    connectionString: process.env.DB_URL
  },
  useNullAsDefault: true
})

exports.init = async () => {
  if (!await knex.schema.hasTable('films')) {
    await knex.schema.createTable('films', table => {
      table.increments('id').primary().notNullable()
      table.string('archiveorg_identifier', 255).notNullable()
      table.string('imdb_identifier', 255).notNullable()
      table.string('title', 255)
      table.integer('year')
      table.json('archiveorg_metadata')
      table.json('omdb_metadata')
      table.unique(['archiveorg_identifier', 'imdb_identifier'])
      table.timestamps()
    })
  }

  if (!await knex.schema.hasTable('persons')) {
    await knex.schema.createTable('persons', table => {
      table.increments('id').primary().notNullable()
      table.string('name', 255).unique().notNullable()
    })
  }

  if (!await knex.schema.hasTable('roles')) {
    await knex.schema.createTable('roles', table => {
      table.increments('id').primary().notNullable()
      table.string('role', 255).unique().notNullable()
    })
  }

  if (!await knex.schema.hasTable('film_roles')) {
    await knex.schema.createTable('film_roles', table => {
      table.increments('id').primary().notNullable()
      table.integer('role_id').references('id').inTable('roles')
      table.integer('film_id').references('id').inTable('films')
      table.integer('person_id').references('id').inTable('persons')
      table.unique(['film_id', 'person_id', 'role_id'])
    })
  }

  if (!await knex.schema.hasTable('genres')) {
    await knex.schema.createTable('genres', table => {
      table.increments('id').primary().notNullable()
      table.string('genre', 255).unique().notNullable()
    })
  }

  if (!await knex.schema.hasTable('films_genres')) {
    await knex.schema.createTable('films_genres', table => {
      table.increments('id').primary().notNullable()
      table.integer('genre_id').references('id').inTable('genres')
      table.integer('film_id').references('id').inTable('films')
      table.unique(['film_id', 'genre_id'])
    })
  }
}
