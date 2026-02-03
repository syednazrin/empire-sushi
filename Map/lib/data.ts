// Dummy / mock data for Empire Sushi study

export const BRANDS = [
  { id: "empire", name: "Empire Sushi", color: "#c4a77d" },
  { id: "mentai", name: "Sushi Mentai", color: "#8b7355" },
  { id: "nippon", name: "Nippon Sushi", color: "#6b5344" },
  { id: "familymart", name: "FamilyMart", color: "#2c5f2d" },
] as const;

export type BrandId = (typeof BRANDS)[number]["id"];

// Store locations (Malaysia — KL / Selangor area, dummy)
export const STORES: { brand: BrandId; name: string; lng: number; lat: number }[] = [
  { brand: "empire", name: "Empire Sushi KLCC", lng: 101.7112, lat: 3.1579 },
  { brand: "empire", name: "Empire Sushi PJ", lng: 101.6167, lat: 3.1167 },
  { brand: "empire", name: "Empire Sushi Subang", lng: 101.5833, lat: 3.0833 },
  { brand: "mentai", name: "Sushi Mentai Sunway", lng: 101.6167, lat: 3.0667 },
  { brand: "mentai", name: "Sushi Mentai KL", lng: 101.6987, lat: 3.1390 },
  { brand: "mentai", name: "Sushi Mentai Shah Alam", lng: 101.5333, lat: 3.0833 },
  { brand: "nippon", name: "Nippon Sushi Mid Valley", lng: 101.6770, lat: 3.1189 },
  { brand: "nippon", name: "Nippon Sushi Cheras", lng: 101.7833, lat: 3.0833 },
  { brand: "familymart", name: "FamilyMart Bangsar", lng: 101.6670, lat: 3.1667 },
  { brand: "familymart", name: "FamilyMart Setapak", lng: 101.7333, lat: 3.1833 },
  { brand: "familymart", name: "FamilyMart Cyberjaya", lng: 101.6500, lat: 2.9213 },
];

// Analytics by brand (mock)
export const BRAND_METRICS = [
  { brand: "Empire Sushi", avgPrice: 12.5, menuCount: 45, storeCount: 3 },
  { brand: "Sushi Mentai", avgPrice: 9.8, menuCount: 38, storeCount: 3 },
  { brand: "Nippon Sushi", avgPrice: 11.2, menuCount: 52, storeCount: 2 },
  { brand: "FamilyMart", avgPrice: 6.5, menuCount: 28, storeCount: 3 },
];

// Top 5 items per brand (mock)
export const TOP_ITEMS: Record<string, string[]> = {
  "Empire Sushi": ["Salmon Nigiri", "Dragon Roll", "Unagi Don", "Miso Soup", "Edamame"],
  "Sushi Mentai": ["Mentai Salmon", "Salmon Aburi", "Chawanmushi", "Green Tea", "Tamago"],
  "Nippon Sushi": ["Toro Nigiri", "Spicy Tuna", "Tempura Udon", "Gyoza", "Matcha Ice"],
  "FamilyMart": ["Onigiri Salmon", "Inari", "Tamago Sushi", "Noodle Cup", "Oden"],
};

// Sushi trend over time (mock — last 12 months)
export const TREND_DATA = [
  { month: "Mar", premium: 42, mass: 68 },
  { month: "Apr", premium: 44, mass: 71 },
  { month: "May", premium: 45, mass: 69 },
  { month: "Jun", premium: 47, mass: 72 },
  { month: "Jul", premium: 48, mass: 70 },
  { month: "Aug", premium: 49, mass: 74 },
  { month: "Sep", premium: 51, mass: 73 },
  { month: "Oct", premium: 52, mass: 75 },
  { month: "Nov", premium: 53, mass: 72 },
  { month: "Dec", premium: 54, mass: 76 },
  { month: "Jan", premium: 55, mass: 74 },
  { month: "Feb", premium: 56, mass: 78 },
];
