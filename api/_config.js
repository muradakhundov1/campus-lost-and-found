module.exports = async function handler(req, res) {
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
      ]
    })
  );
};

