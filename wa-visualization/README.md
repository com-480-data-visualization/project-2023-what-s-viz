# WhatsApp message streaming visualizations

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) using the [typescript-golang template](https://github.com/royhadad/CRA-wasm-go-template) and then heavily modified for different things.
Other project used are [Whatsmeow](https://github.com/tulir/whatsmeow) and [SQL.js](https://github.com/sql-js), as well as a wrapper for SQL.js written to use it in Go.

- make sure you have Go installed on your machine (tested for Go 1.19.1)
- make sure to have WebAssembly configured in your IDE:
  - [VS Code guide](https://egghead.io/lessons/go-configure-go-build-constraints-in-vs-code-to-work-with-webassembly)
  - [Intellij guide](https://www.jetbrains.com/help/go/webassembly-project.html)


## To get started

These are the steps necessary to be able to run the development server.

### Pull submodules and apply diffs

Because we had to heavily modify some projects we depend on, you first have to run `git submodule update --init --recursive` after cloning this repo to get the correct submodule data.
Then afterwards go to wasm/whatsmeow and run `git apply ../whatsmeowDiff.diff` to apply the changes.

After having applied the go changes, to run the development server you need to install all dependencies; run `npm install` from this folder (wa-visualization) to download them.

Having done these steps, the following scripts should work.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
