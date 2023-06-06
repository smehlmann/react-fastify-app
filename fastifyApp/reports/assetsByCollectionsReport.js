import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function runAssetByCollectionReport(tokens, args) {

    try {

        console.log(`Running Assets by Collection Report`);
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
        //console.log(collections);

        var stigs = [];
        var assets = [];
        var rows = [
            {
                emass: 'EMASS',
                collection: 'Collection',
                benchmark: 'STIG Benchmark',
                stigVersion: 'Version',
                assetNames: 'Assets'
            }

        ];

        var emassMap = reportUtils.getCollectionsByEmassNumber(collections);
        var iKey = 0;
        var iKeyend = emassMap.size;
        var myKeys = emassMap.keys();

        //collectionName = '';
        while (iKey < iKeyend) {
            /*for (var i = 0; i < collections.length; i++) {*/
            //var collectionName = collections[i].name;
            var emassNum = myKeys.next().value;
            var myCollections = emassMap.get(emassNum);

            for (var i = 0; i < myCollections.length; i++) {
                //console.log("Requesting STIGS");
                var collectionName = myCollections[i].name;
                var strToRemove = '_' + emassNum + '_';
                collectionName = collectionName.replace(strToRemove, '');
                stigs = await reportGetters.getStigs(tokens.access_token, myCollections[i].collectionId);
                //console.log(stigs)

                //console.log("Requesting assets")
                for (var k = 0; k < stigs.length; k++) {
                    assets.length = 0;
                    assets = await reportGetters.getAssets(tokens.access_token, myCollections[i].collectionId, stigs[k].benchmarkId)
                    //console.log(assets)

                    var myData = getRow(emassNum, collectionName, stigs[k], assets)
                    rows.push(myData);
                }
            }
            iKey++;
        }

        return rows;
    }
    catch (e) {
        console.log(e);
        throw(e);
    }
}

function getRow(emassNum, collectionName, stigs, assets) {

    var assetNames = ''
    var benchmarkId = stigs.benchmarkId
    var stigVersion = stigs.lastRevisionStr

    for (var i = 0; i < assets.length; i++) {
        if (i < assets.length - 1) {
            assetNames += assets[i].name + ';'
        }
        else {
            assetNames += assets[i].name
        }
    }

    assetNames = assetNames.trim();

    var rowData = {
        emass: emassNum,
        collection: collectionName,
        benchmark: benchmarkId,
        stigVersion: stigVersion,
        assetNames: assetNames
    }

    return rowData
}


export { runAssetByCollectionReport };