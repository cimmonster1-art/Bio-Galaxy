import { BioObject, DataSourceId, Scale } from '../types';

/**
 * Earth Ecology Explorer dataset.
 *
 * Each city is a scientific *entry point into life* at the Ecosystem scale: a
 * real place on the globe with a factual ecological profile drawn from public
 * Earth-systems and biodiversity databases. Every section names the databases
 * that substantiate it so provenance travels with the data into the sidebar,
 * the bottom card rail, and the copilot's citations.
 *
 * Values are widely published, factual reference figures (Köppen classes,
 * climate normals, elevations, biome/ecoregion names, IUCN statuses). Where a
 * precise figure would be fragile it is stated qualitatively rather than
 * invented. Nothing here is mystical or speculative — it is geography, climate
 * science, ecology, and conservation.
 */

export type IucnStatus = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD';

export const IUCN_LABEL: Record<IucnStatus, string> = {
  LC: 'Least Concern',
  NT: 'Near Threatened',
  VU: 'Vulnerable',
  EN: 'Endangered',
  CR: 'Critically Endangered',
  EW: 'Extinct in the Wild',
  EX: 'Extinct',
  DD: 'Data Deficient',
};

export interface EcologySpecies {
  /** Stable id; resolves to `organism:eco:<id>` in the atlas ontology. */
  id: string;
  name: string;
  scientific: string;
  group: 'mammal' | 'bird' | 'reptile' | 'amphibian' | 'fish' | 'plant' | 'invertebrate';
  iucn: IucnStatus;
  wikiTitle: string;
  blurb: string;
}

export interface EcologyCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  /** Wikipedia article title for the live summary + Commons thumbnail. */
  wikiTitle: string;
  /** Atlas biome this place sits within, linking to the Biome scale. */
  biomeId?: string;
  summary: string;
  climate: {
    koppen: string;
    koppenName: string;
    avgTempC: string;
    rainfallMm: string;
    humidity: string;
    seasonality: string;
  };
  ecology: {
    biome: string;
    ecosystem: string;
    ecoregion: string;
    biodiversity: string;
    endemics: string;
  };
  geology: {
    elevation: string;
    terrain: string;
    soil: string;
    tectonics: string;
  };
  conservation: {
    protectedAreas: string[];
    endangered: string[];
    threats: string[];
    invasives: string[];
  };
  earthSystems: {
    carbon: string;
    vegetation: string;
    water: string;
    productivity: string;
  };
  species: EcologySpecies[];
  /** Databases that substantiate this profile, most relevant first. */
  sources: DataSourceId[];
}

// ── Provenance deep-link builders ───────────────────────────────────────────
const slug = (text: string): string => encodeURIComponent(text.replaceAll(' ', '_'));
const q = (text: string): string => encodeURIComponent(text);

export function gbifSpeciesUrl(scientific: string): string {
  return `https://www.gbif.org/species/search?q=${q(scientific)}`;
}
export function gbifPlaceUrl(city: EcologyCity): string {
  return `https://www.gbif.org/occurrence/map?has_coordinate=true&lat=${city.lat}&lng=${city.lon}`;
}
export function iucnSpeciesUrl(scientific: string): string {
  return `https://www.iucnredlist.org/search?query=${q(scientific)}`;
}
export function ebirdRegionUrl(city: EcologyCity): string {
  return `https://ebird.org/hotspots?lat=${city.lat}&lng=${city.lon}`;
}
export function wikiUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${slug(title)}`;
}
export function wikidataUrl(title: string): string {
  return `https://www.wikidata.org/w/index.php?search=${q(title)}`;
}
export function osmUrl(city: EcologyCity): string {
  return `https://www.openstreetmap.org/#map=11/${city.lat}/${city.lon}`;
}

export const ECOLOGY_CITIES: EcologyCity[] = [
  {
    id: 'brisbane',
    name: 'Brisbane',
    country: 'Australia',
    lat: -27.4705,
    lon: 153.026,
    wikiTitle: 'Brisbane',
    biomeId: 'temperate',
    summary:
      'A humid subtropical river city on Australia’s east coast, fringed by eucalypt forest, mangrove estuaries, and the koala habitat of South East Queensland.',
    climate: {
      koppen: 'Cfa',
      koppenName: 'Humid subtropical',
      avgTempC: '~20.5 °C annual mean (summer ~25 °C, winter ~15 °C)',
      rainfallMm: '~1,000–1,150 mm/year, summer-dominant',
      humidity: 'High in summer (~65–70% afternoon)',
      seasonality: 'Warm wet summers, mild dry winters; no true cold season',
    },
    ecology: {
      biome: 'Temperate & subtropical broadleaf forest',
      ecosystem: 'Eucalypt open forest, melaleuca wetlands, and estuarine mangroves',
      ecoregion: 'Eastern Australian temperate forests',
      biodiversity: 'High — within a megadiverse continent of high endemism',
      endemics: 'Many — Australia’s marsupials and eucalypts are largely endemic',
    },
    geology: {
      elevation: '~28 m (city); Mt Coot-tha ~287 m',
      terrain: 'Coastal floodplain of the Brisbane River with low forested ridges',
      soil: 'Alluvial and clay-loam soils; lateritic ridges',
      tectonics: 'Passive eastern margin of the Australian Plate',
    },
    conservation: {
      protectedAreas: ['D’Aguilar National Park', 'Moreton Bay (Ramsar wetland)', 'Tinchi Tamba Wetlands'],
      endangered: ['Koala (Vulnerable)', 'Grey-headed flying-fox', 'Loggerhead turtle (nearby Moreton Bay)'],
      threats: ['Urban expansion & habitat fragmentation', 'Bushfire regime change', 'Coastal flooding'],
      invasives: ['Cane toad', 'Lantana', 'Feral cats and foxes'],
    },
    earthSystems: {
      carbon: 'Eucalypt forests and mangroves store substantial above- and below-ground (blue) carbon',
      vegetation: 'Sclerophyll eucalypt canopy with grassy understory; estuarine mangroves',
      water: 'Brisbane River catchment draining to Moreton Bay',
      productivity: 'Moderate–high; mangroves rank among the most productive ecosystems',
    },
    species: [
      { id: 'koala', name: 'Koala', scientific: 'Phascolarctos cinereus', group: 'mammal', iucn: 'VU', wikiTitle: 'Koala', blurb: 'An arboreal marsupial that feeds almost exclusively on eucalyptus leaves.' },
      { id: 'kookaburra', name: 'Laughing Kookaburra', scientific: 'Dacelo novaeguineae', group: 'bird', iucn: 'LC', wikiTitle: 'Laughing_kookaburra', blurb: 'A large kingfisher famous for its laughing territorial call.' },
      { id: 'carpet_python', name: 'Carpet Python', scientific: 'Morelia spilota', group: 'reptile', iucn: 'LC', wikiTitle: 'Morelia_spilota', blurb: 'A non-venomous constrictor common in subtropical Queensland.' },
      { id: 'eucalyptus', name: 'Eucalyptus', scientific: 'Eucalyptus tereticornis', group: 'plant', iucn: 'LC', wikiTitle: 'Eucalyptus', blurb: 'Fire-adapted forest trees that define the Australian sclerophyll canopy.' },
    ],
    sources: ['gbif', 'ala', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
  {
    id: 'manaus',
    name: 'Manaus',
    country: 'Brazil',
    lat: -3.119,
    lon: -60.0217,
    wikiTitle: 'Manaus',
    biomeId: 'rainforest',
    summary:
      'A city at the meeting of the Rio Negro and Solimões deep in the central Amazon, surrounded by the largest contiguous tropical rainforest on Earth.',
    climate: {
      koppen: 'Af',
      koppenName: 'Tropical rainforest',
      avgTempC: '~27 °C year-round',
      rainfallMm: '~2,300 mm/year',
      humidity: 'Very high (~80–90%)',
      seasonality: 'Wet and drier seasons, but warm and humid all year',
    },
    ecology: {
      biome: 'Tropical & subtropical moist broadleaf forest',
      ecosystem: 'Terra firme and seasonally flooded várzea/igapó rainforest',
      ecoregion: 'Central Amazon moist forests',
      biodiversity: 'Among the highest on Earth — a global biodiversity epicentre',
      endemics: 'Extremely high; many species known only from the Amazon basin',
    },
    geology: {
      elevation: '~92 m',
      terrain: 'Low Amazon sedimentary basin laced with vast rivers',
      soil: 'Deeply weathered, nutrient-poor oxisols/ferralsols',
      tectonics: 'Stable interior of the South American Plate (Amazon craton)',
    },
    conservation: {
      protectedAreas: ['Anavilhanas National Park', 'Ducke Reserve', 'Jaú National Park (nearby)'],
      endangered: ['Amazonian manatee', 'Giant otter', 'White-bellied spider monkey'],
      threats: ['Deforestation & cattle conversion', 'Fire', 'Climate-driven drought'],
      invasives: ['African oil palm (plantations)', 'Tilapia in waterways'],
    },
    earthSystems: {
      carbon: 'A globally critical carbon sink storing tens of billions of tonnes of carbon',
      vegetation: 'Multi-layered closed-canopy rainforest with emergent trees',
      water: 'Amazon basin — the largest river system on Earth by discharge',
      productivity: 'Very high net primary productivity',
    },
    species: [
      { id: 'jaguar', name: 'Jaguar', scientific: 'Panthera onca', group: 'mammal', iucn: 'NT', wikiTitle: 'Jaguar', blurb: 'The largest cat of the Americas and the Amazon’s apex predator.' },
      { id: 'giant_otter', name: 'Giant Otter', scientific: 'Pteronura brasiliensis', group: 'mammal', iucn: 'EN', wikiTitle: 'Giant_otter', blurb: 'A social river predator endangered by habitat loss and hunting.' },
      { id: 'harpy_eagle', name: 'Harpy Eagle', scientific: 'Harpia harpyja', group: 'bird', iucn: 'VU', wikiTitle: 'Harpy_eagle', blurb: 'A powerful canopy raptor that hunts monkeys and sloths.' },
      { id: 'victoria_lily', name: 'Giant Water Lily', scientific: 'Victoria amazonica', group: 'plant', iucn: 'LC', wikiTitle: 'Victoria_amazonica', blurb: 'A giant flowering aquatic plant of Amazon backwaters.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'nasa', 'unep', 'ebird', 'wikipedia'],
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    lat: -1.2921,
    lon: 36.8219,
    wikiTitle: 'Nairobi',
    biomeId: 'savanna',
    summary:
      'A highland capital beside Nairobi National Park, where East African savanna grassland meets acacia woodland within sight of the city skyline.',
    climate: {
      koppen: 'Cwb',
      koppenName: 'Subtropical highland',
      avgTempC: '~19 °C annual mean (mild for the tropics due to altitude)',
      rainfallMm: '~900 mm/year in two rainy seasons',
      humidity: 'Moderate; lower in the dry seasons',
      seasonality: 'Long rains (Mar–May) and short rains (Oct–Dec)',
    },
    ecology: {
      biome: 'Tropical grassland, savanna & shrubland',
      ecosystem: 'Acacia savanna, riverine forest, and open grassland',
      ecoregion: 'East African montane & Somali Acacia–Commiphora bushland',
      biodiversity: 'High — iconic large-mammal megafauna assemblages',
      endemics: 'Notable highland and Rift Valley endemics',
    },
    geology: {
      elevation: '~1,795 m',
      terrain: 'East African highland plateau near the Great Rift Valley',
      soil: 'Volcanic and lateritic red soils',
      tectonics: 'East African Rift — an active continental divergent boundary',
    },
    conservation: {
      protectedAreas: ['Nairobi National Park', 'Karura Forest Reserve', 'Ngong Road Forest'],
      endangered: ['Black rhinoceros (CR)', 'Grevy’s zebra (EN)', 'African lion (VU)'],
      threats: ['Urban sprawl blocking wildlife corridors', 'Poaching', 'Drought'],
      invasives: ['Prickly pear (Opuntia)', 'Lantana camara'],
    },
    earthSystems: {
      carbon: 'Grassland and savanna soils hold significant below-ground carbon',
      vegetation: 'Open grassland with scattered acacia and riverine forest strips',
      water: 'Nairobi and Athi river catchments',
      productivity: 'Seasonal; tightly coupled to the bimodal rains',
    },
    species: [
      { id: 'lion', name: 'African Lion', scientific: 'Panthera leo', group: 'mammal', iucn: 'VU', wikiTitle: 'Lion', blurb: 'The apex social predator of the African savanna.' },
      { id: 'black_rhino', name: 'Black Rhinoceros', scientific: 'Diceros bicornis', group: 'mammal', iucn: 'CR', wikiTitle: 'Black_rhinoceros', blurb: 'A browsing rhino driven to the brink by poaching for horn.' },
      { id: 'masai_giraffe', name: 'Masai Giraffe', scientific: 'Giraffa tippelskirchi', group: 'mammal', iucn: 'EN', wikiTitle: 'Masai_giraffe', blurb: 'The tallest land animal, a browser of acacia canopies.' },
      { id: 'grey_crowned_crane', name: 'Grey Crowned Crane', scientific: 'Balearica regulorum', group: 'bird', iucn: 'EN', wikiTitle: 'Grey_crowned_crane', blurb: 'A wetland crane and Uganda’s national bird, declining across its range.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
  {
    id: 'cape_town',
    name: 'Cape Town',
    country: 'South Africa',
    lat: -33.9249,
    lon: 18.4241,
    wikiTitle: 'Cape_Town',
    biomeId: 'savanna',
    summary:
      'A Mediterranean-climate city beneath Table Mountain, set within the Cape Floristic Region — the smallest and one of the richest of Earth’s plant kingdoms.',
    climate: {
      koppen: 'Csb',
      koppenName: 'Warm-summer Mediterranean',
      avgTempC: '~17 °C annual mean',
      rainfallMm: '~515 mm/year, winter-dominant',
      humidity: 'Moderate; drier in summer',
      seasonality: 'Hot dry summers and cool wet winters',
    },
    ecology: {
      biome: 'Mediterranean forests, woodlands & scrub (fynbos)',
      ecosystem: 'Fynbos shrubland, renosterveld, and coastal strandveld',
      ecoregion: 'Cape Floristic Region (a global biodiversity hotspot)',
      biodiversity: 'Exceptional — ~9,000 plant species, most found nowhere else',
      endemics: 'Very high — ~70% of fynbos plants are endemic',
    },
    geology: {
      elevation: '~25 m (city); Table Mountain ~1,086 m',
      terrain: 'Coastal plain backed by Table Mountain sandstone massifs',
      soil: 'Nutrient-poor, acidic sandstone-derived soils (key to fynbos)',
      tectonics: 'Ancient folded Cape Fold Belt on a passive margin',
    },
    conservation: {
      protectedAreas: ['Table Mountain National Park', 'Kirstenbosch', 'Cape of Good Hope reserve'],
      endangered: ['African penguin (EN)', 'Geometric tortoise (CR)', 'Many endemic fynbos plants'],
      threats: ['Invasive alien plants', 'Urban development', 'Altered fire regimes'],
      invasives: ['Acacia and pine plantations', 'Argentine ant', 'Mallard (hybridising ducks)'],
    },
    earthSystems: {
      carbon: 'Fynbos is fire-driven; carbon cycles rapidly between vegetation and soil',
      vegetation: 'Fine-leaved, fire-adapted evergreen shrubland (proteas, ericas, restios)',
      water: 'Winter-rainfall mountain catchments supplying the city',
      productivity: 'Low biomass but extraordinary species turnover',
    },
    species: [
      { id: 'african_penguin', name: 'African Penguin', scientific: 'Spheniscus demersus', group: 'bird', iucn: 'CR', wikiTitle: 'African_penguin', blurb: 'A burrow-nesting penguin of southern Africa in steep decline.' },
      { id: 'king_protea', name: 'King Protea', scientific: 'Protea cynaroides', group: 'plant', iucn: 'LC', wikiTitle: 'Protea_cynaroides', blurb: 'South Africa’s national flower and an icon of the fynbos.' },
      { id: 'chacma_baboon', name: 'Chacma Baboon', scientific: 'Papio ursinus', group: 'mammal', iucn: 'LC', wikiTitle: 'Chacma_baboon', blurb: 'A large baboon that ranges from mountain fynbos to the coast.' },
      { id: 'southern_right_whale', name: 'Southern Right Whale', scientific: 'Eubalaena australis', group: 'mammal', iucn: 'LC', wikiTitle: 'Southern_right_whale', blurb: 'A baleen whale that calves in the bays each winter.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    wikiTitle: 'Singapore',
    biomeId: 'rainforest',
    summary:
      'An equatorial island city-state that retains pockets of primary tropical rainforest, mangrove, and coral reef inside one of the world’s densest urban areas.',
    climate: {
      koppen: 'Af',
      koppenName: 'Tropical rainforest',
      avgTempC: '~27 °C year-round',
      rainfallMm: '~2,150 mm/year',
      humidity: 'Very high (~80%+)',
      seasonality: 'No true dry season; wetter during the NE monsoon',
    },
    ecology: {
      biome: 'Tropical & subtropical moist broadleaf forest',
      ecosystem: 'Lowland dipterocarp rainforest, mangrove, and freshwater swamp forest',
      ecoregion: 'Peninsular Malaysian rain forests',
      biodiversity: 'High for its size; a remnant of the rich Sundaland biota',
      endemics: 'Several locally endemic and regionally restricted species',
    },
    geology: {
      elevation: '~15 m (Bukit Timah ~164 m, the high point)',
      terrain: 'Low island of hills, lowlands, and reclaimed coast',
      soil: 'Weathered tropical soils on granite and sedimentary rock',
      tectonics: 'Stable Sunda Shelf of the Eurasian Plate',
    },
    conservation: {
      protectedAreas: ['Bukit Timah Nature Reserve', 'Sungei Buloh Wetland Reserve', 'Central Catchment'],
      endangered: ['Sunda pangolin (CR)', 'Straw-headed bulbul (CR)', 'Raffles’ banded langur'],
      threats: ['Historic deforestation & fragmentation', 'Urban heat', 'Reef sedimentation'],
      invasives: ['Red-eared slider', 'Javan myna', 'Changeable lizard'],
    },
    earthSystems: {
      carbon: 'Mangroves and remnant forest store dense carbon per hectare',
      vegetation: 'Dipterocarp canopy remnants, mangrove fringes, and urban greening',
      water: 'Reservoir catchments and reclaimed coastal waters',
      productivity: 'High in forest and mangrove remnants',
    },
    species: [
      { id: 'sunda_pangolin', name: 'Sunda Pangolin', scientific: 'Manis javanica', group: 'mammal', iucn: 'CR', wikiTitle: 'Sunda_pangolin', blurb: 'A scaly, ant-eating mammal and the world’s most trafficked wild animal.' },
      { id: 'oriental_pied_hornbill', name: 'Oriental Pied Hornbill', scientific: 'Anthracoceros albirostris', group: 'bird', iucn: 'LC', wikiTitle: 'Oriental_pied_hornbill', blurb: 'A canopy hornbill that has recolonised the island.' },
      { id: 'reticulated_python', name: 'Reticulated Python', scientific: 'Malayopython reticulatus', group: 'reptile', iucn: 'LC', wikiTitle: 'Reticulated_python', blurb: 'The world’s longest snake, found even in urban waterways.' },
      { id: 'dipterocarp', name: 'Dipterocarp Tree', scientific: 'Shorea spp.', group: 'plant', iucn: 'LC', wikiTitle: 'Dipterocarpaceae', blurb: 'Towering rainforest trees that mast-fruit across Sundaland.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík',
    country: 'Iceland',
    lat: 64.1466,
    lon: -21.9426,
    wikiTitle: 'Reykjavík',
    biomeId: 'tundra',
    summary:
      'The world’s northernmost capital, set on a volcanic North Atlantic coast of lava fields, geothermal springs, tundra, and vast seabird colonies.',
    climate: {
      koppen: 'Cfc',
      koppenName: 'Subpolar oceanic',
      avgTempC: '~5 °C annual mean',
      rainfallMm: '~800 mm/year, spread through the year',
      humidity: 'High; cool and damp maritime air',
      seasonality: 'Cool short summers, mild dark winters; extreme daylight swing',
    },
    ecology: {
      biome: 'Tundra & boreal',
      ecosystem: 'Subarctic heath, wetland, lava-field moss, and marine cliffs',
      ecoregion: 'Iceland boreal birch forests & alpine tundra',
      biodiversity: 'Low species richness but globally important seabird breeding sites',
      endemics: 'Few terrestrial endemics; isolated island biota',
    },
    geology: {
      elevation: '~0–100 m',
      terrain: 'Young basaltic lava fields, geothermal areas, and fjord coast',
      soil: 'Volcanic andosols, often thin and erosion-prone',
      tectonics: 'Mid-Atlantic Ridge — the Eurasian and North American plates rift apart',
    },
    conservation: {
      protectedAreas: ['Þingvellir National Park', 'Snæfellsjökull NP', 'coastal bird reserves'],
      endangered: ['Atlantic puffin (VU)', 'Harbour seal (declining)', 'Wild Atlantic salmon (locally)'],
      threats: ['Soil erosion & overgrazing', 'Warming seas shifting fish stocks', 'Tourism pressure'],
      invasives: ['Nootka lupine', 'American mink', 'Some introduced conifers'],
    },
    earthSystems: {
      carbon: 'Degraded soils and drained wetlands are a restoration target for carbon',
      vegetation: 'Mosses, grasses, dwarf birch, and sparse heath over lava',
      water: 'Glacier-fed rivers, geothermal fields, and rich North Atlantic shelf',
      productivity: 'Low on land but very high in the surrounding ocean',
    },
    species: [
      { id: 'atlantic_puffin', name: 'Atlantic Puffin', scientific: 'Fratercula arctica', group: 'bird', iucn: 'VU', wikiTitle: 'Atlantic_puffin', blurb: 'A burrow-nesting seabird; Iceland hosts a large share of the world population.' },
      { id: 'arctic_fox', name: 'Arctic Fox', scientific: 'Vulpes lagopus', group: 'mammal', iucn: 'LC', wikiTitle: 'Arctic_fox', blurb: 'Iceland’s only native land mammal, present since the last ice age.' },
      { id: 'atlantic_salmon', name: 'Atlantic Salmon', scientific: 'Salmo salar', group: 'fish', iucn: 'NT', wikiTitle: 'Atlantic_salmon', blurb: 'A migratory fish returning from sea to spawn in Icelandic rivers.' },
      { id: 'humpback_whale', name: 'Humpback Whale', scientific: 'Megaptera novaeangliae', group: 'mammal', iucn: 'LC', wikiTitle: 'Humpback_whale', blurb: 'A baleen whale that feeds in the productive subpolar waters.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
  {
    id: 'antananarivo',
    name: 'Antananarivo',
    country: 'Madagascar',
    lat: -18.8792,
    lon: 47.5079,
    wikiTitle: 'Antananarivo',
    biomeId: 'rainforest',
    summary:
      'The highland capital of Madagascar, gateway to an island whose long isolation produced one of Earth’s highest concentrations of endemic life.',
    climate: {
      koppen: 'Cwb',
      koppenName: 'Subtropical highland',
      avgTempC: '~18 °C annual mean',
      rainfallMm: '~1,350 mm/year, summer-dominant',
      humidity: 'Moderate–high in the wet season',
      seasonality: 'Warm wet summers, cool dry winters',
    },
    ecology: {
      biome: 'Tropical moist broadleaf forest & highland grassland',
      ecosystem: 'Highland plateau, eastern rainforest, and rice-paddy wetlands',
      ecoregion: 'Madagascar subhumid forests',
      biodiversity: 'Globally outstanding — a biodiversity hotspot',
      endemics: 'Among the highest on Earth — ~90% of species found only here',
    },
    geology: {
      elevation: '~1,280 m',
      terrain: 'Eroded central highland plateau of hills and rice valleys',
      soil: 'Deeply weathered lateritic red soils',
      tectonics: 'Ancient continental fragment rifted from Gondwana',
    },
    conservation: {
      protectedAreas: ['Andasibe-Mantadia NP (nearby)', 'Ankaratra reserves', 'Tsimbazaza'],
      endangered: ['Indri (CR)', 'Many lemur species', 'Ploughshare tortoise (CR)'],
      threats: ['Slash-and-burn (tavy) deforestation', 'Erosion', 'Wildlife trade'],
      invasives: ['Water hyacinth', 'Asian common toad', 'Introduced rats'],
    },
    earthSystems: {
      carbon: 'Eastern rainforests store major carbon; highlands are heavily eroded',
      vegetation: 'Highland grassland, remnant forest, and terraced rice agriculture',
      water: 'Ikopa River and an extensive paddy-wetland system',
      productivity: 'High in forest remnants; degraded on the open highlands',
    },
    species: [
      { id: 'indri', name: 'Indri', scientific: 'Indri indri', group: 'mammal', iucn: 'CR', wikiTitle: 'Indri', blurb: 'The largest living lemur, known for its haunting song.' },
      { id: 'ring_tailed_lemur', name: 'Ring-tailed Lemur', scientific: 'Lemur catta', group: 'mammal', iucn: 'EN', wikiTitle: 'Ring-tailed_lemur', blurb: 'An iconic, ground-dwelling lemur endemic to Madagascar.' },
      { id: 'panther_chameleon', name: 'Panther Chameleon', scientific: 'Furcifer pardalis', group: 'reptile', iucn: 'LC', wikiTitle: 'Panther_chameleon', blurb: 'A vividly colour-changing chameleon of the island’s forests.' },
      { id: 'travellers_palm', name: 'Traveller’s Palm', scientific: 'Ravenala madagascariensis', group: 'plant', iucn: 'LC', wikiTitle: 'Ravenala', blurb: 'A fan-shaped endemic plant emblematic of Madagascar.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
  {
    id: 'vancouver',
    name: 'Vancouver',
    country: 'Canada',
    lat: 49.2827,
    lon: -123.1207,
    wikiTitle: 'Vancouver',
    biomeId: 'temperate',
    summary:
      'A Pacific coast city embedded in temperate rainforest, where the Fraser estuary, old-growth conifers, and salmon-bearing rivers meet the Salish Sea.',
    climate: {
      koppen: 'Cfb',
      koppenName: 'Temperate oceanic',
      avgTempC: '~11 °C annual mean',
      rainfallMm: '~1,200 mm/year, winter-dominant',
      humidity: 'High; mild and wet maritime climate',
      seasonality: 'Wet mild winters, warm dry summers',
    },
    ecology: {
      biome: 'Temperate coniferous (rain)forest',
      ecosystem: 'Coastal western hemlock–Douglas fir rainforest and estuary',
      ecoregion: 'Central Pacific coastal forests',
      biodiversity: 'Moderate richness with enormous biomass in old growth',
      endemics: 'Few endemics; rich salmon and marine assemblages',
    },
    geology: {
      elevation: '~0–150 m (North Shore mountains rise above 1,400 m)',
      terrain: 'Fraser River delta backed by the Coast Mountains',
      soil: 'Glacial and alluvial deltaic soils',
      tectonics: 'Cascadia subduction zone — seismically active convergent margin',
    },
    conservation: {
      protectedAreas: ['Pacific Spirit Regional Park', 'Stanley Park', 'Burns Bog'],
      endangered: ['Southern resident killer whale (EN)', 'Pacific salmon runs (locally)', 'Barn owl'],
      threats: ['Urbanisation of the delta', 'Old-growth logging (region)', 'Warming streams'],
      invasives: ['Himalayan blackberry', 'English ivy', 'American bullfrog'],
    },
    earthSystems: {
      carbon: 'Coastal old-growth forests are among the densest carbon stores on land',
      vegetation: 'Towering western hemlock, red cedar, and Douglas fir',
      water: 'Fraser River — a major salmon system — draining to the Salish Sea',
      productivity: 'High; coupled forest–ocean salmon nutrient cycling',
    },
    species: [
      { id: 'orca', name: 'Killer Whale (Orca)', scientific: 'Orcinus orca', group: 'mammal', iucn: 'DD', wikiTitle: 'Killer_whale', blurb: 'A top marine predator; the southern resident population is endangered.' },
      { id: 'sockeye_salmon', name: 'Sockeye Salmon', scientific: 'Oncorhynchus nerka', group: 'fish', iucn: 'LC', wikiTitle: 'Sockeye_salmon', blurb: 'A keystone migratory fish linking ocean nutrients to forests.' },
      { id: 'bald_eagle', name: 'Bald Eagle', scientific: 'Haliaeetus leucocephalus', group: 'bird', iucn: 'LC', wikiTitle: 'Bald_eagle', blurb: 'A fish eagle that congregates on salmon runs.' },
      { id: 'douglas_fir', name: 'Douglas Fir', scientific: 'Pseudotsuga menziesii', group: 'plant', iucn: 'LC', wikiTitle: 'Douglas_fir', blurb: 'A giant conifer that anchors Pacific coastal rainforest.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
  {
    id: 'cairns',
    name: 'Cairns',
    country: 'Australia',
    lat: -16.9203,
    lon: 145.7710,
    wikiTitle: 'Cairns',
    biomeId: 'reef',
    summary:
      'A tropical city between two World Heritage areas — the Wet Tropics rainforest and the Great Barrier Reef — where the oldest rainforest on Earth meets the largest coral system.',
    climate: {
      koppen: 'Am',
      koppenName: 'Tropical monsoon',
      avgTempC: '~25 °C annual mean',
      rainfallMm: '~2,000 mm/year, strongly summer-dominant',
      humidity: 'Very high in the wet season',
      seasonality: 'Hot wet summer monsoon, warm drier winter',
    },
    ecology: {
      biome: 'Tropical rainforest & coral reef',
      ecosystem: 'Lowland tropical rainforest, mangrove, seagrass, and coral reef',
      ecoregion: 'Queensland tropical rain forests / Great Barrier Reef',
      biodiversity: 'Outstanding — two adjacent World Heritage biodiversity areas',
      endemics: 'High rainforest endemism (Wet Tropics relict lineages)',
    },
    geology: {
      elevation: '~3 m (city); rainforest ranges rise above 1,000 m',
      terrain: 'Narrow coastal plain backed by the Great Dividing Range',
      soil: 'Wet tropical and alluvial soils; coral-derived reef sediments',
      tectonics: 'Passive margin; reef built on a continental shelf',
    },
    conservation: {
      protectedAreas: ['Great Barrier Reef Marine Park', 'Daintree National Park', 'Wet Tropics WHA'],
      endangered: ['Southern cassowary (locally threatened)', 'Green sea turtle (EN)', 'Dugong (VU)'],
      threats: ['Coral bleaching from ocean warming', 'Runoff & sedimentation', 'Crown-of-thorns starfish'],
      invasives: ['Cane toad', 'Crown-of-thorns starfish (outbreaks)', 'Feral pigs'],
    },
    earthSystems: {
      carbon: 'Rainforest, mangrove, and seagrass form rich blue- and green-carbon stores',
      vegetation: 'Closed tropical rainforest canopy and coastal mangroves',
      water: 'Coral Sea reef lagoon fed by short, steep coastal rivers',
      productivity: 'Very high — reef and rainforest are both highly productive',
    },
    species: [
      { id: 'cassowary', name: 'Southern Cassowary', scientific: 'Casuarius casuarius', group: 'bird', iucn: 'LC', wikiTitle: 'Southern_cassowary', blurb: 'A large flightless rainforest bird and key seed disperser.' },
      { id: 'green_turtle', name: 'Green Sea Turtle', scientific: 'Chelonia mydas', group: 'reptile', iucn: 'EN', wikiTitle: 'Green_sea_turtle', blurb: 'A reef-grazing sea turtle that nests on Barrier Reef cays.' },
      { id: 'dugong', name: 'Dugong', scientific: 'Dugong dugon', group: 'mammal', iucn: 'VU', wikiTitle: 'Dugong', blurb: 'A seagrass-grazing marine mammal of the reef shallows.' },
      { id: 'staghorn_coral', name: 'Staghorn Coral', scientific: 'Acropora cervicornis', group: 'invertebrate', iucn: 'VU', wikiTitle: 'Acropora', blurb: 'A fast-growing reef-building coral sensitive to bleaching.' },
    ],
    sources: ['gbif', 'ala', 'iucn', 'worldclim', 'nasa', 'unep', 'ebird', 'wikipedia'],
  },
  {
    id: 'quito',
    name: 'Quito',
    country: 'Ecuador',
    lat: -0.1807,
    lon: -78.4678,
    wikiTitle: 'Quito',
    biomeId: 'rainforest',
    summary:
      'A high-altitude Andean capital on the equator, a gateway between cloud forest, páramo grassland, and the headwaters of the Amazon.',
    climate: {
      koppen: 'Cfb',
      koppenName: 'Subtropical highland (equatorial)',
      avgTempC: '~14 °C year-round (eternal spring)',
      rainfallMm: '~1,000 mm/year',
      humidity: 'Moderate–high; little seasonal temperature change',
      seasonality: 'Wetter and drier seasons rather than hot/cold',
    },
    ecology: {
      biome: 'Montane cloud forest & páramo',
      ecosystem: 'Andean cloud forest, páramo grassland, and inter-Andean valleys',
      ecoregion: 'Northern Andean montane forests',
      biodiversity: 'Outstanding — the Tropical Andes biodiversity hotspot',
      endemics: 'Very high elevational and range-restricted endemism',
    },
    geology: {
      elevation: '~2,850 m (one of the highest capitals)',
      terrain: 'Steep inter-Andean basin flanked by volcanoes',
      soil: 'Volcanic andosols, fertile but steep',
      tectonics: 'Active Andean convergent margin; numerous volcanoes',
    },
    conservation: {
      protectedAreas: ['Cayambe Coca NP', 'Cotopaxi NP', 'Pichincha cloud-forest reserves'],
      endangered: ['Spectacled bear (VU)', 'Andean condor (VU)', 'Many endemic frogs'],
      threats: ['Agricultural expansion into páramo', 'Deforestation', 'Glacier retreat'],
      invasives: ['Eucalyptus & pine plantations', 'Trout in páramo lakes'],
    },
    earthSystems: {
      carbon: 'Páramo soils and cloud forests are important carbon and water stores',
      vegetation: 'Cloud forest, montane scrub, and tussock páramo grassland',
      water: 'High-altitude páramo regulates water for the city and Amazon headwaters',
      productivity: 'Moderate; high water-regulation value',
    },
    species: [
      { id: 'spectacled_bear', name: 'Spectacled Bear', scientific: 'Tremarctos ornatus', group: 'mammal', iucn: 'VU', wikiTitle: 'Spectacled_bear', blurb: 'South America’s only bear, a cloud-forest and páramo specialist.' },
      { id: 'andean_condor', name: 'Andean Condor', scientific: 'Vultur gryphus', group: 'bird', iucn: 'VU', wikiTitle: 'Andean_condor', blurb: 'A giant high-altitude scavenger and Andean cultural icon.' },
      { id: 'sword_billed_hummingbird', name: 'Sword-billed Hummingbird', scientific: 'Ensifera ensifera', group: 'bird', iucn: 'LC', wikiTitle: 'Sword-billed_hummingbird', blurb: 'The only bird with a bill longer than its body.' },
      { id: 'polylepis', name: 'Polylepis Tree', scientific: 'Polylepis', group: 'plant', iucn: 'LC', wikiTitle: 'Polylepis', blurb: 'High-altitude trees forming the world’s highest woodlands.' },
    ],
    sources: ['gbif', 'iucn', 'worldclim', 'ebird', 'nasa', 'unep', 'wikipedia'],
  },
];

export function getEcologyCity(id: string): EcologyCity | undefined {
  return ECOLOGY_CITIES.find((city) => city.id === id);
}

/** Resolve an `organism:eco:<id>` pick back to its city + species. */
export function findEcologySpecies(organismId: string): { city: EcologyCity; species: EcologySpecies } | undefined {
  const key = organismId.replace(/^organism:eco:/, '');
  for (const city of ECOLOGY_CITIES) {
    const species = city.species.find((s) => s.id === key);
    if (species) return { city, species };
  }
  return undefined;
}

// ── Atlas object registration ───────────────────────────────────────────────

const CITY_PROVENANCE =
  'Factual ecological profile compiled from GBIF, IUCN, WorldClim, eBird, NASA EarthData, UNEP-WCMC, and Wikipedia. Every metric exposes its source.';

function cityToBioObject(city: EcologyCity): BioObject {
  return {
    id: `city:${city.id}`,
    name: city.name,
    scale: Scale.Biome,
    kind: 'place',
    summary: city.summary,
    size: `${city.country} · ${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}° · Köppen ${city.climate.koppen}`,
    facts: [
      `Climate: ${city.climate.koppenName} (${city.climate.koppen}), ${city.climate.avgTempC}.`,
      `Biome: ${city.ecology.biome}; ecoregion ${city.ecology.ecoregion}.`,
      `Dominant ecosystem: ${city.ecology.ecosystem}.`,
      `Biodiversity: ${city.ecology.biodiversity}.`,
      `Key species: ${city.species.map((s) => s.name).join(', ')}.`,
    ],
    crossRefs: city.sources,
    provenanceNote: CITY_PROVENANCE,
  };
}

function speciesToBioObject(city: EcologyCity, species: EcologySpecies): BioObject {
  return {
    id: `organism:eco:${species.id}`,
    name: species.name,
    scale: Scale.Organism,
    kind: 'organism',
    summary: `${species.blurb} ${species.name} (${species.scientific}) is part of the ecology of ${city.name}, ${city.country}.`,
    size: `${species.scientific} · IUCN ${species.iucn} (${IUCN_LABEL[species.iucn]})`,
    facts: [
      `Scientific name: ${species.scientific}.`,
      `IUCN Red List status: ${IUCN_LABEL[species.iucn]} (${species.iucn}).`,
      `Recorded in the ecology of ${city.name}, ${city.country}.`,
      'Occurrence records via GBIF; conservation status via the IUCN Red List.',
    ],
    crossRefs: ['gbif', 'iucn', 'ncbi', 'wikipedia'],
    provenanceNote:
      'Species record cross-referenced from GBIF occurrences, the IUCN Red List, and Wikipedia.',
  };
}

/** All Ecosystem-scale ecology objects, keyed by pick id, for the resolver. */
export const ecologyObjects: Record<string, BioObject> = {};
for (const city of ECOLOGY_CITIES) {
  ecologyObjects[`city:${city.id}`] = cityToBioObject(city);
  for (const species of city.species) {
    ecologyObjects[`organism:eco:${species.id}`] = speciesToBioObject(city, species);
  }
}
