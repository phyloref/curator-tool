/*
 * Store module for modifying phylogenies.
 */

import Vue from 'vue';
import {findIndex, has} from 'lodash';
import {TaxonomicUnitWrapper} from "@phyloref/phyx";
import {areTUnitsIdentical} from "@/store/modules/phyloref";

export default {
  getters: {
    getExplicitTaxonomicUnitsForPhylogenyNode: () => (phylogeny, nodeLabel) => {
      // Return any "explicit" taxonomic units for a phylogeny node, i.e. those with representsTaxonomicUnits
      // in the additionalNodeProperties for this node label. This is as compared to implicit taxonomic units,
      // which we generate from the node label.
      if (
        has(phylogeny, "additionalNodeProperties") &&
        has(phylogeny.additionalNodeProperties, nodeLabel) &&
        has(
          phylogeny.additionalNodeProperties[nodeLabel],
          "representsTaxonomicUnits"
        )
      ) {
        return phylogeny.additionalNodeProperties[nodeLabel]
          .representsTaxonomicUnits;
      }
      return [];
    },
    areTUnitsIdentical: () => (tunit1, tunit2) => {
      // Test whether two taxonomic units are identical. This is intended to be the only place in Klados where
      // we do this comparison. Eventually I will update this to normalize the TUs before comparison, which should
      // help with https://github.com/phyloref/klados/issues/263
      return areTUnitsIdentical(tunit1, tunit2);
    },
  },
  mutations: {
    /**
     * Insert a new taxonomic unit to a phylogeny node. If one is not provided, we insert an empty taxonomic unit
     * without a nomenclatural code.
     */
    addTaxonomicUnitToPhylogenyNode(state, payload) {
      if (!has(payload, "phylogeny")) {
        throw new Error(
          'addTaxonomicUnitToPhylogenyNode needs a phylogeny to modify using the "phylogeny" argument'
        );
      }
      if (!has(payload, "nodeLabel")) {
        throw new Error(
          'addTaxonomicUnitToPhylogenyNode needs a node label to modify using the "nodeLabel" argument'
        );
      }

      let tunitToBeAdded = TaxonomicUnitWrapper.fromLabel("");
      if (has(payload, "tunit")) {
        tunitToBeAdded = payload.tunit;
      }

      // If there is no additionalNodeProperties or representsTaxonomicUnits, set them up now.
      if (!has(payload.phylogeny, "additionalNodeProperties"))
        Vue.set(payload.phylogeny, "additionalNodeProperties", {});

      if (!has(payload.phylogeny.additionalNodeProperties, payload.nodeLabel))
        Vue.set(
          payload.phylogeny.additionalNodeProperties,
          payload.nodeLabel,
          {}
        );

      if (!has(payload.phylogeny.additionalNodeProperties[payload.nodeLabel], "representsTaxonomicUnits"))
        Vue.set(
          payload.phylogeny.additionalNodeProperties[payload.nodeLabel],
          "representsTaxonomicUnits",
          []
        );

      // Now we can append the new taxonomic unit to it.
      payload.phylogeny.additionalNodeProperties[payload.nodeLabel].representsTaxonomicUnits.push(tunitToBeAdded);
    },
    /**
     * Replace or delete a taxonomic unit from a phylogeny node.
     */
    replaceTUnitForPhylogenyNode(state, payload) {
      if (!has(payload, "phylogeny")) {
        throw new Error(
          'replaceTUnitForPhylogenyNode needs a phylogeny to modify using the "phylogeny" argument'
        );
      }
      if (!has(payload, "nodeLabel")) {
        throw new Error(
          'replaceTUnitForPhylogenyNode needs a node label to modify using the "nodeLabel" argument'
        );
      }
      if (!has(payload, "tunit")) {
        throw new Error(
          'replaceTUnitForPhylogenyNode needs a tunit to delete using the "tunit" argument'
        );
      }
      if (!has(payload, "tunit_new") && !has(payload, "delete")) {
        throw new Error(
          "replaceTUnitForPhylogenyNode needs either a `tunit_new` to replace the tunit or `delete` to indicate it should be deleted."
        );
      }

      console.log(
        "Tried to replace or delete tunit: ", payload.tunit, " from phylogeny ", payload.phylogeny, " at node label ", payload.nodeLabel
      );
      if (!has(payload.phylogeny, "additionalNodeProperties")) {
        console.error(
          "Could not replace or delete: no additionalNodeProperties present in phylogeny."
        );
        return;
      }

      if (!has(payload.phylogeny.additionalNodeProperties, payload.nodeLabel)) {
        console.error(
          "Could not replace or delete: node label ",
          payload.nodeLabel,
          " not present in phylogeny."
        );
        return;
      }

      if (
        !has(
          payload.phylogeny.additionalNodeProperties[payload.nodeLabel],
          "representsTaxonomicUnits"
        )
      ) {
        console.error(
          "Could not replace or delete: node label ",
          payload.nodeLabel,
          " does not have a representsTaxonomicUnits."
        );
        return;
      }

      const tunits =
        payload.phylogeny.additionalNodeProperties[payload.nodeLabel]
          .representsTaxonomicUnits;
      const index = findIndex(tunits, (tu) =>
        areTUnitsIdentical(payload.tunit, tu)
      );

      if (index < 0) {
        console.error(
          "Could not replace or delete: tunit ",
          payload.tunit,
          " as it is not present in tunits: ",
          tunits
        );
        return;
      }

      // Delete or replace?
      if (has(payload, "delete")) {
        tunits.splice(index, 1);
      } else if (has(payload, "tunit_new")) {
        tunits.splice(index, 1, payload.tunit_new);
      } else {
        console.error(
          "Neither `delete` nor `tunit_new` was set in payload, which should have been checked earlier: ",
          payload
        );
      }
    },
    /**
     * Set phylogeny properties.
     */
    setPhylogenyProps(state, payload) {
      if (!has(payload, "phylogeny")) {
        throw new Error(
          'setPhylogenyProps needs a phylogeny to modify using the "phylogeny" argument'
        );
      }
      if (has(payload, "label")) {
        Vue.set(payload.phylogeny, "label", payload.label);
      }
      if (has(payload, "curatorNotes")) {
        Vue.set(payload.phylogeny, "curatorNotes", payload.curatorNotes);
      }
      if (has(payload, "newick")) {
        Vue.set(payload.phylogeny, "newick", payload.newick);
      }
      if (has(payload, "@id")) {
        Vue.set(payload.phylogeny, "@id", payload["@id"]);
      }
    },
  },
  actions: {
    changePhylogenyId(context, payload) {
      // When changing a phylogeny ID, care needs to be taken to ensure that:
      //  (1) duplicate phylogeny IDs are not created within the same file, and
      //  (2) all current references to this phylogeny continue to make sense.

      // Check arguments.
      if (!has(payload, 'phylogeny')) {
        throw new Error('changePhylogenyId needs a phylogeny to modify using the "phylogeny" argument');
      }

      if (!has(payload, 'phylogenyId')) {
        throw new Error('changePhylogenyId needs a new phylogeny ID using the "phylogenyId" argument');
      }

      // What was the previous phylogeny ID?
      const oldPhylogenyId = context.rootGetters.getPhylogenyId(payload.phylogeny);

      // No need to do anything if they haven't changed.
      if (oldPhylogenyId === payload.phylogenyId) return;

      // Do any of our current phylogenies have this ID?
      const phylogenyWithDuplicateID = context.rootState.phyx.currentPhyx.phylogenies.find(phylogeny => has(phylogeny, '@id') && phylogeny['@id'] === payload.phylogenyId);
      if (phylogenyWithDuplicateID) {
        throw new Error(`Attempt to change ${oldPhylogenyId} to ${payload.phylogenyId} failed: duplicate phylogeny ID detected.`);
      }

      // If any phyloreferences refer to oldPhylogenyId, replace it with
      // references to the new phylogenyId.
      context.rootState.phyx.currentPhyx.phylorefs.forEach((phyloref) => {
        if (has(phyloref.expectedResolution || {}, oldPhylogenyId)) {
          // Copy the expected resolution of oldPhylogenyId into the new phylogenyId.
          context.commit('setPhylorefProps', {
            phyloref,
            phylogenyId: payload.phylogenyId,
            expectedResolution: phyloref.expectedResolution[oldPhylogenyId],
          });
          // Delete the expected resolution of oldPhylogenyId.
          context.commit('setPhylorefProps', {
            phyloref,
            phylogenyId: oldPhylogenyId,
            expectedResolution: undefined,
          });
        }
      });

      // Change the phylogeny.
      context.commit('setPhylogenyProps', {
        phylogeny: payload.phylogeny,
        '@id': payload.phylogenyId,
      });
    },
  },
};
