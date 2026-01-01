import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // GitHub Token 확인
    if (!process.env.GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Gist 생성
    const gistResponse = await octokit.gists.create({
      description: 'Chzzk Follow List Share',
      public: false,
      files: {
        'chzzk-follow.json': {
          content: JSON.stringify(data)
        }
      }
    });

    const gistId = gistResponse.data.id;

    return res.status(200).json({
      id: gistId,
      url: `${req.headers.origin || ''}#${gistId}`
    });

  } catch (error) {
    console.error('Share error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
