import * as reportGetters from './reportGetters.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';

async function runAssetByCollectionReport(tokens) {

    try {

        console.log(`Running Assets by Collection Report`);
        const collections = await reportGetters.getCollections(tokens.access_token)
        //console.log(collections);

        var stigs = []
        var assets = []
        var rows = [
            {
                collectionName: 'Collection',
                benchmark: 'Benchmarh ID',
                stigVersion: 'Version',
                assetNames: 'AsssetsS'
            }

        ];

        for (var i = 0; i < collections.length; i++) {
            var collectionName = collections[i].name;
      
            //console.log("Requesting STIGS")
            stigs = await reportGetters.getStigs(tokens.access_token, collections[i].collectionId)
            //console.log(stigs)
      
            //console.log("Requesting assets")
            for (var k = 0; k < stigs.length; k++) {
              assets.length = 0;
              assets = await reportGetters.getAssets(tokens.access_token, collections[i].collectionId, stigs[k].benchmarkId)
              //console.log(assets)
      
              var myData = getRow(collectionName, stigs[k], assets)
              rows.push(myData);
            }
          }
    }
    catch (e) {
        console.log(e)
    }

    return rows;
}

function getRow(collectionName, stigs, assets) {
    var assetNames = ''
    var benchmarkId = stigs.benchmarkId
    var stigVersion = stigs.lastRevisionStr

    for (var i = 0; i < assets.length; i++) {
        if (i < assets.length - 1) {
            assetNames += assets[i].name + ', '
        }
        else {
            assetNames += assets[i].name
        }
    }

    var rowData = {
        collectionName: collectionName,
        benchmark: benchmarkId,
        stigVersion: stigVersion,
        assetNames: assetNames
    }

    return rowData
}


export { runAssetByCollectionReport };