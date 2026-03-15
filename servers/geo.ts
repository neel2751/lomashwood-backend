"use server";

export async function searchAddress(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gb&addressdetails=1&limit=5`;
  const res = await fetch(url, { headers: { "User-Agent": "AddressPicker/1.0" } });
  return res.json();
}

export async function reverseGeocode(lat: number, lon: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": "AddressPicker/1.0" } });
  return res.json();
}
