<template>
  <div>
    <div class="card border-dark">
      <h5 class="card-header border-dark">Phyloreference collection</h5>
      <div class="card-body">
        <form>
          <!-- Curated by information -->
          <div class="form-group row">
            <label for="curator-name" class="col-form-label col-md-2">
              Curated by
            </label>
            <div class="col-md-10">
              <input
                id="curator-name"
                v-model="phyxCurator"
                type="text"
                class="form-control"
                placeholder="Curator name"
              />
              <input
                id="curator-email"
                v-model="phyxCuratorEmail"
                type="email"
                class="form-control"
                placeholder="Curator e-mail address"
              />
              <div class="input-group">
                <input
                  id="external-reference"
                  v-model="phyxCuratorORCID"
                  class="form-control"
                  placeholder="Curator ORCID"
                />
                <div class="input-group-append">
                  <a
                    class="btn btn-outline-secondary"
                    target="_blank"
                    :href="'https://orcid.org/' + phyxCuratorORCID"
                  >
                    Open in new window
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Default nomenclatural code -->
          <div class="form-group row">
            <label for="default-nomen-code" class="col-form-label col-md-2">
              Default nomenclatural code
            </label>
            <div class="col-md-10">
              <select
                id="nomen-code"
                :value="$store.getters.getDefaultNomenCodeIRI"
                class="form-control"
                @change="
                  $store.commit('setDefaultNomenCodeIRI', {
                    defaultNomenclaturalCodeIRI: $event.target.value,
                  })
                "
              >
                <option v-for="nomenCode of nomenCodes" :value="nomenCode.iri">
                  {{ nomenCode.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Checkbox for permission to save this information to browser -->
          <div class="form-group row">
            <div class="col-md-2">&nbsp;</div>
            <div class="col-md-10">
              <input
                type="checkbox"
                :checked="cookieCheckbox"
                @click="$store.commit('toggleCookieAllowed')"
              />
              Save curator information and default nomenclatural code as a
              browser cookie (currently for thirty days). If changed to
              unchecked, delete Klados cookies from your browser.
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="card border-dark mt-2">
      <h5 class="card-header border-dark">Phyloreferences in this file</h5>
      <div class="card-body p-0">
        <table class="table table-hover table-flush">
          <thead>
            <th>&nbsp;</th>
            <th>Phyloreference</th>
            <th>Type</th>
            <th>Internal specifiers</th>
            <th>External specifiers</th>
            <th v-for="(phylogeny, phylogenyIndex) of phylogenies">
              {{ getPhylogenyLabel(phylogeny) }}
            </th>
          </thead>
          <tbody>
            <tr v-if="phylorefs.length === 0" class="bg-white">
              <td :colspan="4 + phylogenies.length">
                <Center><em>No phyloreferences in this file</em></Center>
              </td>
            </tr>
            <tr v-for="(phyloref, phylorefIndex) of phylorefs">
              <td>
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="deletePhyloref(phyloref)"
                >
                  <b-icon-trash></b-icon-trash>
                </button>
              </td>
              <td>
                <a
                  href="javascript: void(0)"
                  @click="$store.commit('changeDisplay', { phyloref })"
                >
                  {{ getPhylorefLabel(phyloref) }}
                </a>
              </td>
              <td>{{ $store.getters.getPhylorefTypeDescription(phyloref) }}</td>
              <td>{{ (phyloref.internalSpecifiers || []).length }}</td>
              <td>{{ (phyloref.externalSpecifiers || []).length }}</td>
              <td v-for="(phylogeny, phylogenyIndex) of phylogenies">
                <template
                  v-if="!getPhylorefExpectedNodeLabel(phyloref, phylogeny)"
                >
                  <strong>No expected node</strong>
                  <template v-if="hasReasoningResults(phyloref)">
                    <template
                      v-if="
                        getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)
                          .length === 0
                      "
                    >
                      but <strong>did not resolve to any node</strong>
                    </template>
                    <template
                      v-else-if="
                        getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)
                          .length > 1
                      "
                    >
                      but
                      <strong
                        >resolved to multiple nodes:
                        {{
                          getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)
                        }}</strong
                      >
                    </template>
                    <template v-else>
                      and resolved to
                      {{
                        getNodeLabelsResolvedByPhyloref(
                          phyloref,
                          phylogeny
                        )[0] || "an unlabeled node"
                      }}
                    </template>

                    <template
                      v-if="$store.getters.isApomorphyBasedPhyloref(phyloref)"
                    >
                      (apomorphy-based phyloreferences cannot currently be
                      resolved)
                    </template>
                  </template>
                </template>
                <template v-else>
                  Expected to resolve to node
                  {{ getPhylorefExpectedNodeLabel(phyloref, phylogeny) }}
                  <template v-if="hasReasoningResults(phyloref)">
                    <template
                      v-if="
                        getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)
                          .length === 0
                      "
                    >
                      but <strong>did not resolve to any node</strong>
                    </template>
                    <template
                      v-else-if="
                        getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)
                          .length > 1
                      "
                    >
                      but
                      <strong
                        >resolved to multiple nodes:
                        {{
                          getNodeLabelsResolvedByPhyloref(phyloref, phylogeny)
                        }}</strong
                      >
                    </template>
                    <template v-else>
                      and resolved
                      <template
                        v-if="
                          getNodeLabelsResolvedByPhyloref(
                            phyloref,
                            phylogeny
                          )[0] ===
                          getPhylorefExpectedNodeLabel(phyloref, phylogeny)
                        "
                      >
                        correctly
                      </template>
                      <template v-else>
                        <strong>incorrectly</strong>
                      </template>
                      to
                      {{
                        getNodeLabelsResolvedByPhyloref(
                          phyloref,
                          phylogeny
                        )[0] || "an unlabeled node"
                      }}
                    </template>

                    <template
                      v-if="$store.getters.isApomorphyBasedPhyloref(phyloref)"
                    >
                      (apomorphy-based phyloreferences cannot currently be
                      resolved)
                    </template>
                  </template>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer">
        <div class="btn-group" role="group" area-label="Phyx file management">
          <button
            class="btn btn-primary"
            href="javascript:;"
            @click="$store.commit('createEmptyPhyloref')"
          >
            Add phyloreference
          </button>

          <button
            class="btn btn-secondary"
            href="javascript:;"
            @click="exportAsCSV()"
          >
            Export as CSV
          </button>
        </div>
      </div>
    </div>

    <div class="card border-dark mt-2">
      <h5 class="card-header border-dark">Phylogenies in this file</h5>
      <div class="card-body p-0">
        <table class="table table-hover table-flush">
          <thead>
            <th>&nbsp;</th>
            <th>Phylogeny</th>
            <th>Curator notes</th>
          </thead>
          <tbody>
            <tr v-if="phylogenies.length === 0" class="bg-white">
              <td :colspan="3">
                <Center><em>No phylogenies in this file</em></Center>
              </td>
            </tr>
            <tr v-for="(phylogeny, phylogenyIndex) of phylogenies">
              <td>
                <button
                  type="button"
                  class="btn btn-sm btn-danger"
                  @click="deletePhylogeny(phylogeny)"
                >
                  <b-icon-trash></b-icon-trash>
                </button>
              </td>
              <td>
                <a
                  href="javascript: void(0)"
                  @click="$store.commit('changeDisplay', { phylogeny })"
                >
                  {{ getPhylogenyLabel(phylogeny) }}
                </a>
              </td>
              <td>
                {{ phylogeny.curatorNotes }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer">
        <div class="btn-group" role="group" area-label="Phylogeny management">
          <button
            class="btn btn-primary"
            href="javascript:;"
            @click="$store.commit('createEmptyPhylogeny')"
          >
            Add phylogeny
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
 * Display a summary of the entire Phyx file.
 */

// We would normally import `csv-stringify` directly, but it uses Buffer, which is
// not implemented in browsers. We therefore need to import the browser-specific ESM
// distribution, which includes polyfills to run outside of the Node.js environment
// as described at https://csv.js.org/stringify/distributions/browser_esm/
import { stringify } from "csv-stringify/browser/esm";

import { mapState } from "vuex";
import { has, max, range } from "lodash";
import { saveAs } from "filesaver.js-npm";
import { BIconTrash } from "bootstrap-vue";
import {
  PhylorefWrapper,
  PhylogenyWrapper,
  TaxonNameWrapper,
  TaxonomicUnitWrapper,
} from "@phyloref/phyx";
import { newickParser } from "phylotree";

export default {
  name: "PhyxView",
  components: {
    BIconTrash,
  },
  computed: {
    nomenCodes: () => TaxonNameWrapper.getNomenclaturalCodes(),
    phyxCurator: {
      get() {
        return this.phyx.curator;
      },
      set(name) {
        this.$store.commit("setCurator", { name });
      },
    },
    phyxCuratorEmail: {
      get() {
        return this.phyx.curatorEmail;
      },
      set(email) {
        this.$store.commit("setCurator", { email });
      },
    },
    phyxCuratorORCID: {
      get() {
        return this.phyx.curatorORCID;
      },
      set(orcid) {
        this.$store.commit("setCurator", { orcid });
      },
    },
    cookieCheckbox() {
      return this.$store.getters.isCookieAllowed;
    },
    ...mapState({
      phyx: (state) => state.phyx.currentPhyx,
      phylorefs: (state) => state.phyx.currentPhyx.phylorefs || [],
      phylogenies: (state) => state.phyx.currentPhyx.phylogenies || [],
    }),
  },
  methods: {
    getPhylogenyLabel(phylogeny) {
      const phylogeny_label = phylogeny.label;
      if (!phylogeny_label) {
        return `Phylogeny ${this.phylogenies.indexOf(phylogeny) + 1}`;
      } else if (phylogeny_label.match(/^Phylogeny (\d+)$/)) {
        return phylogeny_label;
      } else {
        return `Phylogeny: ${phylogeny_label}`;
      }
    },
    getPhylorefLabel(phyloref) {
      return (
        new PhylorefWrapper(phyloref).label ||
        `Phyloref ${this.phylorefs.indexOf(phyloref) + 1}`
      );
    },
    hasReasoningResults(phyloref) {
      if (!has(this.$store.state.resolution.reasoningResults, "phylorefs"))
        return false;

      const phylorefURI = this.$store.getters.getPhylorefId(phyloref);
      return has(
        this.$store.state.resolution.reasoningResults.phylorefs,
        phylorefURI
      );
    },
    getPhylorefExpectedNodeLabel(phyloref, phylogeny) {
      // Return a list of nodes that a phyloreference is expected to resolve to.
      return this.$store.getters.getExpectedNodeLabel(
          phyloref,
          phylogeny,
      );
    },
    getNodesById(phylogeny, nodeId) {
      // Return all node labels with this nodeId in this phylogeny.
      let parsed;
      try {
        parsed = new PhylogenyWrapper(phylogeny).getParsedNewickWithIRIs(
            this.$store.getters.getPhylogenyId(phylogeny),
            newickParser,
        );
      } catch {
        return [];
      }

      function searchNode(node, results = []) {
        if (has(node, "@id") && node["@id"] === nodeId) {
          results.push(node);
        }
        if (has(node, "children")) {
          node.children.forEach((child) => searchNode(child, results));
        }
        return results;
      }

      if (!has(parsed, "json")) return [];
      return searchNode(parsed.json);
    },
    getNodeLabelsResolvedByPhyloref(phyloref, phylogeny) {
      // Converts node IDs to node labels, if present.
      const resolvedNodes = this.$store.getters.getResolvedNodesForPhylogeny(
        phylogeny,
        phyloref,
        false
      );

      return resolvedNodes
        .map((nodeId) => this.getNodesById(phylogeny, nodeId))
        .reduce((a, b) => a.concat(b), [])
        .map((node) => node.name || "(unlabelled)");
    },
    deletePhyloref(phyloref) {
      const warningString = `Are you sure you wish to delete phyloreference '${this.getPhylorefLabel(
        phyloref
      )}'?`;
      if (confirm(warningString)) {
        this.$store.commit("deletePhyloref", { phyloref });
      }
    },
    deletePhylogeny(phylogeny) {
      const warningString = `Are you sure you wish to delete phylogeny '${this.getPhylogenyLabel(
        phylogeny
      )}'?`;
      if (confirm(warningString)) {
        this.$store.commit("deletePhylogeny", { phylogeny });
      }
    },
    exportAsCSV() {
      // Export the phyloref summary as CSV.

      // Determine the maximum number of internal and external specifiers we will need to export.
      const phylorefs = this.phylorefs;
      const maxInternalSpecifiers = max(
        phylorefs.map((phyloref) => phyloref.internalSpecifiers.length)
      );
      const maxExternalSpecifiers = max(
        phylorefs.map((phyloref) => phyloref.externalSpecifiers.length)
      );

      // Create file header.
      const header = [
        "Phyloreference ID",
        "Label",
        "Type",
        "Definition",
        ...range(0, maxInternalSpecifiers).map(
          (_, i) => `Internal specifier ${i + 1}`
        ),
        ...range(0, maxExternalSpecifiers).map(
          (_, i) => `External specifier ${i + 1}`
        ),
        ...this.phylogenies.flatMap((phylogeny) => {
          const label = this.getPhylogenyLabel(phylogeny);
          return [`${label} expected`, `${label} actual`];
        }),
      ];

      const rows = phylorefs.map((phyloref) => {
        const wrappedPhyloref = new PhylorefWrapper(phyloref);

        return [
          this.$store.getters.getPhylorefId(phyloref),
          wrappedPhyloref.label,
          this.$store.getters.getPhylorefTypeDescription(phyloref),
          // Write out the clade definition.
          phyloref.definition || "",
          // Write out the internal specifier labels
          ...wrappedPhyloref.internalSpecifiers.map(
            (sp) => new TaxonomicUnitWrapper(sp).label
          ),
          // Write out blank cells for the remaining internal specifiers
          ...range(
            wrappedPhyloref.internalSpecifiers.length,
            maxInternalSpecifiers
          ).map(() => ""),
          // Write out the external specifier labels
          ...wrappedPhyloref.externalSpecifiers.map(
            (sp) => new TaxonomicUnitWrapper(sp).label
          ),
          // Write out blank cells for the remaining external specifiers
          ...range(
            wrappedPhyloref.externalSpecifiers.length,
            maxExternalSpecifiers
          ).map(() => ""),
          // Export phyloref expectation information.
          ...this.phylogenies.flatMap((phylogeny) => {
            const expectedNodeLabel =
              this.getPhylorefExpectedNodeLabel(phyloref, phylogeny) ||
              "(none)";

            if (!this.hasReasoningResults(phyloref))
              return [expectedNodeLabel, "(resolution not yet run)"];

            const resolvedNodes = this.getNodeLabelsResolvedByPhyloref(
              phyloref,
              phylogeny
            );

            if (resolvedNodes.length === 0)
              return [expectedNodeLabel, "(could not resolve)"];

            const resolvedNodesDescription = resolvedNodes.join("|");

            return [expectedNodeLabel, resolvedNodesDescription];
          }),
        ];
      });

      stringify([header, ...rows], (err, csv) => {
        if (err) {
          console.log("Error occurred while producing CSV:", err);
          return;
        }

        const content = [csv];
        // console.log('Content:', content);

        // Save to local hard drive.
        const filename = `${this.$store.getters.getDownloadFilenameForPhyx}.csv`;
        const csvFile = new Blob(content, { type: "text/csv;charset=utf-8" });
        // Neither Numbers.app nor Excel can read the UTF-8 BOM correctly, so we explicitly
        // turn it off.
        saveAs(csvFile, filename, { autoBom: false });
      });
    },
  },
};
</script>
