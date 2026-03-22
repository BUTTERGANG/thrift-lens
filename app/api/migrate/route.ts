import { runMigrations } from '@/lib/db'

// Simple secret check so this isn't accidentally triggered in production
export async function POST(request: Request) {
  const { secret } = await request.json().catch(() => ({}))

  if (!process.env.ENABLE_MIGRATE_ENDPOINT) {
    return Response.json({ error: 'Unavailable' }, { status: 404 })
  }

  if (!process.env.MIGRATE_SECRET || secret !== process.env.MIGRATE_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await runMigrations()
    return Response.json({ ok: true, message: 'Migrations complete' })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Migration failed' },
      { status: 500 }
    )
  }
}
