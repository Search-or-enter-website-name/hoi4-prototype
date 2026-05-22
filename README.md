# HOI4 Prototype — January 1936

Browser grand-strategy demo inspired by Hearts of Iron IV (1936 start), created by Search-or-enter-website-name.

## Run

```bash
cd hoi4-prototype
python3 -m http.server 8080
```

Open **http://localhost:8080**

## January 1936 scenario

- **38 provinces** — UK, Scandinavia, France, Benelux, Germany, Austria, Czechoslovakia (incl. Sudetenland), Poland, Italy, Balkans, Spain, Baltic states, Soviet west
- **20 nations** — majors + Norway, Sweden, Denmark, Estonia, Latvia, Lithuania, etc.
- **Peace at start** — wars begin via **National Focuses** (e.g. Germany: Danzig or War)

## National focus trees (★ on start screen)

| Nation | Example focuses |
|--------|-----------------|
| Germany | Rhineland → Anschluss → Sudetenland → Danzig or War |
| France | Maginot, Popular Front, Rearmament |
| United Kingdom | Empire, Rearmament, War Economy |
| Italy | Ethiopia, Albania, Pact of Steel |
| Poland | Army modernization, Danzig |
| Soviet Union | Five Year Plan, Baltic claims |
| Czechoslovakia | Fortify Sudetenland, Škoda Works |

Open **National Focuses** in the toolbar. One focus at a time; completes after X days (time must be running).

## Other systems

Government panel: Political Power, Stability, War Support, conscription/economy/trade laws, factories, research, forts, supply lines, victory points.

## UI layout

- **Full-screen map** — province names only on hover or selection
- **Command** — collapsible bottom drawer (MP/VP, province, divisions)
- **Gov** / **Focus** — modal overlays (Esc to close)
- Compact toolbar: date, PP, stability, war support, speed

## Controls

1. Pick nation (★ = focus tree)
2. **Gov** / **Focus** buttons open modals; **Command** toggles bottom drawer
3. Hover provinces for names; click to select and open command drawer
4. Unpause time (1×–5×); select division → click neighbor to move or attack
