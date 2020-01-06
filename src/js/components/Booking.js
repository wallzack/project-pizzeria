import {select, templates, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(bookingWidget){
    const thisBooking = this;

    thisBooking.reservation = [];

    thisBooking.render(bookingWidget);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.pickTable();
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);


    const params = {
      booking: [
        startDateParam,
        endDateParam,

      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };
    // console.log('getData params', params);

    const urls = {
      booking:        settings.db.url + '/' + settings.db.booking  + '?' + params.booking.join('&'),
      eventsCurrent:  settings.db.url + '/' + settings.db.event    + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:   settings.db.url + '/' + settings.db.event    + '?' + params.eventsRepeat.join('&'),
    };
    // console.log('Urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        // console.log('booking', bookings);
        // console.log('one time event', eventsCurrent);
        // console.log('cycle event', eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    // console.log('booking booked: ', thisBooking.booked);
    thisBooking.updateDOM();
    thisBooking.rangeSliderColor();

  }

  rangeSliderColor() {
    const thisBooking = this;

    const bookedHours = thisBooking.booked[thisBooking.date];
    const sliderDataColors = [];

    thisBooking.dom.rangeSlider = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.slider);

    const slider = thisBooking.dom.rangeSlider;

    for (let bookedHour in bookedHours) {
      const firstOfInterval = ((bookedHour - 12) * 100) / 12;
      const secondOfInterval = (((bookedHour - 12) + .5) * 100) / 12;
      if (bookedHour < 24) {
        if (bookedHours[bookedHour].length <= 1) {
          sliderDataColors.push('/*' + bookedHour + '*/green ' + firstOfInterval + '%, green ' + secondOfInterval + '%');
        } else if (bookedHours[bookedHour].length === 2) {
          sliderDataColors.push('/*' + bookedHour + '*/orange ' + firstOfInterval + '%, orange ' + secondOfInterval + '% ');
        } else if (bookedHours[bookedHour].length === 3) {
          sliderDataColors.push('/*' + bookedHour + '*/red ' + firstOfInterval + '%, red ' + secondOfInterval + '%');
        }
      }
    }
    sliderDataColors.sort();
    const greenOrangeRedString = sliderDataColors.join();
    slider.style.background = 'linear-gradient(to right, ' + greenOrangeRedString + ')';
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);



    for(let hourBlock = startHour ; hourBlock < startHour + duration; hourBlock += 0.5){

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  pickTable() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables){
      table.addEventListener('click', function(){

        table.classList.toggle(classNames.booking.tableBooked);
        thisBooking.tableId = table.getAttribute(settings.booking.tableIdAttribute);

      });
    }

  }

  sendBooked(){

    const thisBooking = this;
    // console.log(thisBooking.booked);
    const url = settings.db.url + '/' + settings.db.booking;
    const payload = {
      datePicked: thisBooking.datePicker.correctValue, //
      hourPicked: thisBooking.hourPicker.value,
      bookPhone: thisBooking.dom.inputPhone.value, //
      bookAddress: thisBooking.dom.inputAddress.value, //
      bookHourAmount: thisBooking.hoursAmount.value,
      bookPeopleAmount: thisBooking.peopleAmount.value,
      starters: [],
      table: [],
    };
    // console.log(payload);

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        payload.starters.push(starter.value);
      }
    }

    for (let table of thisBooking.dom.tables) {
      if (table.classList.contains(classNames.booking.tableBooked)) {
        thisBooking.tableId = table.getAttribute(settings.booking.tableIdAttribute);

        if (!isNaN(thisBooking.tableId)) {
          thisBooking.tableId = parseInt(thisBooking.tableId);
        }
        payload.table.push(thisBooking.tableId);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
        // eslint-disable-next-line no-unused-vars
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse: ', parsedResponse);
        thisBooking.makeBooked(payload.datePicked, payload.hourPicked, payload.bookHourAmount, payload.table);

        console.log(payload.datePicked);
        // console.log(payload.hourPicked);
        // console.log(payload.bookHourAmount);
        // console.log(payload.table);
      });

  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(!allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) > -1
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
    thisBooking.rangeSliderColor();
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.inputPhone = thisBooking.dom.wrapper.querySelector(select.booking.bookPhone);
    thisBooking.dom.inputAddress = thisBooking.dom.wrapper.querySelector(select.booking.bookAddress);
    thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.bookTable);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);

    // console.log(thisBooking.dom.datePicker);
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.submit.addEventListener('click', function(){
      event.preventDefault();
      thisBooking.sendBooked();
    });
  }
}
export default Booking;

