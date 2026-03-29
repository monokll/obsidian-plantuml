declare global {
  function plantumlLoad(): any

  var plantuml: {
    render(text: string[], elem: string): void
    renderToString(text: string[], clb: (res: string) => void): void
  }
}

export { plantuml, plantumlLoad }
