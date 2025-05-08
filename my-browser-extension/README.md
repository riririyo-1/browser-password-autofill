# My Browser Extension

This project is a modern browser extension designed for automatic password filling. It features a clean and responsive user interface built with React and TypeScript, utilizing Tailwind CSS for styling.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/my-browser-extension.git
   ```
2. Navigate to the project directory:
   ```
   cd my-browser-extension
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Build the project:
   ```
   npm run build
   ```
2. Load the extension in your browser:
   - For Chrome: Go to `chrome://extensions/`, enable "Developer mode", and click "Load unpacked". Select the `public` directory.
   - For Firefox: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the `manifest.json` file in the `public` directory.

3. Click on the extension icon to open the popup and start using the password auto-fill feature.

## Features

- Modern UI with a card-style layout
- Dark mode support
- Responsive design for mobile devices
- Easy-to-use settings and dictionary management

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.