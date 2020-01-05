import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';
// import Home from './components/Home.js';


const app = {

  initBooking: function(){
    const thisApp = this;
    const bookingWidget = document.querySelector(select.containerOf.booking);

    thisApp.booking = new Booking(bookingWidget);
  },

  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);


    const idFromHash = window.location.hash.replace('#/', '');
    // console.log('idFromHash', idFromHash);

    let pageMatchingHash = thisApp.pages[0].id;

    for(let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }

    thisApp.activatePage(pageMatchingHash);

    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        const clickedElement = this;
        event.preventDefault();

        /* get page id from href attribute */
        const id = clickedElement.getAttribute('href').replace('#', '');

        /* run thisApp.activatePage with this id */
        thisApp.activatePage(id);

        /* change URL hash */
        window.location.hash = '#/' + id;
      });
    }
  },


  activatePage: function(pageId){
    const thisApp = this;

    /* add classs "active" to matching pages, remove from non-matching */
    for(let page of thisApp.pages){
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }
    /* add classs "active" to matching links, remove from non-matching */
    for(let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active,
        link.getAttribute('href') == '#' + pageId
      );
    }
  },

  initMenu: function(){
    const thisApp = this;
    //console.log('thisApp.data:', thisApp.data);

    for(let productData in thisApp.data.products){
      // new Product(productData, thisApp.data.products[productData]); //zmienione w module 9.7 na:
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);

    }
  },

  initCart: function(){
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event){
      app.cart.add(event.detail.product);
    });
  },

  initData: function(){
    const thisApp = this;

    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.product;

    fetch(url)
      .then(function(rawResponse){
        return rawResponse.json();
      })
      .then(function(parsedResponse){
        // console.log('parsedResponse', parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;
        /* execute initMenu method */
        thisApp.initMenu();
      });
    // console.log('thisApp.data', JSON.stringify(thisApp.data));
  },


  initCarousel() {
    // eslint-disable-next-line no-unused-vars
    const thisApp = this;
    const review = [];

    review[0] = {
      title: 'Bombastico pizza',
      content: 'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum dolor sit amet, consectetur adipiscing elit.',
      author: 'Zenon M.',

    };
    review[1] = {
      title: 'Fantastico',
      content: 'Lorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum dolor sit amet',
      author: 'Maryla R.',
    };
    review[2] = {
      title: 'Szok i niedowierzanie',
      content: 'Mauris maximus ipsuLorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum dolor sit ametLorem ipsum dolor sit ametm sed.',
      author: 'Krzysztof K.',
    };
    let i = 0;
    // console.log(review[0]);
    // console.log(review);

    const dots = document.querySelectorAll('.carousel-dots i');
    // console.log(dots);

    function changeTitle() {

      const title = document.querySelector('.review-title');
      // console.log(title);
      const content = document.querySelector('.review-content');
      // console.log(content);
      const author = document.querySelector('.review-author');
      // console.log(author);

      for (let dot of dots) {
        if (dot.id == i + 1) { // +1 ??
          // console.log(dot.id);
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
        title.innerHTML = review[i].title;
        content.innerHTML = review[i].content;
        author.innerHTML = review[i].author;
      }

      if (i < review.length - 1) {
        i++;
      } else {
        i = 0;
      }
    }
    changeTitle();

    setInterval(() => {
      changeTitle();
    }, 3000);

  },

  init: function(){
    const thisApp = this;
    // console.log('*** App starting ***');
    // console.log('thisApp:', thisApp);
    // console.log('classNames:', classNames);
    // console.log('settings:', settings);
    // console.log('templates:', templates);

    thisApp.initPages();

    thisApp.initData();
    // thisApp.initMenu(); //deleted in module 9.7
    thisApp.initCart();

    thisApp.initBooking();

    thisApp.initCarousel();

    // thisApp.initHome();
  },
};

app.init();

