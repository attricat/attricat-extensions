import { useDeferredValue, useState } from 'react';
import { ExtensionIcon } from './ExtensionIcon';
import { ArrowUpRight, Blocks, Search, TriangleAlert, X } from 'lucide-react';
import type { Extension } from '../registry';
import styles from './ExtensionCatalog.module.css';

interface Props {
  extensions: Extension[];
}

const ICON_SIZE = 18;

const matches = (extension: Extension, query: string) => {
  if (!query) return true;
  const haystack = [extension.name, extension.id, extension.description, extension.repository]
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const ExtensionCard = ({ extension }: { extension: Extension }) => {
  const latest = extension.versions[0];
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <ExtensionIcon url={extension.iconUrl} className={styles.icon} />
        <div className={styles.titles}>
          <h3 className={styles.name}>
            <a href={extension.path}>{extension.name}</a>
          </h3>
          <code className={styles.id}>{extension.id}</code>
        </div>
      </div>
      <p className={styles.description}>{extension.description}</p>
      <dl className={styles.meta}>
        {latest ? (
          <>
            <div>
              <dt>Latest</dt>
              <dd>
                <span className={styles.chip}>v{latest.version.replace(/^v/, '')}</span>
              </dd>
            </div>
            <div>
              <dt>Host API</dt>
              <dd>
                <code>{latest.host_api}</code>
              </dd>
            </div>
            <div>
              <dt>Reviewed</dt>
              <dd>{plural(extension.versions.length, 'version', 'versions')}</dd>
            </div>
          </>
        ) : (
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`${styles.chip} ${styles.chipWarning}`}>
                <TriangleAlert size={14} aria-hidden="true" />
                No reviewed versions yet
              </span>
            </dd>
          </div>
        )}
      </dl>
      <div className={styles.footer}>
        <code className={styles.repository}>{extension.repository}</code>
        <a className={styles.link} href={extension.repositoryUrl}>
          GitHub
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </li>
  );
};

export const ExtensionCatalog = ({ extensions }: Props) => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const visible = extensions.filter((extension) => matches(extension, deferredQuery));

  return (
    <section className={styles.catalog} aria-labelledby="catalog-heading">
      <div className={styles.toolbar}>
        <h2 id="catalog-heading" className={styles.heading}>
          Registry
          <span className={styles.count}>{plural(extensions.length, 'extension', 'extensions')}</span>
        </h2>
        <label className={styles.search}>
          <span className={styles.visuallyHidden}>Search extensions</span>
          <Search size={ICON_SIZE} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, ID or repository"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => setQuery('')}>
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </label>
      </div>
      <p className={styles.visuallyHidden} aria-live="polite">
        {deferredQuery ? `${plural(visible.length, 'extension', 'extensions')} found` : ''}
      </p>
      {visible.length > 0 ? (
        <ul className={styles.grid}>
          {visible.map((extension) => (
            <ExtensionCard key={extension.id} extension={extension} />
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <Blocks size={24} aria-hidden="true" />
          {extensions.length === 0 ? (
            <p>The registry lists no extensions yet.</p>
          ) : (
            <>
              <p>No extensions match “{deferredQuery}”.</p>
              <button type="button" className="button button-secondary" onClick={() => setQuery('')}>
                Clear search
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
};
