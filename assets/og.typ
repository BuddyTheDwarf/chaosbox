// chaosbox social/OG card — render: typst compile assets/og.typ assets/og.png --ppi 72  (=> 1200x630)
#set page(width: 1200pt, height: 630pt, margin: 0pt, fill: rgb("#0b0c0a"))
#set text(font: ("Helvetica Neue", "Arial", "Liberation Sans"), fill: rgb("#e9ece2"))

// faint lime glow at top
#place(top + center, dy: -260pt,
  rect(width: 1100pt, height: 600pt, radius: 300pt, fill: rgb(155, 209, 63, 28)))

#block(width: 100%, height: 100%, inset: 84pt)[
  #text(size: 27pt, font: ("Menlo", "SF Mono"), fill: rgb("#9bd13f"))[open source · vote-merged · no gatekeeper]

  #v(48pt)

  #text(size: 82pt, weight: 800)[
    Open a pull request. \
    Let the #box(fill: rgb("#bef264"), inset: (x: 10pt), outset: (y: 10pt), radius: 8pt)[#text(fill: rgb("#0b0c0a"))[crowd]] ship it.
  ]

  #v(1fr)

  #grid(columns: (auto, 1fr), align: (left + horizon, right + horizon),
    text(size: 36pt, weight: 800)[chaos#text(fill: rgb("#bef264"))[box]],
    text(size: 27pt, fill: rgb("#969c89"))[buddythedwarf.github.io/chaosbox],
  )
]
