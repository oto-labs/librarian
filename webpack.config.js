const path = require('path');

module.exports = {
  entry: './main.js', // Entry point of your extension
  output: {
    path: path.resolve(__dirname, 'dist'), // Output directory
    filename: 'bundle.js' // Output file
  }
  // Add additional configurations if needed
};
