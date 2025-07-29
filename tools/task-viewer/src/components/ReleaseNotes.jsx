import React, { useState, useEffect } from 'react';
import { releaseMetadata, getReleaseFile } from '../data/releases';

function ReleaseNotes() {
  const [selectedVersion, setSelectedVersion] = useState(releaseMetadata[0]?.version || '');
  const [releaseContent, setReleaseContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedVersion) {
      loadReleaseContent(selectedVersion);
    }
  }, [selectedVersion]);

  const loadReleaseContent = async (version) => {
    setLoading(true);
    setReleaseContent('');
    
    try {
      const releaseFile = getReleaseFile(version);
      const response = await fetch(releaseFile);
      
      if (response.ok) {
        const content = await response.text();
        setReleaseContent(content);
      } else {
        setReleaseContent(`# ${version}\n\nRelease notes not found.`);
      }
    } catch (error) {
      console.error('Error loading release content:', error);
      setReleaseContent(`# ${version}\n\nError loading release notes.`);
    } finally {
      setLoading(false);
    }
  };

  // Parse inline markdown (bold, italic, code)
  const parseInlineMarkdown = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Check for bold text **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        // Add text before the match
        if (boldMatch.index > 0) {
          parts.push(remaining.substring(0, boldMatch.index));
        }
        // Add bold text
        parts.push(
          <strong key={`bold-${key++}`}>
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Check for code `text`
      const codeMatch = remaining.match(/`([^`]+)`/);
      if (codeMatch && codeMatch.index !== undefined) {
        // Add text before the match
        if (codeMatch.index > 0) {
          parts.push(remaining.substring(0, codeMatch.index));
        }
        // Add code text
        parts.push(
          <span
            className="inline-code"
            key={`code-${key++}`}
          >
            {codeMatch[1]}
          </span>
        );
        remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
        continue;
      }

      // Check for italic text *text* or _text_
      const italicMatch = remaining.match(/[*_]([^*_]+)[*_]/);
      if (italicMatch && italicMatch.index !== undefined) {
        // Add text before the match
        if (italicMatch.index > 0) {
          parts.push(remaining.substring(0, italicMatch.index));
        }
        // Add italic text
        parts.push(
          <em key={`italic-${key++}`}>
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more markdown found, add the rest as plain text
      parts.push(remaining);
      break;
    }

    return parts;
  };

  const renderMarkdown = (content) => {
    if (!content) return null;
    
    // Enhanced markdown rendering with inline formatting
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="release-h1">
            {parseInlineMarkdown(line.substring(2))}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="release-h2">
            {parseInlineMarkdown(line.substring(3))}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="release-h3">
            {parseInlineMarkdown(line.substring(4))}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        return (
          <h4 key={index} className="release-h4">
            {parseInlineMarkdown(line.substring(5))}
          </h4>
        );
      } else if (line.startsWith('- ')) {
        return (
          <div key={index} className="release-list-item">
            • {parseInlineMarkdown(line.substring(2))}
          </div>
        );
      } else if (line.startsWith('  - ')) {
        // Handle nested bullets
        return (
          <div key={index} className="release-list-item nested">
            ◦ {parseInlineMarkdown(line.substring(4))}
          </div>
        );
      } else if (line.trim() === '') {
        return <div key={index} className="release-spacer" />;
      } else if (line.trim() === '---') {
        // Handle horizontal rules
        return <hr key={index} className="release-divider" />;
      } else if (line.match(/^\*[^*]+\*$/)) {
        // Italic line
        return (
          <p key={index} className="release-text italic">
            {parseInlineMarkdown(line)}
          </p>
        );
      } else {
        return (
          <p key={index} className="release-text">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
    });
  };

  return (
    <div className="release-notes-tab-content">
      <div className="release-notes-inner">
        <div className="release-notes-header">
          <h2>📋 Release Notes</h2>
        </div>
        
        <div className="release-notes-content">
          <div className="release-sidebar">
            <h3>Versions</h3>
            <ul className="version-list">
              {releaseMetadata.map((release) => (
                <li key={release.version}>
                  <button
                    className={`version-button ${selectedVersion === release.version ? 'active' : ''}`}
                    onClick={() => setSelectedVersion(release.version)}
                    title={release.summary}
                  >
                    <span className="version-number">{release.version}</span>
                    <span className="version-date">{release.date}</span>
                    {release.title && (
                      <span className="version-title">{release.title}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="release-details">
            {loading ? (
              <div className="release-loading">Loading release notes...</div>
            ) : (
              <div className="release-markdown-content">
                {renderMarkdown(releaseContent)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReleaseNotes;