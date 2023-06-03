## Technical Setup and Intended Usage

The What's Viz project is built using a combination of technologies and libraries. The project utilizes Create React App as the base framework and TypeScript as the programming language. It also incorporates various external libraries and tools to achieve the desired functionality. The following sections outline the technical setup and provide information on how to use the project effectively.

### Technologies and Libraries

The project relies on the following technologies and libraries:

- **Whatsmeow**: A WhatsApp Web API library, available at [https://github.com/tulir/whatsmeow](https://github.com/tulir/whatsmeow), which enables interaction with the WhatsApp API for message retrieval.
- **SQL.js**: A JavaScript implementation of SQLite, accessible at [https://github.com/sql-js](https://github.com/sql-js). It allows the project to perform SQL queries on the retrieved WhatsApp messages.
- **Go**: The Go programming language, found at [https://github.com/golang/go](https://github.com/golang/go), is used to develop the code compiled to WASM that handles the WhatsApp API interaction.
- **Node.js**: The Node.js runtime, available at [https://github.com/nodejs/node](https://github.com/nodejs/node), powers the project's development and package management.
- **React**: The React library, located at [https://github.com/facebook/react](https://github.com/facebook/react), is the foundation of the project's frontend user interface, enabling the creation of interactive and reusable components.
- **React-Bootstrap**: A UI framework based on Bootstrap, found at [https://github.com/react-bootstrap/react-bootstrap](https://github.com/react-bootstrap/react-bootstrap), which provides pre-built React components for a responsive and visually appealing design.
- **D3.js**: A powerful JavaScript library for data visualization, accessible at [https://github.com/d3/d3](https://github.com/d3/d3), used to create dynamic and interactive visualizations of the WhatsApp message data.
- **d3Cloud**: A D3.js plugin, available at [https://github.com/jasondavies/d3-cloud](https://github.com/jasondavies/d3-cloud), used specifically for generating the word cloud in the project.
- **natural**: A natural language processing library for Node.js, located at [https://github.com/NaturalNode/natural](https://github.com/NaturalNode/natural), which provides utilities for tasks language detection for its coloration.

### Project Structure

The project follows a specific folder structure to organize its code and resources. Here's a brief overview of the main folders:

- **config**: Contains the webpack configuration files for the project, including default configurations for Create React App with adjustments for the utilized libraries.
- **public**: Holds the index.html file, favicon, and compiled WebAssembly code for the WhatsApp API interaction. Additional files in this folder include the manifest.json and robots.txt.
- **scripts**: Includes scripts for development and deployment purposes.
- **wasm**: Contains all the Go code compiled to WebAssembly for the WhatsApp API interaction.
- **src**: Contains the main source code of the project, including React components, hooks, and utility functions. The key subdirectories are described below:

  - **components**: Houses the React components responsible for different parts of the project's user interface. Each component serves a specific purpose and should be self-explanatory.
  - **hooks**: Contains a custom React hook that facilitate the integration of D3.js visualizations with the React framework.
  - **LoadWasm**: Includes the code responsible for loading the WebAssembly module for WhatsApp API interaction.
  - **pages**: Contains React components representing the various pages of the project.
  - **state**: Provides type definitions for the relevant data types used in the project's state management.
  - **utils**: Contains utility functions utilized throughout the project, including stop word filters and language coloration code.

### Development Setup

To set up the project for development and start the development server, follow these steps:

#### Prerequisites for Compiling

- Make sure that Go is installed on your development machine (tested with Go 1.19.1) and node version v18.15.0.
- Configure WebAssembly in your IDE. Refer to the following guides for instructions on configuring WebAssembly in popular IDEs:
  - VS Code guide: [https://egghead.io/lessons/go-configure-go-build-constraints-in-vs-code-to-work-with-webassembly](https://egghead.io/lessons/go-configure-go-build-constraints-in-vs-code-to-work-with-webassembly)
  - IntelliJ guide: [https://www.jetbrains.com/help/go/webassembly-project.html](https://www.jetbrains.com/help/go/webassembly-project.html)

#### Pull Submodules and Apply Diffs

Due to significant modifications made to some of the projects this project depends on, you need to perform the following steps after cloning the repository:

1. Run the command `git submodule update --init --recursive` to fetch the correct submodule data.
2. Navigate to the `wasm/whatsmeow` directory and execute `git apply ../whatsmeowDiff.diff` to apply the necessary changes.

#### Install Dependencies

To install the project's dependencies, run `npm install` from the root folder of the project (`wa-visualization`). This command will download and install all the required libraries and tools.

#### Available Scripts

The following scripts are available for running various tasks within the project:

- **`npm start`**: Launches the development server, enabling you to preview the application in the browser. Open [http://localhost:3000/project-2023-what-s-viz/](http://localhost:3000/project-2023-what-s-viz/) to access the application. The page will automatically reload whenever you make edits, and any lint errors will be displayed in the console.
- **`npm run build`**: Builds the application for production, generating optimized and minified files in the `build` folder. The build process includes bundling React in production mode and optimizing performance.
- **`npm run deploy`**: Builds the application and deploys it to the gh-pages branch of the repository using your Git account. After a few minutes, the deployed application will be accessible at [https://com-480-data-visualization.github.io/project-2023-what-s-viz/](https://com-480-data-visualization.github.io/project-2023-what-s-viz/).

By following these steps and utilizing the available scripts, you can effectively set up the project for development, preview it in the browser, and build it for production or deployment purposes.

### N.B:

Please note that currently, the project do not work on vanilla windows, if you use that OS you can install WSL and act as a linux user (Also note that for development you should put the project in the [// root of WSL otherwise continuous development will not be possible](https://stackoverflow.com/questions/60354594/wsl-2-vs-code%C2%B4s-npm-scritps-doen%C2%B4t-refresh-when-creating-a-new-script-in-packag))
