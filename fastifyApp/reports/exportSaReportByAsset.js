import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import { stringify } from 'csv-stringify/sync';

async function runExportSAReportByAsset(myTokenUtils, args) {

    try {

        //const prompt = promptSync();
        //const collectionName = prompt('Enter collection name.');

        console.log(`runExportSAReportByAsset: Requesting STIG Manager Collections`);
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
                datePulled: 'Date Pulled',
                code: 'Code',
                shortName: 'Short Name',
                collectionName: 'Collection',
                asset: 'Asset',
                primOwner: 'Primary Owner',
                sysAdmin: 'Sys Admin',
                deviveType: 'Device-Asset',
                lastTouched: 'Last Touched',
                stigs: 'STIGs',
                assessed: 'Assessed',
                submitted: 'Submitted',
                accepted: 'Accepted',
                rejected: 'Rejected'
            }
        ];

        var today = new Date();
        var todayStr = today.toISOString().substring(0, 10);

        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;

            var upperCaseName = collectionName.toUpperCase();
            /*if (upperCaseName.includes('ASI_NON')) {
                console.log(upperCaseName);
            }
            if (upperCaseName.includes('PL_')) {
                console.log(upperCaseName);
            }*/

            //exclude collections thqt do not start with NP_C
            if (!upperCaseName.startsWith('NP_C')) {
                continue;
            }
            /*// exclude collections that include _NON_STIG or PL/
            if (upperCaseName.includes('_NON_STIG_') ||
                upperCaseName.includes('_NON-STIG_') ||
                upperCaseName.includes('_NON STIG') ||
                upperCaseName.includes('PL_')) {
                continue;
            }*/


            if (collections[i].metadata.NonStig) {
                continue;
            }
            else if (collections[i].metadata.ParkingLot) {
                continue;
            }


            //console.log(collectionName);
            labelMap.clear();
            labels.length = 0;

            labels = await reportGetters.getLabelsByCollection(myTokenUtils.getMyTokens().access_token, collections[i].collectionId);
            for (var x = 0; x < labels.length; x++) {
                labelMap.set(labels[x].labelId, labels[x].description);
            }


            metrics = await reportGetters.getCollectionMerticsAggreatedByAsset(myTokenUtils.getMyTokens().access_token, collections[i].collectionId);
            //console.log(metrics);

            for (var j = 0; j < metrics.length; j++) {
                var myData = getRow(todayStr, collections[i], metrics[j], labelMap);
                rows.push(myData);

            }
        }
    }
    catch (e) {
        console.log(e)
    }

    return rows;
}

function getRow(todayStr, collection, metrics, labelMap) {

    var collectionName = collection.name;
    var code = collection.metadata.Code;
    var shortName = collection.metadata.ShortName;

    const numAssessments = metrics.metrics.assessments;
    const numAssessed = metrics.metrics.assessed;
    const numSubmitted = metrics.metrics.statuses.submitted;
    const numAccepted = metrics.metrics.statuses.accepted;
    const numRejected = metrics.metrics.statuses.rejected;
    const numSaved = metrics.metrics.statuses.rejected;
    const numAssets = metrics.assets;

    var maxTouchTs = metrics.metrics.maxTouchTs;
    var touchDate = new Date(maxTouchTs);
    var today = new Date();
    var timeDiff = today - touchDate;
    var diffInHours = timeDiff / (1000 * 3600);
    var diffInDays = timeDiff / (1000 * 3600 * 24);
    var lastTouched = "";

    // set lastTouched to either hours or days
    if (diffInDays < 1) {
        var touched = Math.round(diffInHours);
        lastTouched = touched + ' h';
    }
    else {
        var touched = Math.round(diffInDays);
        lastTouched = touched.toString() + ' d';
    }

    var primOwner = "";
    var secOwner = "";
    var sysAdmin = "";
    var device = "";
    var labelName = "";
    for (var iLabel = 0; iLabel < metrics.labels.length; iLabel++) {

        var labelDesc = labelMap.get(metrics.labels[iLabel].labelId);

        if (labelDesc) {
            if (labelDesc.toUpperCase() === 'PRIMARY OWNER') {
                if (primOwner === "") {
                    primOwner = metrics.labels[iLabel].name;
                }
                else {
                    secOwner = metrics.labels[iLabel].name;
                }
            }
            else if (labelDesc.toUpperCase() === 'SYS ADMIN') {
                sysAdmin = metrics.labels[iLabel].name;
            }
            else if (labelDesc.toUpperCase() === 'ASSET TYPE') {
                device = metrics.labels[iLabel].name;
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

    //const avgAssessed = Math.round(numAssessments ? (numAssessed / numAssessments) * 100 : 0);
    //const avgSubmitted = Math.round(numAssessments ? ((numSubmitted + numAccepted + numRejected) / numAssessments) * 100 : 0);
    //const avgAccepted = Math.round(numAssessments ? ((numAccepted) / numAssessments) * 100 : 0);
    //const avgRejected = Math.round(numAssessments ? ((numRejected) / numAssessments) * 100 : 0);

    var benchmarkIDs = metrics.benchmarkIds.toString();
    benchmarkIDs = benchmarkIDs.replaceAll(",", " ");

    var rowData = {
        datePulled: todayStr,
        code: code,
        shortName: shortName,
        collectionName: collectionName,
        asset: metrics.name,
        primOwner: primOwner,
        sysAdmin: sysAdmin,
        deviveType: device,
        lastTouched: lastTouched,
        stigs: metrics.benchmarkIds.length,
        assessed: avgAssessed + '%',
        submitted: avgSubmitted + '%',
        accepted: avgAccepted + '%',
        rejected: avgRejected + '%'
    }

    return rowData;

}

export { runExportSAReportByAsset };