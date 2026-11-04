/* ============================================================
   HOLYNOA, all site content lives here.
   To edit a project: change the text below and save.
   To add an image: put the file in assets/img/ and add its name to "gallery".
   "obj" is the floating object on the home page (assets/obj/);
   "cm" is its real-world width, so everything keeps the same scale.
   ============================================================ */

window.SITE = {
  name: "Noa Yaakobovitz",
  email: "noa@holynoa.com",
  phone: "+972 50 241 1880",
  phoneHref: "+972502411880",
  instagram: "https://www.instagram.com/holynoa/",
  linkedin: "https://www.linkedin.com/in/noayaakobovitz",
  resume: "assets/Resume-Noa-Yaakobovitz.pdf",
  // the two non-project objects floating on the home page
  archiveObj: { src: "obj-archive.webp", cm: 21, alt: "a stack of posters" },
  aboutObj: { src: "obj-about.webp", cm: 11, alt: "an ID badge" },
};

window.PROJECTS = [
  {
    slug: "anemoia",
    obj: { src: "obj-anemoia.webp", cm: 22, alt: "a VHS tape" },
    lead: "What remains true when our past is rebuilt by machines?",
    title: "Anemoia",
    kind: "Video art installation",
    label: "Graduation project",
    year: "2025",
    tags: ["Video art", "AI", "Installation", "Sound"],
    cover: "anemoia-cover.jpg",
    preview: "video/preview/anemoia.mp4",
    hero: { type: "video", src: "video/anemoia.mp4", poster: "img/anemoia-poster.jpg" },
    text: [
      "My graduation project from the Department of Visual Communication at HIT, a multi-screen video installation exploring the act of remembering through artificial intelligence.",
      "The work follows a 25-year-old woman who can barely recall her childhood and turns to a machine to reconstruct it. As she feeds the AI fragments of memory, the system generates new, imagined scenes: familiar yet uncertain, tender yet estranged.",
      "Displayed across six CRT monitors, the installation layers text, image, and sound to simulate the nonlinear way memory re-emerges: distorted, looping, and occasionally wrong. Through a dialogue between human and algorithm, Anemoia blurs the boundaries between real and fabricated recollection, asking what remains true when our past is rebuilt by machines.",
    ],
    gallery: [{ src: "anemoia-cover.jpg", caption: "Installation view, six CRT monitors" }],
  },
  {
    slug: "clarity",
    obj: { src: "obj-clarity.webp", cm: 12.5, alt: "a can" },
    lead: "Alternate minds, one can at a time.",
    title: "Clarity",
    kind: "Conceptual branding",
    label: "Third-year branding project",
    year: "2024",
    tags: ["Branding", "Packaging", "Landing page", "Posters"],
    cover: "clarity-cover.jpg",
    preview: "video/preview/clarity.mp4",
    hero: { type: "video", src: "video/clarity-1.mp4", poster: "img/clarity-v1-poster.jpg", loop: true },
    text: [
      "A conceptual beverage line combining natural spring water with psychedelic additives for controlled microdosing. Designed for adults (21+) dealing with anxiety, depression, PTSD, or eating disorders, each drink offers a targeted effect: Uplifting is for mood enhancement and neurotransmitter balance, Relax is for stress relief and calm, and Focus helps to improve clarity and concentration.",
      "The brand promotes natural, effective self-treatment through high-purity psychoactive compounds. The visual identity reflects the intersection of alternative medicine and psychedelics, with a clean, fluid, and colorful design language that balances innovation with approachability.",
    ],
    gallery: [
      { row: ["clarity-1.jpg", "clarity-2.jpg", "clarity-3.jpg"] },
      { caption: "Extras: landing page", video: "video/clarity-2.mp4", poster: "img/clarity-landing.jpg" },
      { caption: "Extras: posters", src: "clarity-posters.jpg", narrow: true },
    ],
  },
  {
    slug: "surface-deep",
    obj: { src: "obj-surface.webp", cm: 12, alt: "a tube" },
    lead: "Less about beauty, more about the rituals we invent to survive ourselves.",
    title: "Surface Deep",
    kind: "Conceptual branding",
    label: "Skincare brand, senior year",
    year: "2024",
    tags: ["Branding", "Packaging", "Copywriting"],
    cover: "surface-cover.jpg",
    hero: { type: "image", src: "img/surface-1.jpg" },
    text: [
      "Created during the first semester of my senior year as part of the Multidisciplinary Design course, Surface Deep was developed in response to an open brief: design something inspired by a film. I chose the iconic monologue from American Psycho, in which Patrick Bateman coldly describes his obsessive skincare routine. This moment, clinical, intimate, and deeply alienated, served as the emotional foundation for the project.",
      "The result is a fictional skincare brand that offers not transformation, but erasure. Each product appears soothing on the surface, yet hints at emotional detachment, self-objectification, and the illusion of control. The tone is sterile and sarcastic, with packaging that mimics the aesthetics of the wellness industry while subtly undermining them. Instructions read more like dissociative mantras than practical guidance.",
      "Surface Deep is less about beauty and more about the rituals we invent to survive ourselves.",
    ],
    gallery: [{ src: "surface-2.jpg" }, { src: "surface-cover.jpg" }],
  },
  {
    slug: "xhibit",
    obj: { src: "obj-xhibit.webp", cm: 19, alt: "a ticket and wristband" },
    lead: "Not just what you see, but how you feel, hear, and react.",
    title: "Xhibit",
    kind: "UX / UI design",
    label: "Third-year project, with a classmate",
    year: "2024",
    tags: ["UX / UI", "Desktop software", "Interaction"],
    cover: "xhibit-cover.jpg",
    preview: "video/preview/xhibit.mp4",
    hero: { type: "image", src: "img/xhibit-cover.jpg" },
    text: [
      "A student project made in collaboration with a fellow classmate, in which we were asked to design and develop a venue / event management system. Xhibit is a desktop software designed for real-time control and monitoring of interactive exhibitions such as teamLab. It allows precise adjustments to elements like temperature, sound, lighting, and spatial dynamics, creating a perfectly tailored experience.",
      "The project seeks to question the viewer's relationship with their surroundings, not just through what they see, but through how they feel, hear, and react. teamLab's multidisciplinary approach served as a major inspiration for the conceptual direction of the project.",
    ],
    aside: {
      title: "Concept",
      text: "teamLab is an international art collective whose work lives at the intersection of art, science, technology, and nature. Through immersive digital environments, they invite viewers to question the boundaries between the self and the surrounding world.",
    },
    gallery: [{ caption: "Case study", video: "video/xhibit.mp4", poster: "img/xhibit-poster.jpg", controls: true }],
  },
  {
    slug: "curious-incident",
    obj: { src: "obj-curious.webp", cm: 16, alt: "a ceramic dog" },
    lead: "Minimalist motion, quiet tension, and a slightly offbeat visual language.",
    title: "The Curious Incident of the Dog in the Night-Time",
    short: "The Curious Incident",
    kind: "Short animated video",
    label: "Third-year title sequence",
    year: "2023",
    tags: ["Motion", "Typography", "Compositing"],
    cover: "curious-cover.jpg",
    preview: "video/preview/curious.mp4",
    hero: { type: "video", src: "video/curious.mp4", poster: "img/curious-poster.jpg" },
    text: [
      "In my third year of Visual Communication studies, I created an animated title sequence based on the novel The Curious Incident of the Dog in the Night-Time. I focused on capturing the mood of the story through minimalist motion, quiet tension, and a slightly offbeat visual language.",
      "The project combines typography, basic compositing, and keyframe animation to reflect the emotional world of the main character. It also deepened my love for animation that sits between storytelling and design.",
    ],
    gallery: [{ src: "curious-cover.jpg", caption: "Still from the title sequence" }],
  },
  {
    slug: "unfolded",
    obj: { src: "obj-unfolded.webp", cm: 20, alt: "a hand-bound book" },
    lead: "Intimacy and discomfort, bound by hand.",
    title: "Unfolded",
    kind: "Complex content design",
    label: "Second-year artist book",
    year: "2023",
    tags: ["Editorial", "Bookbinding", "Print"],
    cover: "unfolded-cover.jpg",
    hero: { type: "youtube", id: "CZa-zZuIRwY", poster: "img/unfolded-cover.jpg" },
    note: "*Please ignore my broken nail lol :(",
    text: [
      "Unfolded is an artist book developed during my second year of studying Visual Communications in the Complex Content Design course. I chose to focus on selected works by photographer Roger Ballen, whose unsettling, psychologically charged imagery served as both inspiration and content.",
      "The book was bound by hand with an exposed spine and designed in A5 format to evoke a personal, almost sentimental quality, contrasting yet complementing the grotesque nature of Ballen's photographs. This deliberate tension between intimacy and discomfort reflects the emotional complexity within his work and guided my editorial and material decisions throughout the project.",
    ],
    gallery: [],
  },
];

window.ARCHIVE = [
  { src: "print-1.jpg", title: "Afterlife", kind: "Poster" },
  { src: "print-2.jpg", thumb: "print-2-sq.jpg", title: "Nice Genes Bro", kind: "Apparel print" },
  { src: "print-3.jpg", title: "Crayola", kind: "Poster" },
  { src: "print-4.jpg", title: "Book spread", kind: "Editorial" },
  { src: "print-5.jpg", title: "My life, my rules", kind: "Poster" },
  { src: "print-6.jpg", title: "Book spread", kind: "Editorial" },
];
