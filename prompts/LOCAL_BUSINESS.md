# Local business landing site

Build a brochure site for a local plumbing company named "Clearflow Plumbing" in Austin, TX.

## Requirements

- Hello Elementor child theme via CTW Native
- Pages: Home (front), Services, Contact
- Free Elementor widgets only
- Contact form via MetForm (name, email, message)
- Native Elementor heading typography (letter-spacing). Do not add a WPCode `type: "css"` snippet — brochure packages ship none.
- **Do not** emit package `header` / `footer`. Build header and footer manually in ElementsKit Free after import.
- No pseudo-element or `:hover` CSS in pages; static native styling only (Woo CSS may use pseudo on `.woocommerce` selectors).
- `woocommerce.enabled`: false
- Colors: primary `#0B3D91`
- Include one hero image in `media/` and reference it from the home page image widget

## Deliverable

`ctw-package.json` + media + ZIP from `npx -y claude-to-wordpress-native generate`.

For the hero image: save under `./media/` or `media fetch --url <unsplash-or-pexels-https> --id hero --package ./ctw-package.json`, then reference `{ "id": "hero", "url": "" }` on the image widget.
