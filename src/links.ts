import { REGISTRY_REPOSITORY } from './registry';

const GITHUB = 'https://github.com';
const DOCS = 'https://docs.attricat.com';

export const links = {
  website: 'https://attricat.com/',
  docs: `${DOCS}/`,
  docsInstall: `${DOCS}/builders/extensions/`,
  docsBuild: `${DOCS}/extensions/build/`,
  registryRepository: `${GITHUB}/${REGISTRY_REPOSITORY}`,
  registryFile: `${GITHUB}/${REGISTRY_REPOSITORY}/blob/main/registry.json`,
  submit: `${GITHUB}/${REGISTRY_REPOSITORY}/edit/main/registry.json`,
} as const;
