module.exports = async function handler(req, res) {
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const storageAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'item-photos';
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.end();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      categories: [
        'Documents / ID Cards',
        'Electronics',
        'Keys',
        'Wallet / Money',
        'Earphones / Accessories',
        'Bags',
        'Clothing',
        'Other'
      ],
      locations: [
        'Main Building',
        'Library',
        'Cafeteria',
        'Lab',
        'Classroom Building',
        'Dormitory',
        'Parking Area',
        'Security Desk',
        'Other'
      ],
      predefinedQuestions: [
        'What brand is the item?',
        'What color is it?',
        'What was inside it?',
        'Where do you think you lost it?',
        'What identifying feature does it have?',
        'Can you describe any writing or labels on it?',
        'What model or size is it?'
      ],
      storage:
        storageUrl && storageAnonKey
          ? {
              url: storageUrl,
              anonKey: storageAnonKey,
              bucket: storageBucket
            }
          : null
    })
  );
};

