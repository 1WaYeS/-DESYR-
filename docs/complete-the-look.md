# DESYR — Complete the Look

Implementation guide and manual test checklist. Reviewed against the project source on 16 November 2026.

## Purpose and current scope

Complete the Look helps a customer pair their selected garment with clothing from another DESYR brand without leaving the magazine shopping experience. It is available in the Gorur Ghash and Wrongs & Rebels magazines. Guzel does not currently offer this feature.

The current implementation uses deterministic catalog rules and curated product data. It does not call an AI model, analyse images, learn from customers or query live inventory. An AI-based recommendation engine would be a future enhancement.

## Customer journey inside the magazine

1. Open a supported brand magazine and select a clothing category.
2. Select an item from the left editorial page. Its shopping details appear on the right.
3. Choose **Complete the Look**. The magazine turns to an outfit spread associated with that category.
4. The left page retains the original item and shows cross-brand pairings with images and descriptions.
5. Select a pairing to see its image, price, description, sizes and quantity on the right page. **Swap suggestion** cycles through the alternatives.
6. Choose a size and add the pairing to the selection bag. The original item is not automatically added again.
7. Use **Back to your item** to turn back to the original shopping spread.

The spread keeps the typography and palette of the magazine currently being read, even when the recommended garment belongs to the other brand. Size Finder and price-alert controls are also available for the selected pairing.

## How the recommendation rules work

| Selected brand and category | Suggested catalog category |
| --- | --- |
| Gorur Ghash: T-shirts & Polo | Wrongs & Rebels: Pants & Denims |
| Gorur Ghash: Shirts & Tops | Wrongs & Rebels: Pants & Denims |
| Gorur Ghash: Pants & Outwear | Wrongs & Rebels: Tops & Shackets |
| Wrongs & Rebels: Tops & Shackets | Gorur Ghash: Pants & Outwear |
| Wrongs & Rebels: Sweater & Outwear | Gorur Ghash: Pants & Outwear |
| Wrongs & Rebels: Pants & Denims | Gorur Ghash: T-shirts & Polo |

The engine reads the corresponding list from `SHOPPING_CATALOG`. It changes the starting order using words in the selected item's name: forest/olive/black uses an offset of one, cream/white uses two, and other names use zero. It rotates the same curated list; it does not compute a fashion compatibility score.

## Implementation map

| Source file | Responsibility |
| --- | --- |
| `src/data/outfit-recommendations.ts` | Supported brands, category pairing rules, suggestion ordering and explanation text |
| `src/data/shopping-catalog.ts` | Product IDs, images, prices, sizes, descriptions and brand-store URLs |
| `src/components/CompleteLookSpread.tsx` | Two-page outfit UI, pairing selection, quantity, size validation and bag updates |
| `src/components/CategoryShopping.tsx` | Entry point from the original item and shared bag context |
| `src/components/FlipMagazine.tsx` | Page allocation, selected anchor item, routes and forward/backward page turns |
| `src/components/category-shopping.css` | Brand-themed shopping presentation |

`FlipMagazine` reserves four pages per category for supported brands: two shopping pages followed by two outfit pages. Outfit routes append `-complete-look` to the category slug. React portals render each side into the page-flip engine's page containers.

Selecting another garment updates the shopping content without turning a page. Explicit navigation controls and keyboard arrows handle page turns; raw magazine mouse gestures and hover corners are disabled.

The component tracks the selected pairing, size, quantity and feedback message in React state. Changing the pairing clears the size and resets quantity to one. Quantities are limited to 1–99. Adding requires a size; an existing bag entry with the same product ID and size has its quantity increased. The bag provider preserves selections in browser storage.

## Example

A customer selects a Gorur Ghash polo, opens Complete the Look and chooses Wrongs & Rebels denim. They select a denim size and add one pairing. The bag receives that denim only. The polo must be added separately if it is not already in the bag.

## Running and checking the feature

From the project root:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the local address printed by Vite. For a production compilation check:

```powershell
npm.cmd run build
```

There is currently no dedicated automated Complete the Look test suite. A successful build checks compilation; it does not replace the following interaction checks.

| Manual check | Expected result | Tester result / evidence |
| --- | --- | --- |
| Open the feature in both supported brands | Outfit spread opens in the current magazine theme | Not recorded |
| Try each category | Suggestions come from the category mapping above | Not recorded |
| Select and swap pairings | Right page updates; previous size is cleared; quantity resets | Not recorded |
| Add without a size | A message asks the customer to choose a size | Not recorded |
| Add the same pairing and size twice | Quantity increases in the matching bag entry | Not recorded |
| Add a pairing while the anchor is already in the bag | Original item is not duplicated | Not recorded |
| Return to the original item | Original shopping selection remains available | Not recorded |
| Try desktop and narrow/mobile layouts | Content can be read and controls remain usable | Not recorded |

## Limitations and safe maintenance

- Prices and listed sizes are catalog snapshots; confirm actual availability at the brand store.
- The selection bag does not process payment, orders, shipping or checkout. Purchases happen through the linked brand stores.
- The current spread expects a non-empty recommendation category. Keep catalog references valid; add an empty-state guard before allowing empty or dynamically fetched lists.
- Keep product IDs stable so bag entries, size charts and price alerts continue to identify the same garments.
- Coordinate changes to shared routing and shopping components with the project integrator.

## Contributor review record

This guide was prepared with AI assistance from the existing source. It does not establish who originally implemented the feature. The reviewer should complete the fields and test results based on their own work.

- Reviewer / GitHub username: _To be completed_
- Review date and tested commit: _To be completed_
- Documentation corrections or code changes made: _To be completed_
- Remaining issues: _To be completed_
