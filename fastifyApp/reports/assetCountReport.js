import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function runAssetCountReport(myTokenUtils, args) {

    try {

        //console.log(`runStatusReport: Requesting STIG Manager Collections`);
        console.log(`runAssetCountReport: Requesting STIG Manager Data`);
        
        var metrics = [];
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
        var rows = [
            {
                collectionName: 'Collection',
                assetCount: 'Asset Count'
            }

        ];

        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;

            metrics.length = 0;
            metrics = await reportGetters.getCollectionMertics(myTokenUtils.getMyTokens().access_token, collections[i].collectionId);

            var myData = getRow(collectionName, metrics);
            rows.push(myData);
        } 
    }
    catch (e) {
        console.log(e)
    }

    return rows;
}

function getRow(collectionName, metrics) {

    const sumOfStigs = metrics.stigs;
    var totalAssetCount = 0;


    // get metrics data
    totalAssetCount = metrics.assets;

    var rowData = {
        collectionName: collectionName,
        assetCount: metrics.assets
    }

    return rowData
}

export { runAssetCountReport };