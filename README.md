# HOLYNOA

Portfolio of Noa Yaakobovitz, live at [holynoa.com](https://holynoa.com).

Plain HTML, CSS and JavaScript hosted on GitHub Pages. No build step.

## Editing content

All text lives in `assets/js/data.js`:

- **Projects**: title, year, description, cover image, gallery
- **Archive**: the "Prints & fun" images
- **Contact details**: email, phone, Instagram, LinkedIn

To add an image, drop it into `assets/img/` and add its file name to the right list in `data.js`.

## Structure

```
index.html            home
about/                info page
archive/              prints & fun
work/<project>/       one folder per project
assets/css/style.css  all styles
assets/js/main.js     animations and page logic
assets/img, video     media
CNAME                 connects holynoa.com
```

Fonts: Default Lingo Pixel / Italic by Second Son Radiance (personal and commercial use), Newsreader, Instrument Serif and JetBrains Mono from Google Fonts. Animation: GSAP + Lenis.
