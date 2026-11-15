import original from './osm-caba.json' with { type: 'json' };
import verifications from './place-verifications.json' with { type: 'json' };
import imports from './osm-imports.json' with { type: 'json' };

const records = new Map(original.elements.map((element) => [`${element.type}/${element.id}`, element]));
imports.elements.forEach((element) => records.set(`${element.type}/${element.id}`, element));

// Institutional checks never change OSM's original tags, geometry or timestamp.
export const verifiedSnapshot = {
  ...original,
  revision: `${original.osmTimestamp}|${verifications.revision}|${imports.revision}`,
  verificationUpdatedOn: verifications.updatedOn,
  dataUpdatedAt: imports.revision === 'initial' ? verifications.updatedOn : imports.revision,
  elements: [...records.values()].map((element) => ({
    ...element,
    verification: (verifications.places[`${element.type}/${element.id}`]?.verifiedOn || '') >= (element.acquisition?.osmTimestamp || original.osmTimestamp).slice(0, 10)
      ? verifications.places[`${element.type}/${element.id}`] : null,
    provenance: {
      source: 'OpenStreetMap',
      recordUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      datasetUrl: original.datasetUrl,
      osmDataTimestamp: element.acquisition?.osmTimestamp || original.osmTimestamp,
      coordinateDataTimestamp: element.acquisition?.osmTimestamp || original.osmTimestamp,
      obtainedAt: element.acquisition?.obtainedAt || original.importedOn,
      acquisitionMethod: element.acquisition?.method || 'manual-transcription-of-published-extract',
      license: original.license,
      licenseUrl: original.licenseUrl,
      attribution: original.attribution,
      ...(element.acquisition ? { datasetUrl: element.acquisition.datasetUrl } : {}),
    },
  })),
};
