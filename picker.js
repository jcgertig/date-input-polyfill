class Picker {
  constructor() {
    // This is a singleton.
    if(window.thePicker) {
      return window.thePicker;
    }

    this.date = new Date();
    this.input = null;
    this.isOpen = false;

    // The picker element. Unique tag name attempts to protect against
    // generic selectors.
    this.container = document.createElement(`date-input-polyfill`);

    // Add controls.
    // Year picker.
    this.year = document.createElement(`select`);
    Picker.createRangeSelect(
      this.year,
      1890, // oldest person alive born in 1894
      this.date.getFullYear() + 20
    );
    this.year.className = `yearSelect`;
    this.year.addEventListener(`change`, ()=> {
      this.date.setYear(this.year.value);
      this.refreshDaysMatrix();
    });
    const yearWrapper = document.createElement(`span`);
    yearWrapper.className = `yearSelect-wrapper`;
    yearWrapper.appendChild(this.year);
    this.container.appendChild(yearWrapper);

    // Month picker.
    this.month = document.createElement(`select`);
    this.month.className = `monthSelect`;
    this.month.addEventListener(`change`, ()=> {
      this.date.setMonth(this.month.value);
      this.refreshDaysMatrix();
    });
    const monthWrapper = document.createElement(`span`);
    monthWrapper.className = `monthSelect-wrapper`;
    monthWrapper.appendChild(this.month);
    this.container.appendChild(monthWrapper);

    // Today button.
    this.today = document.createElement(`button`);
    this.today.textContent = `Today`;
    this.today.addEventListener(`click`, ()=> {
      const today = new Date();
      this.date = new Date(
        `${
          today.getFullYear()
        }/${
          `0${today.getMonth()+1}`.slice(-2)
        }/${
          `0${today.getDate()}`.slice(-2)
        }`
      );
      this.setInput();
    });
    this.container.appendChild(this.today);

    // Setup unchanging DOM for days matrix.
    const daysMatrix = document.createElement(`table`);
    this.daysHead = document.createElement(`thead`);
    this.days = document.createElement(`tbody`);

    // THIS IS THE BIG PART.
    // When the user clicks a day, set that day as the date.
    // Uses event delegation.
    this.days.addEventListener(`click`, e=> {
      const tgt = e.target;

      if(!tgt.hasAttribute(`data-day`)) {
        return false;
      }

      const curSel = this.days.querySelector(`[data-selected]`);
      if(curSel) {
        curSel.removeAttribute(`data-selected`);
      }
      tgt.setAttribute(`data-selected`, ``);

      this.date.setDate(parseInt(tgt.textContent));
      this.setInput();
    });

    daysMatrix.appendChild(this.daysHead);
    daysMatrix.appendChild(this.days);
    this.container.appendChild(daysMatrix);

    this.hide();
    document.body.appendChild(this.container);

    this.removeClickOut = e => {
      if(this.isOpen) {
        let el = e.target;
        let isPicker = el === this.container || el === this.input;
        while(!isPicker && (el = el.parentNode)) {
          isPicker = el === this.container;
        }
        ((e.target.getAttribute(`type`) !== `date` && !isPicker) || !isPicker)
          && this.hide();
      }
    };

    this.removeBlur = e => {
      if(this.isOpen) {
        this.hide();
      }
    };
  }

  // Hide.
  hide() {
    this.container.setAttribute(`data-open`, this.isOpen = false);
    // Close the picker when clicking outside of a date input or picker.
    if(this.input) { this.input.blur() }
    document.removeEventListener(`mousedown`, this.removeClickOut);
    document.removeEventListener(`touchstart`, this.removeClickOut);
  }

  // Show.
  show() {
    this.container.setAttribute(`data-open`, this.isOpen = true);
    // Close the picker when clicking outside of a date input or picker.
    setTimeout(()=>{
      document.addEventListener(`mousedown`, this.removeClickOut);
      document.addEventListener(`touchstart`, this.removeClickOut);
    }, 500);

    // when used in a single-page app  or otherwise,
    // hide datepicker when the browser's back button is pressed
    window.onpopstate = () => {
      this.hide();
    }
  }

  // Position picker below element. Align to element's right edge.
  goto(element) {
    const rekt = element.getBoundingClientRect();
    this.container.style.top = `${
      rekt.top + rekt.height
      + (document.documentElement.scrollTop || document.body.scrollTop)
      + 3
    }px`;

    const contRekt = this.container.getBoundingClientRect();
    const width = contRekt.width ? contRekt.width : 280;

    const classWithOutPos = () => {
      return this.container.className
        .replace(`polyfill-left-aligned`, ``)
        .replace(`polyfill-right-aligned`, ``)
        .replace(/\s+/g,` `).trim();
    };

    let base = rekt.right - width;
    if(rekt.right < width) {
      base = rekt.left;
      this.container.className = `${classWithOutPos()} polyfill-left-aligned`;
    } else {
      this.container.className = `${classWithOutPos()} polyfill-right-aligned`;
    }
    this.container.style.left = `${
      base
      + (document.documentElement.scrollLeft || document.body.scrollLeft)
    }px`;
    this.show();
  }

  // Initiate I/O with given date input.
  attachTo(input) {
    if(input === this.input && this.isOpen) {
      return false;
    }

    this.input = input;
    this.refreshLocale();
    this.sync();
    this.goto(this.input);
    return true;
  }

  // Match picker date with input date.
  sync() {
    // fixes bug where an empty calendar appears if year is missing from keyboard input
    if (!isNaN(Date.parse(this.input.valueAsDate))) {
      this.date = Picker.absoluteDate(this.input.valueAsDate);
    } else {
      this.date = new Date();
    }

    this.year.value = this.date.getFullYear();
    this.month.value = this.date.getMonth();
    this.refreshDaysMatrix();
  }

  // Match input date with picker date.
  setInput() {
    this.input.valueAsDate = this.date;
    this.input.focus();
    setTimeout(()=> { // IE wouldn't hide, so in a timeout you go.
      this.hide();
    }, 100);

    this.pingInput();
  }

  refreshLocale() {
    if(this.locale === this.input.locale) {
      return false;
    }

    this.locale = this.input.locale;

    this.today.textContent = this.locale.today || `Today`;

    const daysHeadHTML = [`<tr>`];
    for(let i = 0, len = this.locale.days.length; i < len; ++i) {
      daysHeadHTML.push(`<th scope="col">${this.locale.days[i]}</th>`);
    }
    this.daysHead.innerHTML = daysHeadHTML.join(``);

    Picker.createRangeSelect(
      this.month,
      0,
      11,
      this.locale.months
    );
  }

  refreshDaysMatrix() {
    this.refreshLocale();

    // Determine days for this month and year,
    // as well as on which weekdays they lie.
    const year = this.date.getFullYear(); // Get the year (2016).
    const month = this.date.getMonth(); // Get the month number (0-11).
    const startDay = new Date(year, month, 1).getDay(); // First weekday of month (0-6).
    const maxDays = new Date(
      this.date.getFullYear(),
      month + 1,
      0
    ).getDate(); // Get days in month (1-31).

    // The input's current date.
    const selDate = Picker.absoluteDate(this.input.valueAsDate) || false;

    // Are we in the input's currently-selected month and year?
    const selMatrix =
      selDate
      && year === selDate.getFullYear()
      && month === selDate.getMonth();

    // Populate days matrix.
    const matrixHTML = [];
    for(let i = 0; i < maxDays + startDay; ++i) {
      // Add a row every 7 days.
      if(i % 7 === 0) {
        matrixHTML.push(`
          ${i !== 0 ? `</tr>` : ``}
          <tr>
        `);
      }

      // Add new column.
      // If no days from this month in this column, it will be empty.
      if(i + 1 <= startDay) {
        matrixHTML.push(`<td></td>`);
        continue;
      }

      // Populate day number.
      const dayNum = i + 1 - startDay;
      const selected = selMatrix && selDate.getDate() === dayNum;

      matrixHTML.push(
        `<td data-day ${selected ? `data-selected` : ``}>
          ${dayNum}
        </td>`
      );
    }

    this.days.innerHTML = matrixHTML.join(``);
  }

  pingInput() {
    // Dispatch DOM events to the input.
    let inputEvent;
    let changeEvent;

    // Modern event creation.
    try {
      inputEvent = new Event(`input`, {bubbles: true, cancelable: false});
      changeEvent = new Event(`change`, {bubbles: true, cancelable: false});
    }
    // Old-fashioned way.
    catch(e) {
      inputEvent = document.createEvent(`KeyboardEvent`);
      inputEvent.initEvent(`input`, true, false);
      changeEvent = document.createEvent(`KeyboardEvent`);
      changeEvent.initEvent(`change`, true, false);
    }

    this.input.dispatchEvent(inputEvent);
    this.input.dispatchEvent(changeEvent);
  }

  static createRangeSelect(theSelect, min, max, namesArray) {
    theSelect.innerHTML = ``;

    for(let i = min; i <= max; ++i) {
      const aOption = document.createElement(`option`);
      theSelect.appendChild(aOption);

      const theText = namesArray ? namesArray[i - min] : i;

      aOption.text = theText;
      aOption.value = i;
    }

    return theSelect;
  }

  static absoluteDate(date) {
    return date && new Date(date.getTime() + date.getTimezoneOffset()*60*1000);
  }
}

window.thePicker = new Picker();

export default window.thePicker;
