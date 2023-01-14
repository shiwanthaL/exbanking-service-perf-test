const reporter = require('k6-html-reporter');

const options = {
        jsonFile: "report/summary.json",
        output: "report",
    };

reporter.generateSummaryReport(options);