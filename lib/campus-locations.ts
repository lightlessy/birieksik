export type CampusLocation = {
  label: string;
  lat: number;
  lng: number;
};

export const CAMPUS_LOCATIONS: Record<string, CampusLocation[]> = {
  "Maçka": [
    { label: "Maçka Kantin", lat: 41.0416, lng: 28.9942 },
    { label: "Maçka Kütüphane", lat: 41.0423, lng: 28.9951 },
  ],
  "Gümüşsuyu": [
    { label: "Gümüşsuyu Kantin", lat: 41.0366, lng: 28.9892 },
    { label: "Gümüşsuyu Giriş", lat: 41.0374, lng: 28.9899 },
  ],
  "Taşkışla": [
    { label: "Taşkışla Avlu", lat: 41.0407, lng: 28.9885 },
    { label: "Taşkışla Kantin", lat: 41.0402, lng: 28.9892 },
  ],
  "Ayazağa": [
    { label: "Ayazağa Merkezi", lat: 41.1052, lng: 29.0238 },
    { label: "Ayazağa Kütüphane", lat: 41.1061, lng: 29.0247 },
  ],
  "Diğer": [],
};
