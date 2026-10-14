# QA test cases: inventory, Palengke, expenses, and modal layout

These are manual acceptance cases for the latest Inventory and Purchasing changes. Run them in a non-production database with test products and ingredients. Resetting application data is not required.

## Purchasing and market-trip modal

| ID | Priority | Test | Steps | Expected result |
| --- | --- | --- | --- | --- |
| PUR-01 | P1 | Market trip modal fits desktop | Open **Palengke → Log Palengke Run** at a desktop viewport (for example, 1440 × 900). | Modal is wider; item name, category, quantity, unit, and total-cost fields are readable and do not overlap. The modal remains scrollable within the viewport. |
| PUR-02 | P1 | Quantity value remains visible | Enter a multi-digit decimal quantity such as `12.75`; select `kg`. | The entire entered quantity remains visible in the input. The unit selector does not squeeze the input. |
| PUR-03 | P1 | Modal works on a narrow viewport | Repeat PUR-01 and PUR-02 at a phone-sized viewport. Add a second line item. | Fields stack without horizontal page overflow; both rows and their values remain usable; remove-item control is visible below its row. |
| PUR-04 | P1 | Trip subtotal and fare total reconcile | Add two major ingredients with costs ₱300 and ₱100, plus ₱40 fare. | Items subtotal is ₱400, fare is ₱40, trip total is ₱440, and the two major ingredients show fare shares of ₱30 and ₱10. |
| PUR-05 | P1 | Linked ingredient uses compatible units | Link a major ingredient with base unit `g`, choose `kg`, enter quantity `2` and item cost ₱300, then save. | Trip saves; ingredient stock increases by 2,000 g; the FIFO lot uses the item cost plus allocated fare; a receipt movement is recorded. |
| PUR-06 | P1 | Incompatible linked units are rejected | Submit a linked ingredient with an incompatible unit using the API or a crafted request. | API returns `400`; no market run, expense, stock lot, or movement is saved. |
| PUR-07 | P1 | Non-stock market line does not create ingredient stock | Add a utility/LPG or other-expense line without linking an ingredient and save. | Line is included in trip spend; no ingredient lot or ingredient movement is created for it. |
| PUR-08 | P2 | Market item links are limited to stock categories | Choose Utility / Cooking Gas or Other Expense in a line item. | Inventory link control is hidden; changing an already linked line to a non-stock category clears its ingredient link. |
| PUR-09 | P1 | Double import is prevented in Inventory | Save a trip with a linked ingredient, then inspect **Inventory → Add from Palengke**. | The saved stock-linked item is not offered for another import. Unlinked compatible major ingredients remain available for import. |

## Ingredient counts, waste, and movement history

| ID | Priority | Test | Steps | Expected result |
| --- | --- | --- | --- | --- |
| INV-01 | P1 | Opening ingredient count adds the difference | Record current stock, choose **Opening count**, enter a larger physical count, and save. | Stock equals the entered count; only the difference is added as an audited movement with the opening-count reason. |
| INV-02 | P1 | Physical count removes the difference | Choose **Physical count**, enter a count below current stock, and save. | Stock equals the entered count; the negative difference is recorded against FIFO lots. |
| INV-03 | P1 | Zero is a valid physical count | Choose **Physical count**, enter `0` for an ingredient with stock, and save. | All available stock is removed and recorded; stock is not negative. |
| INV-04 | P1 | Count equal to current stock is a no-op | Enter the current quantity in a count flow and save. | UI reports no adjustment was saved; no zero-quantity movement is created. |
| INV-05 | P1 | Spoilage records waste | Choose **Spoiled / waste**, enter a positive quantity to remove, and save. | Ingredient stock decreases by that quantity and history shows a negative `waste` movement with the spoilage reason. |
| INV-06 | P1 | Waste cannot exceed stock | Try to record spoilage greater than the ingredient’s available stock. | API rejects the request with `409`; stock and movement history remain unchanged. |
| INV-07 | P1 | Staff meal is separately classified | Record a staff meal quantity. | Stock decreases; history shows a negative adjustment with `staff meal` reason, distinct from spoilage. |
| INV-08 | P1 | Ingredient movement history is traceable | Open **History** for an ingredient with purchases, recipe usage, and adjustments. | Recent movements show type, date/time, signed quantity, unit, and note; receipt, production, adjustment, and waste entries are visible. |
| INV-09 | P2 | Positive adjustments require a valid unit cost | Add stock for an ingredient with no previous purchase cost, first omitting then entering a positive unit cost. | Missing cost is rejected; a valid cost creates a new lot and positive movement. |
| INV-10 | P1 | Inventory API enforces access | Call ingredient adjustment/history endpoints as an authorized purchasing/owner user, then as a role without purchasing/costing permission. | Authorized request succeeds; unauthorized request returns `403`. |

## Prepared servings, leftovers, and waste

| ID | Priority | Test | Steps | Expected result |
| --- | --- | --- | --- | --- |
| PREP-01 | P1 | Opening prepared count sets the counted balance | Choose a menu item with known stock, select **Opening count**, enter a different count, and save. | Prepared stock equals the entered count; a prepared-count operation record includes user, reason, and signed difference. |
| PREP-02 | P1 | Leftovers reduce prepared stock | Choose **End-of-day leftovers**, enter the number of unsold servings, and save. | Prepared stock decreases by the entered quantity; the negative movement is recorded as leftovers. |
| PREP-03 | P1 | Spoiled servings reduce prepared stock | Choose **Spoiled / waste**, enter servings to discard, and save. | Prepared stock decreases; the history identifies a waste record and the reason. |
| PREP-04 | P1 | Prepared stock cannot go below zero | Attempt to remove more servings than available. | API returns `409`; stock remains unchanged and no operation log is written. |
| PREP-05 | P1 | Prepared serving history includes production and corrections | Open **History** for an item with a batch log and manual count/waste adjustments. | Batch production and manual count/waste records appear with timestamps and signed servings. |
| PREP-06 | P1 | Prepared-stock API enforces access | Try a prepared adjustment/history request as kitchen and purchasing staff, then as an unrelated role. | Kitchen/purchasing permission is accepted; unrelated role gets `403`. |

## Non-inventory expenses

| ID | Priority | Test | Steps | Expected result |
| --- | --- | --- | --- | --- |
| EXP-01 | P1 | Record a non-inventory expense | Add an expense with description, supplies category, amount, date, and optional note. | Expense appears in **Other expenses** with the entered category, amount, date, and note. No ingredient, lot, or stock movement is created. |
| EXP-02 | P1 | Backdated expense uses the selected Manila business date | Record an expense for a previous date, then check its date and that date’s day-close summary. | Entry is displayed on the selected date and included in that business day’s expense total, not today’s. |
| EXP-03 | P1 | Expense amount and date validation | Try zero/negative amount and an invalid date via the API. | Invalid amount/date is rejected with `400`; no expense is saved. |
| EXP-04 | P2 | Ingredient spend stays separate from other expenses | Create an ingredient receipt or market trip, then create a supplies expense. | Ingredient purchases appear in purchase/ingredient records; the supplies entry appears as a non-inventory expense and does not create stock. |

## Regression checks

| ID | Priority | Test | Steps | Expected result |
| --- | --- | --- | --- | --- |
| REG-01 | P1 | Existing batch production still consumes ingredients | Produce a batch for a recipe-linked item. | Recipe ingredient lots decrease FIFO; production movement and prepared stock increase as before. |
| REG-02 | P1 | Existing sales still reduce prepared servings | Complete an order for an in-stock menu item. | Order saves and prepared stock decreases by the sold quantity. |
| REG-03 | P2 | Expense and stock pages show request failures clearly | Stop the API or simulate a request failure, then open Inventory/Purchasing. | Loading errors are shown with retry controls; failures are not displayed as empty successful data. |
