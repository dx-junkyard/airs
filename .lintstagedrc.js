const path = require('path');

const buildEslintCommand = (filenames) =>
  `npx eslint --max-warnings=0 --fix ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' ')}`;

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
  '*.{css,scss}': ['npx stylelint src/**/*.{css,scss,sass} --fix'],
  '*': ['npx prettier --write "src/**/*.{js,jsx,ts,tsx,json}"'],
};
