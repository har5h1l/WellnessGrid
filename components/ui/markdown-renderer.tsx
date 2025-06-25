import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const processMarkdown = (text: string) => {
    // Split by line breaks first to handle them properly
    const lines = text.split('\n');
    const processedLines = [];
    
    let inList = false;
    let listItems = [];
    let listType = 'ul'; // 'ul' or 'ol'
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      // Check for list items
      const isBulletPoint = /^[\s]*[-*•]\s+(.+)/.test(line);
      const isNumberedList = /^[\s]*\d+\.\s+(.+)/.test(line);
      const isListItem = isBulletPoint || isNumberedList;
      
      if (isListItem) {
        if (!inList) {
          inList = true;
          listType = isNumberedList ? 'ol' : 'ul';
          listItems = [];
        } else if ((listType === 'ul' && isNumberedList) || (listType === 'ol' && isBulletPoint)) {
          // List type changed, close previous list
          const ListComponent = listType === 'ol' ? 'ol' : 'ul';
          processedLines.push(
            <ListComponent key={`list-${lineIndex}`} className="ml-4 mb-3 space-y-1">
              {listItems}
            </ListComponent>
          );
          listType = isNumberedList ? 'ol' : 'ul';
          listItems = [];
        }
        
        const match = line.match(/^[\s]*(?:[-*•]|\d+\.)\s+(.+)/);
        const itemContent = match ? match[1] : line;
        
        listItems.push(
          <li key={`item-${lineIndex}`} className="text-gray-900">
            {processInlineFormatting(itemContent, lineIndex)}
          </li>
        );
      } else {
        // Not a list item
        if (inList) {
          // Close the current list
          const ListComponent = listType === 'ol' ? 'ol' : 'ul';
          processedLines.push(
            <ListComponent key={`list-${lineIndex}`} className="ml-4 mb-3 space-y-1">
              {listItems}
            </ListComponent>
          );
          inList = false;
          listItems = [];
        }
        
        if (line.trim() === '') {
          // Empty line - add spacing
          processedLines.push(<div key={lineIndex} className="h-3" />);
        } else {
          processedLines.push(
            <div key={lineIndex} className={lineIndex > 0 ? "mt-2" : ""}>
              {processInlineFormatting(line, lineIndex)}
            </div>
          );
        }
      }
    }
    
    // Close any remaining list
    if (inList) {
      const ListComponent = listType === 'ol' ? 'ol' : 'ul';
      processedLines.push(
        <ListComponent key={`list-final`} className="ml-4 mb-3 space-y-1">
          {listItems}
        </ListComponent>
      );
    }
    
    return processedLines;
  };

  const processInlineFormatting = (text: string, lineIndex: number) => {
    // Process inline formatting within each line
    const parts = [];
    let currentText = text;
    let partIndex = 0;

    // Process **bold** text
    currentText = currentText.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
      const marker = `__BOLD_${partIndex}__`;
      parts.push({ type: 'bold', content: p1, marker });
      partIndex++;
      return marker;
    });

    // Process *italic* text (but not if it's part of a bullet point)
    currentText = currentText.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, (match, p1) => {
      const marker = `__ITALIC_${partIndex}__`;
      parts.push({ type: 'italic', content: p1, marker });
      partIndex++;
      return marker;
    });

    // Split the text by the markers and rebuild with React elements
    let processedParts = [currentText];
    
    parts.forEach(part => {
      const newParts = [];
      processedParts.forEach(textPart => {
        if (typeof textPart === 'string' && textPart.includes(part.marker)) {
          const splitParts = textPart.split(part.marker);
          for (let i = 0; i < splitParts.length; i++) {
            if (i > 0) {
              // Insert the formatted element
              if (part.type === 'bold') {
                newParts.push(<strong key={`${lineIndex}-${partIndex}-${i}`} className="font-semibold">{part.content}</strong>);
              } else if (part.type === 'italic') {
                newParts.push(<em key={`${lineIndex}-${partIndex}-${i}`} className="italic">{part.content}</em>);
              }
            }
            if (splitParts[i]) {
              newParts.push(splitParts[i]);
            }
          }
        } else {
          newParts.push(textPart);
        }
      });
      processedParts = newParts;
    });

    return processedParts.map((part, i) => (
      <React.Fragment key={i}>{part}</React.Fragment>
    ));
  };

  return (
    <div className={`leading-relaxed ${className}`}>
      {processMarkdown(content)}
    </div>
  );
} 