# Local business landing site

Build a brochure site for a local plumbing company named "Clearflow Plumbing" in Austin, TX.

## Requirements

- Hello Elementor child theme via CTW Native
- Pages: Home (front), Services, Contact
- Free Elementor widgets only
- Header and footer via ElementsKit payloads
- Contact form via MetForm (name, email, message)
- One CSS snippet via WPCode Free (`type: "css"`, `location: "header"`) for slight letter-spacing on headings. Do not use WPCode Pro types or `everywhere` on CSS.
- `woocommerce.enabled`: false
- Colors: primary `#0B3D91`
- Include one hero image in `media/` and reference it from the home page image widget

## Deliverable

`ctw-package.json` + media + ZIP from `npx -y claude-to-wordpress-native generate`.

For the hero image: save under `./media/` or `media fetch --url <unsplash-or-pexels-https> --id hero --package ./ctw-package.json`, then reference `{ "id": "hero", "url": "" }` on the image widget.
