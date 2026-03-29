import { existsSync, watch } from 'fs'
import { rename, cp } from 'fs/promises'
import path from 'path'

const isDev = Bun.argv.includes('--dev')

export type RequiredFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>
}

const config: RequiredFields<Bun.BuildConfig, 'outdir'> = {
  entrypoints: ['./src/main.ts'],
  outdir: './dist',

  target: 'browser',
  format: 'cjs',
  sourcemap: 'linked',
  minify: !isDev,

  external: ['obsidian'],
}

/* ***** BUILD **** */

async function build() {
  if (existsSync(config.outdir)) {
    //   await rm(`${outdir}/main.js`);
    await cp('./manifest.json', `${config.outdir}/manifest.json`)
  }

  const start = performance.now()

  const result = await Bun.build(config)

  await rename(`${config.outdir}/main.css`, `${config.outdir}/styles.css`)

  return { result, buildTime: performance.now() - start }
}

function debounced<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), waitFor)
  }
}

/**
 * Debounce helper that works with `async` functions.
 *
 * @param func   The function to debounce. It may be sync or async.
 * @param waitFor The debounce delay in milliseconds.
 * @returns A debounced version of `func` that always returns a Promise.
 */
function debouncedAsync<
  F extends (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>,
>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<F>): Promise<Awaited<ReturnType<F>>> => {
    // If there's a pending timeout, cancel it
    if (timeout) clearTimeout(timeout)

    // Create a new promise that will be resolved/rejected when `func` runs
    return new Promise((resolve, reject) => {
      timeout = setTimeout(() => {
        // Call the original function – it might be async or sync
        try {
          const result = func(...args)
          // If result is a Promise, await it; otherwise wrap it
          Promise.resolve(result).then(resolve).catch(reject)
        } catch (err) {
          if (err instanceof Error) {
            reject(err)
          } else {
            reject(new Error(String(err)))
          }
        }
      }, waitFor)
    })
  }
}

const changes = new Set()

if (isDev) {
  console.log(`Start watching for file changes...`)

  const devBuild = debouncedAsync(build, 500)

  watch('./src', { recursive: true }, (_, filename) => {
    if (!changes.has(filename)) {
      changes.add(filename)
      console.log(`Files changed: ${filename}`)
    }

    devBuild()
      .then(({ buildTime }) => {
        console.log(`\n✅ Rebuild completed in ${buildTime.toFixed(2)}ms\n`)
        changes.clear()
      })
      .catch((err: unknown) => {
        console.error('Error!', err)
      })
  })
} else {
  console.log('🚀 Start building process...')

  await build().then(({ result, buildTime }) => {
    /* ***** DISPLAY RESULTING INFO **** */

    function formatFileSize(bytes: number): string {
      const units = ['B', 'KB', 'MB', 'GB']
      const res = { size: bytes, unit: 'GB' }

      for (const [i, el] of units.entries()) {
        if (res.size < 1024 ** (i + 1)) {
          res.unit = el
          break
        }
        res.size /= 1024
      }

      return `${res.size.toFixed(2)} ${res.unit}`
    }

    const outputTable = result.outputs.map((output) => ({
      File: path.relative(process.cwd(), output.path),
      Type: output.kind,
      Size: formatFileSize(output.size),
    }))

    console.table(outputTable)

    console.log(`\n✅ Build completed in ${buildTime.toFixed(2)}ms\n`)
  })
}
