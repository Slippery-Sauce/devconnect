const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

export async function fetchMatchScore(userSkills, projectSkills) {
  const prompt = `You are a developer skill matcher. Given a user's skills and a project's required skills, return ONLY a JSON object with no markdown, no explanation, just raw JSON in this format:
{"score": 85, "reason": "Your React and Python skills align well with this project's needs."}

User skills: ${userSkills.join(', ')}
Project required skills: ${projectSkills.join(', ')}`

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
      }),
    })
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
    const data  = await res.json()
    const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.warn('Gemini fallback:', err.message)
    return fallbackScore(userSkills, projectSkills)
  }
}

function fallbackScore(userSkills, projectSkills) {
  const uL = userSkills.map((s) => s.toLowerCase())
  const pL = projectSkills.map((s) => s.toLowerCase())
  const overlap = uL.filter((s) => pL.some((p) => p.includes(s) || s.includes(p)))
  const score = Math.min(95, Math.round((overlap.length / Math.max(pL.length, 1)) * 80) + 10)
  const reason = overlap.length > 0
    ? `Your ${overlap.slice(0, 2).join(' and ')} skills directly match this project's requirements.`
    : `Your background could bring fresh perspective to this team's tech stack.`
  return { score, reason }
}