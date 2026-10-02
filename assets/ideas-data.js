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
// The questions under `prompt` were written as starting points; replace or delete them freely.
// The writing under `body` / `list` is yours, carried over from the old Ideas page.

window.IDEAS = {
  intro: {
    title: 'A map of ideas',
    text: 'Everything begins from one point. From there it branches — into the sciences, and into the questions that fit in none of them — until every branch reaches the same edge.',
    hint: 'Touch any point to open it. Esc returns to the whole map.'
  },

  root: {
    id: 'god',
    label: 'God',
    title: 'Understanding God (T–3)',
    prompt: 'The one point every branch begins from.',
    body: [
      'Over the course of time I have observed that god and every deed that he does to us humans is in the form of the mixture of deism and absurdism…',
      'He hides himself by making us feel that things are absurd enough, but they are not — everything is intertwined, and it takes the utmost amount of conscience and a third-person view to understand his deeds, but the closest theory is deism. Religion is a cage which traps you, and most people stay trapped; more ironically, religion does the exact opposite of what it says it should — it pulls you away from thinking about god with your own mind, and instead makes you believe things which are foretold. God has to be understood and thought about, not believed and worshipped — he made us conscious so that we could think about him. Every day I reach closer to understanding him, and go farther apart from human indecencies; my emotional understanding is growing exponentially, I am learning a lot about how humans think and act, and love is a blessing.'
    ],
    source: { text: 'from the blog · May 30, 2025', href: 'https://quarkbyquark.blogspot.com/2025/05/the-mixture-of-absurdism-and-deism-1.html' }
  },

  // Order matters: fields are placed clockwise, so neighbours here are neighbours on the map.
  branches: [
    {
      id: 'physics', label: 'Physics', prompt: 'How the universe behaves.',
      children: [
        { id: 'quantum', label: 'Quantum', prompt: 'What does it mean for something to be undecided until it is observed?' },
        { id: 'spacetime', label: 'Spacetime', prompt: 'Is time something we move through, or a story we tell about change?' },
        { id: 'entropy', label: 'Entropy', prompt: 'Why does time have a direction?' },
        {
          id: 'nuclear', label: 'Nuclear models',
          body: ['I think all the models describing nuclear physics are a shot in the dark which are not correct, there are too many errors and corrections at every step which makes it hard to realize that it is what it is, further the framework has multiple modifications at every step which makes it less and less fundamental and more and more iterative, so there is a big gap in this sector.'],
          source: { text: 'from the blog · Sep 16, 2026', href: 'https://quarkbyquark.blogspot.com/2026/09/about-nuclear-physics.html' }
        },
        { id: 'cosmology', label: 'Cosmology', prompt: 'What came before the beginning, if “before” even applies?' }
      ]
    },
    {
      id: 'math', label: 'Mathematics', prompt: 'Structure, pattern and proof.',
      children: [
        { id: 'infinity', label: 'Infinity', prompt: 'Are some endlessnesses larger than others?' },
        { id: 'symmetry', label: 'Symmetry', prompt: 'Why does nature keep choosing balance?' },
        { id: 'proof', label: 'Proof', prompt: 'Can everything that is true be proven?' }
      ]
    },
    {
      id: 'chemistry', label: 'Chemistry', prompt: 'How matter combines and changes.',
      children: [
        { id: 'bonds', label: 'Bonds', prompt: 'How do atoms agree to stay together?' },
        { id: 'elements', label: 'Elements', prompt: 'Where were the elements forged?' }
      ]
    },
    {
      id: 'biology', label: 'Biology', prompt: 'How matter comes alive.',
      children: [
        { id: 'life', label: 'Life', prompt: 'Where does matter cross the line into life?' },
        { id: 'evolution', label: 'Evolution', prompt: 'How does blind selection build something so intricate?' },
        { id: 'mind', label: 'Mind', prompt: 'How do neurons, or parameters, become thought?' }
      ]
    },
    {
      id: 'philosophy', label: 'Philosophy', prompt: 'Questions that have no lab result.',
      children: [
        { id: 'meaning', label: 'Meaning', prompt: 'Does life need a reason, or does it make one?' },
        { id: 'freewill', label: 'Free will', prompt: 'Are our choices ours?' },
        { id: 'knowledge', label: 'Knowledge', prompt: 'What can we know, and how would we know that we know?' },
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
      id: 'metaphysics', label: 'Metaphysics', prompt: 'What there is, and why.',
      children: [
        { id: 'being', label: 'Being', prompt: 'What does it mean to exist?' },
        { id: 'consciousness', label: 'Consciousness', prompt: 'Why is there an inner experience at all?' },
        { id: 'causality', label: 'Causality', prompt: 'Where does the chain of causes begin?' }
      ]
    }
  ],

  rim: {
    id: 'death',
    label: 'Death',
    prompt: 'Every branch ends here. What remains?'
  }
};
