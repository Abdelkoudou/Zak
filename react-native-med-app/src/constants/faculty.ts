export const FACULTIES = [
    { label: '🏛️ Faculté de Constantine (Fac Mère)', value: 'fac_mere' },
    { label: '🏫 Annexe de Biskra', value: 'annexe_biskra' },
    { label: '🏫 Annexe d\'Oum El Bouaghi', value: 'annexe_oum_el_bouaghi' },
    { label: '🏫 Annexe de Khenchela', value: 'annexe_khenchela' },
    { label: '🏫 Annexe de Souk Ahras', value: 'annexe_souk_ahras' },
    { label: '🏫 autre faculte', value: 'autre faculté ' },
 

] as const;

export type Faculty = typeof FACULTIES[number]['value'];
