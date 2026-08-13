// Data wilayah Kota Bontang — 3 kecamatan, 15 kelurahan
export const WILAYAH_BONTANG: Record<string, string[]> = {
  'Bontang Utara': [
    'Api-api',
    'Bontang Baru',
    'Bontang Kuala',
    'Gunung Elai',
    'Guntung',
    'Loktuan',
  ],
  'Bontang Selatan': [
    'Berbas Pantai',
    'Berbas Tengah',
    'Bontang Lestari',
    'Satimpo',
    'Tanjung Laut',
    'Tanjung Laut Indah',
  ],
  'Bontang Barat': [
    'Belimbing',
    'Gunung Telihan',
    'Kanaan',
  ],
}

export const KECAMATAN_LIST = Object.keys(WILAYAH_BONTANG)

export function getKelurahan(kecamatan: string): string[] {
  return WILAYAH_BONTANG[kecamatan] ?? []
}
