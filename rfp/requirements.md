# Requirements — Most Sold Items on Home Page

## 1. Goal
Home page par jo hotel (restaurant) ka card hai (`RestaurantCard`), uske niche usi hotel ke most-sold items dikhane hain.

Branch: `most-sold-items`

## 2. User Story
- User home page (`HomePage.tsx` > `.restaurant-grid`) par aata hai.
- Har restaurant card ke andar niche "Most Sold" / "Bestsellers" section dikhta hai.
- User wahi se item ko cart me Add kar sakta hai, restaurant page khole bina.

## 3. Functional Requirements

### 3.1 Placement
- Location: `src/components/RestaurantCard.tsx` ke `card__body` ke andar, meta info ke niche.
- Har card me alag section: title e.g. "Most Sold" + 3 items ki list.
- Grid layout ya card size break nahi hona chahiye.

### 3.2 Count
- Har restaurant ke liye **Top 3** items dikhane hain.
- Agar menu me 3 se kam items hain, to jitne hain utne dikhao.
- Agar menu empty / load fail, to section hide karo (empty state mat dikhao card me).

### 3.3 Data Source (Demo - Hardcoded Field)
- `MenuItem` type (`src/types/index.ts`) me naya optional field:
  ```ts
  soldCount?: number
  ```
- `src/services/menu.ts` > `mapMenuItem()` me Firestore `data.soldCount` ko read karo.
- Sorting: `soldCount` descending order me sort karke top 3 lo.
- Demo ke liye Firestore me kuch items me `soldCount` hardcode kar do / seed karo.
- Orders collection se aggregate **abhi scope me nahi hai**.

### 3.4 Fallback Logic
- Agar kisi restaurant ke items me `soldCount` missing hai (0 / undefined):
  1. Pehle `rating` descending se top 3 lo (agar rating hai).
  2. Rating bhi na ho to first 3 items lo.
- `inStock === false` wale items: list me dikhao par Add disabled rakho.

### 3.5 Add to Cart (Home Page se)
- Har most-sold row me Add button / stepper hoga.
- Behaviour `RestaurantPage.tsx` > `MenuRow` jaisa:
  - `useCart()` se `addItem`, `quantityOf`, `setQuantity` use karo.
  - Add par toast: `"<item> added to cart"`.
  - `inCart > 0` ho to stepper (- qty +) dikhao.
  - Closed restaurant (`isOpen === false`) ho to Add disabled rakho.
- Veg filter (`vegOnly`) Home card me apply mat karo — card apna data dikhayega. Sirf `inStock` respect karo.

### 3.6 Performance Note
- Home page par har restaurant ke liye menu fetch karna heavy hai.
- Phase-1 (demo): `RestaurantCard` ko `menuItems?: MenuItem[]` prop se items do, ya lazy load karo.
- Firestore reads badhne na payein iska dhyan rakho.

## 4. UI Details
Har row me:
- VegDot (veg / non-veg)
- Item name (1 line ellipsis)
- Price (`formatPrice` se, `src/lib/format.ts`)
- Chhoti thumbnail (SmartImage, `menu-row__image` jaisi chhoti)
- Add / stepper button (small)

Styling: `RestaurantCard.css` me naya `.card__bestseller` block. Dark theme already hai, usi ko follow karo.

## 5. Out of Scope (abhi nahi karna)
- Orders se real-time bestseller aggregation.
- Admin panel se `soldCount` edit karna.
- Bestseller par click karke detail page.
- Analytics / tracking.

## 6. Acceptance Criteria
- [ ] Home page par har restaurant card ke niche 3 most-sold items dikhte hain.
- [ ] Sorting `soldCount` desc se hoti hai, fallback rating/first-3 kaam karta hai.
- [ ] Home se Add karne par cart update hota hai + toast aata hai.
- [ ] Out-of-stock / closed restaurant me Add disabled hai.
- [ ] `npm run build` / `tsc` fail nahi hota.
- [ ] Mobile + desktop dono me card layout tootta nahi hai.

## 7. Open Questions (Code se pehle confirm karna hai)
1. Field ka naam `soldCount` theek hai, ya `totalOrders` / `orderCount` chahiye?
2. Fallback (rating / first-3) chalega?
3. Closed restaurant ke liye Add disabled rakhein?
