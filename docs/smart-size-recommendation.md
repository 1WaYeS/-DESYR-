# DESYR — Smart Size Recommendation

Implementation guide and manual test checklist. Reviewed against the project source on 16 November 2026.

## Purpose and current scope

The **Find my size** feature helps customers who are uncertain about sizing choose a listed size for a specific garment. Customers who already know their size can simply use the normal size selector.

The finder is accessible across all three magazines and on Complete the Look pairings. Actual recommendations require a verified, product-specific measurement chart. The current data contains 12 charts: six Gorur Ghash garments and six Wrongs & Rebels garments. There are no verified Guzel charts in the implementation. Trousers require different measurements and are not recommended by this chest-based method.

This is a rule-based chart comparison, not a trained AI model or a guarantee of fit.

## Customer journey inside the magazine

1. Open a category and select a garment.
2. On the right shopping page, choose **Find my size** beside the size selector.
3. Choose either **Compare a brand I wear** or **Use measurements**.
4. Supply the required information and choose a preferred snug, regular or loose fit.
5. Review the suggested size, chest-room comparison, chart-match score and measurement source.
6. Choose **Use size … for this item** to fill the existing size selector.
7. Review the selection and add the garment to the bag separately.

The dialog adopts the current magazine's visual theme. On a cross-brand outfit pairing, calculations use the pairing garment's own chart while the dialog retains the magazine theme.

## Input methods

### Compare an existing garment

The customer selects a charted brand, the exact garment they already wear, its size and how it currently fits. Garment measurements differ within a brand, so a brand name and size letter alone are insufficient.

The code estimates body chest by subtracting the source-fit allowance from that garment's chest measurement. The source fit and the preferred fit of the new item are separate choices.

### Direct chest measurement

The customer enters full chest circumference in centimetres or inches. Inches are converted using `cm = inches × 2.54`. The UI accepts a converted chest measurement between 60 and 150 cm. It asks for full circumference, not a flat half-chest width.

### Height and weight estimate

When a tape measurement is unavailable, the customer can enter height of 120–220 cm and weight of 30–200 kg. The implemented estimate is:

```text
Estimated chest (cm) = 0.33 × height (cm) + 0.35 × weight (kg) + 10
```

This is an approximate heuristic. A direct measurement is a better starting point; the formula is not presented as a validated body-measurement model.

## Recommendation calculation

| Preferred fit | Added chest allowance |
| --- | --- |
| Snug | 4 cm |
| Regular | 8 cm |
| Loose | 14 cm |

1. Obtain measured or estimated body chest.
2. Calculate `target garment chest = body chest + preferred allowance`.
3. Exclude chart sizes with less than 2 cm of chest room over body chest.
4. Keep only sizes listed for the selected product. The core function can also filter supplied stock quantities, but the current UI has no live stock feed.
5. Choose the garment measurement closest to the target. If equally close, choose the larger measurement.
6. Normalize labels when comparing, including `2XL` and `XXL`.
7. Return the recommendation, or an explicit too-small/unavailable result.

The displayed chart-match score is:

```text
max(0, round(100 − 10 × absolute difference from target in cm))
```

It is a distance score, not a probability of correct fit. A score below 50 produces a weak-match message. Shoulder width, length, fabric stretch and individual proportions are not evaluated.

For example, a measured chest of 96 cm with regular fit gives a target garment chest of 104 cm. The selected product's chart and listed sizes determine the actual recommendation; there is no universal letter-size answer.

## Implementation map

| Source file | Responsibility |
| --- | --- |
| `src/components/SizeFinder.tsx` | Dialog, input methods, validation, results, profile storage and apply-size callback |
| `src/components/size-finder.css` | Brand themes and responsive dialog styles |
| `src/data/size-charts.ts` | Product-specific charts, source URLs, check dates and unit conversion |
| `src/data/size-recommendation.ts` | Allowances, estimates, filtering, tie-breaking and score calculation |
| `src/components/CategoryShopping.tsx` | Main shopping-page integration |
| `src/components/CompleteLookSpread.tsx` | Cross-brand pairing integration |
| `scripts/test-size-recommendation.cjs` | Automated calculation and validation checks |

The chart data records a check date of 15 November 2026. Gorur Ghash full chest values in inches are converted to centimetres; Wrongs & Rebels half-chest widths in centimetres are doubled. These are stored snapshots with source links, not automatic live chart downloads.

## Storage and accessibility

**Remember my fit on this device** is optional. The profile is saved under `desyr-size-profile-v1` in browser localStorage. Measurements are not submitted to a backend by this feature. The customer can remove the saved preference. Storage failures do not prevent calculation.

The dialog moves focus to its heading, keeps Tab navigation inside it, supports Escape to close and returns focus to the opening button. Global magazine arrow navigation is suspended while the overlay is open.

## Unsupported cases

- Guzel and other uncharted garments show a clear chart-unavailable message. A fit profile can be examined, but no size is recommended or applied for the uncharted item.
- Trousers display guidance to consult the brand because waist, hip and inseam charts are needed.
- Comparisons with other brands name a specific charted garment; they do not establish a universal size for that brand.
- Applying a result updates the size field only. It does not add the garment to the bag.

## Verification

From the project root:

```powershell
npm.cmd ci
npm.cmd run test:size
npm.cmd run build
npm.cmd run dev
```

The automated suite covers conversions, source-size round trips, fit choices, listed/stock filters, ties, monotonic sizing, minimum room and invalid inputs. It does not establish real-world fit accuracy.

| Manual check | Expected result | Tester result / evidence |
| --- | --- | --- |
| Measure a charted item using cm and equivalent inches | Same recommendation for equivalent measurements | Not recorded |
| Compare a specific owned garment and size | Source fit and target fit are handled separately | Not recorded |
| Enter missing or out-of-range measurements | Clear validation message | Not recorded |
| Apply a suggestion | Size field changes; bag remains unchanged | Not recorded |
| Open an uncharted Guzel garment | No invented or applicable Guzel size | Not recorded |
| Open trousers | Waist/hip/inseam guidance replaces chest sizing | Not recorded |
| Save, reopen and remove a profile | Local preference is restored and can be removed | Not recorded |
| Use Tab, Escape and arrow keys with the dialog open | Focus stays usable; magazine does not turn behind it | Not recorded |

## Contributor review record

This guide was prepared with AI assistance from the existing source. It does not establish who originally implemented the feature. Complete these fields and test results after performing the review.

- Reviewer / GitHub username: _To be completed_
- Review date and tested commit: _To be completed_
- Documentation corrections or code changes made: _To be completed_
- Remaining issues: _To be completed_
