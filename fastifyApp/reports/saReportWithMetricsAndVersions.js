import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
//import promptSync from 'prompt-sync';
//import { stringify } from 'csv-stringify/sync';
//import fs from 'fs';
//import path from 'path'

async function runSAReportWithMetricsAndVersions(myTokenUtils, args) {

    try {

        const currentQuarter = reportUtils.getCurrentQuarter();

        console.log(`runSAReportWithMetricsAndVersions: Requesting STIG Manager Collections`);
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
        //console.log(collections);
        //const collections = await reportGetters.getCollectionByName(tokens.access_token, collectionName);

        var metrics = [];
        var labels = [];
        let labelMap = new Map();

        var rows = [
            {
                collectionName: 'Collection',
                asset: 'Asset',
                primOwner: 'Primary Owner',
                sysAdmin: 'Sys Admin',
                benchmarks: 'STIG Benchmark',
                latestRev: 'Latest Revision',
                prevRev: 'Previous Revision',
                quarterVer: 'Current Quarter STIG Version',
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
            console.log('collection name: ' + collectionName);
            labelMap.clear();
            labels.length = 0;
            if (collectionName.toUpperCase() === "HAPPY CORP") {
                continue;
            }
            labels = await reportGetters.getLabelsByCollection(myTokenUtils.getMyTokens().access_token, collections[i].collectionId);
            for (var x = 0; x < labels.length; x++) {
                labelMap.set(labels[x].labelId, labels[x].description);
            }


            metrics = await reportGetters.getCollectionMerticsAggreatedByAsset(myTokenUtils.getMyTokens().access_token, collections[i].collectionId);
            console.log('num metrics: ' + metrics.length);

            for (var j = 0; j < metrics.length; j++) {

                var benchmarkIDs = metrics[j].benchmarkIds;
                console.log('num benchmarks: ' + benchmarkIDs.length);

                for (var idx = 0; idx < benchmarkIDs.length; idx++) {

                    console.log('benchmarkId: ' + benchmarkIDs[idx]);

                    var revisions = await reportGetters.getBenchmarkRevisions(
                        myTokenUtils.getMyTokens().access_token,
                        benchmarkIDs[idx]);

                    var latestRev = '';
                    var prevRev = '';
                    var latestRevDate = '';
                    var prevRevDate = '';
                    if (revisions) {
                        for (var bmIdx = 0; bmIdx < revisions.length && bmIdx < 2; bmIdx++) {
                            if (bmIdx === 0) {
                                latestRev = revisions[bmIdx].revisionStr;
                                latestRevDate = revisions[bmIdx].benchmarkDate;
                            }
                            else if (bmIdx === 1) {
                                prevRev = revisions[bmIdx].revisionStr;
                                prevRevDate = revisions[bmIdx].benchmarkDate;
                            }
                        }
                    }

                    var myData = getRow(
                        collectionName,
                        metrics[j],
                        labelMap,
                        latestRev,
                        latestRevDate,
                        prevRev,
                        benchmarkIDs[idx],
                        currentQuarter);

                    rows.push(myData);

                }
            }
        }
    }
    catch (e) {
        console.log(e)
    }

    return rows;
}

function getRow(collectionName,
    metrics,
    labelMap,
    latestRev,
    latestRevDate,
    prevRev,
    benchmarkID,
    currentQuarter) {

    const quarterVer = reportUtils.getVersionForQuarter(currentQuarter, latestRevDate, latestRev);

    const numAssessments = metrics.metrics.assessments;
    const numAssessed = metrics.metrics.assessed;
    const numSubmitted = metrics.metrics.statuses.submitted;
    const numAccepted = metrics.metrics.statuses.accepted;
    const numRejected = metrics.metrics.statuses.rejected;
    const numSaved = metrics.metrics.statuses.rejected;
    const numAssets = metrics.assets;

    var primOwner = "";
    var secOwner = "";
    var sysAdmin = "";
    var labelName = "";
    for (var iLabel = 0; iLabel < metrics.labels.length; iLabel++) {

        var labelDesc = labelMap.get(metrics.labels[iLabel].labelId);

        if (labelDesc) {
            if (labelDesc.toUpperCase() === 'PRIMARY OWNER') {
                primOwner = metrics.labels[iLabel].name;
            }
            else if (labelDesc.toUpperCase() === 'SYS ADMIN') {
                sysAdmin = metrics.labels[iLabel].name;
            }
            else {
                labelName = metrics.labels[iLabel].name;
            }
        }
        else {
            labelName = metrics.labels[iLabel].name;
        }
    }


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
        asset: metrics.name,
        primOwner: primOwner,
        sysAdmin: sysAdmin,
        benchmarks: benchmarkID,
        latestRev: latestRev,
        prevRev: prevRev,
        quarterVer: quarterVer,
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

export { runSAReportWithMetricsAndVersions };