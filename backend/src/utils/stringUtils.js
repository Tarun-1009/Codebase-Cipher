/**
 * String Utilities for parsing
 */

class StringUtils {
  static extractBetween(str, start, end) {
    const startIndex = str.indexOf(start);
    if (startIndex === -1) return null;

    const contentStart = startIndex + start.length;
    const endIndex = str.indexOf(end, contentStart);
    if (endIndex === -1) return null;

    return str.substring(contentStart, endIndex);
  }

  static findMatches(str, pattern) {
    const matches = [];
    let match;

    while ((match = pattern.exec(str)) !== null) {
      matches.push(match);
    }

    return matches;
  }

  static trimWhitespace(str) {
    return str.trim().replace(/\s+/g, ' ');
  }

  static extractLineNumber(content, matchIndex) {
    return content.substring(0, matchIndex).split('\n').length;
  }

  static getLineContent(content, lineNumber) {
    const lines = content.split('\n');
    return lines[lineNumber - 1] || '';
  }

  static extractFunctionName(functionDeclaration) {
    const match = functionDeclaration.match(/function\s+(\w+)|const\s+(\w+)|(\w+)\s*\(/);
    return match ? (match[1] || match[2] || match[3]) : null;
  }

  static isCodeLine(line) {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
  }

  static extractBracketContent(str, openBracket = '{', closeBracket = '}') {
    let depth = 0;
    let start = -1;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === openBracket) {
        if (depth === 0) start = i;
        depth++;
      } else if (str[i] === closeBracket) {
        depth--;
        if (depth === 0 && start !== -1) {
          return str.substring(start, i + 1);
        }
      }
    }

    return null;
  }
}

module.exports = StringUtils;
