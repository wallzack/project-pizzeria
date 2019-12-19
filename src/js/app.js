import{settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';


const app = {
  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;

    thisApp.activatePage(thisApp.page[0].id);
  },

  activatePage: function(pageId){
    const thisApp = this;

    /* add classs "active" to matching pages, remove from non-matching */
    for(let page of thisApp.pages){
      // if(page.id == pageId){
      //   page.classList.add(classNames.pages.active);
      // } else {
      //   page.classList.remove(classNames.pages.active);
      // }

      page.classList.toggle(classNames.pages.active);
    }
    /* add classs "active" to matching links, remove from non-matching */
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
        console.log('parsedResponse', parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;
        /* execute initMenu method */
        thisApp.initMenu();
      });
    console.log('thisApp.data', JSON.stringify(thisApp.data));
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
  },
};

app.init();

