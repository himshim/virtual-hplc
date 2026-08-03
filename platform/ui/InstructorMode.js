/**
 * InstructorMode.js — Instructor & Faculty Classroom Demonstration Mode
 *
 * Provides parameter freezing, answer key reveal, and instant classroom demo resets.
 */

export class InstructorMode {
  constructor() {
    this.enabled = false;
    this.locked = false;
  }

  toggleInstructorControls() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  lockParameters(inputs = []) {
    this.locked = true;
    inputs.forEach(input => {
      if (input) input.disabled = true;
    });
  }

  unlockParameters(inputs = []) {
    this.locked = false;
    inputs.forEach(input => {
      if (input) input.disabled = false;
    });
  }
}

export const instructorModeInstance = new InstructorMode();
