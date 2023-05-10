import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function runAssetCountReportByEmass(tokens, args) {

    try {

        //console.log(`runStatusReport: Requesting STIG Manager Collections`);
        console.log(`runAssetCountReportByEmass: Requesting STIG Manager Data`);
        var collections = [];
        var tempCollections = [];

        tempCollections = await reportGetters.getCollections(tokens.access_token);
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

        var emassMap = reportUtils.getCollectionsByEmassNumber(collections);

        var metrics = [];

        var rows = [
            {
                emassNum: 'EMASS Number',
                assetCount: 'Asset Count'
            }

        ];

        var iKey = 0;
        var iKeyend = emassMap.size;
        var myKeys = emassMap.keys();
        //console.log(myKeys);

        while (iKey < iKeyend) {
            var emassNum = myKeys.next().value;
            var myCollections = emassMap.get(emassNum);
            var metricsData = [];
            for (var i = 0; i < myCollections.length; i++) {

                metrics = await reportGetters.getCollectionMertics(tokens.access_token, myCollections[i].collectionId);
                metricsData.push(metrics);

                //var myData = getRow(collectionName, metrics);
                //rows.push(myData);

            }
            var myData = getRow(emassNum, metricsData);
            rows.push(myData);
            iKey++;
            metricsData.length = 0;
        }

        return rows;
    }
    catch (e) {
        console.log(e);
        throw(e);
    }
}

function getRow(emassNum, metricsData) {

    var totalAssetCount = 0;
    for (var i = 0; i < metricsData.length; i++) {
        totalAssetCount += metricsData[i].assets;
    }

    var metricsData = {
        emassNum: emassNum,
        assetCount: totalAssetCount
    }

    return metricsData;

}

export { runAssetCountReportByEmass };