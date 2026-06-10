import { BioObject, Scale } from '../types';

export interface AnatomyEntry {
  id: string;
  name: string;
  kind: 'system' | 'organ';
  scale: Scale;
  color: string;
  summary: string;
  size: string;
  facts: string[];
}

export const ANATOMY_ENTRIES: AnatomyEntry[] = [
  { id: 'system:skeletal', name: 'Skeletal system', kind: 'system', scale: Scale.OrganSystem, color: '#e8e1cf', summary: 'Bones, cartilage, and joints support the body and protect organs.', size: '206 bones in a typical adult', facts: ['Stores calcium and phosphorus.', 'Bone marrow produces blood cells.'] },
  { id: 'system:nervous', name: 'Nervous system', kind: 'system', scale: Scale.OrganSystem, color: '#ffd65a', summary: 'The brain, spinal cord, and nerves coordinate sensation and response.', size: 'central and peripheral networks', facts: ['Neurons transmit electrochemical signals.', 'The spinal cord links the brain and body.'] },
  { id: 'system:cardiovascular', name: 'Cardiovascular system', kind: 'system', scale: Scale.OrganSystem, color: '#ff596d', summary: 'The heart and vessels circulate blood through the body.', size: '~100,000 km of vessels', facts: ['Arteries carry blood away from the heart.', 'Veins return blood to the heart.'] },
  { id: 'system:respiratory', name: 'Respiratory system', kind: 'system', scale: Scale.OrganSystem, color: '#78dce8', summary: 'Airways and lungs exchange oxygen and carbon dioxide.', size: 'two lungs and branching airways', facts: ['Gas exchange occurs across alveoli.', 'The diaphragm drives ventilation.'] },
  { id: 'system:digestive', name: 'Digestive system', kind: 'system', scale: Scale.OrganSystem, color: '#e8a15b', summary: 'Organs that break down food, absorb nutrients, and eliminate solid waste.', size: '~9 m alimentary canal', facts: ['The small intestine absorbs most nutrients.', 'The liver processes absorbed substances.'] },
  { id: 'system:urinary', name: 'Urinary system', kind: 'system', scale: Scale.OrganSystem, color: '#a883ff', summary: 'The kidneys and urinary tract regulate fluid composition and remove soluble waste.', size: 'two kidneys and urinary tract', facts: ['Nephrons filter blood plasma.', 'The bladder stores urine.'] },
  { id: 'organ:brain', name: 'Brain', kind: 'organ', scale: Scale.Organ, color: '#f5b8c8', summary: 'The central organ of the nervous system.', size: '~1.3 to 1.4 kg adult mass', facts: ['Contains cerebral hemispheres, cerebellum, and brainstem.', 'Protected by the skull and meninges.'] },
  { id: 'organ:heart', name: 'Heart', kind: 'organ', scale: Scale.Organ, color: '#ff4058', summary: 'A muscular pump that drives pulmonary and systemic circulation.', size: '~12 cm long', facts: ['Four chambers direct blood flow.', 'Cardiac muscle contracts rhythmically.'] },
  { id: 'organ:lungs', name: 'Lungs', kind: 'organ', scale: Scale.Organ, color: '#79d6df', summary: 'Paired organs where gases diffuse between air and blood.', size: '~4 to 6 L total capacity', facts: ['The right lung has three lobes.', 'The left lung makes room for the heart.'] },
  { id: 'organ:liver', name: 'Liver', kind: 'organ', scale: Scale.Organ, color: '#9d503f', summary: 'A large metabolic organ that processes nutrients and produces bile.', size: '~1.5 kg adult mass', facts: ['Receives blood from the hepatic portal vein.', 'Performs many metabolic and synthetic functions.'] },
  { id: 'organ:stomach', name: 'Stomach', kind: 'organ', scale: Scale.Organ, color: '#e59b69', summary: 'A muscular chamber that mixes food with gastric secretions.', size: '~1 L relaxed capacity', facts: ['Connects the esophagus to the duodenum.', 'Begins substantial protein digestion.'] },
  { id: 'organ:intestines', name: 'Intestines', kind: 'organ', scale: Scale.Organ, color: '#d88961', summary: 'The small and large intestines absorb nutrients and water.', size: '~7.5 m combined length', facts: ['Villi expand absorptive area.', 'The colon compacts fecal material.'] },
  { id: 'organ:kidneys', name: 'Kidneys', kind: 'organ', scale: Scale.Organ, color: '#a45b73', summary: 'Paired organs that filter blood and regulate fluid balance.', size: '~11 cm each', facts: ['Each kidney contains about one million nephrons.', 'They help regulate blood pressure and pH.'] },
];

export const ANATOMY_OBJECTS: Record<string, BioObject> = Object.fromEntries(
  ANATOMY_ENTRIES.map((entry) => [entry.id, { ...entry, source: 'hpa', crossRefs: ['ncbi'] }]),
);
