# Homepage demo clips

Each project card on `index.html` has a 16:9 demo slot. Until a clip exists, the
slot shows a "20s demo coming" placeholder.

## Naming

One clip and one poster per project, named by slug:

| Project                        | Clip              | Poster            |
| ------------------------------ | ----------------- | ----------------- |
| App Factory                    | `app-factory.mp4` | `app-factory.jpg` |
| TrainGames                     | `traingames.mp4`  | `traingames.jpg`  |
| YouTube Shorts agent workflow  | `shorts.mp4`      | `shorts.jpg`      |
| BetterMTA                      | `bettermta.mp4`   | `bettermta.jpg`   |

## Clip spec

- About 20 seconds, silent (the page plays clips muted), looping cleanly.
- 16:9, 1280x720, H.264 MP4. Aim for under 2 MB, for example:
  `ffmpeg -i in.mov -an -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slow -movflags +faststart app-factory.mp4`
- Poster: the first frame (or the best frame) as a 1280x720 JPEG:
  `ffmpeg -i app-factory.mp4 -frames:v 1 -q:v 4 app-factory.jpg`

## Turning a slot on

The site has no build step, so the markup is edited by hand. After you add
`<slug>.mp4` and `<slug>.jpg` here, replace the placeholder text in that card's
slot in `index.html`:

```html
<div class="demo" data-demo-slot="traingames">20s demo coming</div>
```

with:

```html
<div class="demo" data-demo-slot="traingames">
  <video data-demo muted loop playsinline preload="none" poster="assets/demos/traingames.jpg" aria-label="TrainGames 20-second demo">
    <source src="assets/demos/traingames.mp4" type="video/mp4" />
  </video>
</div>
```

The inline script on the homepage plays a clip only while its card is in view,
and pauses it when the card scrolls away. With `prefers-reduced-motion: reduce`,
nothing autoplays; the clip shows native controls (a play button) instead.

`npm test` (`tests/homepage.test.mjs`) fails if a slot and this folder disagree:
a clip with no `<video>`, a `<video>` with no clip, or a clip with no poster.
