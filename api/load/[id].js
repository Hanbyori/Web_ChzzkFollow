import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'No ID provided' });
    }

    // GitHub Token 확인
    if (!process.env.GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Gist 조회
    const gistResponse = await octokit.gists.get({
      gist_id: id
    });

    // 파일 내용 추출
    const files = gistResponse.data.files;
    const fileKey = Object.keys(files)[0];
    const content = files[fileKey].content;
    const data = JSON.parse(content);

    return res.status(200).json({ data });

  } catch (error) {
    console.error('Load error:', error);

    if (error.status === 404) {
      return res.status(404).json({ error: 'Data not found' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
