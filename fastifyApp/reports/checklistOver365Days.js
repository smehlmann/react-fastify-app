import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
//import promptSync from 'prompt-sync';
//import { stringify } from 'csv-stringify/sync';
//import fs from 'fs';
//import path from 'path'

async function runChecklistOver365Days(myTokenUtils, args) {

    try {

        //const currentQuarter = reportUtils.getCurrentQuarter();

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
                benchmark: 'STIG Benchmark',
                revision: 'Revision',
                groupId: 'Group ID',
                result: 'Result',
                detail: 'Detail',
                comment: 'Comment',
                modifiedDate: 'Modified Date',
                modifiedBy: 'Modified By',
                ruleId: 'Rule',
                status: 'Status',
                statusDate: 'Status Date',
                checkedBy: 'Checked By'
            }
        ];


        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;
            var collectionId = collections[i].collectionId;
            console.log(i + ' collection name: ' + collectionName);

            labelMap.clear();
            labels.length = 0;
            if (collectionName.toUpperCase() === "HAPPY CORP") {
                continue;
            }

            //exclude collections that do not start with NP_C
            if (!collectionName.startsWith('NP_C')) {
                continue;
            }

            labelMap.clear();
            labels.length = 0;
            labels = await reportGetters.getLabelsByCollection(myTokenUtils.getMyTokens().access_token, collections[i].collectionId);
            for (var x = 0; x < labels.length; x++) {
                labelMap.set(labels[x].labelId, labels[x].description);
            }

            var metrics = await reportGetters.getCollectionMerticsAggreatedByAsset
                (myTokenUtils.getMyTokens().access_token, collectionId);
            //console.log('Number metrics: ' + metrics.length)

            for (var iMetrics = 0; iMetrics < metrics.length; iMetrics++) {

                var minTs = metrics[iMetrics].metrics.minTs;
                var maxTs = metrics[iMetrics].metrics.maxTs;
                var diffInDays = reportUtils.calcDiffInDays(minTs);
                if (diffInDays < 360) {
                    continue;
                }

                //var oldest = diffInDays;
                //var diffInDays = reportUtils.calcDiffInDays(maxTs);

                var assetId = metrics[iMetrics].assetId;
                var assetName = metrics[iMetrics].name;

                var stigs = await reportGetters.getStigsByAsset(myTokenUtils.getMyTokens().access_token, assetId);
                for (var iStigs = 0; iStigs < stigs.length; iStigs++) {
                    var benchmarkId = stigs[iStigs].benchmarkId;
                    var revisionStr = stigs[iStigs].revisionStr;

                    var checklists = await reportGetters.getChecklists(
                        myTokenUtils.getMyTokens().access_token, assetId, benchmarkId, revisionStr);
                    //console.log('Number of checklists: ' + checklists.length);

                    for (var iCkl = 0; iCkl < checklists.length; iCkl++) {
                        var result = checklists[iCkl].result;
                        result = result = reportUtils.resultAbbreviation(result);

                        var groupId = checklists[iCkl].groupId;

                        var reviews = await reportGetters.getReviewByGroupId(
                            myTokenUtils.getMyTokens().access_token, collectionId, assetId, benchmarkId, groupId);
                        //console.log('Number of reviews: ' + reviews.length);

                        if (!reviews) {
                            continue;
                        }

                        for (var iReviews = 0; iReviews < reviews.length; iReviews++) {

                            var modifiedDate = reviews[iReviews].ts;
                            diffInDays = reportUtils.calcDiffInDays(modifiedDate);
                            if (diffInDays < 360) {
                                continue;
                            }
                            
                            var modifiedBy = reviews[iReviews].username;
                            var status = reviews[iReviews].status.label;
                            var statusDate = reviews[iReviews].status.ts;
                            var checkedBy = reviews[iReviews].status.user.username;
                            var ruleId = reviews[iReviews].ruleId;

                            var myDetail = reviews[iReviews].detail;
                            var detail = myDetail.replaceAll('/', '-');
                            detail = detail.replaceAll('\r', '\\r');
                            detail = detail.replaceAll('\n', '\\n');
                            detail = detail.replaceAll('\t', '\\t');
                            detail = detail.replaceAll(',', ';');
                            /*if(detail === '0' || detail === '1' || detail === '2'){
                                console.log('myDetail before truncate: ' + myDetail);
                            }*/

                            if (detail.length > 32000) {
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

                            if (comment.length > 32000) {
                                comment = comment.substring(0, 32000);
                            }

                            //var revisions = await reportGetters.getBenchmarkRevisions(myTokenUtils.getMyTokens().access_token, benchmarkId);

                            //var latestRev = '';
                            //var prevRev = '';
                            //var latestRevDate = '';
                            //var prevRevDate = '';

                            /*for (var bmIdx = 0; bmIdx < revisions.length && bmIdx < 2; bmIdx++) {
                                if (bmIdx === 0) {
                                    latestRev = revisions[bmIdx].revisionStr;
                                    latestRevDate = revisions[bmIdx].benchmarkDate;
                                }
                                else if (bmIdx === 1) {
                                    prevRev = revisions[bmIdx].revisionStr;
                                    prevRevDate = revisions[bmIdx].benchmarkDate;
                                }
                            } // end revisions*/

                            var myData = getRow(collectionName,
                                assetName,
                                benchmarkId,
                                revisionStr,
                                groupId,
                                result,
                                detail,
                                comment,
                                modifiedDate,
                                modifiedBy,
                                ruleId,
                                status,
                                statusDate,
                                checkedBy,
                                metrics[iMetrics],
                                labelMap);
                            rows.push(myData);
                        } // end reviews
                    }// end checklists
                } // end stigs
            } // end metrics
        } // end collections

        return rows;
    }
    catch (e) {
        console.log(e);
        throw (e);
    }
}

function getRow(
    collectionName,
    assetName,
    benchmarkId,
    revisionStr,
    groupId,
    result,
    detail,
    comment,
    modifiedDate,
    modifiedBy,
    ruleId,
    status,
    statusDate,
    checkedBy,
    metrics,
    labelMap) {

    var primOwner = "";
    var sysAdmin = "";

    for (var iLabel = 0; iLabel < metrics.labels.length; iLabel++) {

        var labelDesc = labelMap.get(metrics.labels[iLabel].labelId);

        if (labelDesc) {
            if (labelDesc.toUpperCase() === 'PRIMARY OWNER') {
                primOwner = metrics.labels[iLabel].name;
            }
            else if (labelDesc.toUpperCase() === 'SYS ADMIN') {
                sysAdmin = metrics.labels[iLabel].name;
            }
        }
    }

    var rowData = {
        collectionName: collectionName,
        asset: assetName,
        primOwner: primOwner,
        sysAdmin: sysAdmin,
        benchmark: benchmarkId,
        revision: revisionStr,
        groupId: groupId,
        result: result,
        detail: detail,
        comment: comment,
        modifiedDate: modifiedDate,
        modifiedBy: modifiedBy,
        ruleId: ruleId,
        status: status,
        statusDate: statusDate,
        checkedBy: checkedBy
    }

    return rowData;

}

export { runChecklistOver365Days };