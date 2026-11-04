import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Creates the PostgreSQL database configured for a Lucid connection.
 *
 * It connects to the "postgres" maintenance database (you cannot create a
 * database while connected to it) and issues a `CREATE DATABASE` statement.
 */
export default class DbCreate extends BaseCommand {
  static commandName = 'db:create'
  static description = 'Create the database for a given connection'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({
    description:
      'The connection to create the database for (defaults to the configured connection)',
  })
  declare connection: string

  async run() {
    const { default: pg } = await import('pg')
    const dbConfig = this.app.config.get<any>('database')
    const connectionName = this.connection || dbConfig.connection

    const connection = dbConfig.connections?.[connectionName]
    if (!connection) {
      this.logger.error(`Connection "${connectionName}" is not defined in config/database.ts`)
      this.exitCode = 1
      return
    }

    if (connection.client !== 'pg') {
      this.logger.error(
        `db:create only supports PostgreSQL ("pg") connections, but "${connectionName}" uses "${connection.client}"`
      )
      this.exitCode = 1
      return
    }

    const { host, port, user, password, database } = connection.connection
    if (!database) {
      this.logger.error(`No database name configured for connection "${connectionName}"`)
      this.exitCode = 1
      return
    }

    const client = new pg.Client({ host, port, user, password, database: 'postgres' })

    try {
      await client.connect()

      const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
        database,
      ])

      if (rowCount) {
        this.logger.info(`Database "${database}" already exists`)
        return
      }

      // Identifiers cannot be parameterized, so quote it safely.
      await client.query(`CREATE DATABASE "${database.replace(/"/g, '""')}"`)
      this.logger.success(`Created database "${database}"`)
    } catch (error) {
      this.logger.error(`Failed to create database "${database}": ${(error as Error).message}`)
      this.exitCode = 1
    } finally {
      await client.end()
    }
  }
}
