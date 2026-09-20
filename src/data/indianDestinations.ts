export interface DestinationItem {
  id: string;
  name: string;
  state: string;
  country: string;
  type: 'city' | 'outstation';
  popularFor?: string;
  aliases?: string[];
}

export const INDIAN_DESTINATIONS: DestinationItem[] = [
  // Maharashtra
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    type: 'city',
    popularFor: 'Coastal Promenade, Art Deco & Street Food',
    aliases: ['Bombay', 'BOM']
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    type: 'city',
    popularFor: 'Osho Ashram, Historic Forts & Cafe Culture',
    aliases: ['Poona', 'PNQ']
  },
  {
    id: 'lonavala',
    name: 'Lonavala & Khandala',
    state: 'Maharashtra',
    country: 'India',
    type: 'outstation',
    popularFor: 'Western Ghats, Waterfalls & Monsoon Treks'
  },
  {
    id: 'mahabaleshwar',
    name: 'Mahabaleshwar',
    state: 'Maharashtra',
    country: 'India',
    type: 'outstation',
    popularFor: 'Strawberry Farms, Viewpoints & Venna Lake'
  },
  {
    id: 'alibaug',
    name: 'Alibaug',
    state: 'Maharashtra',
    country: 'India',
    type: 'outstation',
    popularFor: 'Secluded Beaches, Forts & Seafood'
  },
  {
    id: 'nashik',
    name: 'Nashik',
    state: 'Maharashtra',
    country: 'India',
    type: 'city',
    popularFor: 'Vineyards, Sula Wine Trail & Godavari Ghats'
  },

  // Goa
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    country: 'India',
    type: 'city',
    popularFor: 'Portuguese Quarters, Coastal Shacks & Sunset Beaches',
    aliases: ['North Goa', 'South Goa', 'Panaji', 'GOI']
  },

  // Rajasthan
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    type: 'city',
    popularFor: 'Hawa Mahal, Amber Fort & Pink City Bazaars',
    aliases: ['Pink City', 'JAI']
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    type: 'city',
    popularFor: 'Lake Pichola, City Palace & Sunset Boat Cruises',
    aliases: ['City of Lakes', 'UDR']
  },
  {
    id: 'jodhpur',
    name: 'Jodhpur',
    state: 'Rajasthan',
    country: 'India',
    type: 'city',
    popularFor: 'Mehrangarh Fort, Blue City Lanes & Stepwells',
    aliases: ['Blue City', 'JDH']
  },
  {
    id: 'jaisalmer',
    name: 'Jaisalmer',
    state: 'Rajasthan',
    country: 'India',
    type: 'outstation',
    popularFor: 'Golden Sand Dunes, Living Fort & Desert Camping',
    aliases: ['Golden City']
  },
  {
    id: 'pushkar',
    name: 'Pushkar',
    state: 'Rajasthan',
    country: 'India',
    type: 'outstation',
    popularFor: 'Sacred Lake, Ghats & Camel Heritage'
  },

  // Delhi NCR
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi NCR',
    country: 'India',
    type: 'city',
    popularFor: 'Old Delhi Food Trail, Mughal Monuments & Modern Art',
    aliases: ['New Delhi', 'DEL']
  },

  // Karnataka
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    type: 'city',
    popularFor: 'Microbreweries, Cubbon Park & Tech Innovation Hubs',
    aliases: ['Bangalore', 'BLR']
  },
  {
    id: 'mysuru',
    name: 'Mysuru',
    state: 'Karnataka',
    country: 'India',
    type: 'city',
    popularFor: 'Illuminated Palace, Silk & Sandalwood Heritage',
    aliases: ['Mysore', 'MYQ']
  },
  {
    id: 'coorg',
    name: 'Coorg (Kodagu)',
    state: 'Karnataka',
    country: 'India',
    type: 'outstation',
    popularFor: 'Coffee Plantations, Waterfalls & Misty Hills'
  },
  {
    id: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    country: 'India',
    type: 'outstation',
    popularFor: 'UNESCO Vijayanagara Ruins & Boulder Landscapes'
  },
  {
    id: 'gokarna',
    name: 'Gokarna',
    state: 'Karnataka',
    country: 'India',
    type: 'outstation',
    popularFor: 'Om Beach, Cliff Treks & Serene Shores'
  },

  // Kerala
  {
    id: 'kochi',
    name: 'Kochi (Cochin)',
    state: 'Kerala',
    country: 'India',
    type: 'city',
    popularFor: 'Fort Kochi, Chinese Fishing Nets & Spice Bazaars',
    aliases: ['Cochin', 'COK']
  },
  {
    id: 'munnar',
    name: 'Munnar',
    state: 'Kerala',
    country: 'India',
    type: 'outstation',
    popularFor: 'Rolling Tea Gardens, Anamudi Peak & Cool Mists'
  },
  {
    id: 'alleppey',
    name: 'Alleppey (Alappuzha)',
    state: 'Kerala',
    country: 'India',
    type: 'outstation',
    popularFor: 'Houseboat Cruises, Backwaters & Coir Villages'
  },
  {
    id: 'wayanad',
    name: 'Wayanad',
    state: 'Kerala',
    country: 'India',
    type: 'outstation',
    popularFor: 'Spice Estates, Edakkal Caves & Chembra Peak'
  },
  {
    id: 'varkala',
    name: 'Varkala',
    state: 'Kerala',
    country: 'India',
    type: 'outstation',
    popularFor: 'Red Cliffs, Arabian Sea Views & Ayurvedic Centers'
  },

  // Telangana & Andhra Pradesh
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    type: 'city',
    popularFor: 'Charminar, Biryani Trails, Golconda Fort & Pearls',
    aliases: ['HYD']
  },

  // Tamil Nadu & Puducherry
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    type: 'city',
    popularFor: 'Marina Beach, Carnatic Music & Filter Coffee',
    aliases: ['Madras', 'MAA']
  },
  {
    id: 'pondicherry',
    name: 'Pondicherry (Puducherry)',
    state: 'Puducherry',
    country: 'India',
    type: 'city',
    popularFor: 'French Colony, Promenade Beach & Auroville',
    aliases: ['Puducherry', 'PNY']
  },
  {
    id: 'ooty',
    name: 'Ooty (Udhagamandalam)',
    state: 'Tamil Nadu',
    country: 'India',
    type: 'outstation',
    popularFor: 'Nilgiri Toy Train, Botanical Gardens & Pine Forests'
  },
  {
    id: 'kodaikanal',
    name: 'Kodaikanal',
    state: 'Tamil Nadu',
    country: 'India',
    type: 'outstation',
    popularFor: 'Star Lake, Pillar Rocks & Cloud Walks'
  },

  // Uttar Pradesh
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    type: 'city',
    popularFor: 'Ganga Aarti, Ancient Ghats, Morning Boat Rides & Silk',
    aliases: ['Kashi', 'Benares', 'VNS']
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    country: 'India',
    type: 'city',
    popularFor: 'Taj Mahal, Agra Fort & Mughal Gardens',
    aliases: ['AGR']
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    type: 'city',
    popularFor: 'Awadhi Gastronomy, Bara Imambara & Chikankari',
    aliases: ['LKO']
  },

  // Himachal Pradesh
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    type: 'outstation',
    popularFor: 'Solang Valley, Rohtang Pass, Old Manali Cafes & Apple Orchards',
    aliases: ['Kullu Manali']
  },
  {
    id: 'shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    country: 'India',
    type: 'outstation',
    popularFor: 'Mall Road, Heritage Kalka-Shimla Train & Ridge'
  },
  {
    id: 'dharamshala',
    name: 'Dharamshala & McLeodGanj',
    state: 'Himachal Pradesh',
    country: 'India',
    type: 'outstation',
    popularFor: 'Tibetan Culture, Dalai Lama Temple & Triund Trek'
  },
  {
    id: 'spiti',
    name: 'Spiti Valley',
    state: 'Himachal Pradesh',
    country: 'India',
    type: 'outstation',
    popularFor: 'Key Monastery, High-Altitude Villages & Moonscapes'
  },

  // Uttarakhand
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    country: 'India',
    type: 'outstation',
    popularFor: 'Yoga ashrams, Ganga Rafting & Laxman Jhula Cafes'
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    state: 'Uttarakhand',
    country: 'India',
    type: 'outstation',
    popularFor: 'Queen of Hills, Kempty Falls & Himalayan Views'
  },
  {
    id: 'nainital',
    name: 'Nainital',
    state: 'Uttarakhand',
    country: 'India',
    type: 'outstation',
    popularFor: 'Naini Lake Boating & Kumaon Hills'
  },

  // West Bengal
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    type: 'city',
    popularFor: 'Victoria Memorial, Howrah Bridge, Tramways & Sweets',
    aliases: ['Calcutta', 'CCU']
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    state: 'West Bengal',
    country: 'India',
    type: 'outstation',
    popularFor: 'Tiger Hill Sunrise, Kanchenjunga & Himalayan Railway'
  },

  // Gujarat
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    type: 'city',
    popularFor: 'UNESCO Walled City, Sabarmati Ashram & Gujarati Thali',
    aliases: ['Amdavad', 'AMD']
  },
  {
    id: 'kutch',
    name: 'Rann of Kutch',
    state: 'Gujarat',
    country: 'India',
    type: 'outstation',
    popularFor: 'White Salt Desert, Rann Utsav & Handloom Villages'
  },

  // Punjab
  {
    id: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    country: 'India',
    type: 'city',
    popularFor: 'Golden Temple, Wagah Border & Kulcha Trails',
    aliases: ['ATQ']
  },

  // Jammu & Kashmir & Ladakh
  {
    id: 'srinagar',
    name: 'Srinagar',
    state: 'Jammu & Kashmir',
    country: 'India',
    type: 'city',
    popularFor: 'Dal Lake Shikara Rides, Mughal Gardens & Houseboats',
    aliases: ['SXR']
  },
  {
    id: 'leh-ladakh',
    name: 'Leh-Ladakh',
    state: 'Ladakh',
    country: 'India',
    type: 'outstation',
    popularFor: 'Pangong Tso, Khardung La & Buddhist Monasteries',
    aliases: ['IXL', 'Ladakh']
  }
];

export function searchDestinations(queryStr: string): DestinationItem[] {
  const clean = queryStr.trim().toLowerCase();
  if (!clean) return INDIAN_DESTINATIONS.slice(0, 8);

  return INDIAN_DESTINATIONS.filter((item) => {
    if (item.name.toLowerCase().includes(clean)) return true;
    if (item.state.toLowerCase().includes(clean)) return true;
    if (item.aliases?.some((a) => a.toLowerCase().includes(clean))) return true;
    if (item.popularFor?.toLowerCase().includes(clean)) return true;
    return false;
  }).slice(0, 10);
}
