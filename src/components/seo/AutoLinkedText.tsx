import React from 'react';
import { useLocation } from 'react-router-dom';
import { autoLinkText } from '../../lib/seo/autoLinkText';

type AutoLinkedTextProps = {
  text: string;
  maxLinks?: number;
  cluster?: string;
  allowRuleIds?: string[];
  excludeRuleIds?: string[];
  /** A Set of hrefs that have already been used in the current context, to prevent duplicates. */
  usedHrefs?: Set<string>;
};

const AutoLinkedText: React.FC<AutoLinkedTextProps> = ({ text, ...options }) => {
  const { pathname } = useLocation();
  
  if (!text) {
    return null;
  }

  return <>{autoLinkText(text, { pathname, ...options })}</>;
};

export default AutoLinkedText;
