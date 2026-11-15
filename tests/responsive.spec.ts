import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

type Role = "admin" | "faculty" | "quality" | "research" | "graduate" | "student";
const credentials: Record<Role,{email:string;home:string}> = {
  admin:{email:"admin@riax.uz",home:"/admin"}, faculty:{email:"professor@riax.uz",home:"/admin"},
  quality:{email:"sifat@riax.uz",home:"/admin"}, research:{email:"nashr@riax.uz",home:"/admin"},
  graduate:{email:"bitiruvchi@riax.uz",home:"/admin"}, student:{email:"talaba@riax.uz",home:"/student"},
};
const commonRoutes=["/faculty","/faculty/certificates","/faculty/development","/publications","/publications/faculty","/publications/analytics","/publications/import","/teaching","/teaching/materials","/teaching/lessons","/teaching/portfolio","/quality","/quality/lessons","/quality/ai","/quality/actions","/graduates/internships","/graduates/theses","/graduates/attestation"];
const viewportWidths=[320,375,390,430,768,1024,1366,1440,1920];
const screenshotWidths=new Set([390,768,1440]);
mkdirSync("artifacts/screenshots",{recursive:true});

async function loginAs(page:Page,role:Role){const response=await page.context().request.post("/api/auth/demo",{data:{email:credentials[role].email,password:"Demo123!"}});expect(response.ok()).toBeTruthy()}
async function noOverflow(page:Page){const size=await page.evaluate(()=>({viewport:window.innerWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));expect(size.html,JSON.stringify(size)).toBeLessThanOrEqual(size.viewport+1);expect(size.body,JSON.stringify(size)).toBeLessThanOrEqual(size.viewport+1)}
async function openMobileDrawer(page:Page){const button=page.getByRole("button",{name:"Menyuni ochish"});await expect(button).toBeVisible();await page.waitForTimeout(300);await button.click();const drawer=page.getByRole("dialog",{name:"Mobil navigatsiya"});if(await drawer.count()===0){await page.waitForTimeout(400);await button.click()}await expect(drawer).toBeVisible();return drawer}

for(const width of viewportWidths){
  for(const role of ["admin","faculty","student"] as Role[]){
    test(`${role} dashboard ${width}px`,async({page})=>{
      await page.setViewportSize({width,height:width<=430?844:width<=768?1024:900});await loginAs(page,role);await page.goto(credentials[role].home,{waitUntil:"domcontentloaded"});
      await expect(page.locator("main h1").first()).toContainText("SMART RIAX");await noOverflow(page);
      if(width<1024){const drawer=await openMobileDrawer(page);await expect(drawer.locator("[data-primary-nav]")).toHaveCount(5);await page.getByRole("button",{name:"Menyuni yopish"}).last().click()}else{await expect(page.locator("aside nav [data-primary-nav]")).toHaveCount(5)}
      if(width<768)await expect(page.getByRole("navigation",{name:"Tezkor navigatsiya"})).toBeVisible();
      if(screenshotWidths.has(width))await page.screenshot({path:`artifacts/screenshots/${role}-${width}.png`,fullPage:true,animations:"disabled"});
    });
  }
}

test("besh asosiy menyu va barcha modul route'lari responsive",async({page})=>{
  test.setTimeout(120_000);
  for(const width of [320,1024]){await page.setViewportSize({width,height:width===320?844:900});await loginAs(page,"admin");for(const route of commonRoutes){await page.goto(route,{waitUntil:"domcontentloaded"});await expect(page.locator("main")).toBeVisible();await noOverflow(page)}}
});

test("yangi mas'ul rollar o'z modullariga kira oladi",async({page})=>{
  for(const [role,route] of [["quality","/quality"],["research","/publications"],["graduate","/graduates/internships"]] as [Role,string][]){await loginAs(page,role);await page.goto(route);await expect(page.locator("main h1").first()).toBeVisible();await expect(page.getByRole("button",{name:/Yangi yozuv/}).first()).toBeVisible()}
});

test("mobil login, besh menyu va logout ishlaydi",async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto("/login");await page.getByRole("button",{name:"Kafedra mudiri"}).click();await page.getByRole("button",{name:"Kirish"}).click();await expect(page).toHaveURL(/\/admin$/);await page.getByRole("button",{name:"Menyuni ochish"}).click();const drawer=page.getByRole("dialog",{name:"Mobil navigatsiya"});await drawer.getByRole("link",{name:"Ilmiy nashrlar"}).click();await expect(page).toHaveURL(/\/publications$/);await page.getByRole("button",{name:"Profil menyusi"}).click();await page.getByRole("button",{name:"Chiqish"}).click();await expect(page).toHaveURL(/\/login$/)
});

test("sidebar accordion submenyulari va TDIU rasmi ishlaydi",async({page})=>{
  await page.setViewportSize({width:1440,height:900});await loginAs(page,"admin");await page.goto("/publications");
  const sidebar=page.locator("aside");const faculty=sidebar.getByRole("button",{name:/Professor-o‘qituvchilar/});
  await expect(faculty).toHaveAttribute("aria-expanded","false");await faculty.click();await expect(faculty).toHaveAttribute("aria-expanded","true");
  await expect(sidebar.getByRole("link",{name:"Malaka oshirish"})).toBeVisible();await sidebar.getByRole("link",{name:"Sertifikatlar"}).click();await expect(page).toHaveURL(/\/faculty\/certificates$/);
  const graduates=sidebar.getByRole("button",{name:/Bitiruvchilar/});await graduates.click();await expect(graduates).toHaveAttribute("aria-expanded","true");
  await expect(sidebar.getByRole("link",{name:"Amaliyot"})).toBeVisible();await expect(sidebar.getByRole("link",{name:"BMI"})).toBeVisible();await expect(sidebar.getByRole("link",{name:"YADK"})).toBeVisible();
  await sidebar.getByRole("link",{name:"BMI"}).click();await expect(page).toHaveURL(/\/graduates\/theses$/);
  await expect(sidebar.getByRole("img",{name:"Toshkent davlat iqtisodiyot universiteti binosi"})).toBeVisible();await expect(sidebar.getByText("5 yo‘nalishli monitoring")).toBeVisible();
  await noOverflow(page);

  await page.setViewportSize({width:390,height:844});await page.goto("/admin");const drawer=await openMobileDrawer(page);
  await expect(drawer.getByRole("img",{name:"Toshkent davlat iqtisodiyot universiteti binosi"})).toBeAttached();await expect(drawer.getByText("5 yo‘nalishli monitoring")).toBeAttached();
  await drawer.screenshot({path:"artifacts/screenshots/sidebar-mobile-390.png",animations:"disabled"});
});

test("asosiy CRUD oqimlari demo saqlash bilan ishlaydi",async({page})=>{
  await page.setViewportSize({width:390,height:844});await loginAs(page,"admin");
  await page.goto("/faculty");await page.getByRole("button",{name:"Yangi yozuv"}).click();await page.getByLabel("F.I.Sh. *").fill("Test Professor");await page.getByLabel("Lavozim *").fill("Dotsent");await page.getByLabel("Bandlik holati *").selectOption("active");await page.getByLabel("Kafedra *").fill("RIAX");await page.getByRole("button",{name:"Saqlash"}).click();await page.getByPlaceholder("Barcha maydonlar bo‘yicha qidirish...").fill("Test Professor");await expect(page.getByText("Test Professor")).toBeVisible();
  await page.goto("/publications");await page.getByRole("button",{name:"Yangi yozuv"}).first().click();await page.getByLabel("Maqola nomi *").fill("Tekshiruv nashri");await page.getByLabel("Mualliflar *").fill("Test Professor");await page.getByLabel("Jurnal yoki konferensiya *").fill("Sinov jurnali");await page.getByLabel("Nashr yili *").fill("2026");await page.getByRole("button",{name:"Saqlash"}).click();await expect(page.getByText("Tekshiruv nashri")).toBeVisible();
  await page.goto("/quality/ai");await page.getByRole("button",{name:"Yangi yozuv"}).click();await page.getByLabel("Material ID *").fill("demo-material");await page.getByLabel("Professor-o‘qituvchi ID *").fill("demo-faculty");await page.getByLabel("AI vositasi toifasi *").fill("Matn yordamchisi");await page.getByLabel("Foydalanish maqsadi *").fill("Tuzilmani taklif qilish, inson tomonidan tekshirilgan");await page.getByRole("button",{name:"Saqlash"}).click();await expect(page.getByText("Matn yordamchisi")).toBeVisible();
  await page.goto("/graduates/internships");await page.getByRole("button",{name:"Yangi yozuv"}).first().click();await page.getByLabel("Talaba ID *").fill("demo-student");await page.getByLabel("Talaba F.I.Sh. *").fill("Test Talaba");await page.getByLabel("Akademik guruh *").fill("DI-01");await page.getByLabel("Amaliyot tashkiloti *").fill("TSUE");await page.getByLabel("Boshlanish *").fill("2026-01-10");await page.getByLabel("Yakun *").fill("2026-03-10");await page.getByRole("button",{name:"Saqlash"}).click();await expect(page.getByText("Test Talaba")).toBeVisible();
});

test("fayl tanlash va portfolio PDF eksporti ishlaydi",async({page})=>{
  await loginAs(page,"admin");await page.goto("/faculty");await page.getByRole("button",{name:"Yangi yozuv"}).click();await page.getByLabel("F.I.Sh. *").fill("Portfolio Professor");await page.getByLabel("Lavozim *").fill("Professor");await page.getByLabel("Bandlik holati *").selectOption("active");await page.getByLabel("Kafedra *").fill("RIAX");await page.getByLabel("Faol xodim").check();await page.getByRole("button",{name:"Saqlash"}).click();
  await page.goto("/teaching/portfolio");await page.getByLabel("Professor-o‘qituvchini tanlang").selectOption({label:"Portfolio Professor"});const download=page.waitForEvent("download");await page.getByRole("button",{name:/PDF portfolio/}).click();expect((await download).suggestedFilename()).toContain("portfolio.pdf");
});

test("Scopus Excel manbasidagi barcha professorlar ko‘rsatiladi",async({page})=>{
  await page.setViewportSize({width:1440,height:900});await loginAs(page,"admin");await page.goto("/faculty");
  await expect(page.getByText("Jami xodimlar").locator("..").getByText("51",{exact:true})).toBeVisible();
  await expect(page.getByText("Scopus ID va havola mos").locator("..").getByText("34",{exact:true})).toBeVisible();
  await page.screenshot({path:"artifacts/screenshots/faculty-registry-1440.png",fullPage:true,animations:"disabled"});
  const search=page.getByPlaceholder("Barcha maydonlar bo‘yicha qidirish...");await search.fill("Madyarova Muxlisa");
  await expect(page.getByText("Madyarova Muxlisa Abdulla qizi")).toBeVisible();await expect(page.getByRole("table").getByText("Tekshiruv kerak")).toBeVisible();
  await expect(page.getByRole("link",{name:/60647745100/})).toHaveAttribute("href",/authorId=60647406000/);
});

test("SMART RIAX nomi va subtitle barcha ekranlarda saqlangan",async({page})=>{const subtitle="Aqlli Kafedra - Raqamli iqtisodiyot va axborot xavfsizligi kafedrasining raqamli monitoringi";for(const width of [320,1440]){await page.setViewportSize({width,height:width===320?844:900});await page.context().clearCookies();await page.goto("/login");await expect(page).toHaveTitle("SMART RIAX");await expect(page.getByText(subtitle,{exact:true}).filter({visible:true}).first()).toBeVisible();await loginAs(page,"admin");await page.goto("/admin");await expect(page.locator("main").getByText(subtitle,{exact:true})).toBeVisible();await noOverflow(page)}});
