/**
 * Curated destination places and candidate activities across India
 * Supports diverse day-by-day itineraries without repetition.
 */

export interface ActivityCandidate {
  id: string;
  title: string;
  description: string;
  location: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  bestVisited: 'Morning' | 'Afternoon' | 'Evening';
  durationMinutes: number;
  estimatedCost: number; // in INR
  category: string;
  openingHours?: string;
  tier?: 'budget' | 'moderate' | 'luxury';
  tags?: string[];
  isFreeOrLowCost?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CityCatalog {
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  places: ActivityCandidate[];
  freeAlternatives: ActivityCandidate[];
}

export const DESTINATION_CATALOGS: Record<string, CityCatalog> = {
  jaipur: {
    city: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    places: [
      // Day 1: Amer & Ridge
      {
        id: 'jpr-amber-fort',
        title: 'Amber Palace & Fortress',
        description: 'Iconic 16th-century hilltop citadel featuring red sandstone, Maota Lake panoramas, and the mirror-inlaid Sheesh Mahal.',
        location: 'Devisinghpura, Amer, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 150,
        estimatedCost: 500,
        category: 'Heritage & Architecture',
        openingHours: '08:00 - 17:30',
        tags: ['heritage', 'palace', 'photography']
      },
      {
        id: 'jpr-stepwell',
        title: 'Panna Meena Ka Kund Stepwell',
        description: 'Geometric 16th-century stepwell celebrated for its symmetrical stair patterns and tranquil historic courtyard.',
        location: 'Near Anokhi Museum, Amer, Jaipur',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 60,
        estimatedCost: 150,
        category: 'Architecture',
        openingHours: '09:00 - 18:00',
        tags: ['stepwell', 'culture']
      },
      {
        id: 'jpr-nahargarh',
        title: 'Nahargarh Fort Sunset Ridge',
        description: 'Perched on the rugged Aravalli hills, offering sweeping golden-hour panoramas over the entire Pink City.',
        location: 'Aravalli Hills, Nahargarh, Jaipur',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 120,
        estimatedCost: 250,
        category: 'Scenic Viewpoint',
        openingHours: '10:00 - 21:00',
        tags: ['sunset', 'viewpoint', 'history']
      },

      // Day 2: Walled Pink City
      {
        id: 'jpr-city-palace',
        title: 'City Palace & Chandra Mahal Courtyards',
        description: 'Living royal complex blending Rajasthani and Mughal court architecture, housing the Maharaja Sawai Man Singh II Museum.',
        location: 'Tulsi Marg, Gangori Bazaar, J.D.A. Market, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 120,
        estimatedCost: 600,
        category: 'Royal Heritage',
        openingHours: '09:30 - 17:00',
        tags: ['museum', 'royalty', 'architecture']
      },
      {
        id: 'jpr-jantar-mantar',
        title: 'Jantar Mantar Astronomical Observatory',
        description: 'UNESCO World Heritage site with nineteen architectural astronomical instruments, including the world’s largest stone sundial.',
        location: 'Gangori Bazaar, J.D.A. Market, Jaipur',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 75,
        estimatedCost: 200,
        category: 'Science & Heritage',
        openingHours: '09:00 - 17:00',
        tags: ['astronomy', 'unesco']
      },
      {
        id: 'jpr-hawa-mahal',
        title: 'Hawa Mahal & Old City Spice Walk',
        description: 'Marvel at the 953 filigreed jharokhas of the Palace of Winds, followed by a stroll through Johari Bazaar jewelers and sweetshops.',
        location: 'Hawa Mahal Rd, Badi Choupad, J.D.A. Market, Jaipur',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 200,
        category: 'Culture & Bazaars',
        openingHours: '09:00 - 17:00 (exterior 24h)',
        tags: ['bazaar', 'street-food', 'landmark']
      },

      // Day 3: Arts & Temples
      {
        id: 'jpr-albert-hall',
        title: 'Albert Hall Museum & Ram Niwas Garden',
        description: 'Rajasthan’s oldest museum set in an Indo-Saracenic masterpiece, housing rare Persian carpets, miniatures, and ivory art.',
        location: 'Ram Niwas Garden, Kailash Puri, Adarsh Nagar, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 110,
        estimatedCost: 300,
        category: 'Arts & History',
        openingHours: '09:00 - 17:00',
        tags: ['museum', 'gardens']
      },
      {
        id: 'jpr-galta-ji',
        title: 'Galta Ji Sun Temple & Sacred Springs',
        description: 'Ancient pilgrim retreat built into a narrow mountain pass with natural mineral springs, pavilions, and resident sacred langurs.',
        location: 'Galta Hills, Jaipur',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 90,
        estimatedCost: 100,
        category: 'Spiritual Heritage',
        openingHours: '06:00 - 19:00',
        tags: ['temple', 'springs', 'nature']
      },
      {
        id: 'jpr-jal-mahal',
        title: 'Jal Mahal Water Palace Promenade',
        description: 'Dusk view of the flooded palace glowing amidst Man Sagar Lake, flanked by handicraft artisans and roasted corn vendors.',
        location: 'Amer Road, Jal Mahal, Jaipur',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 150,
        category: 'Leisure & Street Food',
        openingHours: 'Accessible 24h',
        tags: ['lake', 'promenade', 'relaxation']
      },

      // Day 4: Royal Crafts & Gardens
      {
        id: 'jpr-anokhi-museum',
        title: 'Anokhi Museum of Hand Printing',
        description: 'Dedicated to the preservation of traditional Rajasthani woodblock printing inside a restored 16th-century mansion.',
        location: 'Kheri Gate, Amer, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 150,
        category: 'Handicrafts & Textiles',
        openingHours: '10:30 - 17:00',
        tags: ['textiles', 'workshops']
      },
      {
        id: 'jpr-sisodia-rani',
        title: 'Sisodia Rani Ka Bagh Terraced Gardens',
        description: 'Cascading Mughal-style fountains, floral waterways, and painted Radha-Krishna pavilions nestled in the surrounding ghats.',
        location: 'Agra Road, Ghat Ki Guni, Jaipur',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 80,
        estimatedCost: 100,
        category: 'Botanical Heritage',
        openingHours: '08:00 - 18:00',
        tags: ['garden', 'fountains']
      },
      {
        id: 'jpr-chokhi-dhani',
        title: 'Chokhi Dhani Ethnic Cultural Village',
        description: 'Open-air cultural village with folk puppet dances, Kalbeliya performances, camel rides, and traditional bajra roti thali.',
        location: '12 Miles, Tonk Road, Sukhdeopura Nohara, Jaipur',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 180,
        estimatedCost: 950,
        category: 'Dining & Folklore',
        openingHours: '17:00 - 23:00',
        tags: ['dinner', 'dance', 'cultural']
      },

      // Day 5: Fortresses & Cannon Trails
      {
        id: 'jpr-jaigarh',
        title: 'Jaigarh Fort & Jaivana Great Cannon',
        description: 'Military fortress housing the largest wheeled cannon in the world, overlooking Amer Palace through interconnected underground tunnels.',
        location: 'Cheel ka Teela, Amer, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 120,
        estimatedCost: 200,
        category: 'Fortresses',
        openingHours: '09:00 - 17:00',
        tags: ['fortress', 'military', 'views']
      },
      {
        id: 'jpr-bapu-bazaar',
        title: 'Bapu Bazaar Camel Leather & Mojari Trail',
        description: 'Vibrant arcade of terra-cotta pink shops renowned for authentic leather juttis, tie-dye bandhani textiles, and local street snacks.',
        location: 'Bapu Bazaar, Biseswarji, Jaipur',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 90,
        estimatedCost: 200,
        category: 'Markets & Shopping',
        openingHours: '11:00 - 20:00',
        tags: ['shopping', 'bazaar', 'crafts']
      },
      {
        id: 'jpr-masala-chowk',
        title: 'Masala Chowk Open-Air Food Court',
        description: 'Curated hub of legendary Rajasthani food stalls serving pyaz kachoris, faloodas, and gulab sakar in Ram Niwas Gardens.',
        location: 'Near Albert Hall, Adarsh Nagar, Jaipur',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 350,
        category: 'Culinary Experiences',
        openingHours: '10:00 - 22:00',
        tags: ['food-court', 'kachori', 'evening']
      },

      // Day 6: Spiritual & Royal Cenotaphs
      {
        id: 'jpr-gaitore',
        title: 'Gaitore Royal Cenotaphs (Chhatris)',
        description: 'Serene marble cenotaphs nestled in a valley beneath Nahargarh, honoring Jaipur’s Kachwaha royal rulers.',
        location: 'Chhatriyan Rd, Brahampuri, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 100,
        category: 'Monuments',
        openingHours: '09:00 - 17:00',
        tags: ['cenotaphs', 'marble', 'quiet']
      },
      {
        id: 'jpr-govind-dev',
        title: 'Govind Dev Ji Temple & Jalebi Chowk',
        description: 'Centuries-old temple revered by locals, followed by hot saffron jalebis and rabdi near the palace courtyards.',
        location: 'Jalebi Chowk, Jai Niwas Garden, Jaipur',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 75,
        estimatedCost: 100,
        category: 'Spiritual & Food',
        openingHours: '05:00 - 12:00, 16:30 - 21:00',
        tags: ['temple', 'jalebi', 'tradition']
      },
      {
        id: 'jpr-smriti-van',
        title: 'Kalyan Smriti Van Nature Walk',
        description: 'Biodiverse botanical forest park with walking ridges, native desert plants, and sunset birdwatching sanctuaries.',
        location: 'JLN Marg, Jhalana Doongri, Jaipur',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 50,
        category: 'Nature & Parks',
        openingHours: '06:00 - 18:30',
        tags: ['birds', 'nature', 'trail']
      }
    ],
    freeAlternatives: [
      {
        id: 'jpr-free-promenade',
        title: 'Jal Mahal Public Lakeside Promenade',
        description: 'Relaxed pedestrian walkway along Man Sagar Lake with views of the submerged palace at dusk.',
        location: 'Amer Road, Jal Mahal, Jaipur',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 75,
        estimatedCost: 0,
        category: 'Free Scenic Walk',
        isFreeOrLowCost: true
      },
      {
        id: 'jpr-free-bazaars',
        title: 'Johari Bazaar Heritage Architectural Walk',
        description: 'Self-guided architectural discovery through the terracotta colonnades and historic chowks of the walled city.',
        location: 'Johari Bazaar, Old City, Jaipur',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 80,
        estimatedCost: 0,
        category: 'Free Cultural Walk',
        isFreeOrLowCost: true
      },
      {
        id: 'jpr-free-govind',
        title: 'Govind Dev Ji Temple Darshan',
        description: 'Free public entry to the historic 18th-century temple and its open courtyard gardens.',
        location: 'Jalebi Chowk, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 60,
        estimatedCost: 0,
        category: 'Free Spiritual Heritage',
        isFreeOrLowCost: true
      },
      {
        id: 'jpr-free-central-park',
        title: 'Jaipur Central Park Garden Stroll',
        description: 'Lush 5km running and walking park with indigenous flowering trees, open lawns, and peaceful shaded benches.',
        location: 'Prithviraj Road, Rambagh, Jaipur',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 0,
        category: 'Free Public Park',
        isFreeOrLowCost: true
      }
    ]
  },

  pune: {
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    places: [
      // Day 1
      {
        id: 'pne-shaniwar-wada',
        title: 'Shaniwar Wada Peshwa Palace Fort',
        description: 'Seat of the 18th-century Maratha Empire Peshwas, renowned for its imposing Dilli Darwaza, courtyards, and foundation gardens.',
        location: 'Shaniwar Peth, Pune',
        latitude: 18.5196,
        longitude: 73.8553,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 120,
        estimatedCost: 100,
        category: 'Historic Fortress',
        tags: ['heritage', 'history', 'architecture', 'fort'],
        openingHours: '08:00 - 18:30'
      },
      {
        id: 'pne-fc-road',
        title: 'FC Road Heritage Cafes & Irani Chai',
        description: 'Iconic student quarter featuring vintage Irani cafes, bun maska, filter coffee, and second-hand street book stalls.',
        location: 'Fergusson College Road, Shivajinagar, Pune',
        latitude: 18.5222,
        longitude: 73.8415,
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 90,
        estimatedCost: 200,
        category: 'Cafe & Street Life',
        tags: ['food', 'cafe', 'bazaar', 'culture']
      },
      {
        id: 'pne-parvati-hill',
        title: 'Parvati Hill Temple & City Sunset',
        description: 'Climb 108 stone steps to the Peshwa hilltop temple complex offering uninterrupted 360-degree sunset views of Pune.',
        location: 'Parvati Paytha, Pune',
        latitude: 18.4960,
        longitude: 73.8488,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 100,
        estimatedCost: 50,
        category: 'Scenic Viewpoint',
        tags: ['nature', 'sunset', 'viewpoint', 'spiritual']
      },

      // Day 2
      {
        id: 'pne-aga-khan',
        title: 'Aga Khan Palace & Gandhi Memorial',
        description: 'Majestic Italianate palace with sprawling lawns where Mahatma Gandhi was interned during the Quit India movement.',
        location: 'Nagar Road, Samrat Ashok Path, Yerawada, Pune',
        latitude: 18.5524,
        longitude: 73.9016,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 120,
        estimatedCost: 100,
        category: 'History & Memorials',
        tags: ['heritage', 'history', 'architecture', 'memorial'],
        openingHours: '09:00 - 17:30'
      },
      {
        id: 'pne-pataleshwar',
        title: 'Pataleshwar 8th-Century Rock-Cut Cave Temple',
        description: 'Monolithic basalt rock cave carved during the Rashtrakuta period with circular Nandi mandapa and shaded green courtyard.',
        location: 'Jangali Maharaj Road, Shivajinagar, Pune',
        latitude: 18.5284,
        longitude: 73.8504,
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 60,
        estimatedCost: 50,
        category: 'Ancient Archaeology',
        tags: ['heritage', 'architecture', 'spiritual', 'ancient']
      },
      {
        id: 'pne-koregaon-park',
        title: 'Koregaon Park Artisan Cafes & Osho Teerth Walk',
        description: 'Leafy lanes lined with banyan trees, micro-bakeries, art spaces, and the tranquil Osho Teerth Zen botanical garden.',
        location: 'Lane 1-3, Koregaon Park, Pune',
        latitude: 18.5362,
        longitude: 73.8940,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 120,
        estimatedCost: 350,
        category: 'Culinary & Culture',
        tags: ['cafe', 'art', 'nature', 'garden', 'food']
      },

      // Day 3
      {
        id: 'pne-sinhagad',
        title: 'Sinhagad Fort Mountain Expedition',
        description: 'Historic Sahyadri mountain fortress steeped in Tanaji Malusare’s legacy, famous for rustic pitla bhakri and kanda bhaji at the top.',
        location: 'Sinhagad Ghat Road, Thoptewadi, Maharashtra',
        latitude: 18.3663,
        longitude: 73.7558,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 180,
        estimatedCost: 300,
        category: 'Trek & Heritage',
        tags: ['nature', 'trek', 'mountain', 'heritage', 'outdoors']
      },
      {
        id: 'pne-khadakwasla',
        title: 'Khadakwasla Dam Lakeside Breeze',
        description: 'Picturesque freshwater reservoir breeze with hot roasted corn (bhutta) and views of the NDA campus hills.',
        location: 'Khadakwasla, Pune',
        latitude: 18.4357,
        longitude: 73.7656,
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 75,
        estimatedCost: 100,
        category: 'Lake & Outdoors',
        tags: ['nature', 'lake', 'outdoors', 'sunset']
      },
      {
        id: 'pne-saras-baug',
        title: 'Saras Baug & Talyatla Ganpati Gardens',
        description: 'Peshwa-era temple situated in a historic dried lake basin, surrounded by fountains and bhel puri food plazas.',
        location: 'Sadashiv Peth, Pune',
        latitude: 18.5008,
        longitude: 73.8546,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 80,
        estimatedCost: 100,
        category: 'Public Gardens',
        tags: ['nature', 'garden', 'food', 'spiritual']
      },

      // Day 4
      {
        id: 'pne-kelkar-museum',
        title: 'Raja Dinkar Kelkar Museum',
        description: 'Extensive private collection of over 20,000 Indian artifacts including musical instruments, carvings, and the Mastani Mahal recreation.',
        location: 'Shukrawar Peth, Pune',
        latitude: 18.5109,
        longitude: 73.8539,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 110,
        estimatedCost: 150,
        category: 'Museum & Heritage',
        tags: ['heritage', 'art', 'museum', 'culture']
      },
      {
        id: 'pne-tulshibaug',
        title: 'Tulshibaug Traditional Bazaars & Temple Walk',
        description: 'Dating to the 18th century, a bustling hub for brass utensils, traditional Maharashtrian spices, and authentic Puneri sweets.',
        location: 'Budhwar Peth, Pune',
        latitude: 18.5173,
        longitude: 73.8564,
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 90,
        estimatedCost: 150,
        category: 'Bazaars & Sweets',
        tags: ['food', 'bazaar', 'culture', 'heritage']
      },
      {
        id: 'pne-vetal-tekdi',
        title: 'Vetal Tekdi Hill Ridge Sunset Trail',
        description: 'Highest natural point in Pune city limits, shaded by neem and eucalyptus groves with expansive evening skies.',
        location: 'Kothrud / Senapati Bapat Road, Pune',
        latitude: 18.5255,
        longitude: 73.8156,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 50,
        category: 'Nature & Ridge Trail',
        tags: ['nature', 'sunset', 'trek', 'outdoors']
      },

      // Day 5
      {
        id: 'pne-dagdusheth',
        title: 'Shrimant Dagdusheth Halwai Ganpati & Peth Walk',
        description: 'One of Maharashtra’s most visited pilgrimage sites, followed by a walk through the historic residential wadas of Kasba Peth.',
        location: 'Budhwar Peth, Shivaji Road, Pune',
        latitude: 18.5165,
        longitude: 73.8562,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 50,
        category: 'Spiritual & Heritage',
        tags: ['spiritual', 'heritage', 'culture']
      },
      {
        id: 'pne-mahatma-phule',
        title: 'Mahatma Jyotiba Phule Mandai Victorian Market',
        description: 'Majestic 1886 stone market hall housing hundreds of fresh produce and regional fruit traders.',
        location: 'Shukrawar Peth, Mandai, Pune',
        latitude: 18.5135,
        longitude: 73.8568,
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 60,
        estimatedCost: 100,
        category: 'Colonial Architecture',
        tags: ['architecture', 'bazaar', 'food', 'heritage']
      },
      {
        id: 'pne-arayan-garden',
        title: 'Pu La Deshpande Okayama Friendship Garden',
        description: 'Japanese-style landscape garden inspired by Okayama’s Korakuen, featuring water channels, waterfalls, and wooden footbridges.',
        location: 'Sinhagad Road, Pune',
        latitude: 18.4905,
        longitude: 73.8322,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 50,
        category: 'Botanical Gardens',
        tags: ['nature', 'garden', 'relaxation', 'scenic']
      },

      // Day 6
      {
        id: 'pne-nda-glider',
        title: 'Pashan Lake Wetland & Bird Watching Sanctuary',
        description: 'Early morning tranquility around an artificial lake built during the British era, habitat for migratory waterfowl.',
        location: 'Pashan, Pune',
        latitude: 18.5385,
        longitude: 73.7842,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 50,
        category: 'Wildlife & Nature',
        tags: ['nature', 'lake', 'wildlife', 'outdoors']
      },
      {
        id: 'pne-law-college-rd',
        title: 'Law College Road Cultural Walk & Book Cafes',
        description: 'Tree-lined avenue hosting film archives, cultural societies, and quiet reading cafes serving regional pour-overs.',
        location: 'Erandwane, Pune',
        latitude: 18.5167,
        longitude: 73.8327,
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 90,
        estimatedCost: 250,
        category: 'Culture & Cafes',
        tags: ['cafe', 'art', 'culture', 'food']
      },
      {
        id: 'pne-emp-garden',
        title: 'Empress Botanical Garden Evening Promenade',
        description: 'Sprawling 39-acre historic botanical sanctuary established in 1838 with rare tropical canopy trees and quiet pathways.',
        location: 'Near Race Course, Camp, Pune',
        latitude: 18.5143,
        longitude: 73.8996,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 50,
        category: 'Heritage Gardens',
        tags: ['nature', 'garden', 'heritage', 'relaxation']
      }
    ],
    freeAlternatives: [
      {
        id: 'pne-free-vetal',
        title: 'Vetal Tekdi Hilltop Ridge Nature Walk',
        description: 'Free access to scenic ridge trails overlooking Pune with fresh breeze and bird watching.',
        location: 'Senapati Bapat Road, Pune',
        latitude: 18.5255,
        longitude: 73.8156,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 0,
        category: 'Free Nature Trail',
        tags: ['nature', 'outdoors', 'free'],
        isFreeOrLowCost: true
      },
      {
        id: 'pne-free-parvati',
        title: 'Parvati Hill 108 Steps & Scenic Overview',
        description: 'Free public stone stairway leading to panoramic views of Pune valley and cool evening air.',
        location: 'Parvati Paytha, Pune',
        latitude: 18.4960,
        longitude: 73.8488,
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 75,
        estimatedCost: 0,
        category: 'Free Scenic Viewpoint',
        tags: ['nature', 'sunset', 'viewpoint', 'free'],
        isFreeOrLowCost: true
      },
      {
        id: 'pne-free-pashan',
        title: 'Pashan Lake Public Nature Trail',
        description: 'Free peaceful lakeside walk observing native wetland birds and tree canopies.',
        location: 'Pashan, Pune',
        latitude: 18.5385,
        longitude: 73.7842,
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 60,
        estimatedCost: 0,
        category: 'Free Lakeside Walk',
        tags: ['nature', 'lake', 'outdoors', 'free'],
        isFreeOrLowCost: true
      },
      {
        id: 'pne-free-dagdusheth',
        title: 'Dagdusheth & Historic Kasba Peth Heritage Walk',
        description: 'Free walking route through ancient Maratha wadas and sacred temple chowks.',
        location: 'Kasba Peth, Pune',
        latitude: 18.5165,
        longitude: 73.8562,
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 80,
        estimatedCost: 0,
        category: 'Free Heritage Walk',
        tags: ['heritage', 'culture', 'free'],
        isFreeOrLowCost: true
      }
    ]
  },

  mumbai: {
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    places: [
      {
        id: 'bom-gateway',
        title: 'Gateway of India & Colonial Harbour',
        description: 'Indo-Saracenic triumphal arch overlooking Mumbai Harbour, framing Victorian maritime vistas and ferry boats.',
        location: 'Apollo Bandar, Colaba, Mumbai',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 100,
        category: 'Iconic Landmark'
      },
      {
        id: 'bom-colaba-causeway',
        title: 'Colaba Causeway & Kala Ghoda Arts Walk',
        description: 'Stroll through Art Deco architecture, heritage galleries, antiquities vendors, and historic Irani cafes like Leopold.',
        location: 'Colaba & Kala Ghoda, Fort, Mumbai',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 120,
        estimatedCost: 350,
        category: 'Art & Bazaars'
      },
      {
        id: 'bom-marine-drive',
        title: 'Marine Drive & Chowpatty Beach Sunset',
        description: 'The Queen’s Necklace arc along the Arabian Sea, watching the sunset with fresh bhel puri and cool sea air.',
        location: 'Marine Drive, Netaji Subhash Chandra Bose Road, Mumbai',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 120,
        estimatedCost: 150,
        category: 'Coastal Promenade'
      },
      // Day 2
      {
        id: 'bom-cst-heritage',
        title: 'Chhatrapati Shivaji Maharaj Terminus & Fort Walk',
        description: 'UNESCO Gothic Revival architectural marvel, followed by historic stone streets of Ballard Estate.',
        location: 'Fort, Mumbai',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 100,
        estimatedCost: 100,
        category: 'UNESCO Architecture'
      },
      {
        id: 'bom-crawford',
        title: 'Crawford Market & Mangaldas Cloth Bazaar',
        description: 'Victorian indoor market designed with William Lockwood Kipling bas-reliefs, overflowing with spices and regional fruits.',
        location: 'Dhobi Talao, Chhatrapati Shivaji Terminus Area, Fort, Mumbai',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 90,
        estimatedCost: 200,
        category: 'Historic Markets'
      },
      {
        id: 'bom-bandra-bandstand',
        title: 'Bandra Bandstand Promenade & Castella de Aguada',
        description: 'Portuguese coastal fort ruins at Land’s End with Arabian Sea vistas and Mount Mary Basilica.',
        location: 'Bandstand Promenade, Bandra West, Mumbai',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 110,
        estimatedCost: 100,
        category: 'Coastal Heritage'
      },
      // Day 3
      {
        id: 'bom-elephanta',
        title: 'Elephanta Caves Island Excursion',
        description: 'Ferry ride from Gateway of India to 5th-century rock-cut cave temples dedicated to Shiva, featuring the Trimurti sculpture.',
        location: 'Gharapuri Island, Mumbai Harbour',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 240,
        estimatedCost: 650,
        category: 'Ancient UNESCO Caves'
      },
      {
        id: 'bom-sassoon-docks',
        title: 'Sassoon Dock Art & Fish Auction Trail',
        description: 'One of Mumbai’s oldest wet docks, celebrated for vibrant murals, fishing trawlers, and Koli community heritage.',
        location: 'Colaba, Mumbai',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 75,
        estimatedCost: 100,
        category: 'Maritime Culture'
      },
      {
        id: 'bom-worli-seaface',
        title: 'Worli Sea Face & Bandra-Worli Sea Link View',
        description: 'Vibrant promenade with crashing waves against tetrapods and sweeping views of the cable-stayed bridge.',
        location: 'Worli Sea Face, Mumbai',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 100,
        category: 'Seafront Leisure'
      }
    ],
    freeAlternatives: [
      {
        id: 'bom-free-marine-drive',
        title: 'Marine Drive Queen’s Necklace Sunset Walk',
        description: 'Free scenic seaside promenade stretching 3.6 km along Back Bay with continuous sea breeze.',
        location: 'Marine Drive, Mumbai',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 90,
        estimatedCost: 0,
        category: 'Free Promenade',
        isFreeOrLowCost: true
      },
      {
        id: 'bom-free-kala-ghoda',
        title: 'Kala Ghoda Art Deco Street Walk',
        description: 'Self-guided stroll through Mumbai’s finest preserved heritage precinct and outdoor public art.',
        location: 'Kala Ghoda, Fort, Mumbai',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 75,
        estimatedCost: 0,
        category: 'Free Heritage Walk',
        isFreeOrLowCost: true
      },
      {
        id: 'bom-free-bandstand',
        title: 'Bandra Bandstand & Portuguese Fort Ruins',
        description: 'Free public coastal promontory with open sea views and sea spray.',
        location: 'Bandra West, Mumbai',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 60,
        estimatedCost: 0,
        category: 'Free Coastal View',
        isFreeOrLowCost: true
      }
    ]
  },

  goa: {
    city: 'Goa',
    state: 'Goa',
    latitude: 15.4909,
    longitude: 73.8278,
    places: [
      {
        id: 'goa-fontainhas',
        title: 'Fontainhas Latin Quarter Heritage Walk',
        description: 'Vibrant Portuguese quarter with pastel-yellow mansions, wooden balconies, azulejo tiles, and traditional bakeries.',
        location: 'Altinho, Panaji, Goa',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 100,
        estimatedCost: 150,
        category: 'Colonial Heritage'
      },
      {
        id: 'goa-miramar',
        title: 'Miramar Beach & Mandovi River Estuary Walk',
        description: 'Shaded palm groves meeting the confluence of Mandovi river and the Arabian sea with sea-view shacks.',
        location: 'Panaji, Goa',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 80,
        estimatedCost: 150,
        category: 'Coastal Leisure'
      },
      {
        id: 'goa-aguada-sunset',
        title: 'Fort Aguada & Lighthouse Coastal Cliffs',
        description: '17th-century Portuguese fortress commanding Sinquerim beach with stone battlements and sunset views.',
        location: 'Candolim, Goa',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 110,
        estimatedCost: 100,
        category: 'Historic Fortress'
      },
      // Day 2
      {
        id: 'goa-old-goa',
        title: 'Old Goa Basilica of Bom Jesus & Se Cathedral',
        description: 'UNESCO World Heritage baroque churches holding the mortal remains of St. Francis Xavier and ancient vaulted nave.',
        location: 'Old Goa, Goa',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 120,
        estimatedCost: 100,
        category: 'UNESCO Churches'
      },
      {
        id: 'goa-spice-plantation',
        title: 'Sahakari Organic Spice Plantation & Goan Buffet',
        description: 'Guided tour among vanilla vines, cardamom pods, and nutmeg trees with traditional banana-leaf Goan lunch.',
        location: 'Curti, Ponda, Goa',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 150,
        estimatedCost: 650,
        category: 'Agri-tourism & Cuisine'
      },
      {
        id: 'goa-anjuna-curlies',
        title: 'Anjuna Rocky Beach & Flea Market Sunset',
        description: 'Bohemian red laterite rocks, artisanal jewelry stalls, and ambient acoustic music along the shoreline.',
        location: 'Anjuna Beach, Goa',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 120,
        estimatedCost: 300,
        category: 'Beach & Culture'
      },
      // Day 3
      {
        id: 'goa-chapora',
        title: 'Chapora Fort & Vagator Cliffs',
        description: 'Famed laterite cliff-top fort overlooking the Morjim river mouth, Ozran cove, and deep blue waves.',
        location: 'Chapora, Vagator, Goa',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 90,
        estimatedCost: 50,
        category: 'Cliff Fortress'
      },
      {
        id: 'goa-divar-island',
        title: 'Divar Island Countryside Cycle & Ferry Trail',
        description: 'Catch a river ferry to explore quiet paddy fields, sleepy hamlets, and historic whitewashed hilltop churches.',
        location: 'Divar Island, Mandovi River, Goa',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 120,
        estimatedCost: 150,
        category: 'Slow Travel & Islands'
      },
      {
        id: 'goa-palolem-cove',
        title: 'Palolem Crescent Beach & Candlelight Shacks',
        description: 'Picture-perfect crescent bay fringed by coconut palms with calm swimming waters and beachside dining.',
        location: 'Canacona, South Goa',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 120,
        estimatedCost: 400,
        category: 'South Goa Serenity'
      }
    ],
    freeAlternatives: [
      {
        id: 'goa-free-fontainhas',
        title: 'Fontainhas Architectural Walking Tour',
        description: 'Free stroll through the colorful heritage lanes and historic tiled wells of Panjim.',
        location: 'Fontainhas, Panaji, Goa',
        timeSlot: 'morning',
        bestVisited: 'Morning',
        durationMinutes: 75,
        estimatedCost: 0,
        category: 'Free Heritage Walk',
        isFreeOrLowCost: true
      },
      {
        id: 'goa-free-miramar',
        title: 'Miramar Beach Sunset Stroll',
        description: 'Free public beach overlooking Aguada bay with soft sand and open horizon.',
        location: 'Miramar, Panaji, Goa',
        timeSlot: 'evening',
        bestVisited: 'Evening',
        durationMinutes: 60,
        estimatedCost: 0,
        category: 'Free Beach Walk',
        isFreeOrLowCost: true
      },
      {
        id: 'goa-free-old-goa',
        title: 'Se Cathedral & Old Goa Public Grounds',
        description: 'Free entrance to the historic cathedral plaza and surrounding shaded parklands.',
        location: 'Old Goa, Goa',
        timeSlot: 'afternoon',
        bestVisited: 'Afternoon',
        durationMinutes: 70,
        estimatedCost: 0,
        category: 'Free Historical Site',
        isFreeOrLowCost: true
      }
    ]
  }
};
