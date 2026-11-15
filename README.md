# SMART RIAX

**Aqlli Kafedra - Raqamli iqtisodiyot va axborot xavfsizligi kafedrasining raqamli monitoringi**

Toshkent davlat iqtisodiyot universiteti “Raqamli iqtisodiyot va axborot xavfsizligi” kafedrasi uchun professor-o‘qituvchilar, ilmiy nashrlar, dars jarayoni, ta’lim sifati va bitiruvchilar jarayonlarini boshqaruvchi Next.js platforma.

## Asosiy modullar

Platformada aynan beshta asosiy menyu mavjud:

1. **Professor-o‘qituvchilar** — profil, aloqa vakolati, sertifikat, kasbiy rivojlanish va muddat monitoringi.
2. **Ilmiy nashrlar** — nashr reyestri, hammualliflik, DOI/Crossref, Excel/CSV import, Scopus/WoS identifikatorlari va unique analitika.
3. **Dars jarayoni** — fan va yuklama, o‘quv materiallari va versiyalari, dars reyestri, foydalanish dalillari, PDF/ZIP portfolio.
4. **Ta’lim sifati** — mezonli cheklist, ball va izoh, tuzatish choralari, AI yordamidan foydalanish deklaratsiyasi.
5. **Bitiruvchilar** — to‘rtta ichki bo‘lim: Amaliyot, BMI, YADK va Magistr.

SMART RIAX logosi dashboard bosh sahifasiga olib boradi. Eski talaba–mahalla route va ma’lumotlari tarixiy moslik uchun saqlangan, ammo asosiy menyudan chiqarilgan.

## Ishga tushirish

Talab: Node.js 20.9 yoki yangiroq.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Brauzer: `http://localhost:3000`.

Production tekshiruvi va ishga tushirish:

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

Vercel’da project root shu papka bo‘lishi, build command `npm run build`, output esa Next.js standart qiymatida qolishi kerak. Environment qiymatlarini hosting sozlamalariga kiriting.

## Demo hisoblar

Barcha demo hisoblar uchun parol: `Demo123!`.

| Rol | Email |
|---|---|
| Super Admin | `superadmin@riax.uz` |
| Kafedra mudiri | `admin@riax.uz` |
| Professor-o‘qituvchi | `professor@riax.uz` |
| Ta’lim sifati monitoring mas’uli | `sifat@riax.uz` |
| Ilmiy nashrlar monitoring mas’uli | `nashr@riax.uz` |
| Bitiruv ishlari koordinatori | `bitiruvchi@riax.uz` |
| Talaba | `talaba@riax.uz` |

Demo rejimda CRUD yozuvlari brauzer `localStorage` xotirasida saqlanadi. Production rejimida Supabase va RLS ishlaydi.

## Supabase va migratsiya

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_DEMO_MODE=false
```

SQL Editor yoki migratsiya vositasi orqali tartib bilan bajaring:

1. `supabase/migrations/0001_initial.sql`
2. `supabase/migrations/0002_smart_riax_academic_management.sql`
3. `supabase/migrations/0003_faculty_scopus_import.sql`
4. `supabase/migrations/0004_department_monitoring_core.sql`
5. `supabase/faculty-seed.sql`
6. `supabase/imports/academic-source-data.sql`
7. Zarur bo‘lsa tarixiy talaba ma’lumotlari uchun `supabase/seed.sql`

Ikkinchi migratsiya eski jadvallarni o‘chirmaydi. U yangi rollar, akademik domen jadvallari, indekslar, RLS siyosatlari, audit triggerlari, professional rivojlanish bildirishnomasi funksiyasi va `smart-riax-documents` yopiq Storage bucketini qo‘shadi.

To‘rtinchi migratsiya ham additiv va qayta qo‘llashga xavfsiz tuzilgan. U ilmiy identifikatorlar, provayderlar kesimidagi bibliometriya, davomat, magistrlik dissertatsiyalari, to‘qqiz bosqichli ilmiy ish monitoringi va YADK nomzodlarini qo‘shadi. Production bazaga qo‘llashdan oldin Supabase backup oling; import SQL mavjud yozuvlarni o‘chirmaydi va barqaror UUID bo‘yicha upsert qiladi.

Professor-o‘qituvchilar reyestri `../RIAX/Scopus ID RIAX.xlsx` manbasidan shakllantiriladi:

```bash
npm run import:faculty
```

Buyruq 51 nafar xodimni tahlil qiladi, `data/faculty-profiles.json` va `supabase/faculty-seed.sql` fayllarini yangilaydi. Supabase environment mavjud bo‘lsa yozuvlarni nomi yoki manba qatori bo‘yicha xavfsiz upsert qiladi. Manbada 34 ta ID profil havolasi bilan mos, 16 ta profil mavjud emas va 1 ta ID/havola konflikti inson tekshiruvi uchun belgilangan.

Qolgan akademik manbalarni qayta generatsiya qilish:

```bash
npm run import:academic -- --source-dir="C:\\path\\to\\RIAX" --contingent="C:\\path\\to\\Bitiruvchi 2025-2026.xlsx"
```

Buyruq Excel/Word manbalarini o‘qib, `data/imported-academic-data.json` va `supabase/imports/academic-source-data.sql` yaratadi. Joriy manbalardan 168 amaliyot yozuvi, 68 BMI, 21 magistr va 88 ta tekshiruv talab qiluvchi YADK nomzodi olindi. 4-kurs kontingentida BMI bilan ishonchli bog‘lash uchun umumiy ID/guruh topilmagani sabab YADK ro‘yxati to‘liq deb belgilanmaydi va 88 yozuvning barchasi admin tasdig‘iga yuboriladi.

Production auth foydalanuvchisi uchun `public.users.id` va Supabase Auth `auth.users.id` bir xil UUID bo‘lishi, `role` esa ruxsat etilgan yangi rollardan biri bo‘lishi kerak.

Malaka oshirish bildirishnomalarini navbatga qo‘yish funksiyasi:

```sql
select public.queue_professional_development_notifications();
```

Uni Supabase Cron/pg_cron yoki ruxsatli scheduler orqali kuniga bir marta chaqirish mumkin.

## Ilmiy integratsiyalar

Crossref DOI metama’lumoti `/api/publications/doi` orqali ruxsatli ochiq API’dan olinadi va `imported` holatida inson tekshiruviga yuboriladi. Indeksatsiya, kvartil, iqtibos yoki h-index to‘qib chiqarilmaydi.

Rasmiy obuna mavjud bo‘lsa server environment’ga qo‘shiladi:

```env
ELSEVIER_API_KEY=...
WOS_API_KEY=...
```

Scopus/Elsevier va Web of Science uchun credential kartalari hamda ma’lumot modeli tayyor. API kaliti va tashkilot obunasisiz avtomatik sinxronlash ishlamaydi; restricted sahifalar scraping qilinmaydi.

## Eksport va fayllar

- Barcha reyestrlarda Excel eksport bor.
- Professor portfolio sahifasi bazadagi yozuvlardan PDF yaratadi.
- ZIP eksport Supabase Storage ulanganda signed URL orqali vakolatli fayllarni qo‘shadi; demo rejimda metadata ZIP yaratiladi.
- Qabul qilinadigan asosiy formatlar: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, PNG/JPG va MP4.

## Testlar

```bash
npm run typecheck
npm run lint
npm run build
npm run test:responsive
```

Playwright 320, 375, 390, 430, 768, 1024, 1366, 1440 va 1920px ekranlarda dashboard, mobil drawer, besh asosiy menyu, barcha yangi route’lar, yangi rollar, CRUD, login/logout, PDF eksport va gorizontal overflow’ni tekshiradi.

Screenshotlar: `artifacts/screenshots/`  
HTML hisobot: `artifacts/playwright-report/`

## Tuzilma

```text
app/(platform)/faculty/       professor-o‘qituvchilar moduli
app/(platform)/publications/  ilmiy nashrlar va import
app/(platform)/teaching/      dars jarayoni va portfolio
app/(platform)/quality/       ta’lim sifati va AI deklaratsiyasi
app/(platform)/graduates/     Amaliyot, BMI, YADK, Magistr va 9 bosqichli monitoring
components/smart-riax/        umumiy CRUD va modul workspacelari
lib/smart-data.ts             Supabase/local demo persistence, upload, Excel
supabase/migrations/          xavfsiz SQL migratsiyalar va RLS
tests/responsive.spec.ts      responsive va funksional Playwright testlari
```

## Muhim cheklovlar

- Rasmiy Scopus/WoS avtomatik sinxronlash uchun tashkilot API credential va obunasi kerak.
- AI indikatori mualliflik isboti emas; platforma uni faqat inson tekshiruvini talab qiluvchi noaniq signal sifatida saqlaydi.
- YADK baholari, plagiat natijalari va indeksatsiya holatlari platforma tomonidan avtomatik to‘qilmaydi yoki belgilanmaydi.
- Productionda demo login sukut bo‘yicha bloklangan. Uni ataylab yoqish uchun ham `NEXT_PUBLIC_DEMO_MODE=true`, ham `NEXT_PUBLIC_ALLOW_PRODUCTION_DEMO_AUTH=true` talab qilinadi; maxfiy ma’lumotli muhitda bu override ishlatilmasin.
