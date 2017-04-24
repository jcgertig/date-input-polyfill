import './date-input-polyfill.scss';

const addPickers = () => {
  // Only initialise if there is an input with type="date" in the document
  if (typeof document.querySelectorAll !== 'undefined' && !document.querySelectorAll('input[type="date"]').length) {
    return;
  }
  // Only initialise if the current browser does not support type="date" natively
  const isDateSupported = function () {
    var i = document.createElement("input");
    i.setAttribute("type", "date");
    return i.type !== "text";
  };
  if (isDateSupported()) {
    return;
  }
  // Only now do we need to load dependencies
  const Input = require('./input.js').default;
  
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
