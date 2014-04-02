/*global casper:true */
var TestFW = {},
    url = casper.cli.get('url'),
    screenshotPath = casper.cli.get('screenshot-path') || 'screenshots',
    viewport = {
        width: 1280,
        height: 1024
    };

if(!url) {
    casper
        .echo('Usage: casperjs test actions.js --url=http://example.com')
        .exit(1);
}

if(url.indexOf('http') !== 0) {
    url = 'http://' + url;
}

casper.echo('Using URL: ' + url, 'INFO');

/**
 * Creates an array of *some* combinations of provided values in an object
 * @param  {Object} values
 * @return {Array}
 */
TestFW.createValueSets = function(values) {
    var valueSets = [{}],   // include an empty object
        curValues,
        key;

    // create objects with only one property from the original object present
    for(key in values) {
        curValues = {};
        curValues[key] = values[key];
        valueSets.push(curValues);
    }

    // push the original object with all properties present
    valueSets.push(values);

    return valueSets;
};

// initialize
casper.start();
casper.viewport(viewport.width, viewport.height);
casper.then(function() {
    casper.test.begin('Feedback form submit test', function(test) {
        var
            testValues = {  // all fields that need to be set on the form
                name: "Brendan Eich",
                email: 'user@example.com',
                text: 'Sample message'
            },
            formSelector = 'form[name="feedback_form"]',
            successMsgSelector = '.message_succefull',
            valueSets = TestFW.createValueSets(testValues),
            valueSetsCount = valueSets.length;

        // require('utils').dump(valueSets);

        /*jshint loopfunc:false */
        valueSets.forEach(function(curValues, i) {
             // (re)load the same page every time
            casper.thenOpen(url, function(response) {
                test.comment('--- #' + i + ' Page loaded...');
                var curValues = valueSets[i];
                test.assertHttpStatus(200);

                if(!casper.exists(formSelector)) {
                    casper.echo('Form not found on this page, exiting test', 'WARNING');
                    test.done();
                    return;
                }

                // fill & submit the form
                test.comment('Filling the form with the following fields: ' +
                            (Object.keys(curValues).join(' ') || '<no fields>')
                );
                this.fill(formSelector, curValues, true);
            });

            // after the form has been submitted...
            casper.then(function() {
                var
                    fieldSelector,
                    fieldName,
                    isErrored,
                    curValues = valueSets[i],
                    screenshotFilePath = screenshotPath + '/screenshot-actions-' + i + '.png',
                    allFieldsPresent = true;

                test.assertHttpStatus(200);

                test.comment('Form submitted, saving screenshot to ' + screenshotFilePath);
                casper.capture(screenshotFilePath);

                /*jshint loopfunc:true */
                for(fieldName in testValues) {
                    // retrieving the corresponding field element
                    fieldSelector = formSelector + ' [name="' + fieldName + '"]';
                    // fieldEl = casper.getElementInfo(formSelector + ' [name="' + fieldName + '"]');
                    isErrored = casper.evaluate(function(fieldSelector) {
                        // assume that jQuery is present
                        /* global $:true */
                        var field = $(fieldSelector),
                            container;
                        if(field.length) {
                            container = field.parents('.row');

                            if(container.length) {
                                return container.first().hasClass('row_error');
                            }
                        }
                    }, fieldSelector);

                    test.assertType(isErrored, 'boolean', "Field '" + fieldName + "' and its container must be found");

                    if(fieldName in curValues) {
                        // field is set - expect it to be accepted
                        test.assert(!isErrored, "Field '" + fieldName + "' must NOT be errored");
                    } else {
                        // field is not set - expect it to be rejected
                        allFieldsPresent = false;
                        test.assert(isErrored, "Field '" + fieldName + "' must be errored");
                    }
                }

                if(allFieldsPresent) {
                    // When all fields are filled - special check for some success message!
                    test.assertVisible(formSelector + ' ' + successMsgSelector, 'When all fields are filled, success message must be visible');
                }

                if(i == valueSetsCount) {
                    test.done();
                }
            });
        });
    });
});


casper.run();
