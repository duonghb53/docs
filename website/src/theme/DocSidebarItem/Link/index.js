import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {isActiveSidebarItem} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import styles from './styles.module.css';
import { CategoryIcon } from '@theme/DocSidebarItem/Category';
import sharedStyles from '../Category/styles.module.css';
export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  activeDescendant, // <-- new prop
  ...props
}) {
  const {href, label, className, autoAddBaseUrl} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
        {
          [sharedStyles.activeDescendant]: activeDescendant && level > 1, // <-- add class for active descendant at nested levels
        }
      )}
      key={label}>
      <Link
        className={clsx(
          item.customProps && sharedStyles.customMenuLink,
          'menu__link',
          !isInternalLink && styles.menuExternalLink,
          {
            'menu__link--active': isActive,
          },
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}>
        {item.customProps && <CategoryIcon icon={item.customProps? item.customProps.icon : undefined} /> }  
        {label}
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
