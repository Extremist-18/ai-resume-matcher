import React, { useState } from 'react';
import axios from 'axios';
import Background from './components/Background';
import './App.css';

const highlightKeywords = ['managed', 'developed', 'led', 'designed', 'implemented', 'built'];
function highlightExperience(text) {
  const regex = new RegExp(`\\b(${highlightKeywords.join('|')})\\b`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState({ fullName: '', email: '', phone: '', skills: [], sections: [] });
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a PDF file');
    }
  };
  const handleJdFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setJdFile(file);
      setError('');
    } else {
      setError('Please select a PDF file for Job Description');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      const response = await axios.post('http://localhost:4001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setExtractedData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process PDF');
    } finally {
      setProcessing(false);
    }
  };

  // AI-powered match upload
  const handleMatch = async () => {
    if (!selectedFile || !jdFile) {
      setError('Please select both resume and job description PDFs');
      return;
    }
    setProcessing(true);
    setError('');
    setMatchResult(null);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('job', jdFile);
      const response = await axios.post('http://localhost:4001/match', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMatchResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to match resume and JD');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <Background />
      <div className="app-content">
        <h1>Resume Parser</h1>
        <div className="upload-section">
          <input type="file" accept=".pdf" onChange={handleFileSelect} disabled={processing} />
          {selectedFile && <p>Resume: {selectedFile.name}</p>}
          <input type="file" accept=".pdf" onChange={handleJdFileSelect} disabled={processing} style={{marginTop:'10px'}} />
          {jdFile && <p>Job Description: {jdFile.name}</p>}
          <button onClick={handleUpload} disabled={!selectedFile || processing}>
            {processing ? 'Processing...' : 'Extract Information'}
          </button>
          <button onClick={handleMatch} disabled={!selectedFile || !jdFile || processing} style={{marginLeft:'10px'}}>
            {processing ? 'Processing...' : 'AI Match & Suggestions'}
          </button>
        </div>
        {error && <div className="error">{error}</div>}

        {/* AI Match Results */}
        {matchResult && (
          <div className="match-section">
            <h2>AI Resume Match Results</h2>
            <p><strong>Match %:</strong> {matchResult.matchPercent}%</p>
            <div>
              <h3>Missing/Required Points from JD:</h3>
              <ul>
                {matchResult.jobPoints && matchResult.jobPoints.map((point, idx) => (
                  !matchResult.resumePoints.includes(point) ? <li key={idx}>{point}</li> : null
                ))}
              </ul>
            </div>
            <div>
              <h3>AI Suggestions for Improvement:</h3>
              <ul>
                {matchResult.suggestions && matchResult.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Old Resume Extraction Results */}
        {extractedData.fullName && (
          <div className="info-section">
            <h2>Extracted Information</h2>
            <p><strong>Full Name:</strong> {extractedData.fullName}</p>
            <p><strong>Email:</strong> {extractedData.email}</p>
            <p><strong>Phone:</strong> {extractedData.phone}</p>
          </div>
        )}

        {extractedData.skills.length > 0 && (
          <div className="skills-section">
            <h2>Skills</h2>
            <ul>{extractedData.skills.map((skill, idx) => <li key={idx}>{skill}</li>)}</ul>
          </div>
        )}

        {extractedData.sections && extractedData.sections.length > 0 && (
          <div className="sections">
            <h2>Resume Sections</h2>
            {extractedData.sections.map((section, index) => (
              <div key={index} className="section-block">
                <h3>{section.title}</h3>
                {section.items.map((item, idx) => (
                  <div key={idx} className="section-item">
                    {item.name && <h4>{item.name}</h4>}
                    <ul>
                      {item.bullets.map((bullet, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: highlightExperience(bullet) }} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
