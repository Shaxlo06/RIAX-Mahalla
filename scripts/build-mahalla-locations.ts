import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Student = {
  id: string;
  fullName: string;
  group: string;
  supervisorName: string;
  region: string;
  district: string | null;
  mahallaName: string | null;
  practiceAddress: string;
};

type PointFeature = {
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: { mahalla_id: number; name: string; district_soato: string };
};

type PolygonFeature = {
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
  properties: { mahalla_id: number };
};

async function main() {
const projectRoot = path.resolve(import.meta.dirname, "..");
const raw = JSON.parse(await readFile(path.join(projectRoot, "data/riax-data.json"), "utf8")) as { students: Student[] };
const apiRoot = "https://raw.githubusercontent.com/pdlpad/SOATO/main";
const districtCodes = ["1726262", "1726264", "1726266", "1726269", "1726273", "1726277", "1726280", "1726283", "1726287", "1726290", "1726292", "1726294"];

const cyrillicMap: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"g",ғ:"g",д:"d",е:"e",ё:"yo",ж:"j",з:"z",и:"i",й:"y",к:"k",қ:"q",л:"l",м:"m",н:"n",ң:"ng",о:"o",ў:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"x",ҳ:"h",ц:"s",ч:"ch",ш:"sh",щ:"sh",ъ:"",ы:"i",ь:"",э:"e",ю:"yu",я:"ya",
};

function transliterate(value: string) {
  return [...value.toLowerCase()].map((character) => cyrillicMap[character] ?? character).join("");
}

function normalize(value: string) {
  return transliterate(value)
    .replace(/mfy|mahalla fuqarolar yig.?ini|tumani/g, "")
    .replace(/[‘’ʼʻ'`\-\s.]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function distance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return matrix[a.length][b.length];
}

const internetFeatures: Array<PointFeature & { districtName: string }> = [];
const internetPolygons = new Map<number, PolygonFeature["geometry"]>();
for (const code of districtCodes) {
  const [pointsResponse, districtResponse, polygonsResponse] = await Promise.all([
    fetch(`${apiRoot}/data/points/1726/${code}.geojson`),
    fetch(`${apiRoot}/data/districts/1726/${code}.json`),
    fetch(`${apiRoot}/data/polygons/1726/${code}.geojson`),
  ]);
  if (!pointsResponse.ok || !districtResponse.ok || !polygonsResponse.ok) throw new Error(`${code} uchun internet ma’lumoti olinmadi.`);
  const points = await pointsResponse.json() as { features: PointFeature[] };
  const district = await districtResponse.json() as { name_soato: string };
  const polygons = await polygonsResponse.json() as { features: PolygonFeature[] };
  internetFeatures.push(...points.features.map((feature) => ({ ...feature, districtName: district.name_soato })));
  for (const polygon of polygons.features) internetPolygons.set(polygon.properties.mahalla_id, polygon.geometry);
}

const cityStudents = raw.students.filter((student) => student.region === "Toshkent shahri" && student.mahallaName);
const grouped = new Map<string, Student[]>();
for (const student of cityStudents) {
  const key = `${student.district}|${student.mahallaName}`;
  grouped.set(key, [...(grouped.get(key) ?? []), student]);
}

const locations = [...grouped.values()].map((students) => {
  const first = students[0];
  const targetName = normalize(first.mahallaName ?? "");
  const districtName = first.practiceAddress.split(",").map((part) => part.trim()).find((part) => /tumani/i.test(part)) ?? first.district ?? "Tuman kiritilmagan";
  const targetDistrict = normalize(districtName);
  const districtCandidates = internetFeatures.filter((feature) => normalize(feature.districtName) === targetDistrict);
  const ranked = (districtCandidates.length ? districtCandidates : internetFeatures)
    .map((feature) => ({ feature, score: distance(targetName, normalize(feature.properties.name)) }))
    .sort((a, b) => a.score - b.score);
  const best = ranked[0];
  const accepted = best && best.score <= Math.max(3, Math.floor(targetName.length * 0.22));
  if (!accepted) console.warn(`Mos kelmadi: ${first.district} / ${first.mahallaName}; eng yaqin: ${best?.feature.properties.name} (${best?.score})`);
  return {
    id: accepted ? String(best.feature.properties.mahalla_id) : `unmatched-${normalize(first.mahallaName ?? "")}`,
    name: `${first.mahallaName} MFY`,
    district: districtName,
    address: first.practiceAddress,
    latitude: accepted ? best.feature.geometry.coordinates[1] : null,
    longitude: accepted ? best.feature.geometry.coordinates[0] : null,
    sourceName: accepted ? best.feature.properties.name : null,
    source: accepted ? `${apiRoot}/data/points/1726/${best.feature.properties.district_soato}.geojson` : null,
    geometry: accepted ? internetPolygons.get(best.feature.properties.mahalla_id) ?? null : null,
    students: students.map((student) => ({ id: student.id, fullName: student.fullName, group: student.group, supervisorName: student.supervisorName })),
  };
}).sort((a, b) => a.district.localeCompare(b.district, "uz") || a.name.localeCompare(b.name, "uz"));

const output = {
  generatedAt: new Date().toISOString(),
  source: "SOATO mahalla centroids derived from OpenStreetMap building data",
  sourceRepository: "https://github.com/pdlpad/SOATO",
  mapTiles: "https://www.openstreetmap.org/copyright",
  locations,
};
await writeFile(path.join(projectRoot, "data/tashkent-mahalla-locations.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`${locations.length} ta Toshkent shahri mahallasi yozildi; koordinatali: ${locations.filter((location) => location.latitude).length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
