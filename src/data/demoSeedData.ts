// Static fallback data used when the live backend is unreachable.
// Mirrors the shape returned by the dashboard queries so the UI works seamlessly.

export const demoDatasets = [
  {
    id: "demo-ds-1",
    title: "Daily Mandi Prices (Demo)",
    category: "agriculture",
    total_records: 22,
    last_synced_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "demo-ds-2",
    title: "State Rainfall (Demo)",
    category: "weather",
    total_records: 10,
    last_synced_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

// Each entry shaped like a row from fact_production
export const demoProduction = [
  // Punjab
  { state: "Punjab", crop: "Wheat", district: "Ludhiana", created_at: "2023-03-15", raw_record: { modal_price: 2150, market: "Khanna" } },
  { state: "Punjab", crop: "Rice", district: "Amritsar", created_at: "2023-04-10", raw_record: { modal_price: 2050, market: "Amritsar" } },
  { state: "Punjab", crop: "Maize", district: "Patiala", created_at: "2023-05-12", raw_record: { modal_price: 1850, market: "Patiala" } },
  { state: "Punjab", crop: "Cotton", district: "Bathinda", created_at: "2023-06-08", raw_record: { modal_price: 6200, market: "Bathinda" } },
  { state: "Punjab", crop: "Wheat", district: "Jalandhar", created_at: "2023-03-20", raw_record: { modal_price: 2180, market: "Jalandhar" } },

  // Maharashtra
  { state: "Maharashtra", crop: "Onion", district: "Nashik", created_at: "2023-04-05", raw_record: { modal_price: 1750, market: "Lasalgaon" } },
  { state: "Maharashtra", crop: "Soybean", district: "Latur", created_at: "2023-05-18", raw_record: { modal_price: 4400, market: "Latur" } },
  { state: "Maharashtra", crop: "Cotton", district: "Yavatmal", created_at: "2023-06-22", raw_record: { modal_price: 6500, market: "Yavatmal" } },
  { state: "Maharashtra", crop: "Sugarcane", district: "Pune", created_at: "2023-07-10", raw_record: { modal_price: 320, market: "Pune" } },
  { state: "Maharashtra", crop: "Tur", district: "Akola", created_at: "2023-08-14", raw_record: { modal_price: 8200, market: "Akola" } },

  // Uttar Pradesh
  { state: "Uttar Pradesh", crop: "Wheat", district: "Meerut", created_at: "2023-03-25", raw_record: { modal_price: 2100, market: "Meerut" } },
  { state: "Uttar Pradesh", crop: "Sugarcane", district: "Muzaffarnagar", created_at: "2023-04-30", raw_record: { modal_price: 340, market: "Muzaffarnagar" } },
  { state: "Uttar Pradesh", crop: "Potato", district: "Agra", created_at: "2023-05-15", raw_record: { modal_price: 1200, market: "Agra" } },
  { state: "Uttar Pradesh", crop: "Rice", district: "Varanasi", created_at: "2023-09-12", raw_record: { modal_price: 2080, market: "Varanasi" } },

  // Karnataka
  { state: "Karnataka", crop: "Coffee", district: "Chikmagalur", created_at: "2023-02-18", raw_record: { modal_price: 18500, market: "Chikmagalur" } },
  { state: "Karnataka", crop: "Ragi", district: "Mandya", created_at: "2023-04-22", raw_record: { modal_price: 3400, market: "Mandya" } },
  { state: "Karnataka", crop: "Tur", district: "Kalaburagi", created_at: "2023-06-15", raw_record: { modal_price: 8400, market: "Kalaburagi" } },
  { state: "Karnataka", crop: "Cotton", district: "Raichur", created_at: "2023-07-20", raw_record: { modal_price: 6300, market: "Raichur" } },

  // Madhya Pradesh
  { state: "Madhya Pradesh", crop: "Soybean", district: "Indore", created_at: "2023-05-08", raw_record: { modal_price: 4500, market: "Indore" } },
  { state: "Madhya Pradesh", crop: "Wheat", district: "Bhopal", created_at: "2023-03-28", raw_record: { modal_price: 2120, market: "Bhopal" } },
  { state: "Madhya Pradesh", crop: "Gram", district: "Ujjain", created_at: "2023-04-18", raw_record: { modal_price: 5100, market: "Ujjain" } },
  { state: "Madhya Pradesh", crop: "Mustard", district: "Gwalior", created_at: "2023-02-25", raw_record: { modal_price: 5400, market: "Gwalior" } },
];
