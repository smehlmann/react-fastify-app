import * as reportGetters from '../reports/reportGetters.js'
import { setTimeout } from 'timers/promises'

async function addNewLabel(tokens, args) {

    var collectionName = '';
    let collectionMap = new Map();
    let collectionLabelMap = new Map();

    //console.log(args);

    for (var i = 0; i < args.length; i++) {
        //args.forEach((labelInfo) => {
        //let tokens = await getTokens(oidcBase, client_id, scope);
        console.log('addNewLabel:' + args[i]);
        collectionName = args[i].collectionName;
        var collectionId = collectionMap.get(collectionName);
        // get collection data, if it has not been previously retrieved
        if (!collectionId) {
            var collections =
                await reportGetters.getCollectionByName(tokens.access_token,
                    collectionName);
            //console.log(collections);
            if (!collections) {
                continue;
            }
            collectionId = collections[0].collectionId;
            // add the collection to the map
            collectionMap.set(collectionName, collectionId);
        }

        // set the label data
        var labelData = {
            asset: args[i].asset,
            primOwner: args[i].primOwner,
            sysAdmin: args[i].sysAdmin,
            assetType: args[i].assetType
        }

        // create a labelAssetMap if one has not been previously created
        var labelAssetMap = collectionLabelMap.get(collectionId);
        if (!labelAssetMap) {
            labelAssetMap = new Map();
        }

        // create the label(s)
        await reportGetters.createLabel(tokens.access_token,
            collectionId, labelData, labelAssetMap);
        //console.log(labelAssetMap);

        // save the labelAssetMap in the collectionLabelMap
        var tmpMap = collectionLabelMap.get(collectionId);
        if (!tmpMap) {
            collectionLabelMap.set(collectionId, labelAssetMap);
        }
        else {
            // delete the previous entry and save the new labelAssetMap that
            // contains all mappings read in so far
            collectionLabelMap.delete(collectionId);
            collectionLabelMap.set(collectionId, labelAssetMap);
        }
        //console.log(collectionLabelMap);

        // wait a second to give server time to process label creation
        //wait(1000);
        await setTimeout(1000);
    }
    console.log('All entries read');
    await assignLabelsToAssets(tokens.access_token, collectionLabelMap);
}

async function deleteAllLabels(tokens) {
    try {
        var rows = [
            {
                labelId: 'Label ID',
                name: 'Name',
                description: 'Description',
                color: 'color',
                uses: 'Uses'
            }
        ];
        console.log(`deleteAllLabels: Requesting STIG Manager Collections`);
        //console.log(`runSAReportByLabelAndEmass Requesting STIG Manager Data for collection ` + collectionName);

        const collections = await reportGetters.getCollections(tokens.access_token)
        //console.log(collections);

        var collectionNames = '';
        for (var i = 0; i < collections.length; i++) {
            if (collections[i].name === 'Happy Corp') {
                //labelMap.clear();
                var labels = await
                    reportGetters.getLabelsByCollection(tokens.access_token, collections[i].collectionId);
                //console.log("labels: " + labels);

                for (var j = 0; j < labels.length; j++) {

                    var deleteResp = await
                        reportGetters.deleteLabel(tokens.access_token, collections[i].collectionId, labels[j].labelId);
                    console.log(deleteResp);
                    rows.push(deleteResp);
                }
            }
        }
    }
    catch (e) {
        console.log(e);
    }

    return rows;
}

// Save the Label's Asset mappings
async function assignLabelsToAssets(access_token, collectionLabelMap) {

    try {

        var labelDetails = [];

        collectionLabelMap.forEach(function (value, key) {
            // key is the collectionId
            //console.log('key: ' + key);

            // value is the label mapping
            //console.log('value: ' + value);

            var labelId;
            var collectionId = key;
            var results;
            value.forEach(function (info, labelName) {
                //results = saveMapping(access_token, collectionId, labelId, assetIds);
                console.log('labelName: ' + labelName);
                //console.log('info: ' + info);
                var assetIds = [];
                for (var i = 0; i < info.length; i++) {
                    var labelId = info[i].labelId;
                    assetIds.push(info[i].assetId);
                }
                //console.log(assetIds);
                var item = {
                    collectionId: collectionId,
                    labelId: labelId,
                    assetIds: assetIds

                }

                labelDetails.push(item);

                //results = saveMapping(access_token, collectionId, labelId, assetIds);
                //console.log(results);
            });
        });
        for (var i = 0; i < labelDetails.length; i++) {
            var results = await reportGetters.saveLabelAssetMapping(access_token,
                labelDetails[i].collectionId, labelDetails[i].labelId, labelDetails[i].assetIds);
            //console.log(results);
        }
    }
    catch (e) {
        console.log(e);
    }

    return results;
}

async function saveMapping(access_token, collectionId, labelId, assetIds) {

    var results = await reportGetters.saveLabelAssetMapping(
        access_token, collectionId, labelId, assetIds);

    return results;
}

export { addNewLabel, deleteAllLabels };