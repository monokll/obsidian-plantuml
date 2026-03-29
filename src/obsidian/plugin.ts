import { Plugin, MarkdownRenderChild, Notice } from 'obsidian'
import { LibsProvider } from '@/providers/libs'
import { CONFIG } from '@/config'

class PlantumlPlugin extends Plugin {
  // Queue to ensure diagrams render one after another
  private renderQueue: Promise<void> = Promise.resolve()
  private pluginDir: string = ''

  override async onload() {
    const dir = this.app.vault.configDir
    this.pluginDir = `${dir}/plugins/${CONFIG.id}`

    // Run once on load (or you can expose it as a command)
    await new LibsProvider(this.app, this.pluginDir).ensureAndLoadLibs()

    this.registerPlantumlHandler()

    new Notice('✅ PlantUML plugin loaded successfully.')
  }

  registerPlantumlHandler() {
    this.registerMarkdownCodeBlockProcessor('plantuml', (source, el, ctx) => {
      const container = el.createDiv({ cls: 'plantuml-container' })
      const content = container.createDiv({ cls: 'plantuml-content' })

      // Show loading state
      const preloader = container.createDiv({
        text: 'Rendering PlantUML diagram...',
        cls: 'plantuml-loading',
      })

      // Chain renders sequentially using the queue
      this.renderQueue = this.renderQueue
        .then(async () => {
          await this.renderPlantuml(source.trim(), content)
          preloader.remove()
        })
        .catch((err: unknown) => {
          console.error('PlantUML rendering error:', err)
          preloader.setText(`Failed to render PlantUML diagram: ${err.message}`)
          preloader.addClass('loading-error')
        })

      ctx.addChild(new MarkdownRenderChild(content))

      const btn = container.createEl('button', {
        text: 'SVG ⬇️',
        cls: 'plantuml-export-svg',
      })

      btn.addEventListener('click', () => {
        this.exportSVG(content)
      })
    })
  }

  /**
   * Renders a single PlantUML diagram with async/await syntax
   */
  private async renderPlantuml(
    text: string,
    container: HTMLElement
  ): Promise<void> {
    //   const optimizer = new SvgOptimizer(this.app)
    //   await optimizer.init()

    return new Promise((resolve, reject) => {
      try {
        const lines = text.split(/\r?\n/)

        window.plantuml.renderToString(lines, (res: string) => {
          // Replace loading message with the actual diagram
          container.innerHTML =
            res || '<div style="color: orange;">Diagram returned empty</div>'
          resolve()
        })
      } catch (error) {
        reject(error as Error)
      }
    })
  }

  exportSVG(elem: HTMLElement) {
    const content = elem.innerHTML
    const blob = new Blob([content], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  override onunload() {
    console.log('PlantUML Plugin unloaded')
  }
}

export default PlantumlPlugin
