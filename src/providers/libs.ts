import { App, FileSystemAdapter, Notice, requestUrl } from 'obsidian'
import { CONFIG } from '@/config'

class LibsProvider {
  // Subfolder inside plugin directory
  private readonly LIBS_FOLDER = 'libs'

  constructor(
    private app: App,
    private pluginDir: string
  ) {}

  async ensureAndLoadLibs(forceRedownload = false) {
    try {
      const plantUmlPath = await this.ensureLocalScript(
        CONFIG.libs.plantuml,
        'plantuml.js',
        forceRedownload
      )

      const graphvizPath = await this.ensureLocalScript(
        CONFIG.libs.graphviz,
        'viz-global.js',
        forceRedownload
      )

      await this.injectScript(plantUmlPath, 'plantuml-script')
      await this.injectScript(graphvizPath, 'graphviz-script')

      plantumlLoad()

      new Notice('✅ PlantUML and Graphviz scripts loaded successfully', 4000)
    } catch (err) {
      console.error('Failed to load PlantUML scripts:', err)
      new Notice(
        '❌ Failed to load PlantUML/Graphviz scripts. Check console.',
        8000
      )
    }
  }

  private async ensureLocalScript(
    url: string,
    filename: string,
    forceRedownload: boolean
  ): Promise<string> {
    const adapter = this.app.vault.adapter as FileSystemAdapter

    // Full relative path inside the plugin folder: .obsidian/plugins/<your-plugin-id>/libs/filename.js
    const relativeDir = `${this.pluginDir}/${this.LIBS_FOLDER}`
    const relativeFilePath = `${relativeDir}/${filename}`

    // Create libs subfolder if it doesn't exist
    if (!(await adapter.exists(relativeDir))) {
      await adapter.mkdir(relativeDir)
    }

    const fileExists = await adapter.exists(relativeFilePath)

    if (forceRedownload || !fileExists) {
      new Notice(`📥 Downloading ${filename}...`)
      console.log(`Downloading ${filename} → ${relativeFilePath}`)

      let content: string
      try {
        const response = await requestUrl({ url })
        content = response.text
      } catch (fetchErr) {
        console.warn('requestUrl failed, trying native fetch...', fetchErr)
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP error ${res.status}`)
        content = await res.text()
      }

      await adapter.write(relativeFilePath, content)
      console.log(`✅ Downloaded and saved: ${filename}`)
    } else {
      console.log(`✅ Using cached local copy: ${filename}`)
    }

    return relativeFilePath
  }

  private async injectScript(relativePath: string, id: string) {
    const adapter = this.app.vault.adapter as FileSystemAdapter
    const fullContent = await adapter.read(relativePath)

    // Remove old script if it exists (prevents duplicates on reload)
    document.getElementById(id)?.remove()

    const script = document.createElement('script')
    script.id = id
    script.textContent = fullContent
    script.type = 'text/javascript'

    document.head.appendChild(script)
    console.log(`📜 Injected script from plugin folder: ${relativePath}`)
  }
}

export { LibsProvider }
