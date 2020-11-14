// import '../styles/globals.css'
import App from "next/app";
import Head from "next/head";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";

import { Provider, TitleBar } from "@shopify/app-bridge-react";
// App Bridge lets you embed your app directly inside the Shopify Admin and Shopify POS https://shopify.dev/tools/app-bridge
// App Bridge React provides access to the App Bridge client app instance using the React Context API. https://shopify.dev/tools/app-bridge/react-components/provider#accessing-the-app-bridge-client-directly

import Cookies from "js-cookie";
// js api for handling cookies
// https://github.com/js-cookie/js-cookie

import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
// Apollo is a platform for building a data graph, a communication layer that seamlessly connects your application clients (such as React and iOS apps) to your back-end services. https://www.apollographql.com/docs
// The ApolloProvider component leverages React's Context API to make a configured Apollo Client instance available throughout a React component tree. https://www.apollographql.com/docs/react/api/react/hooks/#apolloprovider
// Context provides a way to pass data through the component tree without having to pass props down manually at every level. https://reactjs.org/docs/context.html
// The ApolloClient class encapsulates Apollo's core client-side API -- it backs all available view-layer integrations (React, iOS, and so on). https://www.apollographql.com/docs/react/api/core/ApolloClient/#gatsby-focus-wrapper
// InMemoryCache outputs query result data object (optionally typed by QueryType) or null if no matching data can be found. https://www.apollographql.com/docs/react/api/cache/InMemoryCache/#gatsby-focus-wrapper Apollo Client stores the results of its GraphQL queries in a normalized, in-memory cache. This enables your client to respond to future queries for the same data without sending unnecessary network requests. https://www.apollographql.com/docs/react/caching/cache-configuration/
// TitleBar -- When used with embedded app functionality, the Polaris <Page> component still renders important layout elements. App Bridge React’s <TitleBar> does not. Because of this, the recommended migration path is to keep the <Page> element, but pass its props to <TitleBar> instead.
// https://shopify.dev/tools/app-bridge/react-components/titlebar

const client = new ApolloClient({
  uri: "/graphql",
  fetchOptions: {
    credentials: 'include'
  },
  cache: new InMemoryCache()
});


class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props; // wtf is this?

    // config is passed to App Bridge React's Provider
    // shopOrigin is set in server.js
    const config = {
      apiKey: SHOPIFY_API_KEY,
      shopOrigin: Cookies.get("shopOrigin"),
      forceRedirect: true,
    };

    // appbridge Provider > polaris AppProvider????
    // App Bridge React is fully compatible with Polaris. To use them together, wrap your app in both Polaris’s <AppProvider> component and App Bridge React’s <Provider> component. 
    // Pass the config object containing the apiKey and shopOrigin values to the App Bridge React <Provider> config prop. Don't pass the apiKey or shopOrigin values to the Polaris <AppProvider> component.
    // Provider > Titlebar
    // https://shopify.dev/tools/app-bridge/react-components/provider


    // my modifications
    // return (
    //   <React.Fragment>
    //     <Head>
    //       <title>App Paige!</title>
    //       <meta charSet="utf-8" />
    //     </Head>

    //     <AppProvider i18n={translations}>
    //       <Provider config={config}>
    //         <ApolloProvider client={client}>
    //           <Component {...pageProps} />
    //         </ApolloProvider>
    //         <TitleBar title="Dashboard" />
    //       </Provider>
    //     </AppProvider>

    //   </React.Fragment>
    // );

      // from the course
    return (
      <React.Fragment>
        <Head>
          <title>App Paige!</title>
          <meta charSet="utf-8" />
        </Head>
        <Provider config={config}>
          <AppProvider i18n={translations}>
            <ApolloProvider client={client}>
              <Component {...pageProps} />
            </ApolloProvider>
          </AppProvider>

          <TitleBar
            title="Dashboard"
          />
        </Provider>
      </React.Fragment>
    );    
  }
}

export default MyApp;
