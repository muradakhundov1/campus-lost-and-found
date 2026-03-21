// ========================================
// CAMPUS LOST & FOUND — DATA LAYER
// ========================================

const DB = {
  currentUser: null,

  users: [
    { id: 'u1', name: 'Alex Johnson', email: 'alex.j@campus.edu', phone: '+1 555-0101', role: 'student', avatar: 'AJ', verified: true, suspended: false, joinedDate: '2025-09-01', department: 'Computer Science', year: '3rd Year', postCount: 4, resolvedCount: 2 },
    { id: 'u2', name: 'Maya Patel', email: 'maya.p@campus.edu', phone: '+1 555-0102', role: 'student', avatar: 'MP', verified: true, suspended: false, joinedDate: '2025-09-01', department: 'Biology', year: '2nd Year', postCount: 2, resolvedCount: 1 },
    { id: 'u3', name: 'Sam Rivera', email: 'sam.r@campus.edu', phone: '+1 555-0103', role: 'staff', avatar: 'SR', verified: true, suspended: false, joinedDate: '2024-01-15', department: 'Library Services', year: 'Staff', postCount: 5, resolvedCount: 4 },
    { id: 'u4', name: 'Admin User', email: 'admin@campus.edu', phone: '+1 555-0100', role: 'admin', avatar: 'AU', verified: true, suspended: false, joinedDate: '2023-06-01', department: 'Administration', year: 'Admin', postCount: 0, resolvedCount: 0 },
    { id: 'u5', name: 'Jordan Lee', email: 'jordan.l@campus.edu', phone: '+1 555-0104', role: 'student', avatar: 'JL', verified: true, suspended: false, joinedDate: '2025-09-01', department: 'Engineering', year: '1st Year', postCount: 1, resolvedCount: 0 }
  ],

  items: [
    {
      id: 'i1', type: 'found', title: 'AirPods Pro in white case', category: 'Earphones / Accessories',
      description: 'Found a pair of AirPods Pro in a white charging case near the cafeteria seating area. The case has a small sticker on the back.',
      location: 'Cafeteria', date: '2026-03-18', time: '12:30', emoji: '🎧',
      status: 'Active', posterId: 'u2', posterName: 'Maya P.',
      verificationQuestions: [
        { id: 'q1', text: 'What is the serial number or any identifying mark on the case?' },
        { id: 'q2', text: 'What model are they — AirPods, AirPods Pro, or AirPods Max?' },
        { id: 'q3', text: 'What was inside the AirPods case (how much charge approximately)?' }
      ],
      claimCount: 1, resolvedAt: null
    },
    {
      id: 'i2', type: 'lost', title: 'Student ID Card — Alex Johnson', category: 'Documents / ID Cards',
      description: 'Lost my student ID card. It has my photo and "Computer Science, 3rd Year" printed on it. I need it urgently for the library and dormitory access.',
      location: 'Library', date: '2026-03-17', time: '14:00', emoji: '🪪',
      status: 'Claim Pending', posterId: 'u1', posterName: 'Alex J.',
      verificationQuestions: [], claimCount: 0, resolvedAt: null
    },
    {
      id: 'i3', type: 'lost', title: 'Black leather wallet', category: 'Wallet / Money',
      description: 'Lost my black leather wallet somewhere in the library. Contains student ID, debit card, and some cash. Very important to recover.',
      location: 'Library', date: '2026-03-18', time: '11:00', emoji: '👛',
      status: 'Active', posterId: 'u1', posterName: 'Alex J.',
      verificationQuestions: [], claimCount: 0, resolvedAt: null
    },
    {
      id: 'i4', type: 'found', title: 'USB-C laptop charger (Dell)', category: 'Electronics',
      description: 'Found a Dell USB-C charger cable and adapter left on a desk in Lab B-204. Black cable, 65W adapter.',
      location: 'Lab', date: '2026-03-19', time: '16:00', emoji: '🔌',
      status: 'Active', posterId: 'u3', posterName: 'Sam R.',
      verificationQuestions: [
        { id: 'q4', text: 'What wattage is the adapter?' },
        { id: 'q5', text: 'Any identifying marks or labels on the adapter?' }
      ],
      claimCount: 0, resolvedAt: null
    },
    {
      id: 'i5', type: 'found', title: 'Set of 3 keys on a blue keyring', category: 'Keys',
      description: 'Found a set of 3 keys on a blue keyring with a small flashlight attached at the classroom building entrance.',
      location: 'Classroom Building', date: '2026-03-20', time: '09:15', emoji: '🔑',
      status: 'Approved for Handover', posterId: 'u5', posterName: 'Jordan L.',
      verificationQuestions: [
        { id: 'q6', text: 'How many keys are on the ring?' },
        { id: 'q7', text: 'Describe any keychain items attached.' }
      ],
      claimCount: 1, resolvedAt: null
    },
    {
      id: 'i6', type: 'found', title: 'Blue hardcover notebook', category: 'Other',
      description: 'Found a blue hardcover A5 notebook at the security desk. Has handwritten notes inside, appears to be lecture notes for an engineering course.',
      location: 'Security Desk', date: '2026-03-16', time: '17:30', emoji: '📓',
      status: 'Resolved / Returned', posterId: 'u3', posterName: 'Sam R.',
      verificationQuestions: [], claimCount: 1, resolvedAt: '2026-03-20'
    },
    {
      id: 'i7', type: 'lost', title: 'Gray Fjallraven backpack', category: 'Bags',
      description: 'Lost my gray Fjallraven Kanken backpack. Contains laptop, charger, and notebooks. Last seen at the dormitory common room.',
      location: 'Dormitory', date: '2026-03-19', time: '20:00', emoji: '🎒',
      status: 'Active', posterId: 'u2', posterName: 'Maya P.',
      verificationQuestions: [], claimCount: 0, resolvedAt: null
    },
    {
      id: 'i8', type: 'found', title: 'Black wallet (found in library)', category: 'Wallet / Money',
      description: 'Found a black wallet near the reference section of the library. Contains some cards. Turned it in to the library desk first.',
      location: 'Library', date: '2026-03-19', time: '13:45', emoji: '👛',
      status: 'Active', posterId: 'u3', posterName: 'Sam R.',
      verificationQuestions: [
        { id: 'q8', text: 'What cards or items were inside the wallet?' },
        { id: 'q9', text: 'Describe any personal details visible (no numbers, just type).' }
      ],
      claimCount: 0, resolvedAt: null
    }
  ],

  claims: [
    {
      id: 'c1', itemId: 'i1', claimantId: 'u1', claimantName: 'Alex Johnson',
      status: 'Pending', submittedAt: '2026-03-19T10:30:00Z',
      answers: [
        { questionId: 'q1', question: 'What is the serial number or any identifying mark on the case?', answer: 'There is a small yellow star sticker on the back of the case.' },
        { questionId: 'q2', question: 'What model are they — AirPods, AirPods Pro, or AirPods Max?', answer: 'AirPods Pro, second generation.' },
        { questionId: 'q3', question: 'What was inside the AirPods case (how much charge approximately)?', answer: 'Both earbuds and the case were at around 40% charge.' }
      ],
      chatEnabled: false, reviewNote: ''
    },
    {
      id: 'c2', itemId: 'i5', claimantId: 'u1', claimantName: 'Alex Johnson',
      status: 'Approved', submittedAt: '2026-03-20T09:45:00Z',
      answers: [
        { questionId: 'q6', question: 'How many keys are on the ring?', answer: '3 keys — one large, two small.' },
        { questionId: 'q7', question: 'Describe any keychain items attached.', answer: 'A small flashlight and a metal "A" letter charm.' }
      ],
      chatEnabled: true, reviewNote: 'Answers match perfectly.',
      meetingPoint: 'Main Building Lobby', meetingTime: '2026-03-21 14:00',
      handoverStatus: 'Scheduled'
    },
    {
      id: 'c3', itemId: 'i6', claimantId: 'u5', claimantName: 'Jordan Lee',
      status: 'Resolved', submittedAt: '2026-03-17T08:00:00Z',
      answers: [], chatEnabled: false,
      reviewNote: 'Item successfully returned.', handoverStatus: 'Completed'
    }
  ],

  messages: {
    'c2': [
      { id: 'm1', senderId: 'u5', text: 'Hi! I approved your claim. Let\'s coordinate the pickup.', time: '09:50', date: '2026-03-20' },
      { id: 'm2', senderId: 'u1', text: 'Great, thank you so much! Where should we meet?', time: '09:52', date: '2026-03-20' },
      { id: 'm3', senderId: 'u5', text: 'How about the Main Building Lobby at 2 PM tomorrow?', time: '09:55', date: '2026-03-20' },
      { id: 'm4', senderId: 'u1', text: 'Perfect, that works for me!', time: '09:57', date: '2026-03-20' },
      { id: 'm5', senderId: 'system', text: 'Handover scheduled: Main Building Lobby, Mar 21 at 2:00 PM', time: '10:00', date: '2026-03-20' }
    ]
  },

  notifications: [
    { id: 'n1', type: 'claim', icon: '📋', title: 'New claim on your item', desc: 'Alex Johnson submitted a claim for "AirPods Pro in white case"', time: '2h ago', read: false, screen: 'claim-review', claimId: 'c1' },
    { id: 'n2', type: 'match', icon: '✨', title: 'Suggested match found!', desc: 'A found black wallet in Library might match your lost item from Mar 18', time: '3h ago', read: false, screen: 'item-detail', itemId: 'i8' },
    { id: 'n3', type: 'approved', icon: '✅', title: 'Claim approved!', desc: 'Jordan Lee approved your claim for "Set of 3 keys on a blue keyring"', time: '5h ago', read: true, screen: 'chat', claimId: 'c2' },
    { id: 'n4', type: 'handover', icon: '🤝', title: 'Handover scheduled', desc: 'Meeting confirmed: Main Building Lobby, Mar 21 at 2:00 PM', time: '5h ago', read: true, screen: 'handover', claimId: 'c2' },
    { id: 'n5', type: 'status', icon: '🔄', title: 'Item status updated', desc: 'Your lost Student ID card post is now marked as "Active"', time: '1d ago', read: true }
  ],

  reports: [
    { id: 'r1', type: 'post', targetId: 'i7', targetTitle: 'Gray Fjallraven backpack', reporterId: 'u5', reason: 'Suspicious / fake listing', detail: 'Description seems too vague, could be a scam attempt.', severity: 'medium', status: 'pending', createdAt: '2026-03-20T08:00:00Z' },
    { id: 'r2', type: 'user', targetId: 'u2', targetTitle: 'Maya Patel', reporterId: 'u1', reason: 'False claim / harassment', detail: 'User submitted a false claim for an item and sent threatening messages.', severity: 'high', status: 'pending', createdAt: '2026-03-20T10:00:00Z' },
    { id: 'r3', type: 'post', targetId: 'i3', targetTitle: 'Black leather wallet', reporterId: 'u3', reason: 'Spam', detail: 'Same post submitted multiple times.', severity: 'low', status: 'reviewed', createdAt: '2026-03-19T14:00:00Z' }
  ],

  adminLog: [
    { id: 'al1', action: 'Warning Issued', target: 'Jordan Lee (u5)', note: 'First warning for posting incomplete info.', adminId: 'u4', at: '2026-03-18T09:00:00Z' },
    { id: 'al2', action: 'Post Removed', target: 'Item i9 (duplicate)', note: 'Duplicate spam post removed.', adminId: 'u4', at: '2026-03-17T14:00:00Z' },
    { id: 'al3', action: 'Report Reviewed', target: 'Report r3', note: 'Closed as low-priority spam, user warned.', adminId: 'u4', at: '2026-03-19T15:00:00Z' }
  ],

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
