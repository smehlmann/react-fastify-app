import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import * as tokenUtils from './tokenUtils.js';

const myTokenUtils = tokenUtils;

async function runStigBenchmarkByResults(myTokenUtils, args) {

    const currentQuarter = reportUtils.getCurrentQuarter();

    var collections = [];
    var tempCollections = [];
    var numRowsAdded = 0;

    // Get collections
    tempCollections = await reportGetters.getCollections
        (myTokenUtils.getMyTokens().access_token);
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

    var rows = [
        {
            collectionName: 'Collection',
            benchmark: 'STIG Benchmark',
            latestRev: 'Latest Revision',
            prevRev: 'Previous Revision',
            quarterVer: 'Current Quarter STIG Version',
            groupId: 'Group ID',
            asset: 'Asset',
            Result: 'Result',
            detail: 'Detail',
            comment: 'Comment',
            status: 'Status'
        }
    ];

    try {
        var startDate = new Date();
        console.log('Number of collections: ' + collections.length);
        // Get assets for each collection
        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;
            var collectionId = collections[i].collectionId;
            console.log('collection ' + i + ' ' + collectionName + ' ID: ' + collectionId);

            if (collectionName === 'Happy Corp') {
                continue;
            }

            var metrics = await reportGetters.getCollectionMerticsAggreatedByAsset
                (myTokenUtils.getMyTokens().access_token, collectionId);
            //console.log('Number metrics: ' + metrics.length)

            for (var iMetrics = 0; iMetrics < metrics.length; iMetrics++) {
                var averages = reportUtils.getMetricsAverages(metrics[iMetrics]);
                //console.log('Avg submited: ' + averages.submitted);

                if (averages.submitted < 100) {
                    var assetId = metrics[iMetrics].assetId;
                    var assetName = metrics[iMetrics].name;

                    var stigs = await reportGetters.getStigsByAsset(myTokenUtils.getMyTokens().access_token, assetId);
                    //console.log('Number of stigs: ' + stigs.length);

                    for (var iStigs = 0; iStigs < stigs.length; iStigs++) {
                        var benchmarkId = stigs[iStigs].benchmarkId;
                        var revisionStr = stigs[iStigs].revisionStr;

                        var checklists = await reportGetters.getChecklists(
                            myTokenUtils.getMyTokens().access_token, assetId, benchmarkId, revisionStr);
                        //console.log('Number of checklists: ' + checklists.length);

                        for (var iCkl = 0; iCkl < checklists.length; iCkl++) {

                            var result = checklists[iCkl].result;
                            result = result = resultAbbreviation(result);

                            if (result === '' || result === 'O' ||
                                result === 'NR+' || result === 'I') {
                                //console.log('result: ' + checklists[iCkl].result + ' abbrv: ' + result);

                                var groupId = checklists[iCkl].groupId;

                                var reviews = await reportGetters.getReviewByGroupId(
                                    myTokenUtils.getMyTokens().access_token, collectionId, assetId, benchmarkId, groupId);
                                //console.log('Number of reviews: ' + reviews.length);

                                for (var iReviews = 0; iReviews < reviews.length; iReviews++) {

                                    var myDetail = reviews[iReviews].detail;
                                    var detail = myDetail.replaceAll('/', '-');
                                    detail = detail.replaceAll('\r', '\\r');
                                    detail = detail.replaceAll('\n', '\\n');
                                    detail = detail.replaceAll('\t', '\\t');
                                    detail = detail.replaceAll(',', ';');
                                    /*if(detail === '0' || detail === '1' || detail === '2'){
                                        console.log('myDetail before truncate: ' + myDetail);
                                    }*/

                                    if(detail.length > 32000){
                                        detail = detail.substring(0, 32000);
                                    }

                                    /*if(detail === '0' || detail === '1' || detail === '2'){
                                        console.log('myDetail after truncate: ' + myDetail);
                                    }*/


                                    var comment = reviews[iReviews].comment;
                                    comment = comment.replaceAll('/', '|');
                                    comment = comment.replaceAll('\r', '\\r');
                                    comment = comment.replaceAll('\n', '\\n');
                                    comment = comment.replaceAll('\t', '\\t');
                                    comment = comment.replaceAll(',', ';');
                                    //console.log('detail.length: ' + detail.length + ' comment.length: ' + comment.length);

                                    if(comment.length > 32000){
                                        comment = comment.substring(0, 32000);
                                    }

                                    /*if (collectionName === 'NP_C10  NCCM-W_7372_SAP-SAMPLE' &&
                                        benchmarkId === 'IIS_10-0_Site_STIG' &&
                                        groupId === 'V-218779' &&
                                        assetName === 'NP0170NB422573-Default Web Site-NA') {

                                        console.log('detail: ' + detail);
                                    }*/

                                    var status = reviews[iReviews].status.label;

                                    var revisions = await reportGetters.getBenchmarkRevisions(myTokenUtils.getMyTokens().access_token, benchmarkId);

                                    var latestRev = '';
                                    var prevRev = '';
                                    var latestRevDate = '';
                                    var prevRevDate = '';

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

                                    var myData = getRow(collectionName,
                                        benchmarkId,
                                        currentQuarter,
                                        latestRevDate,
                                        latestRev,
                                        prevRev,
                                        groupId,
                                        assetName,
                                        result,
                                        detail,
                                        comment,
                                        status);
                                    rows.push(myData);
                                } // end for iReviews
                            } // end if result                              
                        }// end for iCkl
                    }//end for iStigs 
                } // end if avgs
            } // end for iMetrics
        }//end for each collection
    } // end try
    catch (e) {
        console.log('Error in runStigBenchmarkByResults');
        console.log(e.message);
    }

    var endDate = new Date();
    var dateDiff = (endDate.getTime() - startDate.getTime()) / 1000;
    var dateDiffInMinutes = dateDiff / 60;
    var dateDiffInHours = dateDiffInMinutes / 60;
    console.log('start: ' + startDate + ' end: ' + endDate + ' total time in seconds: ' + dateDiff);
    console.log('total time in minutes: ' + dateDiffInMinutes);
    console.log('total time in hours: ' + dateDiffInHours);

    return rows;
}

function getRow(collectionName, benchmarkId, currentQuarter,
    latestRevDate, latestRev, prevRev, groupId, assetName, result,
    detail, comment, status) {

    const quarterVer = reportUtils.getVersionForQuarter(
        currentQuarter, latestRevDate, latestRev);

    var row = {
        collectionName: collectionName,
        benchmark: benchmarkId,
        latestRev: latestRev,
        prevRev: prevRev,
        quarterVer: quarterVer,
        groupId: groupId,
        asset: assetName,
        Result: result,
        detail: detail,
        comment: comment,
        status: status
    };

    return row;
}


function resultAbbreviation(result) {

    var abbrev = '';

    if(!result || result === 'null' || result === 'undefined'){
        return abbrev;
    }

    switch (result) {
        case 'notchecked':
            abbrev = 'NR+';
            break;
        case 'notapplicable':
            abbrev = 'NA';
            break;
        case 'pass':
            abbrev = 'NF';
            break;
        case 'fail':
            abbrev = 'O';
            break;
        case 'informational':
            abbrev = 'I';
            break;
        default:
            abbrev = 'NR+';
            break;
    }

    return abbrev;
}




export { runStigBenchmarkByResults }