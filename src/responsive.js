/*
* Takes provided URL passed as argument and make screenshots of this page with several viewport sizes.
*
* Usage:
* $ casperjs screenshots.js http://example.com
*/

var casper = require("casper").create(),
    startTime = +Date.now();

function pad(number) {
  var r = String(number);
  if ( r.length === 1 ) {
    r = '0' + r;
  }
  return r;
}

if (casper.cli.args.length < 1) {
  casper
    .echo("Usage: $ casperjs responsive.js [--screenshot-path=/path/to/screenshots/] http://example.com")
    .exit(1)
  ;
}

var screenshotUrl = casper.cli.args[0],
    screenshotNow = new Date(),
    screenshotDateTime = screenshotNow.getFullYear() + pad(screenshotNow.getMonth() + 1) + pad(screenshotNow.getDate()) + '-' + pad(screenshotNow.getHours()) + pad(screenshotNow.getMinutes()) + pad(screenshotNow.getSeconds()),
    screenshotPath = casper.cli.get('screenshot-path') || 'screenshots',
    viewports = [
      {
        'name': 'smartphone-portrait',
        'viewport': {width: 320, height: 480}
      },
      {
        'name': 'smartphone-landscape',
        'viewport': {width: 480, height: 320}
      },
      {
        'name': 'tablet-portrait',
        'viewport': {width: 768, height: 1024}
      },
      {
        'name': 'tablet-landscape',
        'viewport': {width: 1024, height: 768}
      },
      {
        'name': 'desktop-standard',
        'viewport': {width: 1280, height: 1024}
      },
      {
        'name': 'desktop-wide',
        'viewport': {width: 1440, height: 900}
      }
    ];

if(screenshotUrl.indexOf('http') !== 0) {
    screenshotUrl = 'http://' + screenshotUrl;
}

casper.start(screenshotUrl, function() {
  this.echo('Current location is ' + this.getCurrentUrl(), 'info');
});

casper.each(viewports, function(casper, viewport) {
  this.then(function() {
    this.viewport(viewport.viewport.width, viewport.viewport.height);
  });
  /**
   * Reload the page on every viewport resize, because:
   * - The page may be running animations and we want to restart them
   * - The page may serve different resources depending on viewport size
   */
  this.thenOpen(screenshotUrl, function() {
    // this.wait(5000); // optionally wait (in ms)
  });
  this.then(function(){
    this.echo('Screenshot for ' + viewport.name + ' (' + viewport.viewport.width + 'x' + viewport.viewport.height + ')', 'info');
    this.capture(screenshotPath + '/' /*+ screenshotDateTime + '/'*/ + viewport.name + '-' + viewport.viewport.width + 'x' + viewport.viewport.height + '.png', {
        top: 0,
        left: 0,
        width: viewport.viewport.width,
        height: viewport.viewport.height
    });
  });
});

casper.run(function() {
    var elapsed = Date.now() - startTime;
    this.echo('Finished in ' + elapsed/1000 + 's', 'INFO');
    this.exit();
});
