import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path'

async function runSAReport(myTokenUtils, args) {

    try {

        //const prompt = promptSync();
        //const collectionName = prompt('Enter collection name.');

        console.log(`runSAReport: Requesting STIG Manager Collections`);
        //console.log(`runStatusReport: Requesting STIG Manager Data for collection ` + collectionName);

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

        //var labels = [];
        var assets = [];
        var metrics = [];

        //let labelMap = new Map();

        var rows = [
            {
                collectionName: 'Collections',
                asset: 'Asset',
                assessed: 'Assessed',
                submitted: 'Submitted',
                accepted: 'Accepted',
                rejected: 'Rejected',
                cat3: 'CAT3',
                cat2: 'CAT2',
                cat1: 'CAT1'
            }
        ];


        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;
            //console.log(collectionName);

            //labelMap.clear();
            //labels.length = 0;

            /*labels = await reportGetters.getLabelsByCollection(tokens.access_token, collections[i].collectionId);
            for (var x = 0; x < labels.length; x++) {
                labelMap.set(labels[x].labelId, labels[x].description);
            }*/

            metrics = await reportGetters.getCollectionMertics(myTokenUtils.getMyTokens().access_token, collections[i].collectionId);
            //console.log(metrics);
            //console.log(metrics.length);
            var myData = getRow(collectionName, metrics);
            rows.push(myData);
            /*
                        for (var j = 0; j < metrics.length; j++) {
                            //var myData = getRow(collectionName, metrics[j], labelMap);
                            var myData = getRow(collectionName, metrics[j]);
                            rows.push(myData);
                        }
            */
        }

        return rows;
    }
    catch (e) {
        console.log(e);
        throw(e);
    }
}

function getRow(collectionName, metrics) {

    const numAssessments = metrics.metrics.assessments;
    const numAssessed = metrics.metrics.assessed;
    const numSubmitted = metrics.metrics.statuses.submitted.total;
    const numAccepted = metrics.metrics.statuses.accepted.total;
    const numRejected = metrics.metrics.statuses.rejected.total;
    const numSaved = metrics.metrics.statuses.rejected.total;
    const numAssets = metrics.assets;

    const numUnassessed = numAssessments - numAssessed;
    const totalChecks = numAssessments;

    const avgAssessed = Math.round(numAssessments ? (numAssessed / numAssessments) * 100 : 0);
    const avgSubmitted = Math.round(numAssessments ? ((numSubmitted + numAccepted + numRejected) / numAssessments) * 100 : 0);
    const avgAccepted = Math.round(numAssessments ? ((numAccepted) / numAssessments) * 100 : 0);
    const avgRejected = Math.round(numAssessments ? ((numRejected) / numAssessments) * 100 : 0);

    const sumOfCat3 = metrics.metrics.findings.low;
    const sumOfCat2 = metrics.metrics.findings.medium;
    const sumOfCat1 = metrics.metrics.findings.high;

    var rowData = {
        collectionName: collectionName,
        asset: numAssets,
        assessed: avgAssessed + '%',
        submitted: avgSubmitted + '%',
        accepted: avgAccepted + '%',
        rejected: avgRejected + '%',
        cat3: sumOfCat3,
        cat2: sumOfCat2,
        cat1: sumOfCat1
    }

    return rowData;
}

export { runSAReport };