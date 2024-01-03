import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function runStatusReport(myTokenUtils, args) {

    try {

        //console.log(`runStatusReport: Requesting STIG Manager Collections`);
        console.log(`runStatusReport: Requesting STIG Manager Data`);
        var collections = [];
        var tempCollections = [];

        tempCollections = await reportGetters.getCollections(myTokenUtils.getMyTokens().access_token);
        if (!args || args.length === 0) {
            collections = tempCollections;
        }
        else {
            var emassMap = reportUtils.getCollectionsByEmassNumber(tempCollections);
            var emassArray = args.split(',');
            for (var mapIdx = 0; mapIdx < emassArray.length; mapIdx++) {
                if (emassMap.has(emassArray[mapIdx])) {

                    var mappedCollection = emassMap.get(emassArray[mapIdx]);
                    if (mappedCollection) {
                        collections = collections.concat(mappedCollection);
                    }
                }
            }
        }

        //var assets = [];
        var metrics = [];
        //var findings = [];
        var stigs = [];

        var rows = [
            {
                collectionName: 'Collection',
                sumOfStigs: 'Sum of STIGs',
                sumOfChecks: 'Sum of Checks',
                avgAssessed: 'Average of Assessed',
                avgSubmitted: 'Average of Submitted',
                avgAccepted: 'Average of Accepted',
                avgRejected: 'Average of Rejected',
                sumOfCat3: 'Sum of CAT3',
                sumOfCat2: 'Sum of CAT2',
                sumOfCat1: 'Sum of CAT1'
            }

        ];

        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;

            stigs.length = 0;
            stigs = await reportGetters.getStigs(myTokenUtils.getMyTokens().access_token, 
                collections[i].collectionId);
            //console.log(stigs);

            metrics.length = 0;
            metrics = await reportGetters.getCollectionMertics(myTokenUtils.getMyTokens().access_token, 
                collections[i].collectionId);

            var myData = getRow(collectionName, stigs, metrics);
            rows.push(myData);
        }

        return rows;
    }
    catch (e) {
        console.log(e);
        throw(e);
    }
}

function getRow(collectionName, stigs, metrics) {

    const sumOfStigs = metrics.stigs;
    var totalRuleCount = 0;
    var totalAssetCount = 0;
    var numSubmitted = 0;
    var numAccepted = 0;
    var numRejected = 0;
    var numSaved = 0;

    // get STIG data
    for (var i = 0; i < stigs.length; i++) {
        totalRuleCount += stigs[i].ruleCount;
    }

    // get metrics data
    totalAssetCount = metrics.assets;
    const numAssessments = metrics.metrics.assessments;
    const numAssessed = metrics.metrics.assessed;
    numSubmitted = metrics.metrics.statuses.submitted.total;
    numAccepted = metrics.metrics.statuses.accepted.total;
    numRejected = metrics.metrics.statuses.rejected.total;
    numSaved = metrics.metrics.statuses.rejected.total;

    const numUnassessed = numAssessments - numAssessed;
    const totalChecks = numAssessments;
    const checks = totalRuleCount;

    var avgAssessed = 0;
    var avgSubmitted = 0;
    var avgAccepted = 0;
    var avgRejected = 0;
    var temp = 0;

    if (numAssessments) {
        temp = (numAssessed / numAssessments) * 100;
        avgAssessed = temp.toFixed(2);

        temp = ((numSubmitted + numAccepted + numRejected) / numAssessments) * 100;
        avgSubmitted = temp.toFixed(2);

        temp = (numAccepted / numAssessments) * 100;
        avgAccepted = temp.toFixed(2);

        temp = (numRejected / numAssessments) * 100;
        avgRejected = temp.toFixed(2);

    }

    const sumOfCat3 = metrics.metrics.findings.low;
    const sumOfCat2 = metrics.metrics.findings.medium;
    const sumOfCat1 = metrics.metrics.findings.high;

    var rowData = {
        collectionName: collectionName,
        sumOfStigs: sumOfStigs,
        sumOfChecks: totalChecks,
        avgAssessed: avgAssessed + "%",
        avgSubmitted: avgSubmitted + "%",
        avgAccepted: avgAccepted + "%",
        avgRejected: avgRejected + "%",
        sumOfCat3: sumOfCat3,
        sumOfCat2: sumOfCat2,
        sumOfCat1: sumOfCat1
    }

    return rowData
}

export { runStatusReport };