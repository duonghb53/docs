import React from 'react';
import DocSidebarItemCategory from '@theme/DocSidebarItem/Category';
import DocSidebarItemLink from '@theme/DocSidebarItem/Link';
import clsx from 'clsx';
import { isActiveSidebarItem, DocSidebarItemsExpandedStateProvider } from '@docusaurus/plugin-content-docs/client';

// Helper to check if any descendant is active
function hasActiveDescendant(items, activePath) {
  return items?.some(item => {
    if (item.type === 'category') {
      return isActiveSidebarItem(item, activePath) || hasActiveDescendant(item.items, activePath);
    }
    return isActiveSidebarItem(item, activePath);
  });
}

export default function DocSidebarItems({
  items,
  onItemClick,
  activePath,
  level = 1,
}) {
  // Check if any child at this level or deeper is active
  const activeDescendant = hasActiveDescendant(items, activePath);

  return (
    <DocSidebarItemsExpandedStateProvider>
      {items.map((item, index) => {
        if (item.type === 'category') {
          // Pass activeDescendant to children
          return (
            <DocSidebarItemCategory
              key={item.label || index}
              item={item}
              onItemClick={onItemClick}
              activePath={activePath}
              level={level}
              index={index}
              activeDescendant={activeDescendant}
            />
          );
        }
        if (item.type === 'link' || item.type === 'ref') {
          return (
            <DocSidebarItemLink
              key={item.label || index}
              item={item}
              onItemClick={onItemClick}
              activePath={activePath}
              level={level}
              index={index}
              activeDescendant={activeDescendant}
            />
          );
        }
        // Support for custom HTML or other types
        if (item.type === 'html') {
          return (
            <li key={index} dangerouslySetInnerHTML={{ __html: item.value }} />
          );
        }
        return null;
      })}
    </DocSidebarItemsExpandedStateProvider>
  );
} 