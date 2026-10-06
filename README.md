# HOLYNOA

Portfolio of Noa Yaakobovitz, live at [holynoa.com](https://holynoa.com).

Plain HTML, CSS and JavaScript hosted on GitHub Pages. No build step.

The home page: objects from each project float around the name. Hover one to stop time and read its name; click to open it. There is a Lights switch in the header for a light version.

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
assets/css/next.css   all styles
assets/js/next.js     animations and page logic
assets/obj/           the floating objects (transparent WebP)
assets/img, video     media
CNAME                 connects holynoa.com
```

Fonts: Lingo Pixel / Italic by Second Son Radiance (personal and commercial use), Geist and Geist Mono by Vercel (SIL Open Font License), all self-hosted in assets/fonts. Animation: GSAP + Lenis.
