import * as reportGetters from './reportGetters.js';
import * as reportUtils from './reportUtils.js';
import promptSync from 'prompt-sync';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs';
import path from 'path'

async function getLabelsByCollection(tokens) {

    try {

        console.log(`runLabelsByCollection: Requesting STIG Manager Collections`);
        //console.log(`runSAReportByLabelAndEmass Requesting STIG Manager Data for collection ` + collectionName);

        const collections = await reportGetters.getCollections(tokens.access_token)
        //console.log(collections);

        var emassMap = reportUtils.getCollectionsByEmassNumber(collections);

        var labels = [];
        let labelMap = new Map();

        var rows = [
            {
                emass: 'EMASS Number',
                collectionName: 'Collection',
                label: 'Label',
                asset: 'Asset',
                assessed: 'Assessed',
                submitted: 'Submitted',
                accepted: 'Accepted',
                rejected: 'Rejected',
                cat3: 'CAT3',
                cat2: 'CAT2',
                cat1: 'CAT1'
            }
        ];

        var iKey = 0;
        var iKeyend = emassMap.size;
        var myKeys = emassMap.keys();
        //console.log(myKeys);

        var collectionNames = '';
        while (iKey < iKeyend) {
            var emassNum = myKeys.next().value;
            var myCollections = emassMap.get(emassNum);

            for (var i = 0; i < myCollections.length; i++) {

                //labelMap.clear();
                labels.length = 0;
                labels = await reportGetters.getLabelsByCollection(tokens.access_token, myCollections[i].collectionId);
                //console.log("labels: " + labels);

                labelMap.set(myCollections[i].name, labels);
            }
        }
    }
    catch (e) {
        console.log(e)
    }

    return labelMap;
}


export { getLabelsByCollection };