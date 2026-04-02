// ========================================
// CAMPUS LOST & FOUND — DATA LAYER
// ========================================

const DB = {
  currentUser: null,

  users: [],
  items: [],
  claims: [],
  messages: {},
  notifications: [],
  reports: [],
  adminLog: [],

  categories: ['Documents / ID Cards', 'Electronics', 'Keys', 'Wallet / Money', 'Earphones / Accessories', 'Bags', 'Clothing', 'Other'],
  locations: ['Main Building', 'Library', 'Cafeteria', 'Lab', 'Classroom Building', 'Dormitory', 'Parking Area', 'Security Desk', 'Other'],

  predefinedQuestions: [
    'What brand is the item?',
    'What color is it?',
    'What was inside it?',
    'Where do you think you lost it?',
    'What identifying feature does it have?',
    'Can you describe any writing or labels on it?',
    'What model or size is it?'
  ],

  // Compute suggested matches for an item
  getSuggestedMatches(item) {
    const opposite = item.type === 'lost' ? 'found' : 'lost';
    const itemDate = new Date(item.date);
    return DB.items.filter(other => {
      if (other.id === item.id) return false;
      if (other.type !== opposite) return false;
      const sameCategory = other.category === item.category;
      const sameLocation = other.location === item.location;
      const otherDate = new Date(other.date);
      const daysDiff = Math.abs((otherDate - itemDate) / (1000*60*60*24));
      const nearDate = daysDiff <= 3;
      return (sameCategory && nearDate) || (sameLocation && nearDate) || (sameCategory && sameLocation);
    }).slice(0, 3);
  },

  getMyItems(userId) { return DB.items.filter(i => i.posterId === userId); },
  getMyClaims(userId) { return DB.claims.filter(c => c.claimantId === userId); },
  getItemClaims(itemId) { return DB.claims.filter(c => c.itemId === itemId); },
  getItemById(id) { return DB.items.find(i => i.id === id); },
  getClaimById(id) { return DB.claims.find(c => c.id === id); },
  getUserById(id) { return DB.users.find(u => u.id === id); }
};
