/*
 * Store module for modifying phyloreferences.
 */

import Vue from "vue";
import { PhylorefWrapper, TaxonomicUnitWrapper } from "@phyloref/phyx";
import { cloneDeep, has, isEqual, keys } from "lodash";

/**
 * Checks if two taxonomic units are identical.
 *
 * @param {any} tunit1 - The first taxonomic unit.
 * @param {any} tunit2 - The second taxonomic unit.
 * @returns {boolean} - True if the taxonomic units are identical, false otherwise.
 */
export function areTUnitsIdentical(tunit1, tunit2) {
  // Check if the taxonomic units are identical after normalization.
  return isEqual(
    TaxonomicUnitWrapper.normalize(tunit1),
    TaxonomicUnitWrapper.normalize(tunit2)
  );
}

export default {
  getters: {
    getPhylorefType: (state, getters) => (phyloref) => {
      const internalSpecifierCount = (phyloref.internalSpecifiers || []).length;
      const externalSpecifierCount = (phyloref.externalSpecifiers || []).length;

      // Handle apormophy-based definitions separately.
      if (getters.isApomorphyBasedPhyloref(phyloref)) {
        // Apomorphy-based phyloreferences must have a single internal specifier.
        if (externalSpecifierCount === 0 && internalSpecifierCount === 1) {
          return "Apomorphy-based clade definition";
        }

        return "Invalid definition (apomorphy-based clade definitions must have a single internal specifier)";
      }

      if (externalSpecifierCount > 0) {
        if (internalSpecifierCount > 0) return "Maximum clade definition";
      } else if (internalSpecifierCount > 0) {
        if (internalSpecifierCount > 1) return "Minimum clade definition";
        return "Invalid definition (single internal specifier cannot be resolved)";
      }

      return "Invalid definition (must have at least one internal specifier)";
    },

    /** Returns true if a particular phyloref should be considered an apomorphy-based phyloref. */
    isApomorphyBasedPhyloref: () => (phyloref) =>
      has(phyloref, "apomorphy") && has(phyloref.apomorphy, "definition"),
  },
  mutations: {
    setPhylorefProps(state, payload) {
      // Set or delete one or more properties on a phyloreference.

      if (!has(payload, "phyloref")) {
        throw new Error(
          'setPhylorefProps needs a phyloref to modify using the "phyloref" argument'
        );
      }
      if (has(payload, "deleteFields")) {
        payload.deleteFields.forEach((fieldName) =>
          Vue.delete(payload.phyloref, fieldName)
        );
      }
      if (has(payload, "label")) {
        Vue.set(payload.phyloref, "label", payload.label);
      }
      if (has(payload, "definition")) {
        Vue.set(payload.phyloref, "definition", payload.definition);
      }
      if (has(payload, "curatorNotes")) {
        Vue.set(payload.phyloref, "curatorNotes", payload.curatorNotes);
      }
      if (has(payload, "apomorphy")) {
        Vue.set(payload.phyloref, "apomorphy", payload.apomorphy);
      }
      if (has(payload, "expectedResolution")) {
        if (!has(payload, "phylogenyId")) {
          throw new Error(
            'setPhylorefProps used to set expectedResolution needs a phylogeny ID to set using the "phylogenyId" argument'
          );
        }

        if (!has(payload.phyloref, "expectedResolution"))
          Vue.set(payload.phyloref, "expectedResolution", {});
        Vue.set(
          payload.phyloref.expectedResolution,
          payload.phylogenyId,
          payload.expectedResolution
        );
      }
    },

    addExternalSpecifier(state, payload) {
      // Add an empty specifier to a particular phyloreference as an external specifier.

      if (!has(payload, "phyloref")) {
        throw new Error(
          'addSpecifier needs a phyloref to modify using the "phyloref" argument'
        );
      }

      if (!has(payload.phyloref, "externalSpecifiers")) {
        Vue.set(payload.phyloref, "externalSpecifiers", []);
      }

      payload.phyloref.externalSpecifiers.push({});
    },

    addInternalSpecifier(state, payload) {
      // Add an empty specifier to a particular phyloreference as an internal specifier.

      if (!has(payload, "phyloref")) {
        throw new Error(
          'addSpecifier needs a phyloref to modify using the "phyloref" argument'
        );
      }

      if (!has(payload.phyloref, "internalSpecifiers")) {
        Vue.set(payload.phyloref, "internalSpecifiers", []);
      }

      payload.phyloref.internalSpecifiers.push({});
    },

    deleteSpecifier(state, payload) {
      // Delete a specifier from a phyloreference.

      if (!has(payload, "phyloref")) {
        throw new Error(
          'deleteSpecifier needs a phyloref to modify using the "phyloref" argument'
        );
      }
      if (!has(payload, "specifier")) {
        throw new Error(
          'deleteSpecifier needs a specifier to delete using the "specifier" argument'
        );
      }

      new PhylorefWrapper(payload.phyloref).deleteSpecifier(payload.specifier);
    },

    setSpecifierProps(state, payload) {
      // Set one or more properties on a specifier.

      if (!has(payload, "specifier")) {
        throw new Error(
          'setSpecifierProps needs a specifier to modify using the "specifier" argument'
        );
      }

      if (!has(payload, "props")) {
        throw new Error(
          'setSpecifierProps needs properties to set this specifier to using the "props" argument'
        );
      }

      const specifier = payload.specifier;
      const props = payload.props;

      // Delete all existing keys in this specifier.
      keys(specifier).forEach((key) => Vue.delete(specifier, key));

      // Add all new keys from the payload.
      keys(props).forEach((key) =>
        Vue.set(specifier, key, cloneDeep(props[key]))
      );
    },

    setSpecifierType(state, payload) {
      // Change the type of a specifier. Since we maintain separate internalSpecifiers
      // and externalSpecifiers arrays, we may need to delete the specifier from one
      // array and add it to the other.

      if (!has(payload, "phyloref")) {
        throw new Error(
          'setSpecifierType needs a phyloref to modify using the "phyloref" argument'
        );
      }
      if (!has(payload, "specifier")) {
        throw new Error(
          'setSpecifierType needs a specifier to modify using the "specifier" argument'
        );
      }
      if (!has(payload, "specifierType")) {
        throw new Error(
          'setSpecifierType needs a specifierType to set to using the "specifierType" argument'
        );
      }

      // Remove this specifier from this phyloreference.
      if (
        has(payload.phyloref, "internalSpecifiers") &&
        payload.phyloref.internalSpecifiers.includes(payload.specifier)
      ) {
        payload.phyloref.internalSpecifiers.splice(
          payload.phyloref.internalSpecifiers.indexOf(payload.specifier),
          1
        );
      }
      if (
        has(payload.phyloref, "externalSpecifiers") &&
        payload.phyloref.externalSpecifiers.includes(payload.specifier)
      ) {
        payload.phyloref.externalSpecifiers.splice(
          payload.phyloref.externalSpecifiers.indexOf(payload.specifier),
          1
        );
      }

      // Reinsert it into the correct place.
      if (payload.specifierType === "Internal") {
        if (has(payload.phyloref, "internalSpecifiers")) {
          payload.phyloref.internalSpecifiers.push(payload.specifier);
        } else {
          Vue.set(payload.phyloref, "internalSpecifiers", [payload.specifier]);
        }
      } else if (payload.specifierType === "External") {
        if (has(payload.phyloref, "externalSpecifiers")) {
          payload.phyloref.externalSpecifiers.push(payload.specifier);
        } else {
          Vue.set(payload.phyloref, "externalSpecifiers", [payload.specifier]);
        }
      } else {
        throw new Error(`Unknown specifier type: ${payload.specifierType}`);
      }
    },

    setSpecifierPart(state, payload) {
      // Replaces one or more specifier part with a new value. Note that values
      // can only be scientific names or occurrence IDs; external references use
      // updateSpecifierExternalReference().
      if (!has(payload, "specifierPart")) {
        throw new Error(
          'setSpecifierPart needs a specifier part to modify using the "specifierPart" argument'
        );
      }

      if (has(payload, "scientificName")) {
        Vue.set(
          payload.specifierPart,
          "scientificName",
          payload.scientificName
        );
      }
      if (has(payload, "occurrenceID")) {
        Vue.set(payload.specifierPart, "occurrenceID", payload.occurrenceID);
      }
    },

    updateSpecifierExternalReference(state, payload) {
      // Given a specifier, replace one external reference with another.
      if (!has(payload, "specifier")) {
        throw new Error(
          'updateSpecifierExternalReference needs a specifier to modify using the "specifier" argument'
        );
      }

      if (!has(payload.specifier, "externalReferences")) {
        Vue.set(payload.specifier, "externalReferences", []);
      }

      if (has(payload, "fromExternalReference")) {
        if (
          payload.specifier.externalReferences.includes(
            payload.fromExternalReference
          )
        ) {
          payload.specifier.externalReferences.splice(
            payload.specifier.externalReferences.indexOf(
              payload.fromExternalReference
            ),
            1
          );
        }
      }

      if (has(payload, "toExternalReference")) {
        payload.specifier.externalReferences.push(payload.toExternalReference);
      }
    },

    addToSpecifier(state, payload) {
      // Add a new external reference, specimen or scientific name to a phyloreference.

      if (!has(payload, "specifier")) {
        throw new Error(
          'addToSpecifier needs a specifier to modify using the "specifier" argument'
        );
      }

      // Add external reference (if one is provided).
      if (has(payload, "externalReference")) {
        if (!has(payload.specifier, "externalReferences")) {
          Vue.set(payload.specifier, "externalReferences", []);
        }

        payload.specifier.externalReferences.push(payload.externalReference);
      }

      // Add specimen (if one is provided).
      if (has(payload, "specimen")) {
        if (!has(payload.specifier, "includesSpecimens")) {
          Vue.set(payload.specifier, "includesSpecimens", []);
        }

        payload.specifier.includesSpecimens.push(payload.specimen);
      }

      // Add scientific name (if one is provided).
      if (has(payload, "scientificName")) {
        if (!has(payload.specifier, "scientificNames")) {
          Vue.set(payload.specifier, "scientificNames", []);
        }

        payload.specifier.scientificNames.push(payload.scientificName);
      }
    },

    deleteFromSpecifier(state, payload) {
      // Delete a scientific name, specimen or external reference from a given specifier.

      if (!has(payload, "specifier")) {
        throw new Error(
          'deleteFromSpecifier needs a specifier to modify using the "specifier" argument'
        );
      }
      if (has(payload, "scientificName")) {
        if (!has(payload.specifier, "scientificNames"))
          Vue.set(payload.specifier, "scientificNames", []);
        if (
          payload.specifier.scientificNames.includes(payload.scientificName)
        ) {
          payload.specifier.scientificNames.splice(
            payload.specifier.scientificNames.indexOf(payload.scientificName),
            1
          );
        }
      }
      if (has(payload, "specimen")) {
        if (!has(payload.specifier, "includesSpecimens"))
          Vue.set(payload.specifier, "includesSpecimens", []);
        if (payload.specifier.includesSpecimens.includes(payload.specimen)) {
          payload.specifier.includesSpecimens.splice(
            payload.specifier.includesSpecimens.indexOf(payload.specimen),
            1
          );
        }
      }
      if (has(payload, "externalReference")) {
        if (!has(payload.specifier, "externalReferences"))
          Vue.set(payload.specifier, "externalReferences", []);
        if (
          payload.specifier.externalReferences.includes(
            payload.externalReference
          )
        ) {
          payload.specifier.externalReferences.splice(
            payload.specifier.externalReferences.indexOf(
              payload.externalReference
            ),
            1
          );
        }
      }
    },
  },
};
