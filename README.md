**AI Resume Matcher**
--------------------------------------------------------------------------------------------------------------------------------
A smart web application that analyzes resumes against job descriptions, scores the alignment, and gives personalized suggestions to improve your chances of landing your dream job.

[Live Demo](https://resumematcher-w7dr.onrender.com/)
[Backend](https://ai-resume-matcher-xcxo.onrender.com/)

---

**Features**

- Upload PDFs your resume and job description.
- Uses Gemini 2.5 Flash API to intelligently:
  - Summarize both resume & JD
  - Score resume-to-JD match (% match)
  - Suggest improvements tailored to the role
- Real-time resume parsing using AI
- Recruiters can extract structured data from resumes: skills, experience, education, etc.
- Persistent storage with MongoDB

---

**Tech Stack**

| Frontend        | Backend             | AI/NLP + APIs       |
|-----------------|---------------------|---------------------|
| React.js        | Node.js + Express   | Gemini 2.5 Flash API |
| Context API     | Multer (file upload)| pdf-parse, spaCy    |
| Axios           | MongoDB             | ElevenLabs (TTS) (future) |

---

**How It Works**

1. User uploads resume and job description PDFs.
2. Resume Parser extracts key information from resume (skills, experience, etc.).
3. Both resume and JD are summarized into concise prompts.
4. Gemini API is called to:
   - Score how well the resume matches the JD
   - Suggest edits/improvements
5. User receives:
   - Match Percentage
   - Detailed Suggestions
   - Optionally: Parsed resume view

---

**Screenshots**

<img width="1601" height="945" alt="image" src="https://github.com/user-attachments/assets/ebd14455-43d5-49bf-b881-7e15b7fd9f7d" />

--------------------------------------------------------------------------------------------------------





Link: https://resumematcher-w7dr.onrender.com/

If you liked this project, kindly support.
