// THE IDEA MAP: edit this file to grow it. No other file needs to change.
//
//   root      the single point everything begins from (God)
//   branches  the fields that grow out of it; each has `children` (the ideas inside the field)
//   rim       the edge every branch finally reaches (Death)
//
// Every node can have:
//   label    the name drawn on the map                     (required, keep it short)
//   prompt   one open question, shown in italics           (optional)
//   title    a heading for the panel, if it differs from label (optional)
//   body     your own writing: an array of paragraphs      (optional)
//   list     a bulleted list, e.g. quotes                  (optional; listLabel is its intro line)
//   source   { text, href }: a link, e.g. to the blog      (optional)
//
// To add a thought: put a new object inside a field's `children`, e.g.
//   { id: 'chaos', label: 'Chaos', prompt: 'Is unpredictability a flaw or a feature?', body: ['My thoughts...'] }
// `id` must be unique and URL-safe; it also makes the node linkable as ideas.html#chaos.
//
// Every `prompt` is a dash placeholder for you to replace with your own words.
// The writing under `body` / `list` is yours, carried over from the old Ideas page.

window.IDEAS = {
  intro: {
    title: 'Ideas',
    text: '—',
    hint: 'Touch any point to open it. Esc returns to the whole map.'
  },

  root: {
    id: 'god',
    label: 'God',
    title: 'Understanding God (T–3)',
    prompt: '—',
    body: [
      'Over the course of time I have observed that god and every deed that he does to us humans is in the form of the mixture of deism and absurdism…',
      'He hides himself by making us feel that things are absurd enough, but they are not — everything is intertwined, and it takes the utmost amount of conscience and a third-person view to understand his deeds, but the closest theory is deism. Religion is a cage which traps you, and most people stay trapped; more ironically, religion does the exact opposite of what it says it should — it pulls you away from thinking about god with your own mind, and instead makes you believe things which are foretold. God has to be understood and thought about, not believed and worshipped — he made us conscious so that we could think about him. Every day I reach closer to understanding him, and go farther apart from human indecencies; my emotional understanding is growing exponentially, I am learning a lot about how humans think and act, and love is a blessing.'
    ],
    source: { text: 'from the blog · May 30, 2025', href: 'https://quarkbyquark.blogspot.com/2025/05/the-mixture-of-absurdism-and-deism-1.html' }
  },

  // Order matters: fields are placed clockwise, so neighbours here are neighbours on the map.
  branches: [
    {
      id: 'physics', label: 'Physics', prompt: '—',
      children: [
        { id: 'quantum', label: 'Quantum Mechanics', prompt: '—' },
        { id: 'spacetime', label: 'Spacetime', prompt: '—' },
        { id: 'entropy', label: 'Entropy', prompt: '—' },
        {
          id: 'nuclear', label: 'Nuclear models',
          body: ['I think all the models describing nuclear physics are a shot in the dark which are not correct, there are too many errors and corrections at every step which makes it hard to realize that it is what it is, further the framework has multiple modifications at every step which makes it less and less fundamental and more and more iterative, so there is a big gap in this sector.'],
          source: { text: 'from the blog · Sep 16, 2026', href: 'https://quarkbyquark.blogspot.com/2026/09/about-nuclear-physics.html' }
        },
        { id: 'cosmology', label: 'Cosmology', prompt: '—' }
      ]
    },
    {
      id: 'math', label: 'Mathematics', prompt: '—',
      children: [
        { id: 'infinity', label: 'Infinity', prompt: '—' },
        { id: 'symmetry', label: 'Symmetry', prompt: '—' },
        { id: 'proof', label: 'Proof', prompt: '—' }
      ]
    },
    {
      id: 'chemistry', label: 'Chemistry', prompt: '—',
      children: [
        { id: 'bonds', label: 'Bonds', prompt: '—' },
        { id: 'elements', label: 'Elements', prompt: '—' }
      ]
    },
    {
      id: 'biology', label: 'Biology', prompt: '—',
      children: [
        { id: 'life', label: 'Life', prompt: '—' },
        { id: 'evolution', label: 'Evolution', prompt: '—' },
        { id: 'mind', label: 'Mind', prompt: '—' }
      ]
    },
    {
      id: 'philosophy', label: 'Philosophy', prompt: '—',
      children: [
        { id: 'meaning', label: 'Meaning', prompt: '—' },
        { id: 'freewill', label: 'Free will', prompt: '—' },
        { id: 'knowledge', label: 'Knowledge', prompt: '—' },
        {
          id: 'quotes', label: 'Quotes',
          listLabel: 'Quotes I’ve come across which have left a deep impact on me — list updates actively.',
          list: [
            'The more fruit a tree bears, the more grounded it tends to become.',
            'A rotten fruit falls by itself.',
            'Empathy beyond boundaries is self-destruction.',
            'A fish with a closed mouth never gets caught by a fisherman’s hook.',
            'A fish and a bird may fall in love, but they cannot build a home together.'
          ],
          source: { text: 'from the blog · updated actively', href: 'https://quarkbyquark.blogspot.com/2026/04/quotes-i-came-across-which-have-left.html' }
        }
      ]
    },
    {
      id: 'metaphysics', label: 'Metaphysics', prompt: '—',
      children: [
        { id: 'being', label: 'Being', prompt: '—' },
        { id: 'consciousness', label: 'Consciousness', prompt: '—' },
        { id: 'causality', label: 'Causality', prompt: '—' }
      ]
    }
  ],

  rim: {
    id: 'death',
    label: 'Death',
    prompt: 'the only that I know of, will happen whatsoever is the case.'
  }
};
