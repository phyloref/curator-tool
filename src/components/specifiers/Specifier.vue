<!--
  The Specifier component is used in two places:
  - The PhylorefView uses it to display specifiers for phyloreferences.
  - The PhylogenyView uses it to display taxonomic units for phylogenies.

  This means that the Specifier component needs to be created with one of two sets of arguments:
  - `phyloref` when the specifier to be edited is part of a phyloreference.
  - `phylogeny` and `nodeLabel` when the taxonomic unit to be edited is part of a phylogeny.
-->

<template>
  <div class="col-md-12">
    <div class="input-group mb-1">
      <div class="input-group-prepend">
        <!-- Display and change the specifier class. -->
        <button
          class="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ specifierClass }}
        </button>
        <div class="dropdown-menu">
          <a
            class="dropdown-item"
            :class="{active: specifierClass === 'Taxon'}"
            href="javascript:;"
            @click="specifierClass = 'Taxon'; updateSpecifier()"
          >Taxon</a>
          <a
            class="dropdown-item"
            :class="{active: specifierClass === 'Specimen'}"
            href="javascript:;"
            @click="specifierClass = 'Specimen'; updateSpecifier()"
          >Specimen</a>
          <a
            class="dropdown-item"
            :class="{active: specifierClass === 'External reference'}"
            href="javascript:;"
            @click="specifierClass = 'External reference'; updateSpecifier()"
          >External reference</a>
        </div>
      </div>
      <!-- For taxon specifiers only, display all possible nomenclatural codes. -->
      <div
        v-if="specifierClass === 'Taxon'"
        class="input-group-prepend"
      >
        <button
          class="btn btn-outline-secondary dropdown-toggle"
          type="button"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {{ nomenclaturalCodeObj.shortName }}
        </button>
        <div class="dropdown-menu">
          <a
            v-for="nomenCode of nomenCodes"
            class="dropdown-item"
            href="javascript:;"
            @click="nomenclaturalCode = nomenCode.iri"
            :key="nomenCode.iri"

            :class="{active: nomenclaturalCode === nomenCode.iri }"
          >
            {{ nomenCode.label }}
          </a>
        </div>
      </div>
      <!-- Display a verbatim label describing the specifier. -->
      <input
        v-model.lazy.trim="specifierLabel"
        readonly
        type="text"
        class="form-control"
      >
      <!-- The "Edit/Collapse" button can be used to edit this specifier. -->
      <div class="input-group-append">
        <button
          class="btn btn-outline-secondary"
          :class="{active: expand}"
          @click="expand = !expand"
        >
          {{ (expand) ? 'Collapse' : 'Edit' }}
        </button>
      </div>
      <!-- The "Delete" button can be used to delete this specifier. -->
      <div class="input-group-append">
        <button
          class="btn btn-danger"
          @click="deleteSpecifier()"
        >
          <b-icon-trash></b-icon-trash>
        </button>
      </div>
    </div>

    <!-- The Edit card is used to edit this specifier -->

    <div
      v-if="expand"
      class="card mt-1 mb-3"
    >
      <div class="card-body">
        <h5 class="card-title">
          Specifier details
        </h5>

        <!-- Specifier type: internal or external. Only phylorefs have this, so we shouldn't display this for others. -->
        <div v-if="phyloref" class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="specifier-type"
          >
            Specifier type
          </label>
          <div class="col-md-10">
            <select
              id="specifier-type"
              v-model.lazy.trim="specifierType"
              class="form-control"
            >
              <option value="Internal">
                Internal specifier
              </option>
              <option value="External">
                External specifier
              </option>
            </select>
          </div>
        </div>

        <!-- Specifier label -->
        <div class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="specifier-label"
          >
            Specifier label
          </label>
          <div class="col-md-10">
            <input
              id="specifier-label"
              v-model.lazy.trim="verbatimLabel"
              class="form-control"
            >
          </div>
        </div>

        <!-- Specifier class -->
        <div class="form-group row">
          <label
            class="col-form-label col-md-2"
            for="specifier-class"
          >
            Specifier class
          </label>
          <div class="col-md-10">
            <select
              id="specifier-class"
              v-model.lazy.trim="specifierClass"
              class="form-control"
              @change="updateSpecifier()"
            >
              <option value="Taxon">
                Taxon
              </option>
              <option value="Specimen">
                Specimen
              </option>
              <option value="External reference">
                External reference
              </option>
            </select>
          </div>
        </div>

        <!--
          We provide three different possible displays for the three different
          types here: Taxon, Specimen, External Reference.
        -->
        <template v-if="specifierClass === 'Taxon'">
          <!-- Specifier class -->
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="nomen-code"
            >
              Nomenclatural code
            </label>
            <div class="col-md-10">
              <select
                id="nomen-code"
                v-model.lazy.trim="nomenclaturalCode"
                class="form-control"
              >
                <option
                  v-for="(nomenCode, nomenCodeIndex) of nomenCodes"
                  :key="nomenCode.iri"
                  :value="nomenCode.iri"
                >
                  {{ nomenCode.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="name-complete"
            >
              Binomial/trinomial name
            </label>
            <div class="col-md-10 input-group">
              <input
                id="name-complete"
                readonly
                :value="wrappedTaxonConcept.nameComplete"
                class="form-control"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="genus"
            >
              Genus
            </label>
            <div class="col-md-10 input-group">
              <input
                id="genus"
                v-model.lazy.trim="genusPart"
                class="form-control"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="specific-epithet"
            >
              Specific epithet
            </label>
            <div class="col-md-10 input-group">
              <input
                id="specific-epithet"
                v-model.lazy.trim="specificEpithet"
                class="form-control"
              >
            </div>
          </div>

          <div
            class="form-group row"
          >
            <label
              class="col-form-label col-md-2"
              for="infraspecific-epithet"
            >
              Infraspecific epithet
            </label>
            <div class="col-md-10 input-group">
              <input
                id="infraspecific-epithet"
                v-model.lazy.trim="infraspecificEpithet"
                class="form-control"
              >
            </div>
          </div>
        </template>

        <template v-if="specifierClass === 'Specimen'">
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="occurrence-id"
            >
              Occurrence ID
            </label>
            <div class="col-md-10">
              <div class="input-group">
                <input
                  id="occurrence-id"
                  v-model.lazy.trim="occurrenceID"
                  class="form-control"
                  placeholder="Enter the occurrence ID of the specimen here, e.g. 'MVZ:Herp:246033' or '000866d2-c177-4648-a200-ead4007051b9'"
                >
              </div>
              <small id="occurrenceIDHelp" class="form-text text-muted">As
                <a href="https://dwc.tdwg.org/terms/#dwc:occurrenceID" target="_blank">per Darwin Core</a>, we recommend
                a persistent, globally unique identifier such as a Darwin Core Triple, a URI/IRI or a UUID.
              </small>
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="collection-code"
            >
              Institution code
            </label>
            <div class="col-md-10 input-group">
              <input
                id="collection-code"
                readonly
                class="form-control"
                :value="wrappedSpecimen.institutionCode"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="collection-code"
            >
              Collection code
            </label>
            <div class="col-md-10 input-group">
              <input
                id="collection-code"
                readonly
                class="form-control"
                :value="wrappedSpecimen.collectionCode"
              >
            </div>
          </div>

          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="catalog-number"
            >
              Catalog number
            </label>
            <div class="col-md-10 input-group">
              <input
                id="catalog-number"
                readonly
                class="form-control"
                :value="wrappedSpecimen.catalogNumber"
              >
            </div>
          </div>
        </template>

        <template v-if="specifierClass === 'External reference'">
          <div class="form-group row">
            <label
              class="col-form-label col-md-2"
              for="external-reference"
            >
              External reference as URI
            </label>
            <div class="col-md-10 input-group">
              <input
                id="external-reference"
                v-model.lazy.trim="externalReference"
                class="form-control"
              >
              <div class="input-group-append">
                <a
                  class="btn btn-outline-secondary"
                  target="_blank"
                  :href="externalReference"
                >
                  Open in new window
                </a>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * The Specifier component is used in two places:
 * - The PhylorefView uses it to display specifiers for phyloreferences.
 * - The PhylogenyView uses it to display taxonomic units for phylogenies.
 *
 * This means that the Specifier component needs to be created with one of two sets of arguments:
 * - `phyloref` when the specifier to be edited is part of a phyloreference.
 * - `phylogeny` and `nodeLabel` when the taxonomic unit to be edited is part of a phylogeny.
 */

import { BIconTrash } from 'bootstrap-vue';
import {
  PhylorefWrapper,
  TaxonomicUnitWrapper,
  TaxonConceptWrapper,
  TaxonNameWrapper,
  SpecimenWrapper,
} from '@phyloref/phyx';
import {
  has, isEqual, cloneDeep, uniqueId,
} from 'lodash';

export default {
  name: 'Specifier',
  components: {
    /* A "trash" icon for deleting this specifier. */
    BIconTrash,
  },
  props: {
    /* The specifier to display and edit. */
    remoteSpecifier: {
      type: Object,
      required: true,
    },
    /* This is used to uniquely identify the specifiers on a page. */
    remoteSpecifierId: {
      type: String,
      required: false,
      default: () => uniqueId('remoteSpecifierId'),
    },
    /*
     * There are two ways of visualizing a specifier:
     * - The specifier may be a part of a phyloref, or
     * - The specifier (really a taxonomic unit) may be a part of a phylogeny via the `representsTaxonomicUnits`
     *   property of the `additionalNodeProperties` dictionary. This is specified in two ways: a phylogeny as
     *   well as a nodeLabel.
     */
    /* The phyloreference containing this specifier */
    phyloref: {
      type: Object,
      required: false,
    },
    /* The phylogeny and nodeLabel containing this specifier (really a taxonomic unit). */
    phylogeny: {
      type: Object,
      required: false,
    },
    nodeLabel: {
      type: String,
      required: false,
    },
  },
  data() {
    // The actual empty data is in methods.emptyData(), except for the `expand` flag.
    return {
      expand: false,
      ...this.emptyData(),
    };
  },
  computed: {
    /** Return a list of all nomenclatural codes recognized by phyx.js. */
    nomenCodes: () => TaxonNameWrapper.getNomenclaturalCodes(),
    /**
     * Return the currently selected nomenclatural code as a Nomen Code Details object, which has e.g. the short name of
     * this code.
     */
    nomenclaturalCodeObj() {
      return TaxonNameWrapper.getNomenCodeDetails(this.nomenclaturalCode);
    },

    // Taxon name fields.
    /**
     * Return a Taxon concept based on the genusName, specificEpithet and the infraspecificEpithet entered by the user.
     */
    taxonConcept() {
      const emptyTaxonConcept = TaxonConceptWrapper.fromLabel('', this.$store.getters.getDefaultNomenCodeIRI);
      const nomenCodeIRI = this.nomenclaturalCode || this.$store.getters.getDefaultNomenCodeIRI;

      // console.log(`wrappedTaxonConcept: ${this.genusPart}, ${this.specificEpithet}, ${this.infraspecificEpithet}.`)

      try {
        if (this.genusPart) {
          if (this.specificEpithet) {
            if (this.infraspecificEpithet) {
              return TaxonConceptWrapper.fromLabel(`${this.genusPart} ${this.specificEpithet} ${this.infraspecificEpithet}`, nomenCodeIRI);
            } else {
              return TaxonConceptWrapper.fromLabel(`${this.genusPart} ${this.specificEpithet}`, nomenCodeIRI);
            }
          } else {
            return TaxonConceptWrapper.fromLabel(this.genusPart, nomenCodeIRI);
          }
        }

        return emptyTaxonConcept;
      } catch {
        return emptyTaxonConcept;
      }
    },

    /** Return a TaxonConceptWrapper that wraps the current taxonConcept. */
    wrappedTaxonConcept() {
      return new TaxonConceptWrapper(this.taxonConcept);
    },

    // Specimen fields.
    /** Return a wrapped specimen based on the only human-editable specimen field: occurrenceID. */
    wrappedSpecimen() {
      return SpecimenWrapper.fromOccurrenceID(this.occurrenceID);
    },

    // Specifier type.
    /**
     * Get or set the specifier type. The code inside the store converts a change-of-specifier-type into
     * removing the specifier from e.g. internalSpecifiers and adding it to e.g. externalSpecifiers.
     *
     * This only makes sense if this specifier is part of a phyloref, in which case `this.phyloref` should be set.
     */
    specifierType: {
      get() {
        if (!this.phyloref) return undefined;
        return new PhylorefWrapper(this.phyloref).getSpecifierType(this.remoteSpecifier);
      },
      set(type) {
        if (!this.phyloref) return undefined;

        this.$store.commit(
          'setSpecifierType',
          {
            phyloref: this.phyloref,
            specifier: this.remoteSpecifier,
            specifierType: type,
          },
        );
      },
    },

    /**
     * The specifier label is what is displayed when the Specifier is not in edit mode. There is also a verbatim label
     * field, which can be used to override this label (it corresponds to the `label` field of the taxonomic unit). If
     * the specifier label is empty, we compute a label from either the taxon concept complete name, the specimen
     * occurrence ID or the external reference.
     */
    specifierLabel() {
      if (this.verbatimLabel) return this.verbatimLabel;
      switch (this.specifierClass) {
        case 'Taxon': return this.wrappedTaxonConcept.nameComplete;
        case 'Specimen': return this.occurrenceID;
        case 'External reference': return this.externalReference;
      }
      return '';
    },

  },
  watch: {
    // If any of our input parameters change, we should reload this specifier. Note that this doesn't check for updates
    // to the contents of these parameters, just whether a new phyloref, remoteSpecifier or remoteSpecifierId has been
    // provided to this template.
    phyloref() {
      this.loadSpecifier();
    },
    phylogeny() {
      this.loadSpecifier();
    },
    nodeLabel() {
      this.loadSpecifier();
    },
    remoteSpecifier() {
      // Did we trigger this?
      if (!this.remoteSpecifierTriggeredHere)
        this.loadSpecifier();
      else
        this.remoteSpecifierTriggeredHere = false;
    },
    remoteSpecifierId() {
      this.loadSpecifier();
    },
    // If the user edits any of the input components, trigger an updateSpecifier() so that we save those changes to
    // the underlying data objects.
    verbatimLabel()         { this.updateSpecifier(); },
    nomenclaturalCode()     { this.updateSpecifier(); },
    genusPart()             { this.updateSpecifier(); },
    specificEpithet()       { this.updateSpecifier(); },
    infraspecificEpithet()  { this.updateSpecifier(); },
    occurrenceID()          { this.updateSpecifier(); },
    externalReference()     { this.updateSpecifier(); },
  },
  // Load the specifier when this component is loaded for the first time.
  mounted() {
    this.loadSpecifier();
  },
  methods: {
    emptyData() {
      /*
       * This method can be used to reset this.$data to its initial state. The only variable missing is `expand`,
       * because we don't want to reset that every time we load.
       */
      return {
        // Fields for all specifier types.
        specifierClass: "",
        verbatimLabel: "",

        // Fields for a taxon name.
        nomenclaturalCode: "",
        genusPart: "",
        specificEpithet: "",
        infraspecificEpithet: "",

        // Fields for a specimen.
        occurrenceID: "",

        // Fields for an external reference.
        externalReference: "",

        // We would like to trigger a reload if something else changes a specifier (unlikely, but it might happen in
        // the future), but we can't trigger that when we update it ourselves. So we set this flag to true while we're
        // updating it.
        remoteSpecifierTriggeredHere: false,
      };
    },
    /**
     * loadSpecifier() reads information from this.remoteSpecifier and loads it into the
     * local variables used by this component.
     *
     * See updateSpecifier() which does the reverse: we call it every time any value changes,
     * and it copies the changes into this.remoteSpecifier using the appropriate $state.commit()
     * methods.
     */
    loadSpecifier() {
      console.log('(Re)loading specifier from: ', this.remoteSpecifier);

      // To begin with, let's blank all our variables so that we don't share information between phylorefs.
      Object.assign(this.$data, this.emptyData());

      // Wrap the remote specifier in a TaxonomicUnitWrapper and figure out
      // what kind of taxonomic unit it is.
      const tunit = new TaxonomicUnitWrapper(this.remoteSpecifier || {});

      // Is there an explicit `label` on this remote specifier?
      // Note we don't use `tunit.label`, becaused TaxonomicUnitWrapper would automatically generate a label:
      // we only want to set `verbatimLabel` if an explicit `label` was set on this
      // taxonomic unit.
      if (has(this.remoteSpecifier, 'label')) {
        this.verbatimLabel = this.remoteSpecifier['label'];
      }

      // If it has an '@id', we treat it solely as an external reference to that '@id'.
      // Otherwise, we try to figure out the specifier class.
      if (has(this.remoteSpecifier, '@id')) {
        this.specifierClass = 'External reference';
        this.externalReference = this.remoteSpecifier['@id'];
      } else {
        // Check the 'types' field to figure out if this tunit is taxon unit or a specimen.
        if (tunit.types.length > 0) {
          switch (tunit.types[0]) {
            case TaxonomicUnitWrapper.TYPE_TAXON_CONCEPT:
              this.specifierClass = 'Taxon';
              break;

            case TaxonomicUnitWrapper.TYPE_SPECIMEN:
              this.specifierClass =  'Specimen';
          }
        }

        if (!this.specifierClass) {
          console.error(`Could not assign a specifier class for ${JSON.stringify(this.remoteSpecifier)}`);

          // Default to Taxon.
          this.specifierClass = 'Taxon';
        }
      }

      /*
       * Here, we do something a little tricky: we load BOTH the taxon concept and the specimen information,
       * if present. Eventually, we could use this to implement a user interface that allows a specimen with a taxon
       * concept to be fully represented in the UI, but for now this just means that if you load a taxon unit with both
       * of these pieces of information, you'll be able to see them if you swap between "Taxon" and "Specimen" in the UI.
       */

      // To start with, set the nomenclatural code to the default. This uses the default nomenclatural code currently
      // set in Klados rather than in the Phyx file, but since we load this from the file when we open it, that
      // should be fine.
      this.nomenclaturalCode = this.$store.getters.getDefaultNomenCodeIRI;

      // Load the taxon concept, if present.
      const taxonConceptWrapped = new TaxonConceptWrapper(tunit.taxonConcept);
      if (taxonConceptWrapped && taxonConceptWrapped.taxonName) {
        const taxonNameWrapped = new TaxonNameWrapper(taxonConceptWrapped.taxonName);

        this.genusPart = taxonNameWrapped.genusPart;
        this.specificEpithet = taxonNameWrapped.specificEpithet;
        this.infraspecificEpithet = taxonNameWrapped.infraspecificEpithet;

        // Override the nomenclatural code if one is present.
        if (taxonNameWrapped.nomenclaturalCode) {
          this.nomenclaturalCode = taxonNameWrapped.nomenclaturalCode;
        }
      }

      // Load the specimen, if present.
      if (tunit.specimen) {
        const specimenWrapped = new SpecimenWrapper(tunit.specimen);

        this.occurrenceID = specimenWrapped.occurrenceID;
      }
    },
    /**
     * updateSpecifier() updates the underlying this.remoteSpecifier with changes made in this
     * component. We shouldn't make those changes directly in Vue, so instead we figure out the
     * correct $store.commit() method to make the change (there are different ones for phylorefs
     * and for phylogenies).
     *
     * See loadSpecifier() which does the reverse: when the underlying data changes (or when this component
     * is mounted), it loads information from this.remoteSpecifier.
     */
    updateSpecifier() {
      // We don't want to set off a (re)-loadSpecifier() while we're editing the specifier here, so set this flag.
      this.remoteSpecifierTriggeredHere = true;

      // Step 1. Create a `result` taxonomic unit. Unlike the loading code, we strictly write this out by type, so
      // if you loaded a taxonomic unit with both Specimen and Taxon information, we ONLY write out EITHER the Specimen
      // or Taxon information, based on which one is chosen in the UI.
      let result = {};
      switch (this.specifierClass) {
        case 'Taxon':
          // Set up a taxonomic unit for this taxon.
          result = this.wrappedTaxonConcept.tunit || {};
          break;

        case 'Specimen':
          // Set up a taxonomic unit for this specimen.
          result = SpecimenWrapper.fromOccurrenceID(this.occurrenceID) || {};
          break;

        case 'External reference':
          result = {
            // We store the external reference in the '@id' field.
            '@id': this.externalReference,
          };
          break;

        default:
          // Make sure we have a result, even if it's just a blank object.
          result = {};
      }

      // Add the entered verbatim label.
      if (this.verbatimLabel) {
        result.label = this.verbatimLabel;
      }

      // Update the underlying specifier, which requires a different command whether this is a specifier in a phyloref
      // or in a phylogeny.
      if (this.phyloref) {
        console.log('Updating specifier in ', this.phyloref, ' as ', result, ' differs from ', this.remoteSpecifier);
        this.$store.commit('setSpecifierProps', {
          specifier: this.remoteSpecifier,
          props: result,
        });
      } else if (this.phylogeny && this.nodeLabel) {
        console.log(
          "Updating tunit in ", this.phylogeny, " with node label ", this.nodeLabel
        );
        this.$store.commit('replaceTUnitForPhylogenyNode', {
          phylogeny: this.phylogeny,
          nodeLabel: this.nodeLabel,
          tunit: this.remoteSpecifier,
          tunit_new: result,
        });
      } else {
        console.error("Specifier has neither phyloref nor phylogeny/nodeLabel combination: ", this);
      }
    },
    /**
     * This method deletes the current taxonomic unit. There are two possible ways of doing this, depending on whether
     * it is a specifier or a taxonomic unit in a phylogeny.
     */
    deleteSpecifier() {
      const confirmed = confirm('Are you sure you want to delete this specifier?');
      if (confirmed) {
        if (this.phyloref) {
          console.log("Deleting specifier from phyloref: ", this.phyloref, this.remoteSpecifier);
          this.$store.commit('deleteSpecifier', {
            phyloref: this.phyloref,
            specifier: this.remoteSpecifier,
          });
        } else if (this.phylogeny && this.nodeLabel) {
          console.log("Deleting taxonomic unit from phylogeny: ", this.phylogeny, this.nodeLabel, this.remoteSpecifier);
          this.$store.commit('replaceTUnitForPhylogenyNode', {
            phylogeny: this.phylogeny,
            nodeLabel: this.nodeLabel,
            tunit: this.remoteSpecifier,
            delete: true,
          });
        }
      }
    },
  },
};
</script>

<style>
</style>
