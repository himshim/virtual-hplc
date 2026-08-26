/**
 * registry.js — UV-Vis Data Repository & Asset Registry
 *
 * Manifest-driven asset registry strictly local to instruments/uvvis/data/.
 * Follows Rule of Two: zero platform abstractions until HPLC/GC adopt data patterns.
 */

import MANIFEST from './manifest.json' with { type: 'json' };

// Samples
import paracetamol        from './samples/paracetamol.json'        with { type: 'json' };
import caffeine           from './samples/caffeine.json'           with { type: 'json' };
import aspirin            from './samples/aspirin.json'            with { type: 'json' };
import kmno4              from './samples/kmno4.json'              with { type: 'json' };
import riboflavin         from './samples/riboflavin.json'         with { type: 'json' };
import vitamin_c          from './samples/vitamin_c.json'          with { type: 'json' };
import dna                from './samples/dna.json'                with { type: 'json' };
import nadh               from './samples/nadh.json'               with { type: 'json' };
import tryptophan         from './samples/tryptophan.json'         with { type: 'json' };
import quinine            from './samples/quinine.json'            with { type: 'json' };
import phenol_red         from './samples/phenol_red.json'         with { type: 'json' };
import methylene_blue     from './samples/methylene_blue.json'     with { type: 'json' };
import metronidazole      from './samples/metronidazole.json'      with { type: 'json' };
import ibuprofen          from './samples/ibuprofen.json'          with { type: 'json' };
import diclofenac_sodium  from './samples/diclofenac_sodium.json'  with { type: 'json' };
import ciprofloxacin      from './samples/ciprofloxacin.json'      with { type: 'json' };
import theophylline       from './samples/theophylline.json'       with { type: 'json' };
import copper_sulfate     from './samples/copper_sulfate.json'     with { type: 'json' };

// Solvents
import water        from './solvents/water.json'        with { type: 'json' };
import methanol     from './solvents/methanol.json'     with { type: 'json' };
import ethanol      from './solvents/ethanol.json'      with { type: 'json' };
import acetonitrile from './solvents/acetonitrile.json' with { type: 'json' };
import acetone      from './solvents/acetone.json'      with { type: 'json' };
import hexane       from './solvents/hexane.json'       with { type: 'json' };
import chloroform   from './solvents/chloroform.json'   with { type: 'json' };
import dmso         from './solvents/dmso.json'         with { type: 'json' };
import dcm          from './solvents/dcm.json'          with { type: 'json' };
import isopropanol  from './solvents/isopropanol.json'  with { type: 'json' };
import ether        from './solvents/ether.json'        with { type: 'json' };

// Standards
import holmium_oxide        from './standards/holmium_oxide.json'        with { type: 'json' };
import potassium_dichromate from './standards/potassium_dichromate.json' with { type: 'json' };
import sodium_iodide        from './standards/sodium_iodide.json'        with { type: 'json' };
import air_blank            from './standards/air_blank.json'            with { type: 'json' };

const SAMPLES_MAP = {
  paracetamol,
  caffeine,
  aspirin,
  kmno4,
  riboflavin,
  vitamin_c,
  dna,
  nadh,
  tryptophan,
  quinine,
  phenol_red,
  methylene_blue,
  metronidazole,
  ibuprofen,
  diclofenac_sodium,
  ciprofloxacin,
  theophylline,
  copper_sulfate
};

const SOLVENTS_MAP = {
  water,
  methanol,
  ethanol,
  acetonitrile,
  acetone,
  hexane,
  chloroform,
  dmso,
  dcm,
  isopropanol,
  ether
};

const STANDARDS_MAP = {
  holmium_oxide,
  potassium_dichromate,
  sodium_iodide,
  air_blank
};

export class UvVisDataRegistry {
  static getManifest() {
    return MANIFEST;
  }

  static getDefaultSampleKey() {
    return MANIFEST.defaultSample || 'paracetamol';
  }

  static getDefaultSolventKey() {
    return MANIFEST.defaultSolvent || 'water';
  }

  static getSample(id) {
    return SAMPLES_MAP[id] || SAMPLES_MAP[UvVisDataRegistry.getDefaultSampleKey()];
  }

  static getSolvent(id) {
    return SOLVENTS_MAP[id] || SOLVENTS_MAP[UvVisDataRegistry.getDefaultSolventKey()];
  }

  static getStandard(id) {
    return STANDARDS_MAP[id] || STANDARDS_MAP.holmium_oxide;
  }

  static listSamples() {
    return (MANIFEST.samples || Object.keys(SAMPLES_MAP))
      .map(id => SAMPLES_MAP[id])
      .filter(Boolean);
  }

  static listSolvents() {
    return (MANIFEST.solvents || Object.keys(SOLVENTS_MAP))
      .map(id => SOLVENTS_MAP[id])
      .filter(Boolean);
  }

  static listStandards() {
    return (MANIFEST.standards || Object.keys(STANDARDS_MAP))
      .map(id => STANDARDS_MAP[id])
      .filter(Boolean);
  }
}

// Re-export legacy databases for 100% backward compatibility during phased migration
export const CHROMOPHORE_DATABASE = SAMPLES_MAP;
export const SOLVENT_DATABASE     = SOLVENTS_MAP;
