const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = (eleventyConfig) => {
    // Copy the "assets" directory to the compiled "_site" folder.
    eleventyConfig.addPassthroughCopy('assets');
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPassthroughCopy({ "images": "images" });
    eleventyConfig.addPassthroughCopy({ "stylesheets": "stylesheets" });
    eleventyConfig.addPassthroughCopy({ "CNAME": "CNAME" });
  
    return {
      dir: {
        input: './',
        output: './_site',
        layouts: './_layouts',
      },
      templateFormats: [
        'html',
        'liquid',
        'md'
      ]
    };
  };