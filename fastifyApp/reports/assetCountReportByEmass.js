import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function runAssetCountReportByEmass(tokens) {

    try {

        //console.log(`runStatusReport: Requesting STIG Manager Collections`);
        console.log(`runStatusReport: Requesting STIG Manager Data`);
        const collections = await reportGetters.getCollections(tokens.access_token)
        //console.log(collections);

        var emassMap = reportUtils.getCollectionsByEmassNumber(collections);

        var metrics = [];

        var rows = [
            {
                emassNum: 'EMASS Number',
                collectionNames: 'Collections',
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
    }
    catch (e) {
        console.log(e)
    }

    return rows;
}

function getRow(emassNum, metricsData) {

    var totalAssetCount = 0;
    var collectionNames = '';
    for (var i = 0; i < metricsData.length; i++) {
        totalAssetCount += metricsData[i].assets;
        var name = metricsData[i].name;
        collectionNames = collectionNames + metricsData[i].name + ', ';
    }

    // remove trailing comma and white space
    collectionNames = collectionNames.replace(/,\s*$/, "");

    var metricsData = {
        emassNum: emassNum,
        collectionNames: collectionNames,
        assetCount: totalAssetCount
    }

    return metricsData;

}

export { runAssetCountReportByEmass };