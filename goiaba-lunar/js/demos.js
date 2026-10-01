import { setupCommissionMap } from './commission.js';
import { setupCindraValley } from './cindra.js';
import { setupMangue } from './mangue.js';

export function setupDemos() {
  setupCindraValley();
  setupCommissionMap();
  setupMangue();
}
