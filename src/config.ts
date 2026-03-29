import manifest from 'manifest.json'

export const CONFIG = {
  id: manifest.id,
  libs: {
    plantuml: 'https://plantuml.github.io/plantuml/js-plantuml/plantuml.js',
    graphviz: 'https://plantuml.github.io/plantuml/js-plantuml/viz-global.js',
  },
} as const
