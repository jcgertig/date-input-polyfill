import './date-input-polyfill.scss';
import Input from './input.js';

const addPickers = () => {
  Input.addPickerToOtherInputs();
  // Check if type="date" is supported.
  if(!Input.supportsDateInput()) {
    Input.addPickerToDateInputs();
  }
};

// Run the above code on any <input type="date"> in the document, also on dynamically created ones.
addPickers();

document.addEventListener(`DOMContentLoaded`, () => {
  addPickers();
});

// This is also on mousedown event so it will capture new inputs that might
// be added to the DOM dynamically.
document.querySelector(`body`).addEventListener(`mousedown`, () => {
  addPickers();
});

// Run the above code after a custom event has fired
document.querySelector(`body`).addEventListener(`addDateInputPolyfillPickers`, () => {
  addPickers();
});
