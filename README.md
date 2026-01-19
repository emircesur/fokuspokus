# fokuspokus
fokuspokus is a speed and focus based reading app with Bionic-style &amp; RSVP modes , that has deep accessibility tools for Dyslexia &amp; ADHD. Features Irlen overlays, syllable coding, and color-safe palettes in offline-ready PWA-base for any device

> **Reading for Every Mind.**

**fokuspokus** is a Progressive Web App (PWA) designed to dismantle the barriers between text and cognition. In an age of information overload, standard typography fails millions of readers—whether due to neurodivergence, visual impairments, or simply the need for speed.

This project goes beyond "dark mode." We combine scientifically-inspired speed-reading methodologies (Fixation Highlighting, RSVP) with deep accessibility customization (Irlen overlays, phoneme decoding) to create a reading environment that adapts to *your* brain, not the other way around.

---

## 🧠 Insightful Accessibility

Standard digital text is static. **fokuspokus** treats text as fluid data. By manipulating the presentation layer of language, we can reduce the cognitive load required to decode words, freeing up mental energy for comprehension and retention.

We prioritize **ADA (Americans with Disabilities Act)** compliance and **WCAG (Web Content Accessibility Guidelines)** principles, ensuring that reading is equitable across the spectrum of neurodiversity.

---

## ⚡ Key Features

### 👁️ Accessibility Suite

Designed for Dyslexia, ADHD, Scotopic Sensitivity, and Visual Impairments.

* **Bionic-Style Fixation:** Bolds the initial letters of words to guide the eye and reduce saccade strain.
* **Irlen Color Overlays:** Customizable tinted screens to reduce visual stress and "floating text" syndrome.
* **Decoding Aids:**
* **Syllable Color-Coding:** visual breakdown of complex multi-syllabic words.
* **Homophone Hints:** Subtle indicators distinguishing *there/their*, *pair/pear*.
* **Character Disambiguation:** Unique colors for **b/d** and **p/q** to prevent flipping.
* 
* **Typefaces:** Includes **OpenDyslexic** and **Atkinson Hyperlegible**.
* **Color Safety:** Verified palettes for Protanopia, Deuteranopia, and Tritanopia.

### 🚀 High-Velocity Consumption

* **RSVP Mode (Rapid Serial Visual Presentation):** Eliminate eye movement entirely by flashing words at a fixed focal point.
* **Speed Control:** Granular control from **100 to 1000 WPM**.
* **Focus Masks & Rulers:** Static or moving guides to isolate lines of text.
* **TTS Integration:** Multimodal learning with simultaneous Text-to-Speech.

### 🎨 Total Control

* **Fine-Tuned Typography:** Adjust letter spacing (tracking), line height (leading), and word spacing.
* **Theming:** Light, Dark, Sepia, and High Contrast (OLED black).
* **Platform Agnostic:** Runs offline, installs to home screen, works on desktop/mobile via PWA.


## 🛠️ Installation & Usage

**fokuspokus** is a Progressive Web App. You do not need an App Store. 
This app is configured for static export and works on GitHub Pages. DOWNLOAD ZIP FOR SERVER /NONSTATIC DEPLOYMENT.

This app uses `output: 'export'` in `next.config.mjs` for static site generation. This means:
- Works on any static host (GitHub Pages, Netlify, S3, etc.)
- No server-side features (API routes removed)
- EPUB parsing happens client-side using JSZip
- URL extraction feature requires a server deployment (shows notice on static hosts)

  The following were removed to support GitHub Pages:

- `/app/api/parse-epub/route.ts` - Replaced with client-side `/lib/epub-parser.ts`
- `/app/api/extract-text/route.ts` - URL extraction requires server (user sees notice)

If you deploy to Vercel or another server-enabled platform, you can restore these for enhanced features.



We welcome contributions, especially from developers with lived experience in neurodivergence.


**License**
Distributed under the MIT License. See `LICENSE` for more information.
