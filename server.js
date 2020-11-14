// import 'isomorphic-fetch';
const Koa = require("koa"); // Koa sever, all it does is listen
const next = require("next"); // next.js to generate static files
const Router = require("@koa/router"); // router to route/handle requests

// koa-shopify-webhooks gotcha -- Make sure to install a fetch polyfill, since internally we use it to make HTTP requests.
// https://www.npmjs.com/package/@shopify/koa-shopify-webhooks
require('isomorphic-fetch'); // Fetch for node and Browserify. This module will enable you to use fetch in your Node code in a cross-browser compliant fashion.

// const bodyParser = require('koa-bodyParser');
const json = require('koa-json'); // JSON pretty-printed response middleware. Also converts node object streams to binary. https://github.com/koajs/json
const dotenv = require('dotenv'); // gets shopify api keys
dotenv.config(); // as early as possible in your application, require and configure dotenv.
// The process object is a global that provides information about, and control over, the current Node.js process. As a global, it is always available to Node.js applications without using require().
const port = parseInt(process.env.PORT, 10) || 3000; // parses a string argument and returns an integer of the specified radix
const dev = process.env.NODE_ENV !== "production"; // true
const app = next({ dev }); // dev: true; custom server https://nextjs.org/docs/advanced-features/custom-server

// app.getRequestHandler returns a request handler which we can use to parse all HTTP requests.
// a handleRequest object does just that, handles requests
// https://stackoverflow.com/questions/59971672/custom-next-js-difference-between-getrequesthandler-and-render-functions
// https://github.com/vercel/next.js/blob/canary/packages/next/next-server/server/next-server.ts
const handle = app.getRequestHandler();

const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth'); // https://www.npmjs.com/package/@shopify/koa-shopify-auth/v/2.0.5
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session'); // session middleware; Defaults to cookie-based sessions and supports external stores. https://github.com/koajs/session
const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY, HOST } = process.env;

// a proxy server is a server application that acts as an intermediary for client requests seeking resources from servers.
// https://www.npmjs.com/package/@shopify/koa-shopify-graphql-proxy
const {default: graphQlProxy, ApiVersion} = require('@shopify/koa-shopify-graphql-proxy'); // Attaching the middleware will proxy any requests sent to /graphql on your app to the current logged-in shop found in session.

const koaBody = require("koa-body"); // body parser middleware; Supports multipart, urlencoded, and json request bodies. https://github.com/dlau/koa-body
const serve = require("koa-static"); // wrapper for koa-send, which is a static file serving middleware. // https://github.com/koajs/static

const cors = require("@koa/cors"); // Cross-Origin Resource Sharing(CORS) for koa
// CORS means to fetch from different servers rather than just one
// origin: request Origin header
// allowMethods: GET,HEAD,PUT,POST,DELETE,PATCH
// Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any other origins (domain, protocol, or port) than its own from which a browser should permit loading of resources. https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
// The CORS mechanism supports secure cross-origin requests and data transfers between browsers and servers. Modern browsers use CORS in APIs such as XMLHttpRequest or Fetch to mitigate the risks of cross-origin HTTP requests.

const getSubscriptionUrl = require('./server/getSubscriptionUrl');
// You will make a call to the GraphQL endpoint using a POST request, it will return the confirmation_url which you can redirect users to.
// You’ll set up a getSubscriptionUrl.js file to make the call and then await that in your server file.
// https://shopify.dev/tutorials/build-a-shopify-app-with-node-and-react/charge-a-fee-using-the-billing-api

const {receiveWebhook, registerWebhook} = require('@shopify/koa-shopify-webhooks');
// Register and receive webhooks from Shopify with ease. This package was created primarily for use with @shopify/koa-shopify-auth and friends. https://www.npmjs.com/package/@shopify/koa-shopify-webhooks

// let SHOPIFY_API_KEY = '6dce6e0daae9ae004d6232870ded7dc1'
// let SHOPIFY_API_SECRET_KEY = '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'
// let HOST = 'https://sapp0.herokuapp.com'



let mockDB = [];



// app is next object
// prepare() verifies typescript, loads custom routes, and reloader, and it sets up data collection! telemetry...
// https://github.com/vercel/next.js/blob/764edc51b2ba9ae18046804d3ef9adbe0ea703a0/packages/next/server/next-dev-server.ts
app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();

  //app.use(function) or server.use(function) adds given middleware function to this application.
  server.use(json()); // koa-json middleware
  server.use(session({ secure: true, sameSite: 'none' }, server)); // require('koa-session'); // session middleware; Defaults to cookie-based sessions
  server.keys = [SHOPIFY_API_SECRET_KEY]; // app.keys= Sets signed cookie keys. These are passed to KeyGrip
  // Keygrip is a node.js module for signing and verifying data (such as cookies or URLs) through a rotating credential system, in which new server keys can be added and old ones removed regularly, without invalidating client credentials. https://github.com/crypto-utils/keygrip
  
  server.use(cors()); // CORS deals with multiple urls  

  //  A Koa Context ctx encapsulates node's request and response objects into a single object
  // A Context is created per request, and is referenced in middleware as the receiver, or the ctx identifier
  // routers are the traffic cops in internet, forwards data packets between networks
  router.get("/api/banners", koaBody(), async (ctx) => {
  // response.body= Set response body to one of the following:
  // string--written, Buffer--written, Stream--piped, Object || Array--json-stringified, null
  // If response.status has not been set, Koa will automatically set the status to 200 or 204.
    ctx.body = {
      status: 200,
      message: "All banners",
      data: mockDB
    }
    console.log('get mockDB', mockDB);
  });

  router.post("/api/banners", koaBody(), async (ctx) => {
    mockDB.unshift(ctx.request.body); // why attach to the front, why not push?
    ctx.body = {
      status: 200,
      message: "Submitted banner data",
      data: mockDB
    }
    if(mockDB.length > 0) {
      // console.log('body after', mockDB[mockDB.length - 1]);
      console.log('body after', mockDB[0]);
    }
  });

  // user sends request to server, in a json object
  // server returns reponse -- server needs url, browser, cookies, api hash key before knows how to serve client
  // when middleware invokes next(), the function suspends and passes control to the next middleware defined. https://koajs.com/
  // Middleware is software that handles communication between components and input/output, pass off that function to a middleman so developers can focus on the specific purpose of their application.
  server.use(async (ctx, next) => {
    ctx.res.statusCode = 200;
    await next();
  });

  // https://github.com/ZijianHe/koa-router#module_koa-router--Router+routes
  // router.routes ⇒ function returns router middleware which dispatches a route matching the request.
  server.use(router.routes());
  
  // Returns an authentication middleware taking up (by default) the routes /auth and /auth/callback
  // how do you get an API KEY from the user?
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_products', 'write_products', 'read_script_tags', 'write_script_tags', 'read_analytics'], // from https://shopify.dev/docs/admin-api/access-scopes

      // then routes you to root /
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;
        // found @17:43 "Setting up shopify app bridge" video
        ctx.cookies.set('shopOrigin', shop, {
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        });

        const registration = await registerWebhook({
          address: `${HOST}/webhooks/products/create`,
          topic: 'PRODUCTS_CREATE',
          accessToken,
          shop,
          apiVersion: ApiVersion.October19
        });
        
        if(registration.success) {
          console.log('registered webhook')
        } else {
          console.log('failedregistered webhook')
        }


        // ctx.redirect(`https://${shop}/admin/apps/cpsampleapp-5`);
        await getSubscriptionUrl(ctx, accessToken, shop);
        /*
          const getSubscriptionUrl = require('./server/getSubscriptionUrl');
          call to the GraphQL endpoint using a POST request
          returns the confirmation_url / redirect
          https://shopify.dev/tutorials/build-a-shopify-app-with-node-and-react/charge-a-fee-using-the-billing-api
        */
      }
    })
  )

  // static file serving middleware
  // serve = require("koa-static"); a wrapper for koa-send, which is a static file serving middleware. // https://github.com/koajs/static
  server.use(serve(__dirname + '/public'));

  // use this to tell us when a client makes changes to their data
  const shopifyWebhook = receiveWebhook({secret: SHOPIFY_API_SECRET_KEY});
  router.post('/webhooks/products/create', shopifyWebhook, ctx => {
    console.log('received website: ', ctx.state.webhook);
  })

  // graph ql proxy-- is the middleman between server app and graphql requests from clients
  // handles graphQL requests from users
  server.use(graphQlProxy({version: ApiVersion.October19}));

  // createVerifyRequest() returns a middleware to verify requests before letting them further in the chain.
  server.use(verifyRequest()); // const { verifyRequest } = require('@shopify/koa-shopify-auth');

  // this is slightly different than the async (ctx, next) middleware
  server.use(async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
    // return
  });

  // port and callback
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
