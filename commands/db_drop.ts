import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Drops the PostgreSQL database configured for a Lucid connection.
 *
 * It connects to the "postgres" maintenance database (you cannot drop a
 * database while connected to it) and issues a `DROP DATABASE` statement.
 */
export default class DbDrop extends BaseCommand {
  static commandName = 'db:drop'
  static description = 'Drop the database for a given connection'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({
    description: 'The connection to drop the database for (defaults to the configured connection)',
  })
  declare connection: string

  @flags.boolean({
    description: 'Skip the confirmation prompt',
    default: false,
  })
  declare force: boolean

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
        `db:drop only supports PostgreSQL ("pg") connections, but "${connectionName}" uses "${connection.client}"`
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

    /**
     * Guard against dropping a database in production unless forced.
     */
    if (this.app.inProduction && !this.force) {
      const proceed = await this.prompt.confirm(
        `You are in production. Drop database "${database}"?`
      )
      if (!proceed) {
        this.logger.info('Aborted')
        return
      }
    } else if (!this.force) {
      const proceed = await this.prompt.confirm(`Drop database "${database}"?`)
      if (!proceed) {
        this.logger.info('Aborted')
        return
      }
    }

    const client = new pg.Client({ host, port, user, password, database: 'postgres' })

    try {
      await client.connect()

      const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
        database,
      ])

      if (!rowCount) {
        this.logger.info(`Database "${database}" does not exist`)
        return
      }

      // Identifiers cannot be parameterized, so quote it safely.
      await client.query(`DROP DATABASE "${database.replace(/"/g, '""')}"`)
      this.logger.success(`Dropped database "${database}"`)
    } catch (error) {
      this.logger.error(`Failed to drop database "${database}": ${(error as Error).message}`)
      this.exitCode = 1
    } finally {
      await client.end()
    }
  }
}
